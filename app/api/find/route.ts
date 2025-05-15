import { DataProtection } from '@/lib/data-protection';
import { findNearbyPeddlers } from '@/lib/peddlers';
import { RateLimiter } from '@/lib/rate-limiter';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import NodeCache from 'node-cache';
import { z } from 'zod';

// Initialize cache with a default TTL (e.g., 5 minutes)
const peddlerCache = new NodeCache({ stdTTL: 300, checkperiod: 120 });

// Type definitions for the query analysis
interface QueryAnalysisResult {
    isLookingForPeddlers: boolean;
    peddlerType: string;
    keywords: string[];
    city?: string;
    kecamatan?: string;
    kelurahan?: string;
    directResponse: string;
}

const QueryAnalysisResultSchema = z.object({
    isLookingForPeddlers: z.boolean().describe("True if the user's query is about finding street peddlers/peddlers, false otherwise."),
    peddlerType: z.string().describe("Specific type of peddler or food item the user is looking for (e.g., 'bakso', 'siomay', 'es kelapa'). Empty string if no specific type is mentioned or if not looking for peddlers."),
    keywords: z.array(z.string()).describe("Relevant keywords from the user's query that help identify the peddler type or search intent. Empty array if not looking for peddlers."),
    city: z.string().optional().describe("City name mentioned by the user (e.g., 'Depok', 'Jakarta Selatan')."),
    kecamatan: z.string().optional().describe("Kecamatan (sub-district) name mentioned by the user (e.g., 'Beji', 'Margonda')."),
    kelurahan: z.string().optional().describe("Kelurahan (village/urban ward) name mentioned by the user (e.g., 'Pondok Cina', 'Kemirimuka')."),
    directResponse: z.string().describe("A polite, natural language response in English to the user if they are NOT looking for peddlers (isLookingForPeddlers is false). Example: 'I can help you find street food peddlers. What are you looking for?' or 'Sorry, I can only help with finding peddlers.'")
});

// Type definition for pagination and response
interface PeddlerResponse {
    peddlers: any[];
    hasMore: boolean;
    lastPeddlerId?: string;
}

// Mock database of peddlers for fallback when Firestore is not accessible
const mockPeddlers: any[] = []; // Initialize as empty array as mock data is removed

// Helper functions for fallback mode
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function formatDistance(distance: number): string {
    if (distance < 1000) {
        return `${Math.round(distance)}m`;
    } else {
        return `${(distance / 1000).toFixed(1)}km`;
    }
}

// Fallback function to find nearby peddlers when Firestore is not accessible
async function findNearbyPeddlersFallback(
    location: { lat: number; lon: number } | undefined,
    peddlerType: string = '',
    keywords: string[] = [],
    city: string = '',
    kecamatan: string = '',
    kelurahan: string = '',
    maxDistance: number = 5000,
    limit: number = 10,
    lastPeddlerId?: string
): Promise<PeddlerResponse> {
    // Filter active peddlers
    let filteredPeddlers = mockPeddlers.filter(peddler => peddler.status === 'active');

    // Filter by type if provided
    if (peddlerType && peddlerType.trim() !== '') {
        const lowerCaseType = peddlerType.toLowerCase();
        filteredPeddlers = filteredPeddlers.filter(
            peddler => peddler.type.toLowerCase().includes(lowerCaseType)
        );
    } else if (keywords && keywords.length > 0) {
        // If no specific peddler type but keywords are provided
        filteredPeddlers = filteredPeddlers.filter(peddler => {
            const peddlerText = `${peddler.name} ${peddler.type} ${peddler.description}`.toLowerCase();
            return keywords.some(keyword =>
                peddlerText.includes(keyword.toLowerCase())
            );
        });
    }

    // If no results with strict filtering, make a more lenient search
    if (filteredPeddlers.length === 0) {
        // Include all peddlers for these common food terms
        const commonFoodTerms = ['makanan', 'food', 'jual', 'pedagang', 'penjual', 'cari'];
        if (keywords.some(keyword => commonFoodTerms.includes(keyword.toLowerCase()))) {
            filteredPeddlers = mockPeddlers.filter(peddler => peddler.status === 'active');
        }

        // For "bakso" specifically, match the bakso peddlers
        if (keywords.some(keyword => keyword.toLowerCase().includes('bakso'))) {
            filteredPeddlers = mockPeddlers.filter(
                peddler => peddler.type.toLowerCase().includes('bakso') && peddler.status === 'active'
            );
        }
    }

    // If still no results and query contains any common food keyword, return all active peddlers
    if (filteredPeddlers.length === 0) {
        const foodKeywords = ['makan', 'food', 'jajan', 'kuliner', 'lapar', 'laper'];
        if (keywords.some(keyword =>
            foodKeywords.some(food => keyword.toLowerCase().includes(food))
        )) {
            filteredPeddlers = mockPeddlers.filter(peddler => peddler.status === 'active');
        }
    }

    // Calculate distance and filter by max_distance
    let peddlersWithDistance = filteredPeddlers
        .map(peddler => {
            let distance = Infinity;
            let formattedDistance = 'N/A';
            if (location) {
                distance = calculateDistance(
                    location.lat,
                    location.lon,
                    peddler.location.lat,
                    peddler.location.lon
                );
                formattedDistance = formatDistance(distance);
            }
            return {
                ...peddler,
                distance: formattedDistance,
                raw_distance: distance
            };
        })
        .filter(peddler => location ? (peddler.raw_distance as number) <= maxDistance : true)
        .sort((a, b) => (a.raw_distance as number) - (b.raw_distance as number));

    // Handle pagination
    if (lastPeddlerId) {
        const lastPeddlerIndex = peddlersWithDistance.findIndex(v => v.id === lastPeddlerId);
        if (lastPeddlerIndex !== -1) {
            peddlersWithDistance = peddlersWithDistance.slice(lastPeddlerIndex + 1);
        }
    }

    const hasMore = peddlersWithDistance.length > limit;
    const paginatedPeddlers = peddlersWithDistance.slice(0, limit);
    const lastId = paginatedPeddlers.length > 0 ? paginatedPeddlers[paginatedPeddlers.length - 1].id : undefined;

    // Return peddlers without the raw_distance property
    return {
        peddlers: paginatedPeddlers.map(({ raw_distance, ...peddler }) => peddler),
        hasMore,
        lastPeddlerId: lastId
    };
}

export async function POST(request: NextRequest) {
    // Apply rate limiting
    const rateLimiter = RateLimiter.getInstance();
    const { isLimited, remainingRequests, headers: rateLimitHeaders } =
        rateLimiter.checkRateLimit(request, 'find');

    // If rate limit exceeded, return 429 Too Many Requests
    if (isLimited) {
        return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            {
                status: 429,
                headers: {
                    ...rateLimitHeaders,
                    'Retry-After': '60', // Suggest client waits 1 minute
                }
            }
        );
    }

    try {
        const { message, location, lastPeddlerId, limit = 10 } = await request.json();

        if (!message || !message.trim()) {
            return NextResponse.json(
                { error: 'Message is required' },
                {
                    status: 400,
                    headers: rateLimitHeaders
                }
            );
        }

        // Validate location data and normalize lng/lon naming
        if (!location || typeof location !== 'object') {
            return NextResponse.json(
                { error: 'Location data is required' },
                {
                    status: 400,
                    headers: rateLimitHeaders
                }
            );
        }

        // Handle the case where the frontend sends `lng` instead of `lon`
        const normalizedLocation = {
            lat: location.lat,
            lon: location.lon || location.lng // Use lon if present, otherwise fall back to lng
        };

        // Get data protection instance
        const dataProtection = DataProtection.getInstance();

        // Check for user consent
        const hasConsent = await (async () => {
            try {
                const cookieStore = await cookies();
                const consentCookie = cookieStore.get("privacy-consent");
                return consentCookie?.value === "true";
            } catch (error) {
                console.error("Error checking consent:", error);
                return false; // Default to no consent if error
            }
        })();

        // Use Gemini AI to determine if the query is looking for peddlers
        const result = await analyzeUserQuery(message);

        // Store the user query for analytics, respecting consent
        if (normalizedLocation) {
            // Anonymize location *before* storing if no consent
            const locationToStore = hasConsent ? normalizedLocation : dataProtection.anonymizeLocation(normalizedLocation);
            await dataProtection.storeUserQuery(message, locationToStore, hasConsent);
        }

        // If the query is not looking for peddlers, respond with a direct message
        if (!result.isLookingForPeddlers) {
            return NextResponse.json({
                response: {
                    text: result.directResponse,
                    peddlers: [], // No peddlers to return
                    hasMore: false
                }
            }, { headers: rateLimitHeaders });
        }

        // If we get here, the user is looking for peddlers
        // Generate a cache key based on the search parameters
        const locationCacheKey = normalizedLocation ? `${normalizedLocation.lat.toFixed(4)}_${normalizedLocation.lon.toFixed(4)}` : 'no_location';
        const cacheKey = `peddlers_${locationCacheKey}_${result.peddlerType}_${result.keywords.join('-')}_${result.city || 'anycity'}_${result.kecamatan || 'anykec'}_${result.kelurahan || 'anykel'}_${lastPeddlerId || 'first'}`;

        // Check if we have cached results
        const cachedResults = peddlerCache.get<PeddlerResponse>(cacheKey);
        if (cachedResults) {
            return NextResponse.json({
                response: {
                    text: `Here are some ${result.peddlerType || 'food'} peddlers near you:`,
                    peddlers: cachedResults.peddlers,
                    hasMore: cachedResults.hasMore,
                    lastPeddlerId: cachedResults.lastPeddlerId
                }
            }, { headers: rateLimitHeaders });
        }

        // No cached results, search for peddlers
        try {
            // Search for nearby peddlers
            const { peddlers, hasMore } = await findNearbyPeddlers({
                userLocation: normalizedLocation,
                peddlerType: result.peddlerType,
                keywords: result.keywords,
                city: result.city,
                kecamatan: result.kecamatan,
                kelurahan: result.kelurahan,
                maxDistance: 5000, // 5km
                limit: parseInt(limit.toString(), 10),
                lastPeddlerId: lastPeddlerId
            });

            const lastId = peddlers.length > 0 ? peddlers[peddlers.length - 1].id : undefined;

            // Cache the results
            peddlerCache.set(cacheKey, { peddlers, hasMore, lastPeddlerId: lastId });

            // Determine the response text based on the search results
            let responseText;
            if (peddlers.length === 0) {
                responseText = `I couldn't find any ${result.peddlerType || 'food'} peddlers near your location. Please try a different search or check back later.`;
            } else {
                responseText = `Here are some ${result.peddlerType || 'food'} peddlers near you:`;
            }

            return NextResponse.json({
                response: {
                    text: responseText,
                    peddlers: peddlers,
                    hasMore: hasMore,
                    lastPeddlerId: lastId
                }
            }, { headers: rateLimitHeaders });
        } catch (error) {
            console.error("Error finding peddlers:", error);

            // Fallback to mock data if Firestore search fails
            const fallbackResults = await findNearbyPeddlersFallback(
                normalizedLocation,
                result.peddlerType,
                result.keywords,
                result.city,
                result.kecamatan,
                result.kelurahan,
                5000,
                parseInt(limit.toString(), 10),
                lastPeddlerId
            );

            return NextResponse.json({
                response: {
                    text: `Here are some ${result.peddlerType || 'food'} peddlers near you (fallback data):`,
                    peddlers: fallbackResults.peddlers,
                    hasMore: fallbackResults.hasMore,
                    lastPeddlerId: fallbackResults.lastPeddlerId
                }
            }, { headers: rateLimitHeaders });
        }
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            { error: 'Internal server error' },
            {
                status: 500,
                headers: rateLimitHeaders
            }
        );
    }
}

// Function to analyze user query with Gemini AI
async function analyzeUserQuery(query: string): Promise<QueryAnalysisResult> {
    try {
        // Define the prompt for Gemini - this will be more of a system prompt or context
        // The main user query will be the 'prompt' for generateObject
        const systemPrompt = `You are an AI assistant helping users find Indonesian street food peddlers. Analyze the user's query. 
Determine if they are looking for peddlers. 
Identify the specific type of peddler or food (e.g., bakso, siomay, sate). 
Extract relevant keywords. 
Also, extract administrative location details if mentioned: city (e.g., 'Depok', 'Jakarta Selatan'), kecamatan/sub-district (e.g., 'Beji', 'Margonda'), and kelurahan/village/urban ward (e.g., 'Pondok Cina', 'Kemirimuka'). 
If they are not looking for peddlers, provide a polite response in English explaining your purpose or asking for clarification. Examples of Indonesian street food types: bakso, siomay, batagor, es kelapa, es cincau, martabak, etc.`;

        const geminiFlashModel = google('gemini-2.0-flash'); // Using the same model as in lib/gemini.ts for consistency

        // Use generateObject for structured output
        const { object } = await generateObject({
            model: geminiFlashModel,
            schema: QueryAnalysisResultSchema,
            prompt: query, // The user's raw query
            system: systemPrompt, // System prompt to guide the LLM's behavior
        });

        return object;

    } catch (error) {
        console.error('Error analyzing user query with AI SDK:', error);
        // Fallback response if AI SDK call fails or parsing fails
        // Check if the error is a specific AIError or a ZodError for more granular handling if needed

        // A simple fallback: assume they are looking for peddlers with the query as keyword
        // This is similar to the original fallback but without attempting to determine directResponse.
        if (query && query.trim().length > 0) {
            return {
                isLookingForPeddlers: true, // Default to true in case of error to allow search
                peddlerType: '',
                keywords: [query.toLowerCase().trim()], // Use the query as a keyword
                city: undefined,
                kecamatan: undefined,
                kelurahan: undefined,
                directResponse: '' // No direct response in this fallback
            };
        }
        // More generic fallback if query is empty or other unhandled error
        return {
            isLookingForPeddlers: false,
            peddlerType: '',
            keywords: [],
            city: undefined,
            kecamatan: undefined,
            kelurahan: undefined,
            directResponse: 'Sorry, I encountered an issue processing your request. Please try again.'
        };
    }
} 