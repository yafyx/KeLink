"use client";

import { useState } from "react";
import { StarIcon } from "lucide-react";
import { Vendor } from "@/lib/vendors";

interface VendorDetailsProps {
  vendor: Vendor;
  onClose: () => void;
}

export function VendorDetails({ vendor, onClose }: VendorDetailsProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [lastReviewId, setLastReviewId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [userRating, setUserRating] = useState<number>(5);
  const [userComment, setUserComment] = useState<string>("");
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load reviews when component mounts
  const loadReviews = async () => {
    if (loadingReviews) return;

    setLoadingReviews(true);
    try {
      const params = new URLSearchParams();
      params.append("vendorId", vendor.id);
      if (lastReviewId) {
        params.append("lastReviewId", lastReviewId);
      }

      const response = await fetch(`/api/vendors/reviews?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load reviews");
      }

      const data = await response.json();

      // If first load, replace reviews, otherwise append
      if (!lastReviewId) {
        setReviews(data.reviews);
      } else {
        setReviews([...reviews, ...data.reviews]);
      }

      setHasMore(data.hasMore);

      // Set the last review ID for pagination
      if (data.reviews.length > 0) {
        setLastReviewId(data.reviews[data.reviews.length - 1].id);
      }
    } catch (err) {
      console.error("Error loading reviews:", err);
      setError("Failed to load reviews");
    } finally {
      setLoadingReviews(false);
    }
  };

  // Submit a new review
  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/vendors/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorId: vendor.id,
          rating: userRating,
          comment: userComment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      // Add the new review to the list
      setReviews([data.review, ...reviews]);
      setReviewSubmitted(true);
      setShowReviewForm(false);

      // Reset form
      setUserRating(5);
      setUserComment("");
    } catch (err: any) {
      console.error("Error submitting review:", err);
      setError(err.message || "Failed to submit review");
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize reviews load if not yet done
  if (reviews.length === 0 && !loadingReviews && !error) {
    loadReviews();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{vendor.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Vendor Information</h3>
            <p>
              <strong>Type:</strong> {vendor.type}
            </p>
            <p>
              <strong>Distance:</strong> {vendor.distance}
            </p>
            <p>
              <strong>Rating:</strong>{" "}
              {vendor.rating ? `${vendor.rating}/5` : "No ratings yet"}
            </p>
            {vendor.description && <p className="mt-2">{vendor.description}</p>}
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Reviews</h3>
              {!showReviewForm && !reviewSubmitted && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Review
                </button>
              )}
              {reviewSubmitted && (
                <p className="text-green-600">Thank you for your review!</p>
              )}
            </div>

            {showReviewForm && (
              <form
                onSubmit={submitReview}
                className="mb-6 p-4 border rounded-lg"
              >
                <h4 className="font-medium mb-2">Your Review</h4>

                <div className="mb-4">
                  <label className="block mb-1">Rating</label>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setUserRating(star)}
                        className="focus:outline-none"
                      >
                        <StarIcon
                          className={`w-6 h-6 ${
                            star <= userRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block mb-1">Comment</label>
                  <textarea
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                  />
                </div>

                {error && <p className="text-red-600 mb-4">{error}</p>}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="px-4 py-2 border rounded-md"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                    disabled={isLoading}
                  >
                    {isLoading ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            )}

            {loadingReviews && reviews.length === 0 ? (
              <p className="text-center py-4">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="text-center py-4">
                No reviews yet. Be the first to review!
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4">
                    <div className="flex items-center mb-1">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}

                {hasMore && (
                  <div className="text-center pt-2">
                    <button
                      onClick={loadReviews}
                      className="px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"
                      disabled={loadingReviews}
                    >
                      {loadingReviews ? "Loading..." : "Load More Reviews"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
