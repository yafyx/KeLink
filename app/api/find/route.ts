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

// Mock database of peddlers for fallback - REMOVED
// const mockPeddlers: any[] = [];

// Helper functions for fallback mode - REMOVED as they relied on mockPeddlers
/*
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // ... implementation ...
}

function formatDistance(distance: number): string {
    // ... implementation ...
}
*/

// Fallback function to find nearby peddlers - REMOVED
/*
async function findNearbyPeddlersFallback(
    location: { lat: number; lon: number } | undefined,
    // ... other params ...
): Promise<PeddlerResponse> {
    // ... implementation using mockPeddlers ...
    return { peddlers: [], hasMore: false }; // Simplified return after removing mock logic
}
*/

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

            // Identify targeted peddlers for logging
            let targetedPeddlerInfoForLogging: Array<{ peddlerId: string; queryType: 'direct_match' | 'keyword_match' }> = [];
            if (result.keywords && result.keywords.length > 0 && peddlers.length > 0) {
                peddlers.forEach(p => {
                    const pNameLower = p.name.toLowerCase();
                    const pTypeLower = p.type.toLowerCase();
                    let matched = false;
                    // Check for direct name match in keywords
                    if (result.keywords.some(kw => pNameLower.includes(kw.toLowerCase()))) {
                        targetedPeddlerInfoForLogging.push({ peddlerId: p.id, queryType: 'direct_match' });
                        matched = true;
                    }
                    // Check if peddlerType from query analysis matches peddler type and a keyword also matches name/type (more general match)
                    if (!matched && result.peddlerType && pTypeLower.includes(result.peddlerType.toLowerCase())) {
                        if (result.keywords.some(kw => pNameLower.includes(kw.toLowerCase()) || pTypeLower.includes(kw.toLowerCase()))) {
                            targetedPeddlerInfoForLogging.push({ peddlerId: p.id, queryType: 'keyword_match' });
                        }
                    }
                });
            }
            // Deduplicate, in case a peddler matched multiple ways, preferring direct_match
            const uniqueTargetedPeddlers = Array.from(new Map(targetedPeddlerInfoForLogging.map(item => [item.peddlerId, item])).values());

            // Update the call to storeUserQuery to include targeted peddler info
            // This assumes storeUserQuery is updated to handle this new parameter.
            // The actual implementation of how it stores this is in lib/data-protection.ts (not provided)
            if (normalizedLocation) { // Re-check normalizedLocation as it was in a different if block before
                const locationToStore = hasConsent ? normalizedLocation : dataProtection.anonymizeLocation(normalizedLocation);
                // The line below is the original call. 
                // To log uniqueTargetedPeddlers, dataProtection.storeUserQuery would need to be modified
                // to accept a fourth argument, e.g.:
                // await dataProtection.storeUserQuery(message, locationToStore, hasConsent, uniqueTargetedPeddlers);
                // For now, uniqueTargetedPeddlers is prepared but not passed to the original storeUserQuery.
                await dataProtection.storeUserQuery(message, locationToStore, hasConsent);
                // TODO: Log uniqueTargetedPeddlers separately or update storeUserQuery to handle them.
                // Example of separate logging (conceptual):
                // if (uniqueTargetedPeddlers.length > 0) {
                //   await dataProtection.logPeddlerSearchEvents(uniqueTargetedPeddlers, message, locationToStore, hasConsent);
                // }
            }

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
            // If findNearbyPeddlers (actual service) fails, return a generic error
            return NextResponse.json(
                {
                    response: {
                        text: "Sorry, I encountered an error while trying to find peddlers. Please try again later.",
                        peddlers: [],
                        hasMore: false
                    }
                },
                {
                    status: 500,
                    headers: rateLimitHeaders
                }
            );
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