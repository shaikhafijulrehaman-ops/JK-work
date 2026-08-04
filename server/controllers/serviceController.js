const db = require('../db');
const { logActivity } = require('../utils/auditLogger');
const cache = require('../utils/cache');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const getCloudinaryPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    const pathAfterUpload = parts[1];
    const pathParts = pathAfterUpload.split('/');
    if (pathParts[0].startsWith('v') && !isNaN(pathParts[0].substring(1))) {
      pathParts.shift();
    }
    const relativePath = pathParts.join('/');
    const lastDotIndex = relativePath.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      return relativePath.substring(0, lastDotIndex);
    }
    return relativePath;
  } catch (error) {
    console.error('Error extracting Cloudinary public ID:', error);
    return null;
  }
};

const SUPABASE_STORAGE_BASE = process.env.SUPABASE_URL || 'https://hiurxjfxdpdxvumpmplp.supabase.co';

const formatServiceImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http') || imageUrl.startsWith('data:image') || imageUrl.startsWith('/')) {
    return imageUrl;
  }
  let path = imageUrl;
  if (path.startsWith('storage://')) {
    path = path.replace('storage://', '');
  }
  if (!path.startsWith('service-images/')) {
    path = `service-images/${path}`;
  }
  return `${SUPABASE_STORAGE_BASE}/storage/v1/object/public/${path}`;
};

const sanitizeServiceImages = (services) => {
  if (!services) return;
  if (Array.isArray(services)) {
    services.forEach(s => {
      if (s.imageUrl) s.imageUrl = formatServiceImageUrl(s.imageUrl);
    });
  } else if (typeof services === 'object' && services.imageUrl) {
    services.imageUrl = formatServiceImageUrl(services.imageUrl);
  }
};


/**
 * Get all catalog services
 */
exports.getAllServices = async (req, res) => {
  const cacheKey = 'all_services';
  const cached = cache.getCache(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }

  const start = Date.now();
  try {
    const services = await db.service.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        price: true,
        durationText: true,
        packageText: true,
        imageUrl: true,
        isActive: true
      }
    });
    
    sanitizeServiceImages(services);
    
    const duration = Date.now() - start;
    if (duration > 500) {
      console.warn(`⚠️  [DATABASE PERFORMANCE WARNING] Get all services query took ${duration}ms (exceeds 500ms limit)`);
    } else {
      console.log(`[DATABASE LOG] Get all services query took ${duration}ms`);
    }

    const payload = {
      success: true,
      services
    };
    cache.setCache(cacheKey, payload, 60000); // 1 minute

    res.status(200).json(payload);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve catalog services.' });
  }
};

/**
 * Get dynamic details of a single service
 */
exports.getServiceById = async (req, res) => {
  try {
    const service = await db.service.findFirst({
      where: { id: req.params.id, isDeleted: false }
    });

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    sanitizeServiceImages(service);

    res.status(200).json({
      success: true,
      service
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve service detail.' });
  }
};

/**
 * ADMIN: Create new catalog service
 */
exports.createService = async (req, res) => {
  try {
    const { name, category, description, price, durationText, packageText, imageUrl, isActive } = req.body;

    if (!name || !category || !price || !description) {
      return res.status(400).json({ success: false, message: 'Please supply service name, category, pricing, and description.' });
    }

    const trimmedName = name.trim();
    let finalImageUrl = imageUrl || '';

    // Safeguard: upload local service image path to Cloudinary on-the-fly
    if (finalImageUrl.startsWith('/services/')) {
      const localPath = path.join(__dirname, '../../client/public', finalImageUrl);
      if (fs.existsSync(localPath)) {
        try {
          const uploadResponse = await cloudinary.uploader.upload(localPath, {
            folder: 'service-images',
            resource_type: 'image'
          });
          finalImageUrl = uploadResponse.secure_url;
        } catch (uploadError) {
          console.error('Failed to upload default image to Cloudinary during creation:', uploadError);
        }
      }
    }

    const service = await db.service.create({
      data: {
        name: trimmedName,
        category,
        description,
        price: parseFloat(price),
        durationText: durationText || '',
        packageText: packageText || '',
        imageUrl: finalImageUrl,
        isActive: isActive !== undefined ? !!isActive : true
      }
    });

    // Write Audit Log
    logActivity(req, {
      userId: req.user.id,
      eventType: 'ADMIN',
      action: 'SERVICE_CREATE',
      details: { id: service.id, name: service.name, price: service.price }
    });

    cache.clearCache();
    res.status(201).json({
      success: true,
      message: 'New catalog service added successfully.',
      service
    });
  } catch (error) {
    console.error('Create service error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'A service with this name already exists in the catalog.' });
    }
    res.status(500).json({ success: false, message: 'Failed to create new catalog service.' });
  }
};

/**
 * ADMIN: Update catalog service pricing / parameters
 */
exports.updateService = async (req, res) => {
  try {
    const { name, category, price, description, durationText, packageText, imageUrl, isActive } = req.body;

    const existing = await db.service.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    let trimmedName = name ? name.trim() : undefined;
    let finalImageUrl = imageUrl || existing.imageUrl;

    if (imageUrl && imageUrl !== existing.imageUrl) {
      // 1. If it's a local file path, upload to Cloudinary first
      if (imageUrl.startsWith('/services/')) {
        const localPath = path.join(__dirname, '../../client/public', imageUrl);
        if (fs.existsSync(localPath)) {
          try {
            const uploadResponse = await cloudinary.uploader.upload(localPath, {
              folder: 'service-images',
              resource_type: 'image'
            });
            finalImageUrl = uploadResponse.secure_url;
          } catch (uploadError) {
            console.error('Failed to upload default image to Cloudinary during update:', uploadError);
          }
        }
      }

      // 2. Delete old image from Cloudinary if it was a Cloudinary URL
      const oldPublicId = getCloudinaryPublicId(existing.imageUrl);
      if (oldPublicId) {
        try {
          await cloudinary.uploader.destroy(oldPublicId);
          console.log(`Deleted old Cloudinary image: ${oldPublicId}`);
        } catch (destroyError) {
          console.error(`Failed to delete old Cloudinary image ${oldPublicId}:`, destroyError);
        }
      }
    }

    const updated = await db.service.update({
      where: { id: req.params.id },
      data: {
        name: trimmedName || existing.name,
        category: category || existing.category,
        price: price !== undefined ? parseFloat(price) : existing.price,
        description: description || existing.description,
        durationText: durationText !== undefined ? durationText : existing.durationText,
        packageText: packageText !== undefined ? packageText : existing.packageText,
        imageUrl: finalImageUrl,
        isActive: isActive !== undefined ? !!isActive : existing.isActive
      }
    });

    // Write Audit Log
    logActivity(req, {
      userId: req.user.id,
      eventType: 'ADMIN',
      action: 'SERVICE_UPDATE',
      details: { id: updated.id, name: updated.name, oldPrice: existing.price, newPrice: updated.price }
    });


    cache.clearCache();
    res.status(200).json({
      success: true,
      message: 'Service details updated successfully.',
      service: updated
    });
  } catch (error) {
    console.error('Update service error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'A service with this name already exists in the catalog.' });
    }
    res.status(500).json({ success: false, message: 'Failed to update service.' });
  }
};

/**
 * ADMIN: Delete service from catalog
 */
exports.deleteService = async (req, res) => {
  try {
    const existing = await db.service.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    // 1. Delete associated image from Cloudinary
    const publicId = getCloudinaryPublicId(existing.imageUrl);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
        console.log(`Deleted Cloudinary image: ${publicId} for deleted service.`);
      } catch (destroyError) {
        console.error(`Failed to delete Cloudinary image ${publicId}:`, destroyError);
      }
    }

    // 2. Hard delete database record
    await db.service.delete({
      where: { id: req.params.id }
    });

    // Write Audit Log
    logActivity(req, {
      userId: req.user.id,
      eventType: 'ADMIN',
      action: 'SERVICE_DELETE',
      details: { id: existing.id, name: existing.name }
    });

    cache.clearCache();
    res.status(200).json({
      success: true,
      message: 'Service deleted from catalog successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete service.' });
  }
};
