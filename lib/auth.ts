import crypto from "crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-Memory sliding window rate limiter fallback
class MemoryRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs = 60000, maxRequests = 60) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async limit(identifier: string): Promise<{ success: boolean; limit: number; remaining: number }> {
    const now = Date.now();
    const timestamps = this.requests.get(identifier) || [];
    const valid = timestamps.filter((t) => now - t < this.windowMs);

    if (valid.length >= this.maxRequests) {
      return { success: false, limit: this.maxRequests, remaining: 0 };
    }

    valid.push(now);
    this.requests.set(identifier, valid);
    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - valid.length,
    };
  }
}

const memoryLimiter = new MemoryRateLimiter(60000, 60);

const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

let upstashRatelimit: Ratelimit | null = null;
if (redisUrl && redisToken) {
  try {
    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });
    upstashRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      analytics: false,
    });
  } catch (err) {
    console.warn("Upstash Redis initialization failed; falling back to in-memory rate limiting", err);
  }
}

/**
 * Checks rate limit for a client IP or identifier
 */
export async function checkRateLimit(identifier: string = "anonymous") {
  if (upstashRatelimit) {
    try {
      const res = await upstashRatelimit.limit(identifier);
      return { success: res.success, remaining: res.remaining, limit: res.limit };
    } catch {
      // Fallback
    }
  }
  return memoryLimiter.limit(identifier);
}

/**
 * Checks if ADMIN_TOKEN is set in the environment
 */
export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_TOKEN && process.env.ADMIN_TOKEN.trim().length > 0);
}

/**
 * Constant-time comparison of ADMIN_TOKEN to prevent timing attacks
 * Returns false immediately if ADMIN_TOKEN is not configured (never open access).
 */
export function verifyAdminToken(providedToken: string | null | undefined): boolean {
  const expectedToken = process.env.ADMIN_TOKEN;
  if (!expectedToken || !providedToken) return false;

  try {
    const providedBuffer = Buffer.from(providedToken, "utf8");
    const expectedBuffer = Buffer.from(expectedToken, "utf8");

    if (providedBuffer.length !== expectedBuffer.length) {
      // Create equal length buffer to avoid timing leak on length comparison
      const dummyBuffer = Buffer.alloc(providedBuffer.length, 0);
      crypto.timingSafeEqual(providedBuffer, dummyBuffer);
      return false;
    }

    return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Checks request headers and cookies for admin authentication
 */
export function isAuthorizedAdmin(req: Request): boolean {
  // Check Authorization header: Bearer <token>
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (verifyAdminToken(token)) return true;
  }

  // Check custom header
  const customHeader = req.headers.get("x-admin-token");
  if (customHeader && verifyAdminToken(customHeader.trim())) return true;

  // Check cookie (admin_token)
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => {
        const [k, ...v] = c.split("=");
        return [k, decodeURIComponent(v.join("="))];
      })
    );
    if (cookies.admin_token && verifyAdminToken(cookies.admin_token)) {
      return true;
    }
  }

  return false;
}
