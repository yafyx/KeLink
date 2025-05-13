import { DataProtection } from '@/lib/data-protection';
import { RateLimiter } from '@/lib/rate-limiter';
import { findNearbyVendors } from '@/lib/vendors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import NodeCache from 'node-cache';

// Initialize Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Initialize cache with a default TTL (e.g., 5 minutes)
const vendorCache = new NodeCache({ stdTTL: 300, checkperiod: 120 });

// Type definitions for the query analysis
interface QueryAnalysisResult {
    isLookingForVendors: boolean;
    vendorType: string;
    keywords: string[];
    directResponse: string;
}

// Type definition for pagination and response
interface VendorResponse {
    vendors: any[];
    hasMore: boolean;
    lastVendorId?: string;
}

// Mock database of vendors for fallback when Firestore is not accessible
const mockVendors: any[] = []; // Initialize as empty array as mock data is removed

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

// Fallback function to find nearby vendors when Firestore is not accessible
async function findNearbyVendorsFallback(
    location: { lat: number; lon: number },
    vendorType: string = '',
    keywords: string[] = [],
    maxDistance: number = 5000,
    limit: number = 10,
    lastVendorId?: string
): Promise<VendorResponse> {
    // Filter active vendors
    let filteredVendors = mockVendors.filter(vendor => vendor.status === 'active');

    // Filter by type if provided
    if (vendorType && vendorType.trim() !== '') {
        const lowerCaseType = vendorType.toLowerCase();
        filteredVendors = filteredVendors.filter(
            vendor => vendor.type.toLowerCase().includes(lowerCaseType)
        );
    } else if (keywords && keywords.length > 0) {
        // If no specific vendor type but keywords are provided
        filteredVendors = filteredVendors.filter(vendor => {
            const vendorText = `${vendor.name} ${vendor.type} ${vendor.description}`.toLowerCase();
            return keywords.some(keyword =>
                vendorText.includes(keyword.toLowerCase())
            );
        });
    }

    // If no results with strict filtering, make a more lenient search
    if (filteredVendors.length === 0) {
        // Include all vendors for these common food terms
        const commonFoodTerms = ['makanan', 'food', 'jual', 'pedagang', 'penjual', 'cari'];
        if (keywords.some(keyword => commonFoodTerms.includes(keyword.toLowerCase()))) {
            filteredVendors = mockVendors.filter(vendor => vendor.status === 'active');
        }

        // For "bakso" specifically, match the bakso vendors
        if (keywords.some(keyword => keyword.toLowerCase().includes('bakso'))) {
            filteredVendors = mockVendors.filter(
                vendor => vendor.type.toLowerCase().includes('bakso') && vendor.status === 'active'
            );
        }
    }

    // If still no results and query contains any common food keyword, return all active vendors
    if (filteredVendors.length === 0) {
        const foodKeywords = ['makan', 'food', 'jajan', 'kuliner', 'lapar', 'laper'];
        if (keywords.some(keyword =>
            foodKeywords.some(food => keyword.toLowerCase().includes(food))
        )) {
            filteredVendors = mockVendors.filter(vendor => vendor.status === 'active');
        }
    }

    // Calculate distance and filter by max_distance
    let vendorsWithDistance = filteredVendors
        .map(vendor => {
            const distance = calculateDistance(
                location.lat,
                location.lon,
                vendor.location.lat,
                vendor.location.lon
            );
            return {
                ...vendor,
                distance: formatDistance(distance),
                raw_distance: distance
            };
        })
        .filter(vendor => (vendor.raw_distance as number) <= maxDistance)
        .sort((a, b) => (a.raw_distance as number) - (b.raw_distance as number));

    // Handle pagination
    if (lastVendorId) {
        const lastVendorIndex = vendorsWithDistance.findIndex(v => v.id === lastVendorId);
        if (lastVendorIndex !== -1) {
            vendorsWithDistance = vendorsWithDistance.slice(lastVendorIndex + 1);
        }
    }

    const hasMore = vendorsWithDistance.length > limit;
    const paginatedVendors = vendorsWithDistance.slice(0, limit);
    const lastId = paginatedVendors.length > 0 ? paginatedVendors[paginatedVendors.length - 1].id : undefined;

    // Return vendors without the raw_distance property
    return {
        vendors: paginatedVendors.map(({ raw_distance, ...vendor }) => vendor),
        hasMore,
        lastVendorId: lastId
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
        const { message, location, lastVendorId, limit = 10 } = await request.json();

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

        // Use Gemini AI to determine if the query is looking for vendors
        const result = await analyzeUserQuery(message);

        // Store the user query for analytics, respecting consent
        if (normalizedLocation) {
            // Anonymize location *before* storing if no consent
            const locationToStore = hasConsent ? normalizedLocation : dataProtection.anonymizeLocation(normalizedLocation);
            await dataProtection.storeUserQuery(message, locationToStore, hasConsent);
        }

        // If the query is not looking for vendors, respond with a direct message
        if (!result.isLookingForVendors) {
            return NextResponse.json({
                response: {
                    text: result.directResponse,
                    vendors: [], // No vendors to return
                    hasMore: false
                }
            }, { headers: rateLimitHeaders });
        }

        // If we get here, the user is looking for vendors
        // Generate a cache key based on the search parameters
        const cacheKey = `vendors_${normalizedLocation.lat.toFixed(4)}_${normalizedLocation.lon.toFixed(4)}_${result.vendorType}_${result.keywords.join('-')}_${lastVendorId || 'first'}`;

        // Check if we have cached results
        const cachedResults = vendorCache.get<VendorResponse>(cacheKey);
        if (cachedResults) {
            return NextResponse.json({
                response: {
                    text: `Here are some ${result.vendorType || 'food'} vendors near you:`,
                    vendors: cachedResults.vendors,
                    hasMore: cachedResults.hasMore,
                    lastVendorId: cachedResults.lastVendorId
                }
            }, { headers: rateLimitHeaders });
        }

        // No cached results, search for vendors
        try {
            // Search for nearby vendors
            const { vendors, hasMore } = await findNearbyVendors({
                userLocation: normalizedLocation,
                vendorType: result.vendorType,
                keywords: result.keywords,
                maxDistance: 5000, // 5km
                limit: parseInt(limit.toString(), 10),
                lastVendorId: lastVendorId
            });

            const lastId = vendors.length > 0 ? vendors[vendors.length - 1].id : undefined;

            // Cache the results
            vendorCache.set(cacheKey, { vendors, hasMore, lastVendorId: lastId });

            // Determine the response text based on the search results
            let responseText;
            if (vendors.length === 0) {
                responseText = `I couldn't find any ${result.vendorType || 'food'} vendors near your location. Please try a different search or check back later.`;
            } else {
                responseText = `Here are some ${result.vendorType || 'food'} vendors near you:`;
            }

            return NextResponse.json({
                response: {
                    text: responseText,
                    vendors: vendors,
                    hasMore: hasMore,
                    lastVendorId: lastId
                }
            }, { headers: rateLimitHeaders });
        } catch (error) {
            console.error("Error finding vendors:", error);

            // Fallback to mock data if Firestore search fails
            const fallbackResults = await findNearbyVendorsFallback(
                normalizedLocation,
                result.vendorType,
                result.keywords,
                5000,
                parseInt(limit.toString(), 10),
                lastVendorId
            );

            return NextResponse.json({
                response: {
                    text: `Here are some ${result.vendorType || 'food'} vendors near you (fallback data):`,
                    vendors: fallbackResults.vendors,
                    hasMore: fallbackResults.hasMore,
                    lastVendorId: fallbackResults.lastVendorId
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
        Analyze the following user query to find street vendors:
        "${query}"
        
        Provide a response in JSON format with the following structure:
        {
          "isLookingForVendors": boolean, // whether the user is looking for street vendors
          "vendorType": string, // type of vendor being sought (e.g. "bakso", "siomay", etc.) or empty if not specific
          "keywords": string[], // important keywords from the query
          "directResponse": string // direct response if not looking for vendors
        }
        
        Examples of Indonesian street food types: bakso, siomay, batagor, es kelapa, es cincau, martabak, etc.
        If the user is not looking for vendors, provide a natural response in English.
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
                    isLookingForVendors: parsedResult.isLookingForVendors || false,
                    vendorType: parsedResult.vendorType || '',
                    keywords: parsedResult.keywords || [],
                    directResponse: parsedResult.directResponse || 'Sorry, I don\'t understand what you mean. Could you please explain what you are looking for?'
                };
            }
        } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
        }

        // Fallback response if parsing fails
        return {
            isLookingForVendors: false,
            vendorType: '',
            keywords: [],
            directResponse: 'Sorry, I can\'t process your request at this time. Could you try rephrasing it?'
        };
    } catch (error) {
        console.error('Error analyzing user query:', error);
        // Fallback to assume they are looking for vendors with the query as keyword
        return {
            isLookingForVendors: true,
            vendorType: '',
            keywords: [query],
            directResponse: ''
        };
    }
} 