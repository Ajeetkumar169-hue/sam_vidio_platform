import { jwtVerify, SignJWT } from "jose";
import CONFIG from "./config";

/**
 * 🔐 EDGE-COMPATIBLE AUTHENTICATION
 * Uses 'jose' for high-performance token verification on the Edge Runtime.
 */

const SECRET = new TextEncoder().encode(CONFIG.JWT_SECRET);

export interface EdgeJWTPayload {
    userId: string;
    email: string;
    username: string;
    role: string;
}

export async function verifyAuthToken(token: string): Promise<EdgeJWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, SECRET);
        return payload as unknown as EdgeJWTPayload;
    } catch (error) {
        return null;
    }
}

export async function createAuthToken(payload: EdgeJWTPayload): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(SECRET);
}
