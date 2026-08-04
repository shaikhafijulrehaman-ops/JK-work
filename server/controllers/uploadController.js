// Force delete CLOUDINARY_URL to ensure it doesn't override manual config with stale values
delete process.env.CLOUDINARY_URL;

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Upload base64 encoded image to Cloudinary
 */
exports.uploadImage = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, message: 'No image data supplied.' });
    }

    // Upload to Cloudinary (base64 data URI is supported directly)
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: 'service-images',
      resource_type: 'image'
    });

    res.status(200).json({
      success: true,
      imageUrl: uploadResponse.secure_url,
      publicId: uploadResponse.public_id
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image to Cloudinary.',
      details: error.message
    });
  }
};
