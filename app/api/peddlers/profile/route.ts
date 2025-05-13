import { getAuthUserFromRequest } from '@/lib/auth-utils';
import { auth, db } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

// Get peddler profile
export async function GET(request: Request) {
    try {
        // Get authenticated user
        const decoded = getAuthUserFromRequest(request);

        // Get peddler data from Firestore
        const vendorDoc = await db.collection('peddlers').doc(decoded.uid).get();

        if (!vendorDoc.exists) {
            return NextResponse.json(
                { error: 'Peddler profile not found' },
                { status: 404 }
            );
        }

        const vendorData = vendorDoc.data();

        // Return peddler profile data
        return NextResponse.json({
            peddler: {
                id: decoded.uid,
                ...vendorData,
            }
        });
    } catch (error: any) {
        console.error('Error getting peddler profile:', error);

        if (error.message && error.message.startsWith('Unauthorized')) {
            return NextResponse.json(
                { error: error.message },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to get peddler profile' },
            { status: 500 }
        );
    }
}

// Update peddler profile
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

        // Get current peddler data
        const vendorDoc = await db.collection('peddlers').doc(decoded.uid).get();

        if (!vendorDoc.exists) {
            return NextResponse.json(
                { error: 'Peddler profile not found' },
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

        // Update peddler data in Firestore
        await db.collection('peddlers').doc(decoded.uid).update(updateData);

        // If name changed, update it in Firebase Auth as well
        if (name && name !== currentData?.name) {
            await auth.updateUser(decoded.uid, {
                displayName: name,
            });
        }

        // Return updated peddler data
        return NextResponse.json({
            message: 'Profile updated successfully',
            peddler: {
                id: decoded.uid,
                ...currentData,
                ...updateData,
            }
        });
    } catch (error: any) {
        console.error('Error updating peddler profile:', error);

        if (error.message && error.message.startsWith('Unauthorized')) {
            return NextResponse.json(
                { error: error.message },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to update peddler profile' },
            { status: 500 }
        );
    }
} 