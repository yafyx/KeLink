import { getAuthUserFromRequest } from '@/lib/auth-utils';
import { auth, db } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

// Get vendor profile
export async function GET(request: Request) {
    try {
        // Get authenticated user
        const decoded = getAuthUserFromRequest(request);

        // Get vendor data from Firestore
        const vendorDoc = await db.collection('vendors').doc(decoded.uid).get();

        if (!vendorDoc.exists) {
            return NextResponse.json(
                { error: 'Vendor profile not found' },
                { status: 404 }
            );
        }

        const vendorData = vendorDoc.data();

        // Return vendor profile data
        return NextResponse.json({
            vendor: {
                id: decoded.uid,
                ...vendorData,
            }
        });
    } catch (error: any) {
        console.error('Error getting vendor profile:', error);

        if (error.message && error.message.startsWith('Unauthorized')) {
            return NextResponse.json(
                { error: error.message },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to get vendor profile' },
            { status: 500 }
        );
    }
}

// Update vendor profile
export async function PUT(request: Request) {
    try {
        // Get authenticated user
        const decoded = getAuthUserFromRequest(request);

        // Get request data
        const { name, vendorType, description, phone } = await request.json();

        // Validate data
        if (!name && !vendorType && !description && !phone) {
            return NextResponse.json(
                { error: 'No data provided for update' },
                { status: 400 }
            );
        }

        // Get current vendor data
        const vendorDoc = await db.collection('vendors').doc(decoded.uid).get();

        if (!vendorDoc.exists) {
            return NextResponse.json(
                { error: 'Vendor profile not found' },
                { status: 404 }
            );
        }

        const currentData = vendorDoc.data();

        // Prepare update data
        const updateData: Record<string, any> = {
            updatedAt: new Date().toISOString(),
        };

        if (name) updateData.name = name;
        if (vendorType) updateData.vendorType = vendorType;
        if (description) updateData.description = description;
        if (phone) updateData.phone = phone;

        // Update vendor data in Firestore
        await db.collection('vendors').doc(decoded.uid).update(updateData);

        // If name changed, update it in Firebase Auth as well
        if (name && name !== currentData?.name) {
            await auth.updateUser(decoded.uid, {
                displayName: name,
            });
        }

        // Return updated vendor data
        return NextResponse.json({
            message: 'Profile updated successfully',
            vendor: {
                id: decoded.uid,
                ...currentData,
                ...updateData,
            }
        });
    } catch (error: any) {
        console.error('Error updating vendor profile:', error);

        if (error.message && error.message.startsWith('Unauthorized')) {
            return NextResponse.json(
                { error: error.message },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to update vendor profile' },
            { status: 500 }
        );
    }
} 