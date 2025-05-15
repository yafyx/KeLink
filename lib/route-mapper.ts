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
export const calculateRoute = async (
    origin: RoutePoint,
    destination: RoutePoint,
    travelMode: TravelModeType = "WALKING"
): Promise<RouteDetails | null> => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        console.error("Google Maps API key is missing. Set GOOGLE_MAPS_API_KEY environment variable.");
        // Consider returning a more specific error or throwing, depending on desired handling
        return null;
    }

    const originStr = `${origin.lat},${origin.lng}`;
    const destinationStr = `${destination.lat},${destination.lng}`;
    const modeStr = travelMode.toLowerCase(); // API uses lowercase (e.g., 'walking')

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&mode=${modeStr}&key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === "OK" && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            if (route.legs && route.legs.length > 0) {
                const leg = route.legs[0];

                const path: Array<{ lat: number; lng: number }> = [];
                const instructions: string[] = [];

                if (leg.steps) {
                    leg.steps.forEach((step: any) => {
                        if (step.html_instructions) {
                            // Remove HTML tags
                            const cleanInstruction = step.html_instructions.replace(/<[^>]*>/g, "");
                            instructions.push(cleanInstruction);
                        }
                        // The Directions API path is an encoded polyline.
                        // Decoding it client-side is common, but for server-side, 
                        // if you need the exact path points, you'd use a polyline decoding library.
                        // For now, we'll skip populating the 'path' array with individual points 
                        // as it's often more for map rendering than for textual instructions.
                        // If detailed path points are crucial for server processing, 
                        // add a polyline decoding step here.
                    });
                }

                // The Directions API polyline is available at route.overview_polyline.points
                // If you need the path, you can decode this. For now, returning an empty path.
                // Example of how you might include the polyline if needed for client later:
                // path: route.overview_polyline ? [{ lat: 0, lng: 0, polyline: route.overview_polyline.points }] : [],
                // For now, let's keep it simple and focus on textual instructions.

                return {
                    path: [], // Simplified: path points extraction from polyline is complex for server if not drawing map.
                    // The map on the client will draw its own route if given origin/destination.
                    distance: {
                        text: leg.distance?.text || "Unknown",
                        value: leg.distance?.value || 0,
                    },
                    duration: {
                        text: leg.duration?.text || "Unknown",
                        value: leg.duration?.value || 0,
                    },
                    instructions,
                };
            } else {
                console.warn("No route legs found in Directions API response:", data);
                return null;
            }
        } else {
            console.error("Directions API request failed:", data.status, data.error_message);
            if (data.status === 'ZERO_RESULTS') {
                // Potentially return a specific object or throw a custom error for no routes found
                return {
                    path: [],
                    distance: { text: "N/A", value: 0 },
                    duration: { text: "N/A", value: 0 },
                    instructions: ["No route could be found between the origin and destination."]
                };
            }
            return null;
        }
    } catch (error) {
        console.error("Error fetching directions:", error);
        return null;
    }
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