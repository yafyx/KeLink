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

        // Get additional user data from Firestore
        const userDoc = await db.collection('users').doc(userRecord.uid).get();

        if (!userDoc.exists) {
            return NextResponse.json(
                { error: 'User account not found' },
                { status: 404 }
            );
        }

        const userData = userDoc.data();

        // Generate JWT token
        const token = sign(
            {
                uid: userRecord.uid,
                email: userRecord.email,
                name: userData?.name,
                role: 'user',
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user data and token
        return NextResponse.json({
            message: 'Login successful',
            token,
            user: {
                id: userRecord.uid,
                name: userData?.name,
                email: userRecord.email,
            },
        });
    } catch (error: any) {
        console.error('Error during user login:', error);

        const errorMessage = error.message || 'Login failed';
        const errorCode = error.code || 'unknown_error';

        return NextResponse.json(
            { error: errorMessage, code: errorCode },
            { status: 500 }
        );
    }
} 