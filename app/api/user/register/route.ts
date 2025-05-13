import { auth, db } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { name, email, password, phone } = await request.json();

        // Validation
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const userExists = await auth.getUserByEmail(email).catch(() => null);

        if (userExists) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            );
        }

        // Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email,
            password, // Firebase Auth handles the password hashing
            displayName: name,
            phoneNumber: phone,
        });

        // Store additional user data in Firestore
        await db.collection('users').doc(userRecord.uid).set({
            name,
            email,
            phone: phone || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        // Return success response (without sensitive info)
        return NextResponse.json(
            {
                message: 'User registered successfully',
                user: {
                    id: userRecord.uid,
                    name,
                    email,
                }
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error during user registration:', error);

        // Handle specific Firebase Auth errors
        if (error.code === 'auth/email-already-exists') {
            return NextResponse.json(
                { error: 'Email already in use' },
                { status: 400 }
            );
        }

        if (error.code === 'auth/invalid-email') {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        if (error.code === 'auth/weak-password') {
            return NextResponse.json(
                { error: 'Password is too weak' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Registration failed' },
            { status: 500 }
        );
    }
} 