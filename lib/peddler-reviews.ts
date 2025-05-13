import { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { db } from './firebase-admin';

export interface PeddlerReview {
    id: string;
    peddlerId: string;
    userId: string; // Anonymous ID for non-logged in users
    rating: number; // 1-5 star rating
    comment: string;
    createdAt: string;
    updatedAt?: string;
}

/**
 * Add a review for a peddler
 */
export async function addReview(review: Omit<PeddlerReview, 'id' | 'createdAt'>): Promise<PeddlerReview> {
    try {
        // Create a new review object with timestamp
        const newReview = {
            ...review,
            createdAt: new Date().toISOString(),
        };

        // Add to the reviews collection
        const reviewRef = await db.collection('reviews').add(newReview);

        // Get the peddler to update their average rating
        const peddlerRef = db.collection('peddlers').doc(review.peddlerId);
        const peddlerDoc = await peddlerRef.get();

        if (peddlerDoc.exists) {
            // Update the peddler's rating
            await updatePeddlerRating(review.peddlerId);
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
 * Get reviews for a peddler with pagination
 */
export async function getPeddlerReviews(
    peddlerId: string,
    limit: number = 10,
    lastReviewId?: string
): Promise<{ reviews: PeddlerReview[]; hasMore: boolean }> {
    try {
        // Start with base query
        let query: any = db.collection('reviews').where('peddlerId', '==', peddlerId);
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
        })) as PeddlerReview[];

        return { reviews, hasMore };
    } catch (error) {
        console.error('Error getting peddler reviews:', error);
        throw error;
    }
}

/**
 * Update a peddler's average rating based on their reviews
 */
export async function updatePeddlerRating(peddlerId: string): Promise<number> {
    try {
        // Get all reviews for this peddler
        const reviewsSnapshot = await (db.collection('reviews') as any)
            .where('peddlerId', '==', peddlerId)
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

        // Update peddler document with new rating
        await db.collection('peddlers').doc(peddlerId).update({
            rating: averageRating,
            reviewCount: count
        });

        return averageRating;
    } catch (error) {
        console.error('Error updating peddler rating:', error);
        throw error;
    }
}

/**
 * Check if a user has already reviewed a peddler
 */
export async function hasUserReviewed(userId: string, peddlerId: string): Promise<boolean> {
    try {
        const snapshot = await (db.collection('reviews') as any)
            .where('userId', '==', userId)
            .where('peddlerId', '==', peddlerId)
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
    updates: Partial<Omit<PeddlerReview, 'id' | 'userId' | 'peddlerId' | 'createdAt'>>
): Promise<void> {
    try {
        // Get the current review to ensure it exists and to get the peddlerId
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

        // Update the peddler's average rating if the rating changed
        if (updates.rating) {
            const peddlerId = reviewDoc.data()?.peddlerId;
            if (peddlerId) {
                await updatePeddlerRating(peddlerId);
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
        // Get the review to ensure it exists and to get the peddlerId
        const reviewDoc = await db.collection('reviews').doc(reviewId).get();

        if (!reviewDoc.exists) {
            throw new Error('Review not found');
        }

        const peddlerId = reviewDoc.data()?.peddlerId;

        // Delete the review
        await db.collection('reviews').doc(reviewId).delete();

        // Update the peddler's average rating
        if (peddlerId) {
            await updatePeddlerRating(peddlerId);
        }
    } catch (error) {
        console.error('Error deleting review:', error);
        throw error;
    }
} 