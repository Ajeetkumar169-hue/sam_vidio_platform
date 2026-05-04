import connectDB from "@/lib/db";
import Video from "@/lib/models/Video";

/**
 * MOCK TRANSCODER (For Demo/Development)
 * In a production SaaS, this would be handled by AWS MediaConvert + Lambda.
 */
export async function simulateTranscoding(videoId: string) {
    console.log(`🎬 [TRANSCODER] Starting mock job for: ${videoId}`);
    
    // Step 1: Simulate 720p conversion (after 10s)
    setTimeout(async () => {
        await connectDB();
        await Video.findByIdAndUpdate(videoId, { 
            processingProgress: 40,
            status: "processing"
        });
        console.log(`🎬 [TRANSCODER] 480p Ready for: ${videoId}`);
    }, 10000);

    // Step 2: Simulate 1080p conversion (after 25s)
    setTimeout(async () => {
        await connectDB();
        const video = await Video.findById(videoId);
        if (!video) return;

        // Mock qualities
        const qualities = [
            { label: "1080p", url: video.videoUrl, size: video.storageSize },
            { label: "720p", url: video.videoUrl, size: Math.round((video.storageSize || 0) * 0.6) },
            { label: "480p", url: video.videoUrl, size: Math.round((video.storageSize || 0) * 0.3) }
        ];

        await Video.findByIdAndUpdate(videoId, { 
            status: "ready", // Final status
            processingProgress: 100,
            qualities: qualities
        });
        console.log(`✅ [TRANSCODER] Transcoding complete for: ${videoId}`);
    }, 25000);
}
