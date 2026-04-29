const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

async function migrate() {
  try {
    dotenv.config({ path: ".env.local" });
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error("❌ MONGO_URI not found in .env.local");
      process.exit(1);
    }

    console.log("⏳ Connecting to MongoDB for video migration...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected.");

    const db = mongoose.connection.db;
    const collection = db.collection("videos");
    
    console.log("🔍 Finding videos with 'url' field instead of 'videoUrl'...");
    const cursor = collection.find({ url: { $exists: true } });
    const count = await collection.countDocuments({ url: { $exists: true } });
    
    if (count === 0) {
      console.log("ℹ️ No videos found requiring migration.");
    } else {
      console.log(`🧹 Found ${count} videos to migrate. Renaming field 'url' to 'videoUrl'...`);
      
      const result = await collection.updateMany(
        { url: { $exists: true } },
        { $rename: { "url": "videoUrl" } }
      );
      
      console.log(`✅ Successfully migrated ${result.modifiedCount} videos.`);
    }

    await mongoose.disconnect();
    console.log("👋 Done.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

migrate();
