/**
 * 🚀 ULTRA EDGE UPLOAD WORKER
 * Handles parallel chunk uploads in the background to keep the UI thread 100% responsive.
 */
self.onmessage = async (e) => {
    const { type, partNumber, url, blob, uploadId } = e.data;

    if (type === 'UPLOAD_CHUNK') {
        try {
            const startTime = Date.now();
            const res = await fetch(url, {
                method: "PUT",
                body: blob,
                headers: {
                    "Content-Type": "application/octet-stream"
                }
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const etag = res.headers.get("ETag");
            if (!etag) throw new Error("Missing ETag");

            self.postMessage({
                type: 'CHUNK_SUCCESS',
                partNumber,
                etag: etag.replace(/"/g, ""),
                duration: Date.now() - startTime,
                size: blob.size
            });
        } catch (err) {
            self.postMessage({
                type: 'CHUNK_FAIL',
                partNumber,
                error: err.message
            });
        }
    }
};
