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
const MAX_CONCURRENT = 3; // Number of concurrent chunk uploads

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

    constructor(file: File, progressCallback: (p: UploadProgress) => void) {
        this.file = file;
        this.progressCallback = progressCallback;
        this.loadSession();
    }

    private get CHUNK_SIZE() {
        // Ensure max parts is ~9000 (below S3 10,000 part limit)
        return Math.max(MIN_CHUNK_SIZE, Math.ceil(this.file.size / 9000));
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
        const totalParts = Math.ceil(this.file.size / this.CHUNK_SIZE);
        const completedPartNumbers = new Set(this.parts.map(p => p.PartNumber));
        const remainingPartNumbers = Array.from({ length: totalParts }, (_, i) => i + 1)
            .filter(n => !completedPartNumbers.has(n));
        
        if (remainingPartNumbers.length === 0) return;

        this.abortController = new AbortController();

        const uploadNext = async (): Promise<void> => {
            if (remainingPartNumbers.length === 0 || this.status !== "uploading") return;

            const partNumber = remainingPartNumbers.shift()!;
            await this.uploadPart(partNumber);
            return uploadNext();
        };

        const workers = Array.from({ length: Math.min(MAX_CONCURRENT, remainingPartNumbers.length) }, () => uploadNext());
        await Promise.all(workers);
    }

    private async uploadPart(partNumber: number): Promise<void> {
        const start = (partNumber - 1) * this.CHUNK_SIZE;
        const end = Math.min(start + this.CHUNK_SIZE, this.file.size);
        const blob = this.file.slice(start, end);

        try {
            const urlRes = await fetch("/api/upload/url", {
                method: "POST",
                body: JSON.stringify({
                    key: this.key,
                    uploadId: this.uploadId,
                    partNumber: partNumber,
                }),
            });
            const { url, error } = await urlRes.json();
            if (error) throw new Error(error);

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
                return this.uploadPart(partNumber);
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
