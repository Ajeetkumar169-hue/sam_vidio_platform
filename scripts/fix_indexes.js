const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

async function repair() {
  try {
    dotenv.config({ path: ".env.local" });
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error("❌ MONGO_URI not found in .env.local");
      process.exit(1);
    }

    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected.");

    const db = mongoose.connection.db;
    const collection = db.collection("channels");
    
    console.log("🔍 Checking indexes on 'channels' collection...");
    const indexes = await collection.indexes();
    
    const duplicateIndex = indexes.find(idx => idx.name === "username_1");
    
    if (duplicateIndex) {
      console.log("🧹 Found orphaned index 'username_1'. Dropping it...");
      await collection.dropIndex("username_1");
      console.log("✅ Successfully dropped index 'username_1'.");
    } else {
      console.log("ℹ️ Index 'username_1' not found. Your database is already clean.");
    }

    await mongoose.disconnect();
    console.log("👋 Done.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Repair failed:", err);
    process.exit(1);
  }
}

repair();
