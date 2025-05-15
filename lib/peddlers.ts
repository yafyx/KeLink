import { DocumentData, GeoPoint, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { db } from './firebase-admin';

export type Peddler = {
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
    rating?: number;
};

type PeddlerWithDistance = Peddler & {
    raw_distance?: number;
};

// Helper function to calculate distance between two coordinate points
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

// Helper function to format distance
export function formatDistance(distance: number): string {
    if (distance < 1000) {
        return `${Math.round(distance)}m`;
    } else {
        return `${(distance / 1000).toFixed(1)}km`;
    }
}

// Function to create geohash-like grid cell for location-based filtering
function getGeoCells(lat: number, lon: number, radiusInKm: number): string[] {
    // A simple implementation - in production, use a proper geohashing library
    // This approximation creates a coarse grid with 0.1 degree cells (~11km at equator)
    const latPrecision = 0.1;
    const lonPrecision = 0.1;

    const latCells = Math.ceil(radiusInKm / 11);
    const lonCells = Math.ceil(radiusInKm / 11);

    const cells: string[] = [];

    for (let latOffset = -latCells; latOffset <= latCells; latOffset++) {
        for (let lonOffset = -lonCells; lonOffset <= lonCells; lonOffset++) {
            const cellLat = Math.floor((lat + latOffset * latPrecision) / latPrecision) * latPrecision;
            const cellLon = Math.floor((lon + lonOffset * lonPrecision) / lonPrecision) * lonPrecision;
            cells.push(`${cellLat.toFixed(1)}_${cellLon.toFixed(1)}`);
        }
    }

    return cells;
}

// Main function to find nearby peddlers
export async function findNearbyPeddlers({
    userLocation,
    keywords = [],
    peddlerType = '',
    city = '',
    kecamatan = '',
    kelurahan = '',
    maxDistance = 5000, // Default max distance in meters
    limit = 20, // Default limit of results
    lastPeddlerId = null, // For pagination
}: {
    userLocation?: { lat: number; lon: number }; // Made optional as admin areas can be primary
    keywords?: string[];
    peddlerType?: string;
    city?: string;
    kecamatan?: string;
    kelurahan?: string;
    maxDistance?: number;
    limit?: number;
    lastPeddlerId?: string | null;
}): Promise<{ peddlers: Peddler[], hasMore: boolean }> {
    try {
        // Convert maxDistance from meters to kilometers for geohashing (if used)
        // const maxDistanceKm = maxDistance / 1000;

        // Get geo cells covering the search area (if userLocation is primary)
        // if (userLocation) {
        //     const cells = getGeoCells(userLocation.lat, userLocation.lon, maxDistanceKm);
        // }

        // Build the initial query
        let peddlerQuery = db.collection('peddlers') as any;

        // Add status filter (active peddlers only)
        peddlerQuery = peddlerQuery.where('status', '==', 'active');

        // Add type filter if provided
        if (peddlerType && peddlerType.trim() !== '') {
            peddlerQuery = peddlerQuery.where('type', '==', peddlerType.trim());
        }

        // Add administrative area filters if provided
        if (city && city.trim() !== '') {
            peddlerQuery = peddlerQuery.where('city', '==', city.trim());
        }
        if (kecamatan && kecamatan.trim() !== '') {
            peddlerQuery = peddlerQuery.where('kecamatan', '==', kecamatan.trim());
        }
        if (kelurahan && kelurahan.trim() !== '') {
            peddlerQuery = peddlerQuery.where('kelurahan', '==', kelurahan.trim());
        }

        // Add pagination if lastPeddlerId provided
        if (lastPeddlerId) {
            const lastDoc = await db.collection('peddlers').doc(lastPeddlerId).get();
            if (lastDoc.exists) {
                peddlerQuery = peddlerQuery.startAfter(lastDoc);
            }
        }

        // Execute query with limit to get a subset of potential matches
        const snapshot = await peddlerQuery.limit(limit * 3).get();

        if (snapshot.empty) {
            return { peddlers: [], hasMore: false };
        }

        // Extract peddler data and convert Firestore documents to Peddler type
        let peddlers: Peddler[] = [];
        snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            // Handle GeoPoint from Firestore
            let locationData;
            if (data.location instanceof GeoPoint) {
                locationData = {
                    lat: data.location.latitude,
                    lon: data.location.longitude
                };
            } else if (data.location) {
                locationData = {
                    lat: data.location.lat || data.location.latitude,
                    lon: data.location.lon || data.location.longitude
                };
            } else {
                // Skip peddlers without location data
                return;
            }

            peddlers.push({
                id: doc.id,
                name: data.name || 'Unknown Peddler',
                type: data.type || 'Unknown Type',
                description: data.description || '',
                location: locationData,
                status: data.status,
                last_active: data.last_active || new Date().toISOString(),
                rating: data.rating
            });
        });

        // Filter by keywords if provided - done in-memory for flexibility
        if (keywords && keywords.length > 0) {
            peddlers = peddlers.filter(peddler => {
                const peddlerText = `${peddler.name} ${peddler.type} ${peddler.description}`.toLowerCase();
                return keywords.some(keyword =>
                    peddlerText.includes(keyword.toLowerCase())
                );
            });
        }

        // Calculate distances and filter by max distance if userLocation is provided
        let peddlersWithDistance: PeddlerWithDistance[] = [];

        if (userLocation) {
            peddlersWithDistance = peddlers
                .map(peddler => {
                    const distance = calculateDistance(
                        userLocation.lat,
                        userLocation.lon,
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
        } else {
            // If no userLocation, we can't calculate distance.
            // Peddlers are already filtered by admin areas.
            // We assign the fetched peddlers directly, without distance info.
            peddlersWithDistance = peddlers.map(p => ({ ...p, distance: undefined, raw_distance: undefined }));
        }

        // Apply limit and determine if there are more results
        const limitedPeddlers = peddlersWithDistance.slice(0, limit);
        const hasMore = peddlersWithDistance.length > limit;

        // Return peddlers without the raw_distance property
        return {
            peddlers: limitedPeddlers.map(({ raw_distance, ...peddler }) => peddler),
            hasMore
        };
    } catch (error) {
        console.error('Error finding nearby peddlers:', error);
        throw error;
    }
} 