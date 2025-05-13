import { apps, credential, initializeApp } from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Check if the Firebase Admin SDK has already been initialized
const initializeFirebaseAdmin = () => {
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
        } else {
            console.error('Firebase credentials are missing or incomplete');
        }
    }
};

// Initialize Firebase Admin SDK
initializeFirebaseAdmin();

// Export Firestore, Auth, and Storage instances
export const db = getFirestore();
export const auth = getAuth();
export const storage = getStorage();

// Export the initialization function for explicit initialization if needed
export { initializeFirebaseAdmin };
