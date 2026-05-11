const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Mock Video model if import fails, but let's try to load the real one
let Video;
try {
    // We need to register the model
    require('./lib/models/Video');
    Video = mongoose.models.Video;
} catch (e) {
    console.error("Failed to load Video model:", e);
    process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        const counts = await Video.aggregate([
            { $group: { _id: { status: '$status', isShort: '$isShort' }, count: { $sum: 1 } } }
        ]);
        console.log("Video Stats:", JSON.stringify(counts, null, 2));
        
        const latest = await Video.find().sort({ createdAt: -1 }).limit(5).select('title status isShort createdAt');
        console.log("Latest Videos:", JSON.stringify(latest, null, 2));

        process.exit(0);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
