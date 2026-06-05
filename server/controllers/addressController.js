const db = require('../db');

/**
 * Get all saved addresses for the logged-in user
 */
exports.getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const addresses = await db.address.findMany({
      where: { userId }
    });

    res.status(200).json({
      success: true,
      data: addresses
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve addresses.' });
  }
};

/**
 * Create a new address for the logged-in user
 */
exports.createAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { houseFlat, street, landmark, altMobile, isDefault } = req.body;

    if (!houseFlat || !street) {
      return res.status(400).json({ success: false, message: 'House/Flat number and Street address are required.' });
    }

    // Check if this is the first address, or if it is forced to be default
    const existing = await db.address.findMany({ where: { userId } });
    const setAsDefault = existing.length === 0 ? true : !!isDefault;

    // If setting as default, update all other addresses to be non-default
    if (setAsDefault && existing.length > 0) {
      await db.address.updateMany({
        where: { userId },
        data: { isDefault: false }
      });
    }

    const newAddress = await db.address.create({
      data: {
        userId,
        houseFlat,
        street,
        landmark: landmark || null,
        altMobile: altMobile || null,
        isDefault: setAsDefault
      }
    });

    await db.auditLog.create({
      data: {
        userId,
        action: 'ADDRESS_ADDED',
        details: JSON.stringify({ addressId: newAddress.id, houseFlat: newAddress.houseFlat, street: newAddress.street }),
        ipAddress: req.ip
      }
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Address added successfully.',
      data: newAddress
    });
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({ success: false, message: 'Failed to create address.' });
  }
};

/**
 * Update an existing address
 */
exports.updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;
    const { houseFlat, street, landmark, altMobile, isDefault } = req.body;

    // Verify address ownership
    const address = await db.address.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Address not found or unauthorized.' });
    }

    const setAsDefault = !!isDefault;

    // If updating this address to be default, set others to false
    if (setAsDefault && !address.isDefault) {
      await db.address.updateMany({
        where: { userId },
        data: { isDefault: false }
      });
    }

    const updated = await db.address.update({
      where: { id: addressId },
      data: {
        houseFlat: houseFlat !== undefined ? houseFlat : address.houseFlat,
        street: street !== undefined ? street : address.street,
        landmark: landmark !== undefined ? landmark : address.landmark,
        altMobile: altMobile !== undefined ? altMobile : address.altMobile,
        isDefault: setAsDefault
      }
    });

    res.status(200).json({
      success: true,
      message: 'Address updated successfully.',
      data: updated
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ success: false, message: 'Failed to update address.' });
  }
};

/**
 * Delete an address
 */
exports.deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;

    // Verify ownership
    const address = await db.address.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Address not found or unauthorized.' });
    }

    const wasDefault = address.isDefault;

    await db.address.delete({
      where: { id: addressId }
    });

    // If deleted address was default, auto-set another one to default
    if (wasDefault) {
      const remaining = await db.address.findMany({ where: { userId } });
      if (remaining.length > 0) {
        await db.address.update({
          where: { id: remaining[0].id },
          data: { isDefault: true }
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully.'
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete address.' });
  }
};

/**
 * Set an address as the default address
 */
exports.setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;

    // Verify ownership
    const address = await db.address.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Address not found or unauthorized.' });
    }

    // Set all user's addresses to not default
    await db.address.updateMany({
      where: { userId },
      data: { isDefault: false }
    });

    // Mark the selected one as default
    const updated = await db.address.update({
      where: { id: addressId },
      data: { isDefault: true }
    });

    res.status(200).json({
      success: true,
      message: 'Default address updated successfully.',
      data: updated
    });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({ success: false, message: 'Failed to set default address.' });
  }
};
