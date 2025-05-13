/**
 * Location coordinate type
 */
export type RoutePoint = {
    lat: number;
    lng: number;
};

/**
 * Route information returned from Google Directions API
 */
export type RouteDetails = {
    path: Array<{ lat: number; lng: number }>;
    distance: {
        text: string;
        value: number; // in meters
    };
    duration: {
        text: string;
        value: number; // in seconds
    };
    instructions: string[];
};

/**
 * Travel mode type for route planning
 */
export type TravelModeType = "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT";

/**
 * Check if Google Maps API is loaded
 */
export const isGoogleMapsLoaded = (): boolean => {
    return typeof window !== 'undefined' &&
        !!window.google &&
        !!window.google.maps;
};

/**
 * Calculate a route between two points
 * @param origin Starting location (user location)
 * @param destination Ending location (peddler location)
 * @param travelMode Travel mode ("DRIVING", "WALKING", "BICYCLING", "TRANSIT")
 * @returns Promise resolving to route details
 */
export const calculateRoute = (
    origin: RoutePoint,
    destination: RoutePoint,
    travelMode: TravelModeType = "WALKING"
): Promise<RouteDetails | null> => {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.google || !window.google.maps) {
            reject(new Error("Google Maps API not loaded"));
            return;
        }

        const directionsService = new window.google.maps.DirectionsService();

        directionsService.route(
            {
                origin: { lat: origin.lat, lng: origin.lng },
                destination: { lat: destination.lat, lng: destination.lng },
                travelMode: travelMode as any,
            },
            (result, status) => {
                if (status === "OK" && result) {
                    const route = result.routes[0];
                    if (route && route.legs && route.legs.length > 0) {
                        const leg = route.legs[0];

                        // Extract path from steps
                        const path: Array<{ lat: number; lng: number }> = [];
                        const instructions: string[] = [];

                        if (leg.steps) {
                            leg.steps.forEach(step => {
                                // Add instructions
                                if (step.instructions) {
                                    // Remove HTML tags
                                    const cleanInstruction = step.instructions.replace(/<[^>]*>/g, "");
                                    instructions.push(cleanInstruction);
                                }

                                // Add path points if available
                                if (step.path) {
                                    step.path.forEach(point => {
                                        try {
                                            // Handle both function and property access for lat/lng
                                            const lat = typeof point.lat === 'function' ? point.lat() : point.lat;
                                            const lng = typeof point.lng === 'function' ? point.lng() : point.lng;

                                            if (typeof lat === 'number' && typeof lng === 'number') {
                                                path.push({ lat, lng });
                                            }
                                        } catch (e) {
                                            console.error("Error extracting point data:", e);
                                        }
                                    });
                                }
                            });
                        }

                        resolve({
                            path,
                            distance: {
                                text: leg.distance?.text || "Unknown",
                                value: leg.distance?.value || 0,
                            },
                            duration: {
                                text: leg.duration?.text || "Unknown",
                                value: leg.duration?.value || 0,
                            },
                            instructions,
                        });
                    } else {
                        resolve(null);
                    }
                } else {
                    console.error("Directions request failed:", status);
                    resolve(null);
                }
            }
        );
    });
};

/**
 * Format route information for display
 * @param distance Distance in meters
 * @param duration Duration in seconds
 * @returns Formatted strings
 */
export const formatRouteInfo = (
    distance: number,
    duration: number
): { distanceText: string; durationText: string } => {
    let distanceText = "Unknown distance";
    let durationText = "Unknown duration";

    // Format distance
    if (distance < 1000) {
        distanceText = `${Math.round(distance)} m`;
    } else {
        distanceText = `${(distance / 1000).toFixed(1)} km`;
    }

    // Format duration
    if (duration < 60) {
        durationText = `${Math.round(duration)} seconds`;
    } else if (duration < 3600) {
        durationText = `${Math.floor(duration / 60)} minutes`;
    } else {
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        durationText = `${hours} hours ${minutes} minutes`;
    }

    return { distanceText, durationText };
};

/**
 * Calculate the estimated time to reach a destination
 * @param durationInSeconds Duration in seconds from the route
 * @returns Estimated arrival time as formatted string
 */
export const calculateEstimatedArrival = (durationInSeconds: number): string => {
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + durationInSeconds * 1000);

    const hours = arrivalTime.getHours();
    const minutes = arrivalTime.getMinutes();

    // Format time as HH:MM
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}; 