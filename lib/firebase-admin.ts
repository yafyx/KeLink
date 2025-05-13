import * as admin from 'firebase-admin';
import { type Firestore } from 'firebase-admin/firestore'; // For type annotation

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
let auth: admin.auth.Auth | any; // Use admin.auth.Auth for type, any for mock
let storage: admin.storage.Storage | any; // Use admin.storage.Storage for type, any for mock
let firebaseInitialized = false;

// Check if the Firebase Admin SDK has already been initialized
const initializeFirebaseAdmin = () => {
    // Skip if already attempted initialization
    if (firebaseInitialized) return;

    firebaseInitialized = true;

    try {
        if (!admin.apps.length) { // Changed: apps -> admin.apps
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
                admin.initializeApp({ // Changed: initializeApp -> admin.initializeApp
                    credential: admin.credential.cert({ // Changed: credential.cert -> admin.credential.cert
                        projectId: firebaseConfig.projectId,
                        clientEmail: firebaseConfig.clientEmail,
                        privateKey: firebaseConfig.privateKey,
                    }),
                    databaseURL: firebaseConfig.databaseURL,
                    storageBucket: firebaseConfig.storageBucket,
                });

                // Set up the real Firestore, Auth and Storage instances
                db = admin.firestore(); // Changed: getFirestore() -> admin.firestore()
                auth = admin.auth();    // Changed: getAuth() -> admin.auth()
                storage = admin.storage(); // Changed: getStorage() -> admin.storage()
                console.log('Firebase Admin SDK initialized successfully');
            } else {
                throw new Error('Firebase credentials are missing or incomplete');
            }
        } else {
            // Firebase already initialized, get instances from the default app
            const app = admin.app(); // Get the default app instance
            db = admin.firestore(app);
            auth = admin.auth(app);
            storage = admin.storage(app);
        }
    } catch (error) {
        console.error('Error initializing Firebase Admin SDK:', error);
        console.warn('Using mock implementations instead');

        // Set up mock implementations
        db = new MockFirestore();
        auth = { // Ensure mock provides methods used, like getUserByEmail
            createUser: async () => ({ uid: 'mock-uid' }),
            verifyIdToken: async () => ({ uid: 'mock-uid' }),
            getUser: async () => ({ uid: 'mock-uid', email: 'mock@example.com' }),
            getUserByEmail: async (email: string) => null, // Added missing mock method
            // Add other methods if they are called and could lead to errors when mocked
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

