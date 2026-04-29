const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Mocking models and connection
async function test() {
  try {
    dotenv.config({ path: ".env.local" });
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected.");

    // Import models (standard CJS way for scripts)
    // Note: In Next.js they are registered on mongoose.models
    const Video = mongoose.models.Video || require("../lib/models/Video").default;
    
    // Use one of the IDs found by the agent
    const testId = "69d6214b2fe050e9705ec079"; 
    
    console.log(`🔍 Testing fetch for ID: ${testId}`);
    
    const video = await Video.findById(testId)
      .populate("channel", "name slug logo subscriberCount")
      .populate("category", "name slug")
      .populate("uploader", "username avatar");

    if (!video) {
       console.log("❌ Video not found in DB.");
       return;
    }

    console.log("✅ Video document fetched.");

    // Simulation of the API response logic
    try {
      const responseData = {
        video: {
          ...video.toObject(),
          _id: video._id.toString(),
          channel: video.channel ? { 
            ...video.channel.toObject(), 
            _id: video.channel._id.toString() 
          } : null,
          category: video.category ? { 
            ...video.category.toObject(), 
            _id: video.category._id.toString() 
          } : null,
          uploader: video.uploader ? { 
            ...video.uploader.toObject(), 
            _id: video.uploader._id.toString() 
          } : null,
        },
      };
      console.log("✅ Response data construction successful.");
    } catch (responseErr) {
      console.error("❌ Response data construction FAILED:", responseErr);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Diagnostic failed:", err);
    process.exit(1);
  }
}

test();
