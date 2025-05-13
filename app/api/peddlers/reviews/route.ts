import { addReview, deleteReview, getPeddlerReviews, hasUserReviewed, updateReview } from '@/lib/peddler-reviews';
import { RateLimiter } from '@/lib/rate-limiter';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Generate or retrieve a unique user ID for tracking reviews
function getUserId(req: NextRequest): string {
    const userIdCookie = req.cookies.get('user_id');

    if (userIdCookie && userIdCookie.value) {
        return userIdCookie.value;
    }

    // Generate a new anonymous ID if none exists
    return uuidv4();
}

export async function GET(request: NextRequest) {
    // Apply rate limiting
    const rateLimiter = RateLimiter.getInstance();
    const { isLimited, headers: rateLimitHeaders } =
        rateLimiter.checkRateLimit(request, 'default');

    // If rate limit exceeded, return 429 Too Many Requests
    if (isLimited) {
        return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            {
                status: 429,
                headers: {
                    ...rateLimitHeaders,
                    'Retry-After': '60'
                }
            }
        );
    }

    try {
        // Parse URL to get peddler ID and pagination parameters
        const { searchParams } = new URL(request.url);
        const vendorId = searchParams.get('vendorId');
        const limitParam = searchParams.get('limit');
        const lastReviewId = searchParams.get('lastReviewId');

        if (!vendorId) {
            return NextResponse.json(
                { error: 'Peddler ID is required' },
                { status: 400, headers: rateLimitHeaders }
            );
        }

        // Convert limit to number or use default
        const limit = limitParam ? parseInt(limitParam, 10) : 10;

        // Get reviews for this peddler
        const { reviews, hasMore } = await getPeddlerReviews(vendorId, limit, lastReviewId || undefined);

        return NextResponse.json(
            { reviews, hasMore },
            { headers: rateLimitHeaders }
        );
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return NextResponse.json(
            { error: 'Failed to fetch reviews' },
            { status: 500, headers: rateLimitHeaders }
        );
    }
}

export async function POST(request: NextRequest) {
    // Apply rate limiting
    const rateLimiter = RateLimiter.getInstance();
    const { isLimited, headers: rateLimitHeaders } =
        rateLimiter.checkRateLimit(request, 'default');

    // If rate limit exceeded, return 429 Too Many Requests
    if (isLimited) {
        return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            {
                status: 429,
                headers: {
                    ...rateLimitHeaders,
                    'Retry-After': '60'
                }
            }
        );
    }

    try {
        const { vendorId, rating, comment } = await request.json();

        // Validate required fields
        if (!vendorId) {
            return NextResponse.json(
                { error: 'Peddler ID is required' },
                { status: 400, headers: rateLimitHeaders }
            );
        }

        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: 'Rating must be between 1 and 5' },
                { status: 400, headers: rateLimitHeaders }
            );
        }

        // Get or create user ID and check for existing cookie
        const userId = getUserId(request);
        const hasExistingCookie = !!request.cookies.get('user_id');

        // Check if user has already reviewed this peddler
        const hasReviewed = await hasUserReviewed(userId, vendorId);
        if (hasReviewed) {
            return NextResponse.json(
                { error: 'You have already reviewed this peddler' },
                { status: 400, headers: rateLimitHeaders }
            );
        }

        // Create the review
        const review = await addReview({
            peddlerId: vendorId,
            userId,
            rating,
            comment: comment || '',
        });

        // Create response
        const response = NextResponse.json(
            { success: true, review },
            { headers: rateLimitHeaders }
        );

        // Set the cookie if it doesn't already exist
        if (!hasExistingCookie) {
            response.cookies.set('user_id', userId, {
                maxAge: 60 * 60 * 24 * 365, // 1 year
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
            });
        }

        return response;
    } catch (error) {
        console.error('Error creating review:', error);
        return NextResponse.json(
            { error: 'Failed to create review' },
            { status: 500, headers: rateLimitHeaders }
        );
    }
}

// Update a review (PATCH method)
export async function PATCH(request: NextRequest) {
    // Apply rate limiting
    const rateLimiter = RateLimiter.getInstance();
    const { isLimited, headers: rateLimitHeaders } =
        rateLimiter.checkRateLimit(request, 'default');

    // If rate limit exceeded, return 429 Too Many Requests
    if (isLimited) {
        return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            {
                status: 429,
                headers: {
                    ...rateLimitHeaders,
                    'Retry-After': '60'
                }
            }
        );
    }

    try {
        const { reviewId, rating, comment } = await request.json();

        // Validate required field
        if (!reviewId) {
            return NextResponse.json(
                { error: 'Review ID is required' },
                { status: 400, headers: rateLimitHeaders }
            );
        }

        // Create update object with only provided fields
        const updates: any = {};
        if (rating !== undefined) {
            if (rating < 1 || rating > 5) {
                return NextResponse.json(
                    { error: 'Rating must be between 1 and 5' },
                    { status: 400, headers: rateLimitHeaders }
                );
            }
            updates.rating = rating;
        }

        if (comment !== undefined) {
            updates.comment = comment;
        }

        // Update the review
        await updateReview(reviewId, updates);

        return NextResponse.json(
            { success: true },
            { headers: rateLimitHeaders }
        );
    } catch (error) {
        console.error('Error updating review:', error);
        return NextResponse.json(
            { error: 'Failed to update review' },
            { status: 500, headers: rateLimitHeaders }
        );
    }
}

// Delete a review (DELETE method)
export async function DELETE(request: NextRequest) {
    // Apply rate limiting
    const rateLimiter = RateLimiter.getInstance();
    const { isLimited, headers: rateLimitHeaders } =
        rateLimiter.checkRateLimit(request, 'default');

    // If rate limit exceeded, return 429 Too Many Requests
    if (isLimited) {
        return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            {
                status: 429,
                headers: {
                    ...rateLimitHeaders,
                    'Retry-After': '60'
                }
            }
        );
    }

    try {
        // Parse URL to get review ID
        const { searchParams } = new URL(request.url);
        const reviewId = searchParams.get('reviewId');

        if (!reviewId) {
            return NextResponse.json(
                { error: 'Review ID is required' },
                { status: 400, headers: rateLimitHeaders }
            );
        }

        // Delete the review
        await deleteReview(reviewId);

        return NextResponse.json(
            { success: true },
            { headers: rateLimitHeaders }
        );
    } catch (error) {
        console.error('Error deleting review:', error);
        return NextResponse.json(
            { error: 'Failed to delete review' },
            { status: 500, headers: rateLimitHeaders }
        );
    }
} 