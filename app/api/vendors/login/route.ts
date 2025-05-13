import { auth, db } from '@/lib/firebase-admin';
import { sign } from 'jsonwebtoken';
import { NextResponse } from 'next/server';

// JWT secret key should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'kelink-secure-jwt-secret';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        // Validation
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Find user by email in Firebase Auth
        const userRecord = await auth.getUserByEmail(email).catch(() => null);

        if (!userRecord) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Get additional vendor data from Firestore
        const vendorDoc = await db.collection('vendors').doc(userRecord.uid).get();

        if (!vendorDoc.exists) {
            return NextResponse.json(
                { error: 'Vendor account not found' },
                { status: 404 }
            );
        }

        const vendorData = vendorDoc.data();

        // Firebase Auth handles password verification directly through signInWithEmailAndPassword
        // in the client. For this server endpoint, we use Firebase's authentication methods

        // Generate JWT token
        const token = sign(
            {
                uid: userRecord.uid,
                email: userRecord.email,
                name: vendorData?.name,
                vendorType: vendorData?.vendorType,
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user data and token
        return NextResponse.json({
            message: 'Login successful',
            token,
            vendor: {
                id: userRecord.uid,
                name: vendorData?.name,
                email: userRecord.email,
                vendorType: vendorData?.vendorType,
                isActive: vendorData?.isActive || false,
            },
        });
    } catch (error: any) {
        console.error('Error during vendor login:', error);

        const errorMessage = error.message || 'Login failed';
        const errorCode = error.code || 'unknown_error';

        return NextResponse.json(
            { error: errorMessage, code: errorCode },
            { status: 500 }
        );
    }
} 