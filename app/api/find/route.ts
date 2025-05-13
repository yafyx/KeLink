import { DataProtection } from '@/lib/data-protection';
import { findNearbyVendors } from '@/lib/vendors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
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

// Mock database of vendors for fallback when Firestore is not accessible
const mockVendors = [
    {
        id: 'v1',
        name: 'Bakso Pak Jono',
        type: 'Bakso',
        description: 'Bakso daging sapi asli dengan kuah gurih dan pangsit goreng renyah.',
        location: { lat: -6.3823, lon: 106.8231 },
        status: 'active',
        last_active: new Date().toISOString()
    },
    {
        id: 'v2',
        name: 'Bakso Malang Bu Siti',
        type: 'Bakso',
        description: 'Bakso Malang dengan berbagai pilihan topping dan mie.',
        location: { lat: -6.3895, lon: 106.8320 },
        status: 'active',
        last_active: new Date().toISOString()
    },
    {
        id: 'v3',
        name: 'Siomay & Batagor Mang Ujang',
        type: 'Siomay/Batagor',
        description: 'Siomay dan batagor dengan saus kacang khas Bandung.',
        location: { lat: -6.3756, lon: 106.8245 },
        status: 'active',
        last_active: new Date().toISOString()
    },
    {
        id: 'v4',
        name: 'Es Cendol Pak Wawan',
        type: 'Es Cendol',
        description: 'Es cendol dengan santan kental dan gula merah asli.',
        location: { lat: -6.3802, lon: 106.8210 },
        status: 'active',
        last_active: new Date().toISOString()
    }
];

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
    maxDistance: number = 5000
) {
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
    const vendorsWithDistance = filteredVendors
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

    // Return vendors without the raw_distance property
    return vendorsWithDistance.map(({ raw_distance, ...vendor }) => vendor);
}

export async function POST(request: Request) {
    try {
        const { message, location } = await request.json();

        if (!message || !message.trim()) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

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
        if (location) {
            // Anonymize location *before* storing if no consent
            const locationToStore = hasConsent ? location : dataProtection.anonymizeLocation(location);
            await dataProtection.storeUserQuery(message, locationToStore, hasConsent);
        }

        // If the query is not looking for vendors, respond with a direct message
        if (!result.isLookingForVendors) {
            return NextResponse.json({
                response: {
                    text: result.directResponse,
                    vendors: [] // No vendors to return
                }
            }, { status: 200 });
        }

        // If the query is looking for vendors but no location provided
        if (!location || !location.lat || !location.lon) {
            return NextResponse.json({
                response: {
                    text: "Saya perlu mengetahui lokasi Anda untuk membantu mencari penjual terdekat. Mohon izinkan akses lokasi.",
                    vendors: []
                }
            }, { status: 200 });
        }

        // Process the location based on consent status
        const processedLocation = hasConsent
            ? location
            : dataProtection.anonymizeLocation(location);

        // Create a cache key
        const cacheKey = `vendors_${processedLocation.lat}_${processedLocation.lon}_${result.vendorType}_${result.keywords.sort().join('-')}`;

        // Check cache first
        const cachedVendors = vendorCache.get<any[]>(cacheKey);
        let vendors: any[]; // Define vendors variable

        if (cachedVendors) {
            console.log(`Cache hit for key: ${cacheKey}`);
            vendors = cachedVendors;
        } else {
            console.log(`Cache miss for key: ${cacheKey}. Fetching vendors...`);
            // Search for vendors using the extracted information
            try {
                // Try to use the main findNearbyVendors function
                vendors = await findNearbyVendors({
                    userLocation: processedLocation,
                    keywords: result.keywords,
                    vendorType: result.vendorType,
                    maxDistance: 5000 // Default max distance in meters
                });
                // Store in cache on successful fetch from primary source
                vendorCache.set(cacheKey, vendors);
            } catch (firestoreError) {
                console.error('Error with Firestore, falling back to mock data:', firestoreError);
                // Fallback to mock data if Firestore fails - *don't cache fallback results*
                vendors = await findNearbyVendorsFallback(
                    processedLocation,
                    result.vendorType,
                    result.keywords,
                    5000
                );
                // Optionally, you might want to cache fallback results with a shorter TTL or not at all.
                // For now, we are not caching fallback results.
            }
        }

        // Format response based on search results
        let responseText: string;
        if (vendors.length > 0) {
            responseText = `Saya menemukan ${vendors.length} penjual ${result.vendorType || result.keywords.join(", ")} yang aktif di sekitar Anda:\n`;
            vendors.forEach((vendor, index) => {
                responseText += `${index + 1}. ${vendor.name} (${vendor.type})${vendor.distance ? ` (sekitar ${vendor.distance})` : ''}\n`;
            });
            responseText += "\nIngin info lebih lanjut tentang salah satu penjual?";
        } else {
            responseText = `Maaf, saat ini saya tidak menemukan penjual "${result.vendorType || result.keywords.join(", ")}" yang aktif di sekitar Anda. Coba cari jenis makanan lain.`;
        }

        // Add privacy notice if consent is not given
        if (!hasConsent) {
            responseText += "\n\nCatatan: Untuk pengalaman yang lebih baik dan hasil pencarian yang lebih akurat, mohon berikan izin penggunaan data di banner privasi.";
        }

        return NextResponse.json({
            response: {
                text: responseText,
                vendors: vendors.map(v => ({
                    id: v.id,
                    name: v.name,
                    type: v.type,
                    distance: v.distance ?? 'N/A',
                    status: v.status,
                    last_active: v.last_active,
                }))
            }
        }, { status: 200 });
    } catch (error) {
        console.error('Error processing find request:', error);
        return NextResponse.json(
            { error: 'Failed to process your request' },
            { status: 500 }
        );
    }
}

// Function to analyze user query with Gemini AI
async function analyzeUserQuery(query: string): Promise<QueryAnalysisResult> {
    try {
        // Define the prompt for Gemini
        const prompt = `
        Analisis kueri pengguna berikut untuk mencari penjual keliling:
        "${query}"
        
        Berikan respons dalam format JSON dengan struktur berikut:
        {
          "isLookingForVendors": boolean, // apakah pengguna mencari penjual keliling
          "vendorType": string, // jenis penjual yang dicari (misalnya "bakso", "siomay", dll.) atau kosong jika tidak spesifik
          "keywords": string[], // kata kunci penting dari query
          "directResponse": string // respons langsung jika bukan mencari penjual
        }
        
        Contoh jenis makanan keliling Indonesia: bakso, siomay, batagor, es kelapa, es cincau, martabak, dll.
        Jika pengguna tidak mencari penjual, berikan respons natural dalam Bahasa Indonesia.
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
                    directResponse: parsedResult.directResponse || 'Maaf, saya tidak mengerti maksud Anda. Bisa tolong jelaskan apa yang Anda cari?'
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
            directResponse: 'Maaf, saya tidak bisa memproses permintaan Anda saat ini. Bisa coba ulangi dengan cara lain?'
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