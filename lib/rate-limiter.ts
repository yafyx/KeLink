import { NextRequest } from 'next/server';
import NodeCache from 'node-cache';

type RateLimitConfig = {
    // Maximum number of requests per window
    limit: number;
    // Time window in seconds
    windowMs: number;
};

// Store request counts for rate limiting
const requestCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

export class RateLimiter {
    private static instance: RateLimiter;
    private config: Record<string, RateLimitConfig> = {
        // Default config for all endpoints
        default: {
            limit: 100,
            windowMs: 60 * 15, // 15 minutes
        },
        // Specific config for find endpoint (which might be more resource-intensive)
        find: {
            limit: 30,
            windowMs: 60 * 5, // 5 minutes
        },
        // Vendor registration (to prevent spam)
        register: {
            limit: 10,
            windowMs: 60 * 60, // 1 hour
        },
    };

    private constructor() { }

    public static getInstance(): RateLimiter {
        if (!RateLimiter.instance) {
            RateLimiter.instance = new RateLimiter();
        }
        return RateLimiter.instance;
    }

    /**
     * Check if a request exceeds the rate limit
     * @param request The Next.js request object
     * @param endpoint The API endpoint being accessed (default, find, register, etc.)
     * @returns Object with isLimited flag and headers to add to the response
     */
    public checkRateLimit(request: NextRequest, endpoint: string = 'default'): {
        isLimited: boolean;
        remainingRequests: number;
        headers: Record<string, string>;
    } {
        // Get the config for this endpoint or use default
        const config = this.config[endpoint] || this.config.default;

        // Identify the client - prefer authorization token, then IP
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        const ip = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';

        // Create a unique identifier for this client and endpoint
        const identifier = `${endpoint}:${token || ip}`;

        // Get current request count
        let requestCount = requestCache.get<number>(identifier) || 0;

        // Increment request count
        requestCount++;

        // Store updated count with appropriate TTL
        requestCache.set(identifier, requestCount, config.windowMs);

        // Calculate remaining requests
        const remainingRequests = Math.max(0, config.limit - requestCount);

        // Generate X-RateLimit headers
        const headers = {
            'X-RateLimit-Limit': config.limit.toString(),
            'X-RateLimit-Remaining': remainingRequests.toString(),
            'X-RateLimit-Reset': Math.floor(Date.now() / 1000 + config.windowMs).toString(),
        };

        // Check if rate limit exceeded
        const isLimited = requestCount > config.limit;

        return {
            isLimited,
            remainingRequests,
            headers,
        };
    }
} 