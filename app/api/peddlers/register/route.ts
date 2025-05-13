import { auth, db } from '@/lib/firebase-admin';
// import { hash } from 'bcrypt'; // This line should be removed
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { name, email, password, vendorType, description, phone } = await request.json();

        // Validation
        if (!name || !email || !password || !vendorType) {
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

        // Hash password
        // const saltRounds = 10;
        // const hashedPassword = await hash(password, saltRounds);

        // Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email,
            password, // Firebase Auth handles the password hashing
            displayName: name,
            phoneNumber: phone,
        });

        // Store additional peddler data in Firestore
        await db.collection('peddlers').doc(userRecord.uid).set({
            name,
            email,
            vendorType,
            description: description || '',
            phone: phone || '',
            isActive: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        // Return success response (without sensitive info)
        return NextResponse.json(
            {
                message: 'Peddler registered successfully',
                peddler: {
                    id: userRecord.uid,
                    name,
                    email,
                    vendorType,
                }
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error registering peddler:', error);

        // Return appropriate error message
        const errorMessage = error.message || 'Failed to register peddler';
        const errorCode = error.code || 'unknown_error';

        return NextResponse.json(
            { error: errorMessage, code: errorCode },
            { status: 500 }
        );
    }
} 