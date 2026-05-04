import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production"

export interface JWTPayload {
  userId: string
  email: string
  username: string
  role: string
}

// Node-only: For login/register (not used in Edge routes)
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * EDGE COMPATIBLE JWT VERIFICATION
 * Uses Web Crypto API instead of 'jsonwebtoken' to work on Vercel Edge Runtime.
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

        const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
        const isValid = await crypto.subtle.verify('HMAC', key, signature, data);

        if (!isValid) return null;

        const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
        return payload as JWTPayload;
    } catch (err) {
        return null;
    }
}

// For Node.js environments (like login) we still use this if needed, 
// but for Edge routes, the verifyJWTEdge logic is the key.
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value
  if (!token) return null
  
  // Use edge-safe verification
  return verifyJWTEdge(token);
}

// Helper to keep token generation (only used in login/register, which run in Node)
export function generateToken(payload: JWTPayload): string {
    // For now, keep it simple. If login also moves to edge, we'd use crypto.subtle.sign
    const jwt = require('jsonwebtoken'); 
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
