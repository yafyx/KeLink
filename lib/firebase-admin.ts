import { apps, credential, initializeApp } from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Create mock implementations for when Firebase initialization fails
class MockFirestore {
    collection(name: string) {
        return {
            where: () => ({
                get: async () => ({
                    empty: true,
                    forEach: () => { }
                })
            }),
            doc: (id: string) => ({
                get: async () => ({
                    exists: false,
                    data: () => null,
                    id: id
                }),
                set: async () => { },
                update: async () => { },
                delete: async () => { }
            }),
            add: async () => ({ id: 'mock-id' })
        };
    }
}

let db: Firestore | MockFirestore;
let auth: any;
let storage: any;
let firebaseInitialized = false;

// Check if the Firebase Admin SDK has already been initialized
const initializeFirebaseAdmin = () => {
    // Skip if already attempted initialization
    if (firebaseInitialized) return;

    firebaseInitialized = true;

    try {
        if (!apps.length) {
            // Initialize the app with the service account credentials
            const firebaseConfig = {
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // The private key needs to have newlines replaced since env variables
                // are stored as strings and newlines in the original key are escaped
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                databaseURL: process.env.FIREBASE_DATABASE_URL,
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            };

            // Only initialize with valid credentials
            if (firebaseConfig.projectId && firebaseConfig.clientEmail && firebaseConfig.privateKey) {
                initializeApp({
                    credential: credential.cert({
                        projectId: firebaseConfig.projectId,
                        clientEmail: firebaseConfig.clientEmail,
                        privateKey: firebaseConfig.privateKey,
                    }),
                    databaseURL: firebaseConfig.databaseURL,
                    storageBucket: firebaseConfig.storageBucket,
                });

                // Set up the real Firestore, Auth and Storage instances
                db = getFirestore();
                auth = getAuth();
                storage = getStorage();
                console.log('Firebase Admin SDK initialized successfully');
            } else {
                throw new Error('Firebase credentials are missing or incomplete');
            }
        } else {
            // Firebase already initialized, get instances
            db = getFirestore();
            auth = getAuth();
            storage = getStorage();
        }
    } catch (error) {
        console.error('Error initializing Firebase Admin SDK:', error);
        console.warn('Using mock implementations instead');

        // Set up mock implementations
        db = new MockFirestore();
        auth = {
            createUser: async () => ({ uid: 'mock-uid' }),
            verifyIdToken: async () => ({ uid: 'mock-uid' }),
            getUser: async () => ({ uid: 'mock-uid', email: 'mock@example.com' })
        };
        storage = {
            bucket: () => ({
                file: () => ({
                    save: async () => { },
                    delete: async () => { }
                }),
                getFiles: async () => [[]]
            })
        };
    }
};

// Try to initialize Firebase Admin SDK
initializeFirebaseAdmin();

// Export Firestore, Auth, and Storage instances
export { auth, db, storage };

// Export the initialization function for explicit initialization if needed
export { initializeFirebaseAdmin };

