import { NextResponse } from 'next/server'

// Types for the peddler data
type Peddler = {
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

// Extended peddler type with raw_distance for internal calculations
type PeddlerWithDistance = Peddler & {
    raw_distance?: number
}

// Mock database of peddlers - REMOVED
// In the real implementation, this would be stored in Firestore
const mockPeddlers: Peddler[] = [];

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

        const { peddler_type, keywords, max_distance = 5000 } = query_details || {}

        // Filter active peddlers
        let filteredPeddlers = mockPeddlers.filter(peddler => peddler.status === 'active')

        // Filter by type if provided
        if (peddler_type) {
            const lowerCaseType = peddler_type.toLowerCase()
            filteredPeddlers = filteredPeddlers.filter(
                peddler => peddler.type.toLowerCase().includes(lowerCaseType)
            )
        }

        // Filter by keywords if provided
        if (keywords && keywords.length > 0) {
            filteredPeddlers = filteredPeddlers.filter(peddler => {
                const peddlerText = `${peddler.name} ${peddler.type} ${peddler.description}`.toLowerCase()
                return keywords.some((keyword: string) =>
                    peddlerText.includes(keyword.toLowerCase())
                )
            })
        }

        // Calculate distance and filter by max_distance
        const peddlersWithDistance: PeddlerWithDistance[] = filteredPeddlers
            .map(peddler => {
                const distance = calculateDistance(
                    location.lat,
                    location.lon,
                    peddler.location.lat,
                    peddler.location.lon
                )
                return {
                    ...peddler,
                    distance: formatDistance(distance),
                    raw_distance: distance // For sorting
                }
            })
            .filter(peddler => (peddler.raw_distance as number) <= max_distance)
            .sort((a, b) => (a.raw_distance as number) - (b.raw_distance as number))

        // Remove the raw_distance property
        const result = peddlersWithDistance.map(({ raw_distance, ...peddler }) => peddler)

        return NextResponse.json({ peddlers: result }, { status: 200 })
    } catch (error) {
        console.error('Error finding nearby peddlers:', error)
        return NextResponse.json(
            { error: 'Failed to find nearby peddlers' },
            { status: 500 }
        )
    }
} 