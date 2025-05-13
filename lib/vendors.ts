import { DocumentData, GeoPoint, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { db } from './firebase-admin';

export type Vendor = {
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

type VendorWithDistance = Vendor & {
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

// Main function to find nearby vendors
export async function findNearbyVendors({
    userLocation,
    keywords = [],
    vendorType = '',
    maxDistance = 5000, // Default max distance in meters
    limit = 20, // Default limit of results
    lastVendorId = null, // For pagination
}: {
    userLocation: { lat: number; lon: number };
    keywords?: string[];
    vendorType?: string;
    maxDistance?: number;
    limit?: number;
    lastVendorId?: string | null;
}): Promise<{ vendors: Vendor[], hasMore: boolean }> {
    try {
        // Convert maxDistance from meters to kilometers for geohashing
        const maxDistanceKm = maxDistance / 1000;

        // Get geo cells covering the search area
        const cells = getGeoCells(userLocation.lat, userLocation.lon, maxDistanceKm);

        // Build the initial query
        let vendorQuery = db.collection('vendors') as any;

        // Add status filter (active vendors only)
        vendorQuery = vendorQuery.where('status', '==', 'active');

        // Add type filter if provided
        if (vendorType && vendorType.trim() !== '') {
            vendorQuery = vendorQuery.where('type', '==', vendorType.trim());
        }

        // Add pagination if lastVendorId provided
        if (lastVendorId) {
            const lastDoc = await db.collection('vendors').doc(lastVendorId).get();
            if (lastDoc.exists) {
                vendorQuery = vendorQuery.startAfter(lastDoc);
            }
        }

        // Execute query with limit to get a subset of potential matches
        const snapshot = await vendorQuery.limit(limit * 3).get();

        if (snapshot.empty) {
            return { vendors: [], hasMore: false };
        }

        // Extract vendor data and convert Firestore documents to Vendor type
        let vendors: Vendor[] = [];
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
                // Skip vendors without location data
                return;
            }

            vendors.push({
                id: doc.id,
                name: data.name || 'Unknown Vendor',
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
            vendors = vendors.filter(vendor => {
                const vendorText = `${vendor.name} ${vendor.type} ${vendor.description}`.toLowerCase();
                return keywords.some(keyword =>
                    vendorText.includes(keyword.toLowerCase())
                );
            });
        }

        // Calculate distances and filter by max distance
        const vendorsWithDistance: VendorWithDistance[] = vendors
            .map(vendor => {
                const distance = calculateDistance(
                    userLocation.lat,
                    userLocation.lon,
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

        // Apply limit and determine if there are more results
        const limitedVendors = vendorsWithDistance.slice(0, limit);
        const hasMore = vendorsWithDistance.length > limit;

        // Return vendors without the raw_distance property
        return {
            vendors: limitedVendors.map(({ raw_distance, ...vendor }) => vendor),
            hasMore
        };
    } catch (error) {
        console.error('Error finding nearby vendors:', error);
        throw error;
    }
} 