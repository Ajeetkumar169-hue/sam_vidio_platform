/**
 * S3 Multipart Upload Manager
 * Handles slicing, signing, parallel uploading, and retrying chunks.
 */

export interface UploadPart {
    PartNumber: number;
    ETag: string;
}

export interface UploadProgress {
    percent: number;
    uploadedBytes: number;
    totalBytes: number;
    status: "idle" | "uploading" | "paused" | "error" | "complete";
}

const MIN_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB minimum for S3 multipart
const DEFAULT_CONCURRENT = 3;

export class S3UploadManager {
    private file: File;
    private uploadId: string = "";
    private key: string = "";
    private parts: UploadPart[] = [];
    private progressCallback: (p: UploadProgress) => void;
    private status: UploadProgress["status"] = "idle";
    private uploadedBytes: number = 0;
    private abortController: AbortController | null = null;
    private retriesMap: Map<number, number> = new Map();
    
    // Adaptive config
    private speedMbps: number = 0;
    private adaptiveConcurrency: number = DEFAULT_CONCURRENT;
    private adaptiveChunkSize: number = MIN_CHUNK_SIZE;

    constructor(file: File, progressCallback: (p: UploadProgress) => void) {
        this.file = file;
        this.progressCallback = progressCallback;
        this.loadSession();
    }

    /**
     * Detects upload speed by sending a small 256KB probe to the server
     */
    private async detectSpeed(): Promise<number> {
        try {
            const probeSize = 256 * 1024; // 256KB probe
            const probeData = new Uint8Array(probeSize);
            const start = performance.now();
            
            const res = await fetch("/api/upload/speed-test", {
                method: "POST",
                body: probeData,
            });
            
            if (!res.ok) return 5; // Fallback to 5Mbps

            const end = performance.now();
            const durationSec = (end - start) / 1000;
            const bits = probeSize * 8;
            const mbps = (bits / durationSec) / 1000000;
            
            this.speedMbps = mbps;
            this.adjustConfig(mbps);
            console.log(`🚀 Detected Speed: ${mbps.toFixed(2)} Mbps`);
            return mbps;
        } catch {
            return 5; // Fallback
        }
    }

    private adjustConfig(mbps: number) {
        if (mbps < 2) {
            this.adaptiveConcurrency = 1;
            this.adaptiveChunkSize = 5 * 1024 * 1024; // 5MB
        } else if (mbps < 10) {
            this.adaptiveConcurrency = 2;
            this.adaptiveChunkSize = 5 * 1024 * 1024; // 5MB
        } else if (mbps < 50) {
            this.adaptiveConcurrency = 4;
            this.adaptiveChunkSize = 10 * 1024 * 1024; // 10MB
        } else {
            this.adaptiveConcurrency = 8;
            this.adaptiveChunkSize = 20 * 1024 * 1024; // 20MB
        }
        
        // Ensure we don't exceed S3 10,000 parts limit
        const maxPartsSafeSize = Math.ceil(this.file.size / 9000);
        this.adaptiveChunkSize = Math.max(this.adaptiveChunkSize, maxPartsSafeSize);
    }

    private getStorageKey() {
        return `s3-upload-${this.file.name}-${this.file.size}`;
    }

    private saveSession() {
        if (typeof window === "undefined") return;
        localStorage.setItem(this.getStorageKey(), JSON.stringify({
            uploadId: this.uploadId,
            key: this.key,
            parts: this.parts,
            uploadedBytes: this.uploadedBytes,
        }));
    }

    private loadSession() {
        if (typeof window === "undefined") return;
        const saved = localStorage.getItem(this.getStorageKey());
        if (saved) {
            const data = JSON.parse(saved);
            this.uploadId = data.uploadId;
            this.key = data.key;
            this.parts = data.parts;
            this.uploadedBytes = data.uploadedBytes;
            this.status = "paused";
            this.updateProgress();
        }
    }

    private clearSession() {
        if (typeof window === "undefined") return;
        localStorage.removeItem(this.getStorageKey());
    }

    public getProgress(): UploadProgress {
        return {
            percent: Math.round((this.uploadedBytes / this.file.size) * 100),
            uploadedBytes: this.uploadedBytes,
            totalBytes: this.file.size,
            status: this.status,
        };
    }

    private updateProgress() {
        this.progressCallback(this.getProgress());
    }

    async start(metadata: any): Promise<any> {
        if (this.status === "uploading") return;

        try {
            this.status = "uploading";
            this.updateProgress();

            // 0. Detect Speed for adaptive configuration
            await this.detectSpeed();

            // 1. Initialize Upload if no session exists or if it was invalidated
            if (!this.uploadId) {
                const initRes = await fetch("/api/upload/init", {
                    method: "POST",
                    body: JSON.stringify({
                        filename: this.file.name,
                        contentType: this.file.type || "video/mp4",
                        fileSize: this.file.size,
                    }),
                });
                const { uploadId, key, error } = await initRes.json();
                if (error) throw new Error(error);

                this.uploadId = uploadId;
                this.key = key;
                this.saveSession();
            }

            // 2. Upload Parts in chunks
            await this.uploadAllParts();

            // 3. Complete Upload
            const completeRes = await fetch("/api/upload/complete", {
                method: "POST",
                body: JSON.stringify({
                    uploadId: this.uploadId,
                    key: this.key,
                    parts: this.parts,
                    metadata: {
                        ...metadata,
                        fileSize: this.file.size,
                    },
                }),
            });
            const final = await completeRes.json();
            if (final.error) throw new Error(final.error);

            this.status = "complete";
            this.updateProgress();
            this.clearSession();
            return final;
        } catch (err: any) {
            if (err.name === "AbortError") {
                this.status = "paused";
            } else {
                this.status = "error";
                console.error("❌ Upload Error:", err);
            }
            this.updateProgress();
            throw err;
        }
    }

    private async uploadAllParts() {
        const totalParts = Math.ceil(this.file.size / this.adaptiveChunkSize);
        const completedPartNumbers = new Set(this.parts.map(p => p.PartNumber));
        const remainingPartNumbers = Array.from({ length: totalParts }, (_, i) => i + 1)
            .filter(n => !completedPartNumbers.has(n));
        
        if (remainingPartNumbers.length === 0) return;

        this.abortController = new AbortController();
        const urlCache = new Map<number, string>();

        const fetchBatchUrls = async (partNumbers: number[]) => {
            const res = await fetch("/api/upload/urls", {
                method: "POST",
                body: JSON.stringify({
                    key: this.key,
                    uploadId: this.uploadId,
                    partNumbers
                })
            });
            const { urls, error } = await res.json();
            if (error) throw new Error(error);
            urls.forEach((u: any) => urlCache.set(u.partNumber, u.url));
        };

        const uploadNext = async (): Promise<void> => {
            if (remainingPartNumbers.length === 0 || this.status !== "uploading") return;

            const partNumber = remainingPartNumbers.shift()!;
            
            // If URL not in cache, fetch a new batch
            if (!urlCache.has(partNumber)) {
                const batch = [partNumber, ...remainingPartNumbers.slice(0, 9)];
                await fetchBatchUrls(batch);
            }

            const url = urlCache.get(partNumber)!;
            urlCache.delete(partNumber);

            await this.uploadPart(partNumber, url);
            return uploadNext();
        };

        const workers = Array.from({ length: Math.min(this.adaptiveConcurrency, remainingPartNumbers.length) }, () => uploadNext());
        await Promise.all(workers);
    }

    private async uploadPart(partNumber: number, url: string): Promise<void> {
        const start = (partNumber - 1) * this.adaptiveChunkSize;
        const end = Math.min(start + this.adaptiveChunkSize, this.file.size);
        const blob = this.file.slice(start, end);

        try {
            const res = await fetch(url, {
                method: "PUT",
                body: blob,
                signal: this.abortController?.signal,
            });

            if (!res.ok) throw new Error(`Part ${partNumber} upload failed`);

            const etag = res.headers.get("ETag");
            if (!etag) throw new Error("No ETag returned from S3");

            this.parts.push({
                PartNumber: partNumber,
                ETag: etag.replace(/"/g, ""),
            });

            this.uploadedBytes += (end - start);
            this.saveSession();
            this.updateProgress();
        } catch (err: any) {
            if (err.name === "AbortError") return;

            const retries = this.retriesMap.get(partNumber) || 0;
            if (retries < 5) {
                this.retriesMap.set(partNumber, retries + 1);
                // Exponential backoff
                const delay = Math.pow(2, retries) * 1000;
                await new Promise(r => setTimeout(() => r(undefined), delay));
                return this.uploadPart(partNumber, url);
            } else {
                this.status = "error";
                throw err;
            }
        }
    }

    pause() {
        this.status = "paused";
        this.abortController?.abort();
        this.updateProgress();
    }

    async cancel() {
        this.status = "idle";
        this.abortController?.abort();
        
        if (this.uploadId) {
            await fetch("/api/upload/abort", {
                method: "POST",
                body: JSON.stringify({ key: this.key, uploadId: this.uploadId }),
            }).catch(() => {});
        }

        this.clearSession();
        this.uploadId = "";
        this.key = "";
        this.parts = [];
        this.uploadedBytes = 0;
        this.updateProgress();
    }
}
