const db = require('../db');
const { logActivity } = require('../utils/auditLogger');
const cache = require('../utils/cache');

const sanitizeServiceImages = (services) => {
  // Disable automatic mapping to default images.
  // The uploaded or existing saved image must take highest priority.
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

    const service = await db.service.create({
      data: {
        name: trimmedName,
        category,
        description,
        price: parseFloat(price),
        durationText: durationText || '',
        packageText: packageText || '',
        imageUrl: imageUrl || '',
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

    const updated = await db.service.update({
      where: { id: req.params.id },
      data: {
        name: trimmedName || existing.name,
        category: category || existing.category,
        price: price !== undefined ? parseFloat(price) : existing.price,
        description: description || existing.description,
        durationText: durationText !== undefined ? durationText : existing.durationText,
        packageText: packageText !== undefined ? packageText : existing.packageText,
        imageUrl: imageUrl || existing.imageUrl,
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

    await db.service.update({
      where: { id: req.params.id },
      data: { isDeleted: true, deletedAt: new Date() }
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
