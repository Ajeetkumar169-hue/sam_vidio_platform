import { NextResponse } from "next/server";

/**
 * ⚡ STANDARDIZED API RESPONSE ENGINE
 * Ensures all backend responses follow a predictable structure.
 */

export class ApiResponse {
    static success(data: any = null, message: string = "Success", status: number = 200) {
        return NextResponse.json({
            success: true,
            data,
            message,
            timestamp: new Date().toISOString()
        }, { status });
    }

    static error(error: string = "Internal Server Error", status: number = 500, details: any = null) {
        console.error(`[API ERROR ${status}]: ${error}`, details);
        return NextResponse.json({
            success: false,
            error,
            details,
            timestamp: new Date().toISOString()
        }, { status });
    }

    static unauthorized(message: string = "Unauthorized access") {
        return this.error(message, 401);
    }

    static badRequest(message: string = "Invalid request data", details: any = null) {
        return this.error(message, 400, details);
    }

    static notFound(message: string = "Resource not found") {
        return this.error(message, 404);
    }
}
