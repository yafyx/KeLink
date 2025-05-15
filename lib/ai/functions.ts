// Define types for function calling
import { FunctionSchema } from "@/lib/ai/gemini";
import { tool } from 'ai';
import { z } from 'zod';

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

// Create AI SDK tools from our function schemas
export function createPeddlerTools() {
    return {
        findNearbyPeddlers: tool({
            description: findPeddlersSchema.description,
            parameters: z.object({
                foodType: z.string().describe("Type of food peddler to search for"),
                maxDistance: z.number().optional().describe("Maximum distance in meters"),
                sortBy: z.enum(["distance", "rating", "last_active"]).optional()
                    .describe("How to sort the results"),
            }),
        }),

        getRouteToPeddler: tool({
            description: getRouteSchema.description,
            parameters: z.object({
                peddlerId: z.string().describe("ID of the peddler to route to"),
                transportMode: z.enum(["walking", "driving", "bicycling"]).optional()
                    .describe("Mode of transportation"),
            }),
        }),

        requestLocationAccess: tool({
            description: requestLocationSchema.description,
            parameters: z.object({
                reason: z.string().optional().describe("Reason for requesting location access"),
            }),
        }),
    };
}

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
        case "findNearbyPeddlers":
        case "find_peddlers": // Support legacy name
            return await handleFindPeddlers(args, userLocation, onVendorResults);

        case "getRouteToPeddler":
        case "get_route": // Support legacy name
            return await handleGetRoute(args, userLocation, foundVendors, onRouteResult);

        case "requestLocationAccess":
        case "get_location": // Support legacy name
            return await handleRequestLocation(args, userLocation);

        default:
            return `Function ${name} is not supported.`;
    }
}

// Handler for finding peddlers
async function handleFindPeddlers(
    args: any,
    userLocation: { lat: number; lng: number } | null,
    onVendorResults?: (peddlers: any[]) => void
): Promise<string> {
    try {
        const peddlerType = args.peddlerType || args.foodType || "";
        const keywords = args.keywords || [];
        const maxDistance = args.maxDistance || 5000;

        if (!userLocation) {
            return JSON.stringify({
                status: "LOCATION_REQUIRED",
                uiMessage: "Your location is needed. Click 'Use My Location & Retry' below, or use the main 'Locate Me' button on the page.",
                aiActionInstruction: "The user\'s location is missing. Inform them it\'s required and that they can use the chat button or page button to provide it. If they indicate location is ready (e.g., via the button flow), then you can try find_peddlers again."
            });
        }

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
        return JSON.stringify({
            status: "ERROR_FINDING_PEDDLERS",
            uiMessage: "Sorry, I had trouble finding peddlers. Please try again later.",
            aiActionInstruction: "An error occurred while trying to find peddlers. Inform the user about the error and suggest trying again."
        });
    }
}

// Handler for getting route
async function handleGetRoute(
    args: any,
    userLocation: { lat: number; lng: number } | null,
    foundVendors: any[],
    onRouteResult?: (routeDetails: any) => void
): Promise<string> {
    try {
        const peddlerId = args.peddlerId;
        const transportMode = args.transportMode || "WALKING";

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
}

// Handler for requesting location
async function handleRequestLocation(
    args: any, // Added args parameter for consistency, though not used yet
    userLocation: { lat: number; lng: number } | null
): Promise<string> {
    try {
        let uiMsg = "Please enable location services in your browser or use the 'Locate Me' button on the page. ";
        uiMsg += "Once done, you can ask me to search again.";

        let aiInstruction = "You've asked the user to enable/share their location. ";
        aiInstruction += "Instruct them to do so using their browser or the page's 'Locate Me' feature. ";
        aiInstruction += "Then, advise them to repeat their original request (e.g., 'find bakso'). ";
        aiInstruction += "Do not attempt the location-dependent action in this turn; wait for their next message confirming location is ready or re-requesting the action.";

        if (userLocation) { // If server somehow knows location when this tool is called
            uiMsg = "It seems I can already access your location. You can try your search again if it failed previously.";
            aiInstruction = "It appears location is already available. You can inform the user and suggest they retry their original request if it failed due to location previously.";
            return JSON.stringify({
                status: "LOCATION_SEEMS_AVAILABLE_RETRY_PROMPT",
                uiMessage: uiMsg,
                aiActionInstruction: aiInstruction
            });
        }

        return JSON.stringify({
            status: "LOCATION_PERMISSION_GUIDANCE",
            uiMessage: uiMsg,
            aiActionInstruction: aiInstruction
        });
    } catch (error) {
        console.error("Error in handleRequestLocation:", error);
        return JSON.stringify({
            status: "ERROR_HANDLING_LOCATION_REQUEST",
            uiMessage: "Sorry, there was an issue with the location request process.",
            aiActionInstruction: "An error occurred while processing the location request. Inform the user."
        });
    }
} 