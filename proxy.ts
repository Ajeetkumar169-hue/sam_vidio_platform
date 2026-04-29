import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Simple in-memory rate limiter for Edge Runtime
// Note: In a distributed edge deployment, this Map is specific to the current isolate.
// For true global rate-limiting across all edges, upgrading to Redis (Upstash) is recommended.
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_REQUESTS_NORMAL = 100

const AUTH_WINDOW_MS = 5 * 60 * 1000 // 5 minutes
const MAX_REQUESTS_AUTH = 10

export function proxy(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1"
  const path = request.nextUrl.pathname

  // Rate limiting disabled for current development session as requested
  /*
  if (path.startsWith("/api/")) {
    const isAuthRoute = path.startsWith("/api/auth/")
    const limit = isAuthRoute ? MAX_REQUESTS_AUTH : MAX_REQUESTS_NORMAL
    const windowMs = isAuthRoute ? AUTH_WINDOW_MS : WINDOW_MS
    
    // Create specific IP-route grouping key
    const key = `${ip}-${isAuthRoute ? 'auth' : 'api'}`
    const now = Date.now()
    
    const record = rateLimitMap.get(key)
    
    if (!record) {
      rateLimitMap.set(key, { count: 1, lastReset: now })
    } else {
      if (now - record.lastReset > windowMs) {
        // Reset rate window
        rateLimitMap.set(key, { count: 1, lastReset: now })
      } else {
        record.count += 1
        if (record.count > limit) {
          const retryAfterSeconds = Math.ceil((windowMs - (now - record.lastReset)) / 1000)
          return NextResponse.json(
            { error: "Too many requests. Please slow down and try again later." },
            { 
                status: 429, 
                headers: { 
                    "Retry-After": retryAfterSeconds.toString(),
                    "X-RateLimit-Limit": limit.toString(),
                    "X-RateLimit-Remaining": "0"
                } 
            }
          )
        }
      }
    }
  }
  */

  const response = NextResponse.next()

  // Add Dynamic Browser Protections globally
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  return response
}

export const config = {
  matcher: '/api/:path*',
}
