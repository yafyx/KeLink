import { getAuthUserFromRequest } from '@/lib/auth-utils';
import { db } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

// Update vendor location
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

        // Update vendor location in Firestore
        await db.collection('vendors').doc(decoded.uid).update(updateData);

        // Return updated location data
        return NextResponse.json({
            message: 'Vendor location updated successfully',
            location: updateData.location,
            status: updateData.status
        });
    } catch (error: any) {
        console.error('Error updating vendor location:', error);

        if (error.message && error.message.startsWith('Unauthorized')) {
            return NextResponse.json(
                { error: error.message },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to update vendor location' },
            { status: 500 }
        );
    }
}

// Get vendor location
export async function GET(request: Request) {
    try {
        // Get authenticated user
        const decoded = getAuthUserFromRequest(request);

        // Get vendor data from Firestore
        const vendorDoc = await db.collection('vendors').doc(decoded.uid).get();

        if (!vendorDoc.exists) {
            return NextResponse.json(
                { error: 'Vendor not found' },
                { status: 404 }
            );
        }

        const vendorData = vendorDoc.data();

        // Return vendor location data
        return NextResponse.json({
            location: vendorData?.location || null,
            status: vendorData?.status || 'inactive',
            last_active: vendorData?.last_active || null
        });
    } catch (error: any) {
        console.error('Error getting vendor location:', error);

        if (error.message && error.message.startsWith('Unauthorized')) {
            return NextResponse.json(
                { error: error.message },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to get vendor location' },
            { status: 500 }
        );
    }
} 