import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { message, location } = await request.json()

        // For the MVP, we're implementing a mock response function
        // In the real implementation, this would call the Gemini API with function calling

        const response = await mockGeminiResponse(message, location)

        return NextResponse.json({ response }, { status: 200 })
    } catch (error) {
        console.error('Error processing find request:', error)
        return NextResponse.json(
            { error: 'Failed to process your request' },
            { status: 500 }
        )
    }
}

// Mock function to simulate Gemini API responses
// Will be replaced with actual Gemini API call with function calling
async function mockGeminiResponse(query: string, location: { lat: number; lon: number } | null) {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Types for the vendor data (copied from findNearby/route.ts)
    type Vendor = {
        id: string;
        name: string;
        type: string;
        description: string;
        location: {
            lat: number;
            lon: number;
        };
        distance?: string;
        status: 'active' | 'inactive';
        last_active: string;
    };

    type VendorWithDistance = Vendor & {
        raw_distance?: number;
    };

    // Mock database of vendors (copied from findNearby/route.ts)
    const mockVendors: Vendor[] = [
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
        },
        {
            id: 'v5',
            name: 'Es Kelapa Muda Bu Ratna',
            type: 'Es Kelapa',
            description: 'Es kelapa muda segar dengan pilihan topping.',
            location: { lat: -6.3850, lon: 106.8275 },
            status: 'active',
            last_active: new Date().toISOString()
        },
        {
            id: 'v6',
            name: 'Es Cincau Mas Budi',
            type: 'Es Cincau',
            description: 'Es cincau hijau dengan susu dan sirup.',
            location: { lat: -6.3900, lon: 106.8350 },
            status: 'active',
            last_active: new Date().toISOString()
        },
        {
            id: 'v7',
            name: 'Martabak Manis Bang Deni',
            type: 'Martabak',
            description: 'Martabak manis dengan berbagai varian rasa.',
            location: { lat: -6.3810, lon: 106.8290 },
            status: 'inactive',
            last_active: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        }
    ];

    // Helper functions (copied from findNearby/route.ts)
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

    const lowercaseQuery = query.toLowerCase();
    const max_distance = 5000; // Default max distance in meters

    // Filter active vendors
    let filteredVendors = mockVendors.filter(vendor => vendor.status === 'active');

    // Filter by keywords (from user query)
    // This will search in name, type, and description
    if (query && query.trim().length > 0) {
        filteredVendors = filteredVendors.filter(vendor => {
            const vendorText = `${vendor.name} ${vendor.type} ${vendor.description}`.toLowerCase();
            // Simple keyword matching, can be improved (e.g., splitting query into multiple keywords)
            return vendorText.includes(lowercaseQuery);
        });
    }

    let vendorsForResponse: Vendor[] = [];

    if (location && location.lat && location.lon) {
        const vendorsWithDistance: VendorWithDistance[] = filteredVendors
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
            .filter(vendor => (vendor.raw_distance as number) <= max_distance)
            .sort((a, b) => (a.raw_distance as number) - (b.raw_distance as number));

        vendorsForResponse = vendorsWithDistance.map(({ raw_distance, ...vendor }) => vendor);
    } else {
        // If no location, use the filtered vendors directly without distance calculation/filtering
        // The Vendor type allows distance to be optional
        vendorsForResponse = filteredVendors;
    }


    if (vendorsForResponse.length > 0) {
        let responseText = `Saya menemukan ${vendorsForResponse.length} penjual \"${query}\" yang aktif di sekitar Anda:\n`;
        vendorsForResponse.forEach((vendor, index) => {
            // Access vendor.distance safely, as it might be undefined
            responseText += `${index + 1}. ${vendor.name} (${vendor.type})${vendor.distance ? ` (sekitar ${vendor.distance})` : ''}\n`;
        });
        responseText += "\nIngin info lebih lanjut tentang salah satu penjual?";

        return {
            text: responseText,
            vendors: vendorsForResponse.map(v => ({ // Ensure the returned vendor objects match the expected structure
                id: v.id,
                name: v.name,
                type: v.type,
                // Use optional chaining and provide default if distance is undefined
                distance: v.distance ?? 'N/A',
                status: v.status,
                last_active: v.last_active,
            }))
        };
    } else {
        return {
            text: `Maaf, saat ini saya tidak menemukan penjual "${query}" yang aktif di sekitar Anda. Coba cari jenis makanan lain.`,
            vendors: []
        };
    }
} 