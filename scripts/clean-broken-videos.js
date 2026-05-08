const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

// Minimal Video Schema
const VideoSchema = new mongoose.Schema({
  videoUrl: String,
  title: String
});

const Video = mongoose.models.Video || mongoose.model('Video', VideoSchema);

async function cleanBrokenVideos() {
  try {
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected.');

    const videos = await Video.find({ videoUrl: { $regex: /^\/uploads\/videos\// } });
    console.log(`🔍 Checking ${videos.length} local (mock) videos...`);

    let removedCount = 0;
    const publicDir = path.join(process.cwd(), 'public');

    for (const video of videos) {
      const filePath = path.join(publicDir, video.videoUrl);
      if (!fs.existsSync(filePath)) {
        console.log(`🗑️ Removing broken video: "${video.title}" (File missing: ${video.videoUrl})`);
        await Video.deleteOne({ _id: video._id });
        removedCount++;
      }
    }

    console.log(`\n✨ Cleanup complete!`);
    console.log(`✅ Removed ${removedCount} broken database entries.`);

  } catch (err) {
    console.error('❌ Cleanup failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

cleanBrokenVideos();
