// Define types for function calling
import { FunctionSchema } from "@/lib/gemini";

// First definition of FunctionCallResult
export interface FunctionCallResult {
    name: string;
    args: Record<string, any>;
}

// Define function schemas

export const findVendorsFunction = {
    name: "find_vendors",
    description: "Searches for nearby food vendors matching the user's query",
    parameters: {
        type: "object",
        properties: {
            vendorType: {
                type: "string",
                description: "Type of vendor/food to search for (e.g., 'bakso', 'siomay', 'batagor')",
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
    description: "Calculate a route to the selected vendor",
    parameters: {
        type: "object",
        properties: {
            vendorId: {
                type: "string",
                description: "ID of the vendor to navigate to",
            },
            transportMode: {
                type: "string",
                enum: ["WALKING", "DRIVING", "BICYCLING", "TRANSIT"],
                description: "Mode of transportation (default: WALKING)",
            },
        },
        required: ["vendorId"],
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
    findVendorsFunction,
    getRouteFunction,
    getLocationFunction
];

// Handler for executing function calls
export async function executeFunctionCall(
    functionCall: FunctionCallResult,
    userLocation: { lat: number; lng: number } | null,
    foundVendors: any[],
    onVendorResults?: (vendors: any[]) => void,
    onRouteResult?: (routeDetails: any) => void,
    onLocationResult?: () => void
): Promise<string> {
    const { name, args } = functionCall;

    switch (name) {
        case "find_vendors":
            try {
                // Default values
                const vendorType = args.vendorType || "";
                const keywords = args.keywords || [];
                const maxDistance = args.maxDistance || 5000;

                if (!userLocation) {
                    return "I need your location to find vendors nearby. Please enable location access.";
                }

                // Prepare the request body for the API
                const requestBody = {
                    message: `${vendorType} ${keywords.join(" ")}`.trim(),
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

                // Update vendors in the parent component
                if (onVendorResults && data.response.vendors) {
                    onVendorResults(data.response.vendors);
                }

                // Return a response based on the results
                if (data.response.vendors && data.response.vendors.length > 0) {
                    return `I found ${data.response.vendors.length} ${vendorType || "food"} vendors near you. You can see them on the map.`;
                } else {
                    return `I couldn't find any ${vendorType || "food"} vendors near your location. Please try a different search or check back later.`;
                }
            } catch (error) {
                console.error("Error finding vendors:", error);
                return "Sorry, I had trouble finding vendors. Please try again later.";
            }

        case "get_route":
            try {
                const { vendorId, transportMode = "WALKING" } = args;

                if (!userLocation) {
                    return "I need your location to calculate a route. Please enable location access.";
                }

                if (!vendorId) {
                    return "Please select a vendor first to get directions.";
                }

                const selectedVendor = foundVendors.find((v) => v.id === vendorId);
                if (!selectedVendor) {
                    return "I couldn't find that vendor. Please select a vendor from the list.";
                }

                // Import and use the route-mapper functions
                const { calculateRoute } = await import("@/lib/route-mapper");

                const routeDetails = await calculateRoute(
                    userLocation,
                    selectedVendor.location,
                    transportMode
                );

                // Update route in the parent component
                if (onRouteResult) {
                    onRouteResult(routeDetails);
                }

                if (!routeDetails) {
                    return "I couldn't calculate a route to the vendor. Please try again later.";
                }

                return `Here's the route to ${selectedVendor.name}. It will take approximately ${routeDetails.duration.text} (${routeDetails.distance.text}).`;
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

// Schema for finding nearby vendors
export const findVendorsSchema: FunctionSchema = {
    name: "findNearbyVendors",
    description: "Search for nearby food vendors based on user preferences",
    parameters: {
        type: "object",
        properties: {
            foodType: {
                type: "string",
                description: "Type of food vendor to search for (e.g., bakso, siomay, batagor, es cendol)",
            },
            maxDistance: {
                type: "number",
                description: "Maximum distance in meters to search for vendors",
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

// Schema for getting routes to a vendor
export const getRouteSchema: FunctionSchema = {
    name: "getRouteToVendor",
    description: "Calculate a route from user's location to a selected vendor",
    parameters: {
        type: "object",
        properties: {
            vendorId: {
                type: "string",
                description: "ID of the vendor to route to",
            },
            transportMode: {
                type: "string",
                enum: ["walking", "driving", "bicycling"],
                description: "Mode of transportation",
            },
        },
        required: ["vendorId"],
    },
};

// Schema for requesting user location access
export const requestLocationSchema: FunctionSchema = {
    name: "requestLocationAccess",
    description: "Request access to user's location to find nearby vendors",
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
    findVendorsSchema,
    getRouteSchema,
    requestLocationSchema,
];

// Function type definitions for TypeScript
export type FindVendorsParams = {
    foodType: string;
    maxDistance?: number;
    sortBy?: "distance" | "rating" | "last_active";
};

export type GetRouteParams = {
    vendorId: string;
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