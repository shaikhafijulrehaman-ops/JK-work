// Suppress node warning for fetch if any
const supabaseUrl = process.env.SUPABASE_URL || 'https://hiurxjfxdpdxvumpmplp.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpdXJ4amZ4ZHBkeHZ1bXBtcGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NzU0MTQsImV4cCI6MjA5NTI1MTQxNH0.JLYXEUl30FkOP_0BBkPwXylQK__X1dqEJz7gmL-sXdI';

/**
 * Upload base64 encoded image to Supabase Storage via REST API
 */
exports.uploadImage = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, message: 'No image data supplied.' });
    }

    // Parse base64 data URI
    const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
    if (!mimeMatch) {
      return res.status(400).json({ success: false, message: 'Invalid image format.' });
    }

    const contentType = mimeMatch[1];
    const extension = contentType.split('/')[1] || 'jpg';
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/service-images/${fileName}`;

    // Upload to Supabase Storage using native REST
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apiKey': supabaseKey,
        'Content-Type': contentType
      },
      body: buffer
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Supabase Storage REST upload error:', errText);
      return res.status(response.status).json({
        success: false,
        message: 'Failed to upload image to storage.',
        details: errText
      });
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/service-images/${fileName}`;

    res.status(200).json({
      success: true,
      imageUrl: publicUrl,
      fileName
    });
  } catch (error) {
    console.error('Supabase Storage upload exception:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image.',
      details: error.message
    });
  }
};
