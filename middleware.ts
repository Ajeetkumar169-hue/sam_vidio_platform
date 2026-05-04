import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuthToken } from "./lib/edge-auth";

/**
 * 🛡️ GLOBAL ARCHITECTURE MIDDLEWARE
 * Handles route protection, security headers, and request logging.
 */

const PROTECTED_ROUTES = ["/admin", "/upload", "/studio", "/profile", "/settings"];
const ADMIN_ROUTES = ["/admin"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get("auth-token")?.value;

    // 1. Check if route is protected
    const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
    const isAdminOnly = ADMIN_ROUTES.some(route => pathname.startsWith(route));

    if (isProtected) {
        if (!token) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }

        const payload = await verifyAuthToken(token);
        if (!payload) {
            const response = NextResponse.redirect(new URL("/login", request.url));
            response.cookies.delete("auth-token");
            return response;
        }

        // 2. Admin Check
        if (isAdminOnly && payload.role !== "admin") {
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    // 3. API Protection (Optional: Add more strict checks for /api routes)
    if (pathname.startsWith("/api/admin") && !token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = NextResponse.next();

    // 4. Security Headers (Best Practice)
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public (public files)
         */
        "/((?!_next/static|_next/image|favicon.ico|public).*)",
    ],
};
