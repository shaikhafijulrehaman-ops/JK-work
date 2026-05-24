const db = require('../db');

/**
 * Get all catalog services
 */
exports.getAllServices = async (req, res) => {
  try {
    const services = await db.service.findMany({});
    res.status(200).json({
      success: true,
      services
    });
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
    const service = await db.service.findUnique({
      where: { id: req.params.id }
    });

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

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
    const { name, category, description, price, durationText, packageText, imageUrl } = req.body;

    if (!name || !category || !price || !description) {
      return res.status(400).json({ success: false, message: 'Please supply service name, category, pricing, and description.' });
    }

    const service = await db.service.create({
      data: {
        name,
        category,
        description,
        price: parseFloat(price),
        durationText: durationText || '',
        packageText: packageText || '',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop'
      }
    });

    // Write Audit Log
    await db.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'SERVICE_CREATE',
        details: JSON.stringify({ id: service.id, name: service.name, price: service.price }),
        ipAddress: req.ip
      }
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'New catalog service added successfully.',
      service
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ success: false, message: 'Failed to create new catalog service.' });
  }
};

/**
 * ADMIN: Update catalog service pricing / parameters
 */
exports.updateService = async (req, res) => {
  try {
    const { price, description, durationText, packageText, imageUrl } = req.body;

    const existing = await db.service.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    const updated = await db.service.update({
      where: { id: req.params.id },
      data: {
        price: price ? parseFloat(price) : existing.price,
        description: description || existing.description,
        durationText: durationText !== undefined ? durationText : existing.durationText,
        packageText: packageText !== undefined ? packageText : existing.packageText,
        imageUrl: imageUrl || existing.imageUrl
      }
    });

    // Write Audit Log
    await db.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'SERVICE_UPDATE',
        details: JSON.stringify({ id: updated.id, name: updated.name, oldPrice: existing.price, newPrice: updated.price }),
        ipAddress: req.ip
      }
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Service details updated successfully.',
      service: updated
    });
  } catch (error) {
    console.error('Update service error:', error);
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

    await db.service.delete({ where: { id: req.params.id } });

    // Write Audit Log
    await db.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'SERVICE_DELETE',
        details: JSON.stringify({ id: existing.id, name: existing.name }),
        ipAddress: req.ip
      }
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Service deleted from catalog successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete service.' });
  }
};
