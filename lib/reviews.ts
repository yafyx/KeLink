import { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { db } from './firebase-admin';

export interface VendorReview {
    id: string;
    vendorId: string;
    userId: string; // Anonymous ID for non-logged in users
    rating: number; // 1-5 star rating
    comment: string;
    createdAt: string;
    updatedAt?: string;
}

/**
 * Add a review for a vendor
 */
export async function addReview(review: Omit<VendorReview, 'id' | 'createdAt'>): Promise<VendorReview> {
    try {
        // Create a new review object with timestamp
        const newReview = {
            ...review,
            createdAt: new Date().toISOString(),
        };

        // Add to the reviews collection
        const reviewRef = await db.collection('reviews').add(newReview);

        // Get the vendor to update their average rating
        const vendorRef = db.collection('vendors').doc(review.vendorId);
        const vendorDoc = await vendorRef.get();

        if (vendorDoc.exists) {
            // Update the vendor's rating
            await updateVendorRating(review.vendorId);
        }

        // Return the created review with the ID
        return {
            id: reviewRef.id,
            ...newReview,
        };
    } catch (error) {
        console.error('Error adding review:', error);
        throw error;
    }
}

/**
 * Get reviews for a vendor with pagination
 */
export async function getVendorReviews(
    vendorId: string,
    limit: number = 10,
    lastReviewId?: string
): Promise<{ reviews: VendorReview[]; hasMore: boolean }> {
    try {
        // Start with base query
        let query: any = db.collection('reviews').where('vendorId', '==', vendorId);
        query = query.orderBy('createdAt', 'desc');

        // Add pagination if lastReviewId provided
        if (lastReviewId) {
            const lastReviewDoc = await db.collection('reviews').doc(lastReviewId).get();
            if (lastReviewDoc.exists) {
                query = query.startAfter(lastReviewDoc);
            }
        }

        // Execute query with limit
        const snapshot = await query.limit(limit + 1).get();

        // Check if there are more results
        const hasMore = snapshot.docs.length > limit;

        // Extract reviews, removing the extra one used for hasMore check
        const reviews = snapshot.docs.slice(0, limit).map((doc: QueryDocumentSnapshot<DocumentData>) => ({
            id: doc.id,
            ...doc.data(),
        })) as VendorReview[];

        return { reviews, hasMore };
    } catch (error) {
        console.error('Error getting vendor reviews:', error);
        throw error;
    }
}

/**
 * Update a vendor's average rating based on their reviews
 */
export async function updateVendorRating(vendorId: string): Promise<number> {
    try {
        // Get all reviews for this vendor
        const reviewsSnapshot = await (db.collection('reviews') as any)
            .where('vendorId', '==', vendorId)
            .get();

        if (reviewsSnapshot.empty) {
            return 0; // No reviews
        }

        // Calculate average rating
        let totalRating = 0;
        let count = 0;

        reviewsSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
            const review = doc.data();
            if (review.rating >= 1 && review.rating <= 5) {
                totalRating += review.rating;
                count++;
            }
        });

        const averageRating = count > 0 ? parseFloat((totalRating / count).toFixed(1)) : 0;

        // Update vendor document with new rating
        await db.collection('vendors').doc(vendorId).update({
            rating: averageRating,
            reviewCount: count
        });

        return averageRating;
    } catch (error) {
        console.error('Error updating vendor rating:', error);
        throw error;
    }
}

/**
 * Check if a user has already reviewed a vendor
 */
export async function hasUserReviewed(userId: string, vendorId: string): Promise<boolean> {
    try {
        const snapshot = await (db.collection('reviews') as any)
            .where('userId', '==', userId)
            .where('vendorId', '==', vendorId)
            .limit(1)
            .get();

        return !snapshot.empty;
    } catch (error) {
        console.error('Error checking if user has reviewed:', error);
        throw error;
    }
}

/**
 * Update an existing review
 */
export async function updateReview(
    reviewId: string,
    updates: Partial<Omit<VendorReview, 'id' | 'userId' | 'vendorId' | 'createdAt'>>
): Promise<void> {
    try {
        // Get the current review to ensure it exists and to get the vendorId
        const reviewDoc = await db.collection('reviews').doc(reviewId).get();

        if (!reviewDoc.exists) {
            throw new Error('Review not found');
        }

        // Add updatedAt timestamp
        const updatedReview = {
            ...updates,
            updatedAt: new Date().toISOString()
        };

        // Update the review
        await db.collection('reviews').doc(reviewId).update(updatedReview);

        // Update the vendor's average rating if the rating changed
        if (updates.rating) {
            const vendorId = reviewDoc.data()?.vendorId;
            if (vendorId) {
                await updateVendorRating(vendorId);
            }
        }
    } catch (error) {
        console.error('Error updating review:', error);
        throw error;
    }
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string): Promise<void> {
    try {
        // Get the review to ensure it exists and to get the vendorId
        const reviewDoc = await db.collection('reviews').doc(reviewId).get();

        if (!reviewDoc.exists) {
            throw new Error('Review not found');
        }

        const vendorId = reviewDoc.data()?.vendorId;

        // Delete the review
        await db.collection('reviews').doc(reviewId).delete();

        // Update the vendor's average rating
        if (vendorId) {
            await updateVendorRating(vendorId);
        }
    } catch (error) {
        console.error('Error deleting review:', error);
        throw error;
    }
} 