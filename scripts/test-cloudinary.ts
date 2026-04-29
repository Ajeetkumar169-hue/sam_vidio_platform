import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

// Verify that credentials are loaded
const name = process.env.CLOUDINARY_CLOUD_NAME;
const key = process.env.CLOUDINARY_API_KEY;
const secret = process.env.CLOUDINARY_API_SECRET;

if (!name || !key || !secret) {
  console.error("❌ Error: Missing Cloudinary credentials in .env.local");
  process.exit(1);
}

cloudinary.config({
  cloud_name: name,
  api_key: key,
  api_secret: secret,
  secure: true
});

console.log(`⏳ Pinging Cloudinary (Cloud: ${name})...`);

cloudinary.api.ping()
  .then(res => {
    console.log("✅ Cloudinary Connection Successful!");
    console.log("Response:", res);
  })
  .catch(err => {
    console.error("❌ Cloudinary Connection Failed. Please check your credentials in .env.local.");
    console.error("Error Detail:", err.message);
  });
