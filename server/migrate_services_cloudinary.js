require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./db');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

async function run() {
  try {
    const connected = await db.connectDb();
    if (!connected) {
      console.error('Failed to connect to database');
      process.exit(1);
    }

    const services = await db.service.findMany({
      where: { isDeleted: false }
    });

    console.log(`Found ${services.length} active services in database.`);

    for (const service of services) {
      console.log(`Processing service: ${service.name} (ID: ${service.id}). Current ImageUrl: ${service.imageUrl}`);
      
      if (service.imageUrl && service.imageUrl.startsWith('/services/')) {
        const localPath = path.join(__dirname, '../client/public', service.imageUrl);
        if (fs.existsSync(localPath)) {
          console.log(`Found local file at: ${localPath}`);
          try {
            const uploadResponse = await cloudinary.uploader.upload(localPath, {
              folder: 'service-images',
              resource_type: 'image'
            });
            console.log(`Uploaded to Cloudinary: ${uploadResponse.secure_url}`);
            
            // Update database
            await db.service.update({
              where: { id: service.id },
              data: { imageUrl: uploadResponse.secure_url }
            });
            console.log(`Database updated for service "${service.name}".`);
          } catch (uploadError) {
            console.error(`Failed to upload ${service.imageUrl} to Cloudinary:`, uploadError);
          }
        } else {
          console.warn(`Local file does not exist at: ${localPath}`);
        }
      } else {
        console.log(`Service "${service.name}" image URL is already remote/migrated: ${service.imageUrl}`);
      }
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

run();
