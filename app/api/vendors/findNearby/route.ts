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
const mockVendors: Vendor[] = []; // Return empty array as mock data is removed

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