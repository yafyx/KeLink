import { DataProtection } from '@/lib/data-protection';
import { findNearbyPeddlers } from '@/lib/peddlers';
import { RateLimiter } from '@/lib/rate-limiter';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import NodeCache from 'node-cache';

// Initialize Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Initialize cache with a default TTL (e.g., 5 minutes)
const peddlerCache = new NodeCache({ stdTTL: 300, checkperiod: 120 });

// Type definitions for the query analysis
interface QueryAnalysisResult {
    isLookingForPeddlers: boolean;
    peddlerType: string;
    keywords: string[];
    directResponse: string;
}

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
    location: { lat: number; lon: number },
    peddlerType: string = '',
    keywords: string[] = [],
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
            const distance = calculateDistance(
                location.lat,
                location.lon,
                peddler.location.lat,
                peddler.location.lon
            );
            return {
                ...peddler,
                distance: formatDistance(distance),
                raw_distance: distance
            };
        })
        .filter(peddler => (peddler.raw_distance as number) <= maxDistance)
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
        const cacheKey = `peddlers_${normalizedLocation.lat.toFixed(4)}_${normalizedLocation.lon.toFixed(4)}_${result.peddlerType}_${result.keywords.join('-')}_${lastPeddlerId || 'first'}`;

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
        // Define the prompt for Gemini
        const prompt = `
        Analyze the following user query to find street peddlers:
        "${query}"
        
        Provide a response in JSON format with the following structure:
        {
          "isLookingForPeddlers": boolean, // whether the user is looking for street peddlers
          "peddlerType": string, // type of peddler being sought (e.g. "bakso", "siomay", etc.) or empty if not specific
          "keywords": string[], // important keywords from the query
          "directResponse": string // direct response if not looking for peddlers
        }
        
        Examples of Indonesian street food types: bakso, siomay, batagor, es kelapa, es cincau, martabak, etc.
        If the user is not looking for peddlers, provide a natural response in English.
        `;

        // Get the generative model
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Generate content based on the prompt
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse the JSON response
        try {
            // Extract JSON from the text (in case there's any wrapper text)
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsedResult = JSON.parse(jsonMatch[0]) as Partial<QueryAnalysisResult>;
                return {
                    isLookingForPeddlers: parsedResult.isLookingForPeddlers || false,
                    peddlerType: parsedResult.peddlerType || '',
                    keywords: parsedResult.keywords || [],
                    directResponse: parsedResult.directResponse || 'Sorry, I don\'t understand what you mean. Could you please explain what you are looking for?'
                };
            }
        } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
        }

        // Fallback response if parsing fails
        return {
            isLookingForPeddlers: false,
            peddlerType: '',
            keywords: [],
            directResponse: 'Sorry, I can\'t process your request at this time. Could you try rephrasing it?'
        };
    } catch (error) {
        console.error('Error analyzing user query:', error);
        // Fallback to assume they are looking for peddlers with the query as keyword
        return {
            isLookingForPeddlers: true,
            peddlerType: '',
            keywords: [query],
            directResponse: ''
        };
    }
} 