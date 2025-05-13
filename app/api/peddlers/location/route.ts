import { getAuthUserFromRequest } from '@/lib/auth-utils';
import { db } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

// Update peddler location
export async function POST(request: Request) {
    try {
        // Get authenticated user
        const decoded = getAuthUserFromRequest(request);

        // Get request data
        const { location, is_active } = await request.json();

        // Validate data
        if (!location || typeof location.lat !== 'number' || typeof location.lon !== 'number') {
            return NextResponse.json(
                { error: 'Valid location coordinates are required' },
                { status: 400 }
            );
        }

        // Create GeoPoint and prepare update data
        const updateData: Record<string, any> = {
            location: {
                lat: location.lat,
                lon: location.lon
            },
            updatedAt: new Date().toISOString(),
            last_active: new Date().toISOString()
        };

        // Update active status if provided
        if (typeof is_active === 'boolean') {
            updateData.status = is_active ? 'active' : 'inactive';
        }

        // Update peddler location in Firestore
        await db.collection('peddlers').doc(decoded.uid).update(updateData);

        // Return updated location data
        return NextResponse.json({
            message: 'Peddler location updated successfully',
            location: updateData.location,
            status: updateData.status
        });
    } catch (error: any) {
        console.error('Error updating peddler location:', error);

        if (error.message && error.message.startsWith('Unauthorized')) {
            return NextResponse.json(
                { error: error.message },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to update peddler location' },
            { status: 500 }
        );
    }
}

// Get peddler location
export async function GET(request: Request) {
    try {
        // Get authenticated user
        const decoded = getAuthUserFromRequest(request);

        // Get peddler data from Firestore
        const vendorDoc = await db.collection('peddlers').doc(decoded.uid).get();

        if (!vendorDoc.exists) {
            return NextResponse.json(
                { error: 'Peddler not found' },
                { status: 404 }
            );
        }

        const vendorData = vendorDoc.data();

        // Return peddler location data
        return NextResponse.json({
            location: vendorData?.location || null,
            status: vendorData?.status || 'inactive',
            last_active: vendorData?.last_active || null
        });
    } catch (error: any) {
        console.error('Error getting peddler location:', error);

        if (error.message && error.message.startsWith('Unauthorized')) {
            return NextResponse.json(
                { error: error.message },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to get peddler location' },
            { status: 500 }
        );
    }
} 