import { GeoPoint } from 'firebase-admin/firestore';
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

// Main function to find nearby vendors
export async function findNearbyVendors({
    userLocation,
    keywords = [],
    vendorType = '',
    maxDistance = 5000, // Default max distance in meters
}: {
    userLocation: { lat: number; lon: number };
    keywords?: string[];
    vendorType?: string;
    maxDistance?: number;
}): Promise<Vendor[]> {
    try {
        // Get all active vendors from firestore
        const vendorsRef = db.collection('vendors');
        const snapshot = await vendorsRef
            .where('status', '==', 'active')
            .get();

        if (snapshot.empty) {
            return [];
        }

        // Extract vendor data and convert Firestore documents to Vendor type
        let vendors: Vendor[] = [];
        snapshot.forEach(doc => {
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

        // Filter by vendor type if specified
        if (vendorType && vendorType.trim() !== '') {
            const lowerCaseType = vendorType.toLowerCase();
            vendors = vendors.filter(vendor =>
                vendor.type.toLowerCase().includes(lowerCaseType)
            );
        }

        // Filter by keywords if provided
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

        // Return vendors without the raw_distance property
        return vendorsWithDistance.map(({ raw_distance, ...vendor }) => vendor);
    } catch (error) {
        console.error('Error finding nearby vendors:', error);
        throw error;
    }
} 