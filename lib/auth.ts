import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production"

export interface JWTPayload {
  userId: string
  email: string
  username: string
  role: string
}

/**
 * EDGE COMPATIBLE JWT VERIFICATION
 * Uses Web Crypto API (SubtleCrypto) which is native to Vercel Edge Runtime.
 * No 'jsonwebtoken' or 'crypto' (Node) module needed.
 */
async function verifyJWTEdge(token: string): Promise<JWTPayload | null> {
    try {
        const [headerB64, payloadB64, signatureB64] = token.split('.');
        if (!signatureB64) return null;

        const encoder = new TextEncoder();
        const data = encoder.encode(`${headerB64}.${payloadB64}`);
        
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(JWT_SECRET),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        // Helper for base64url to base64
        const b64 = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
        const signature = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        
        const isValid = await crypto.subtle.verify('HMAC', key, signature, data);
        if (!isValid) return null;

        const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
        return payload as JWTPayload;
    } catch (err) {
        return null;
    }
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value
  if (!token) return null
  return verifyJWTEdge(token);
}

// Node-only functions (will throw if called on Edge, but that's fine as they are only for login/reg)
export async function hashPassword(password: string): Promise<string> {
    const bcrypt = await import("bcryptjs");
    return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    const bcrypt = await import("bcryptjs");
    return bcrypt.compare(password, hashedPassword);
}

export async function generateToken(payload: JWTPayload): Promise<string> {
    const jwt = await import("jsonwebtoken");
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
