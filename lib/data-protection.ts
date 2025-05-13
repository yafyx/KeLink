import { Firestore } from "firebase-admin/firestore";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies } from "next/headers";
import { DecodedToken } from "./auth-utils";
import { db } from "./firebase-admin";

interface RetentionPolicy {
    locationData: number; // days
    queryHistory: number; // days
    anonymousUsageData: number; // days
}

export class DataProtection {
    private static instance: DataProtection;
    private retentionPolicy: RetentionPolicy = {
        locationData: 90, // 90 days retention for location data
        queryHistory: 60, // 60 days retention for query history
        anonymousUsageData: 365, // 1 year for anonymous usage data
    };

    private constructor() { }

    public static getInstance(): DataProtection {
        if (!DataProtection.instance) {
            DataProtection.instance = new DataProtection();
        }
        return DataProtection.instance;
    }

    /**
     * Check if the user has given consent to data processing
     */
    public hasConsent(): boolean {
        try {
            const cookieStore = cookies() as unknown as ReadonlyRequestCookies;
            const consentCookie = cookieStore.get("privacy-consent");
            return consentCookie?.value === "true";
        } catch (error) {
            console.error("Error checking consent:", error);
            return false;
        }
    }

    /**
     * Anonymize location data for storage when consent is not given
     * but some level of functionality is still needed
     */
    public anonymizeLocation(location: { lat: number; lon: number }): { lat: number; lon: number } {
        // Reduce precision to neighborhood level (roughly 1km)
        // This reduces precision to ~3 decimal places which is about 110m accuracy
        const anonymizedLat = Math.round(location.lat * 100) / 100;
        const anonymizedLon = Math.round(location.lon * 100) / 100;

        return {
            lat: anonymizedLat,
            lon: anonymizedLon,
        };
    }

    /**
     * Store user query with appropriate consent and retention metadata
     */
    public async storeUserQuery(
        query: string,
        location: { lat: number; lon: number } | null,
        hasConsent: boolean
    ): Promise<void> {
        if (!hasConsent && !location) {
            // If no consent and no location, don't store anything
            return;
        }

        try {
            // Prepare data to store
            const queryData: Record<string, any> = {
                query,
                timestamp: new Date().toISOString(),
                hasConsent,
                // Calculate expiration date based on retention policy
                expirationDate: new Date(
                    Date.now() + this.retentionPolicy.queryHistory * 24 * 60 * 60 * 1000
                ).toISOString(),
            };

            // Handle location data based on consent
            if (location) {
                if (hasConsent) {
                    queryData.location = location;
                } else {
                    // Store anonymized location if no consent
                    queryData.location = this.anonymizeLocation(location);
                    queryData.locationAnonymized = true;
                }

                // Add location expiration date (shorter than general query data)
                queryData.locationExpirationDate = new Date(
                    Date.now() + this.retentionPolicy.locationData * 24 * 60 * 60 * 1000
                ).toISOString();
            }

            // Store in Firestore with auto-generated ID
            await db.collection("user_queries").add(queryData);
        } catch (error) {
            console.error("Error storing user query:", error);
        }
    }

    /**
     * Purge expired user data to comply with retention policies
     * This should be run on a scheduled basis (e.g., daily)
     */
    public async purgeExpiredData(): Promise<void> {
        const currentDate = new Date().toISOString();

        try {
            // Check if db is a Firestore instance with batch support
            if (!(db instanceof Firestore) || typeof db.batch !== 'function') {
                console.error("Batch operations not supported in current Firestore configuration");
                return;
            }

            // Create a WriteBatch
            const writeBatch = db.batch();

            // Delete expired queries
            const expiredQueriesSnapshot = await db
                .collection("user_queries")
                .where("expirationDate", "<", currentDate)
                .get();

            expiredQueriesSnapshot.forEach((doc) => {
                writeBatch.delete(doc.ref);
            });

            // Delete expired location data (but keep other query data)
            const locationExpiredSnapshot = await db
                .collection("user_queries")
                .where("locationExpirationDate", "<", currentDate)
                .get();

            locationExpiredSnapshot.forEach((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    // Check if the entire document isn't already scheduled for deletion
                    if (data.expirationDate >= currentDate) {
                        // Only remove location data
                        writeBatch.update(doc.ref, {
                            location: null,
                            locationAnonymized: null,
                            locationExpirationDate: null,
                        });
                    }
                }
            });

            await writeBatch.commit();
        } catch (error) {
            console.error("Error purging expired data:", error);
        }
    }

    /**
     * Delete all data for a specific user (right to be forgotten)
     */
    public async deleteUserData(user: DecodedToken): Promise<void> {
        try {
            // Check if db is a Firestore instance with batch support
            if (!(db instanceof Firestore) || typeof db.batch !== 'function') {
                throw new Error("Batch operations not supported in current Firestore configuration");
            }

            // Create a WriteBatch
            const writeBatch = db.batch();

            // Delete user document
            const userRef = db.collection("peddlers").doc(user.uid);
            writeBatch.delete(userRef);

            // Delete user location history
            const locationHistorySnapshot = await db
                .collection("location_history")
                .where("userId", "==", user.uid)
                .get();

            locationHistorySnapshot.forEach((doc) => {
                writeBatch.delete(doc.ref);
            });

            await writeBatch.commit();
        } catch (error) {
            console.error("Error deleting user data:", error);
            throw new Error("Failed to delete user data");
        }
    }

    /**
     * Export user data in a portable format (right to data portability)
     */
    public async exportUserData(user: DecodedToken): Promise<Record<string, any>> {
        try {
            const userData: Record<string, any> = {};

            // Get user profile
            const userDoc = await db.collection("peddlers").doc(user.uid).get();
            if (userDoc.exists) {
                userData.profile = userDoc.data();
            }

            // Get user location history
            const locationHistorySnapshot = await db
                .collection("location_history")
                .where("userId", "==", user.uid)
                .get();

            userData.locationHistory = [];
            locationHistorySnapshot.forEach((doc) => {
                userData.locationHistory.push(doc.data());
            });

            return userData;
        } catch (error) {
            console.error("Error exporting user data:", error);
            throw new Error("Failed to export user data");
        }
    }
} 