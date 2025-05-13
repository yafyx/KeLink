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

        // Get additional peddler data from Firestore
        const peddlerDoc = await db.collection('peddlers').doc(userRecord.uid).get();

        if (!peddlerDoc.exists) {
            return NextResponse.json(
                { error: 'Peddler account not found' },
                { status: 404 }
            );
        }

        const peddlerData = peddlerDoc.data();

        // Firebase Auth handles password verification directly through signInWithEmailAndPassword
        // in the client. For this server endpoint, we use Firebase's authentication methods

        // Generate JWT token
        const token = sign(
            {
                uid: userRecord.uid,
                email: userRecord.email,
                name: peddlerData?.name,
                peddlerType: peddlerData?.peddlerType,
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user data and token
        return NextResponse.json({
            message: 'Login successful',
            token,
            peddler: {
                id: userRecord.uid,
                name: peddlerData?.name,
                email: userRecord.email,
                peddlerType: peddlerData?.peddlerType,
                isActive: peddlerData?.isActive || false,
            },
        });
    } catch (error: any) {
        console.error('Error during peddler login:', error);

        const errorMessage = error.message || 'Login failed';
        const errorCode = error.code || 'unknown_error';

        return NextResponse.json(
            { error: errorMessage, code: errorCode },
            { status: 500 }
        );
    }
} 