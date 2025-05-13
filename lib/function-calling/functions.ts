// Define types for function calling
import { FunctionSchema } from "@/lib/gemini";

// First definition of FunctionCallResult
export interface FunctionCallResult {
    name: string;
    args: Record<string, any>;
}

// Define function schemas

export const findPeddlersFunction = {
    name: "find_peddlers",
    description: "Searches for nearby food peddlers matching the user's query",
    parameters: {
        type: "object",
        properties: {
            peddlerType: {
                type: "string",
                description: "Type of peddler/food to search for (e.g., 'bakso', 'siomay', 'batagor')",
            },
            keywords: {
                type: "array",
                items: { type: "string" },
                description: "Additional keywords to help with the search",
            },
            maxDistance: {
                type: "number",
                description: "Maximum distance in meters to search (default: 5000)",
            },
        },
        required: [],
    },
};

export const getRouteFunction = {
    name: "get_route",
    description: "Calculate a route to the selected peddler",
    parameters: {
        type: "object",
        properties: {
            peddlerId: {
                type: "string",
                description: "ID of the peddler to navigate to",
            },
            transportMode: {
                type: "string",
                enum: ["WALKING", "DRIVING", "BICYCLING", "TRANSIT"],
                description: "Mode of transportation (default: WALKING)",
            },
        },
        required: ["peddlerId"],
    },
};

export const getLocationFunction = {
    name: "get_location",
    description: "Gets the user's current location",
    parameters: {
        type: "object",
        properties: {},
        required: [],
    },
};

// Combined list of all available functions
export const legacyFunctions = [
    findPeddlersFunction,
    getRouteFunction,
    getLocationFunction
];

// Handler for executing function calls
export async function executeFunctionCall(
    functionCall: FunctionCallResult,
    userLocation: { lat: number; lng: number } | null,
    foundVendors: any[],
    onVendorResults?: (peddlers: any[]) => void,
    onRouteResult?: (routeDetails: any) => void,
    onLocationResult?: () => void
): Promise<string> {
    const { name, args } = functionCall;

    switch (name) {
        case "find_peddlers":
            try {
                // Default values
                const peddlerType = args.peddlerType || "";
                const keywords = args.keywords || [];
                const maxDistance = args.maxDistance || 5000;

                if (!userLocation) {
                    return "I need your location to find peddlers nearby. Please enable location access.";
                }

                // Prepare the request body for the API
                const requestBody = {
                    message: `${peddlerType} ${keywords.join(" ")}`.trim(),
                    location: {
                        lat: userLocation.lat,
                        lng: userLocation.lng,
                    },
                    limit: 10,
                };

                // Call the API
                const response = await fetch("/api/find", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(requestBody),
                });

                if (!response.ok) {
                    throw new Error(`API error: ${response.statusText}`);
                }

                const data = await response.json();

                // Update peddlers in the parent component
                if (onVendorResults && data.response.peddlers) {
                    onVendorResults(data.response.peddlers);
                }

                // Return a response based on the results
                if (data.response.peddlers && data.response.peddlers.length > 0) {
                    return `I found ${data.response.peddlers.length} ${peddlerType || "food"} peddlers near you. You can see them on the map.`;
                } else {
                    return `I couldn't find any ${peddlerType || "food"} peddlers near your location. Please try a different search or check back later.`;
                }
            } catch (error) {
                console.error("Error finding peddlers:", error);
                return "Sorry, I had trouble finding peddlers. Please try again later.";
            }

        case "get_route":
            try {
                const { peddlerId, transportMode = "WALKING" } = args;

                if (!userLocation) {
                    return "I need your location to calculate a route. Please enable location access.";
                }

                if (!peddlerId) {
                    return "Please select a peddler first to get directions.";
                }

                const selectedPeddler = foundVendors.find((v) => v.id === peddlerId);
                if (!selectedPeddler) {
                    return "I couldn't find that peddler. Please select a peddler from the list.";
                }

                // Import and use the route-mapper functions
                const { calculateRoute } = await import("@/lib/route-mapper");

                const routeDetails = await calculateRoute(
                    userLocation,
                    selectedPeddler.location,
                    transportMode
                );

                // Update route in the parent component
                if (onRouteResult) {
                    onRouteResult(routeDetails);
                }

                if (!routeDetails) {
                    return "I couldn't calculate a route to the peddler. Please try again later.";
                }

                return `Here's the route to ${selectedPeddler.name}. It will take approximately ${routeDetails.duration.text} (${routeDetails.distance.text}).`;
            } catch (error) {
                console.error("Error calculating route:", error);
                return "Sorry, I had trouble calculating the route. Please try again later.";
            }

        case "get_location":
            try {
                // This will trigger the location update in the parent component
                if (onLocationResult) {
                    onLocationResult();
                }

                if (!userLocation) {
                    return "Requesting your location. Please enable location access if prompted.";
                } else {
                    return "I've updated your location on the map.";
                }
            } catch (error) {
                console.error("Error getting location:", error);
                return "Sorry, I had trouble accessing your location. Please check your location permissions.";
            }

        default:
            return `Function ${name} is not supported.`;
    }
}

// Define function call schemas for the LLM

// Schema for finding nearby peddlers
export const findPeddlersSchema: FunctionSchema = {
    name: "findNearbyPeddlers",
    description: "Search for nearby food peddlers based on user preferences",
    parameters: {
        type: "object",
        properties: {
            foodType: {
                type: "string",
                description: "Type of food peddler to search for (e.g., bakso, siomay, batagor, es cendol)",
            },
            maxDistance: {
                type: "number",
                description: "Maximum distance in meters to search for peddlers",
            },
            sortBy: {
                type: "string",
                enum: ["distance", "rating", "last_active"],
                description: "How to sort the results",
            },
        },
        required: ["foodType"],
    },
};

// Schema for getting routes to a peddler
export const getRouteSchema: FunctionSchema = {
    name: "getRouteToPeddler",
    description: "Calculate a route from user's location to a selected peddler",
    parameters: {
        type: "object",
        properties: {
            peddlerId: {
                type: "string",
                description: "ID of the peddler to route to",
            },
            transportMode: {
                type: "string",
                enum: ["walking", "driving", "bicycling"],
                description: "Mode of transportation",
            },
        },
        required: ["peddlerId"],
    },
};

// Schema for requesting user location access
export const requestLocationSchema: FunctionSchema = {
    name: "requestLocationAccess",
    description: "Request access to user's location to find nearby peddlers",
    parameters: {
        type: "object",
        properties: {
            reason: {
                type: "string",
                description: "Reason for requesting location access",
            },
        },
        required: [],
    },
};

// All available functions for the LLM
export const availableFunctions: FunctionSchema[] = [
    findPeddlersSchema,
    getRouteSchema,
    requestLocationSchema,
];

// Function type definitions for TypeScript
export type FindPeddlersParams = {
    foodType: string;
    maxDistance?: number;
    sortBy?: "distance" | "rating" | "last_active";
};

export type GetRouteParams = {
    peddlerId: string;
    transportMode?: "walking" | "driving" | "bicycling";
};

export type RequestLocationParams = {
    reason?: string;
};

// Function call type
export type FunctionCall = {
    name: string;
    arguments: string; // This will be a JSON string
};

// Helper types for chat messages
export type ChatFunctionCallResult = {
    name: string;
    content: string;
}; 