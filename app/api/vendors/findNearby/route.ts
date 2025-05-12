import { NextResponse } from 'next/server'

// Types for the vendor data
type Vendor = {
    id: string
    name: string
    type: string
    description: string
    location: {
        lat: number
        lon: number
    }
    distance?: string
    status: 'active' | 'inactive'
    last_active: string
}

// Extended vendor type with raw_distance for internal calculations
type VendorWithDistance = Vendor & {
    raw_distance?: number
}

// Mock database of vendors
// In the real implementation, this would be stored in Firestore
const mockVendors: Vendor[] = [
    {
        id: 'v1',
        name: 'Bakso Pak Jono',
        type: 'Bakso',
        description: 'Bakso daging sapi asli dengan kuah gurih dan pangsit goreng renyah.',
        location: {
            lat: -6.3823,
            lon: 106.8231
        },
        status: 'active',
        last_active: new Date().toISOString()
    },
    {
        id: 'v2',
        name: 'Bakso Malang Bu Siti',
        type: 'Bakso',
        description: 'Bakso Malang dengan berbagai pilihan topping dan mie.',
        location: {
            lat: -6.3895,
            lon: 106.8320
        },
        status: 'active',
        last_active: new Date().toISOString()
    },
    {
        id: 'v3',
        name: 'Siomay & Batagor Mang Ujang',
        type: 'Siomay/Batagor',
        description: 'Siomay dan batagor dengan saus kacang khas Bandung.',
        location: {
            lat: -6.3756,
            lon: 106.8245
        },
        status: 'active',
        last_active: new Date().toISOString()
    },
    {
        id: 'v4',
        name: 'Es Cendol Pak Wawan',
        type: 'Es Cendol',
        description: 'Es cendol dengan santan kental dan gula merah asli.',
        location: {
            lat: -6.3802,
            lon: 106.8210
        },
        status: 'active',
        last_active: new Date().toISOString()
    },
    {
        id: 'v5',
        name: 'Es Kelapa Muda Bu Ratna',
        type: 'Es Kelapa',
        description: 'Es kelapa muda segar dengan pilihan topping.',
        location: {
            lat: -6.3850,
            lon: 106.8275
        },
        status: 'active',
        last_active: new Date().toISOString()
    },
    {
        id: 'v6',
        name: 'Es Cincau Mas Budi',
        type: 'Es Cincau',
        description: 'Es cincau hijau dengan susu dan sirup.',
        location: {
            lat: -6.3900,
            lon: 106.8350
        },
        status: 'active',
        last_active: new Date().toISOString()
    },
    {
        id: 'v7',
        name: 'Martabak Manis Bang Deni',
        type: 'Martabak',
        description: 'Martabak manis dengan berbagai varian rasa.',
        location: {
            lat: -6.3810,
            lon: 106.8290
        },
        status: 'inactive',
        last_active: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    }
]

// Simple function to calculate distance between two coordinates (in meters)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3 // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
}

// Format distance function
function formatDistance(distance: number): string {
    if (distance < 1000) {
        return `${Math.round(distance)}m`
    } else {
        return `${(distance / 1000).toFixed(1)}km`
    }
}

export async function POST(request: Request) {
    try {
        const { query_details, location } = await request.json()

        if (!location || !location.lat || !location.lon) {
            return NextResponse.json(
                { error: 'Location is required' },
                { status: 400 }
            )
        }

        const { vendor_type, keywords, max_distance = 5000 } = query_details || {}

        // Filter active vendors
        let filteredVendors = mockVendors.filter(vendor => vendor.status === 'active')

        // Filter by type if provided
        if (vendor_type) {
            const lowerCaseType = vendor_type.toLowerCase()
            filteredVendors = filteredVendors.filter(
                vendor => vendor.type.toLowerCase().includes(lowerCaseType)
            )
        }

        // Filter by keywords if provided
        if (keywords && keywords.length > 0) {
            filteredVendors = filteredVendors.filter(vendor => {
                const vendorText = `${vendor.name} ${vendor.type} ${vendor.description}`.toLowerCase()
                return keywords.some((keyword: string) =>
                    vendorText.includes(keyword.toLowerCase())
                )
            })
        }

        // Calculate distance and filter by max_distance
        const vendorsWithDistance: VendorWithDistance[] = filteredVendors
            .map(vendor => {
                const distance = calculateDistance(
                    location.lat,
                    location.lon,
                    vendor.location.lat,
                    vendor.location.lon
                )
                return {
                    ...vendor,
                    distance: formatDistance(distance),
                    raw_distance: distance // For sorting
                }
            })
            .filter(vendor => (vendor.raw_distance as number) <= max_distance)
            .sort((a, b) => (a.raw_distance as number) - (b.raw_distance as number))

        // Remove the raw_distance property
        const result = vendorsWithDistance.map(({ raw_distance, ...vendor }) => vendor)

        return NextResponse.json({ vendors: result }, { status: 200 })
    } catch (error) {
        console.error('Error finding nearby vendors:', error)
        return NextResponse.json(
            { error: 'Failed to find nearby vendors' },
            { status: 500 }
        )
    }
} 