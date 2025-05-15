import type { Peddler } from "@/lib/peddlers";
import { findNearbyPeddlers as findNearbyPeddlersService } from '@/lib/peddlers'; // Assuming these are the actual service functions
import { calculateRoute as calculateRouteService } from '@/lib/route-mapper';
import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';

// IMPORTANT: Ensure your GOOGLE_GENERATIVE_AI_API_KEY is set in your environment
const gemini = google('gemini-2.0-flash'); // Consistent with lib/ai/gemini.ts

const KELILINK_SYSTEM_PROMPT = `You are KeliLink, a friendly and helpful assistant for finding Indonesian street food peddlers. Your goal is to provide concise and clear information to the user.

When you use a tool:
- When you decide to use a tool, first briefly acknowledge the user's request and state your action (e.g., "Alright, I'll search for those peddlers for you."). Then, after the tool executes, summarize the information it provides in a natural, conversational way.
- For route calculations using 'getRouteToPeddler':
    - If the user asks for directions to a specific peddler (e.g., 'How do I get to Bakso Pak Kumis?' or has a peddler selected), use the 'getRouteToPeddler' tool with the 'peddlerIdToRoute' parameter.
    - If the user asks for directions to a general place (e.g., "How to get to Pasar Santa?"), first use the 'getCoordinatesForPlace' tool to attempt a real coordinate lookup. If successful, then use 'getRouteToPeddler' with the 'destinationPlaceName' parameter.
    - Inform the user that you are calculating the route, then, upon successful calculation, state the approximate duration and distance.
- If 'getCoordinatesForPlace' is used and returns coordinates, you can then use these for subsequent actions. If it fails to find coordinates, inform the user clearly.
- If you need the user's location (e.g., for 'findNearbyPeddlers' or 'getRouteToPeddler' from current position) AND the userLocation context provided to you is missing or null, you MUST call the 'requestClientLocation' tool. Do not try to proceed with the original request in the same turn; wait for the user to provide their location.
- If the tool execution is successful but finds no results (e.g., no peddlers), clearly inform the user.
- When searching for peddlers with 'findNearbyPeddlers', use 'keywords' for specific names and 'foodType' for general types.
- If a user's query to find peddlers is too generic, ask for more details.

General Guidelines:
- Be concise and interactive.
- Integrate tool information smoothly into your response.`;

export const maxDuration = 30; // Allow streaming responses up to 30 seconds

// Define tool schemas for the AI
const findPeddlersTool = tool({
    description: "Searches for nearby food peddlers based on type and current user location.",
    parameters: z.object({
        foodType: z.string().describe("Type of food or peddler to search for (e.g., 'bakso', 'siomay')."),
        // userLat: z.number().describe("User's current latitude. This MUST be provided by the client through the chat context if available."),
        // userLng: z.number().describe("User's current longitude. This MUST be provided by the client through the chat context if available.")
        // For now, the API route will try to get location from a session or a default if not provided in chat.
        // The useChat hook can send additional `body` parameters.
    }),
    execute: async ({ foodType /*, userLat, userLng */ }) => {
        console.log(`Executing findPeddlersTool with foodType: ${foodType}`);
        // How to get userLocation here? The `useChat` hook can send additional data in its `body`.
        // We'll need to modify the client to send userLocation if available.
        // For now, let's assume a default or a mechanism to get it (e.g. from a session if this were a full app)
        // This is a placeholder for where you'd fetch/access the user's current location server-side or via client-sent data.
        // const userLocation = userLat && userLng ? { lat: userLat, lon: userLng } : null;

        // For this example, we call the existing /api/find endpoint for finding peddlers
        // This means our current /api/find needs to be robust or we replicate its core logic here.
        // Let's try to call /api/find. THIS IS A SERVER-SIDE CALL TO ITSELF, ensure it's allowed/works.
        // Ideally, the logic from /api/find (findNearbyPeddlersService) should be directly usable here.

        // To call another internal API route, we need the full URL or use a direct service function call.
        // It is better to call the service function directly.

        // const requestBody = {
        //   message: foodType, // Simplified message for /api/find
        //   location: userLocation || { lat: -6.2088, lng: 106.8456 }, // Default to Jakarta if no location
        //   limit: 5, // Fetch a few for the chat context
        // }; 
        // console.log("Calling /api/find with body:", requestBody);
        // const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/find`, { // Requires NEXT_PUBLIC_APP_URL
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify(requestBody),
        // });

        // if (!response.ok) {
        //   const errorBody = await response.text();
        //   console.error("Error calling /api/find:", response.status, errorBody);
        //   throw new Error(`Failed to find peddlers via internal API: ${response.statusText}`);
        // }
        // const data = await response.json();
        // console.log("Response from /api/find:", data);
        // return data.response; // Return the structure expected (peddlers, text, etc.)

        // Direct service call attempt:
        // We need userLocation passed into the chat body from the client.
        // This execute function receives parameters defined in `z.object`.
        // The client needs to send `userLocation` in `useChat({ body: { userLocation } })`.
        // Then here, we'd get it from the main request.json() before streamText.
        // This `execute` function gets only the Zod parameters. We need a different approach for broader context.

        // For now, let's return a mock result and focus on wiring.
        // We will adjust client to send userLocation and read it in POST handler.
        console.log("findPeddlersTool execute: foodType=", foodType);
        // This function will be refined to use userLocation from the request body.
        return { peddlersFound: [{ name: `Mock ${foodType} Stall`, distance: "100m" }], message: `Found some mock ${foodType} stalls.` };
    },
});

const getRouteTool = tool({
    description: "Calculates a walking route to a selected peddler.",
    parameters: z.object({
        peddlerId: z.string().describe("ID of the peddler to navigate to."),
        // userLat: z.number().describe("User's current latitude."),
        // userLng: z.number().describe("User's current longitude."),
        // selectedPeddlerLat: z.number().describe("Selected peddler's latitude."),
        // selectedPeddlerLng: z.number().describe("Selected peddler's longitude.")
        // Again, user location and peddler location need to be available here.
    }),
    execute: async ({ peddlerId /*, userLat, userLng, selectedPeddlerLat, selectedPeddlerLng */ }) => {
        // Placeholder for getting peddler details and user location.
        // These would ideally come from the chat context or be fetched.
        // const userLocation = { lat: userLat, lng: userLng };
        // const peddlerLocation = { lat: selectedPeddlerLat, lng: selectedPeddlerLng };
        // const route = await calculateRouteService(userLocation, peddlerLocation, "WALKING");
        // return { route, message: `Route calculated to peddler ${peddlerId}.` };
        console.log("getRouteTool execute: peddlerId=", peddlerId);
        return { routeInfo: { distance: "1km", duration: "10 mins" }, message: `Mock route calculated for ${peddlerId}.` };
    },
});

// The requestLocationAccess tool might be more of a client-side action trigger
// rather than a server-side execute, as it prompts user for browser permission.
// For AI SDK tools, they usually execute server-side logic and return data.
// Let's assume the AI will suggest the user to click the "Locate Me" button on the UI if location is needed.
// So, we might not define requestLocationAccess as a server-side tool for streamText.

export async function POST(req: Request) {
    // Correctly destructure assuming `userLocation` and other `body` fields are at the root of req.json()
    const { messages, userLocation, currentPeddlers, selectedPeddlerId } = await req.json();

    console.log('!!! API CHAT ROUTE - Received request. Messages count:', messages?.length);
    // console.log('!!! API CHAT ROUTE - Raw data object from req.json():', JSON.stringify(data, null, 2)); // No longer using a separate 'data' object for these

    // const userLocation = data?.userLocation; // No longer needed
    // const currentPeddlers = data?.currentPeddlers; // No longer needed
    // const selectedPeddlerId = data?.selectedPeddlerId; // No longer needed

    console.log('!!! API CHAT ROUTE - Parsed userLocation directly from req.json() (before tool definition):', JSON.stringify(userLocation, null, 2));
    console.log('!!! API CHAT ROUTE - Type of userLocation:', typeof userLocation);
    console.log('!!! API CHAT ROUTE - Parsed currentPeddlers directly from req.json():', JSON.stringify(currentPeddlers, null, 2));
    console.log('!!! API CHAT ROUTE - Parsed selectedPeddlerId directly from req.json():', JSON.stringify(selectedPeddlerId, null, 2));

    const toolsForAI = {
        findNearbyPeddlers: tool({
            description: "Searches for nearby food peddlers based on type, keywords, current user location, and/or administrative areas (city, kecamatan, kelurahan).",
            parameters: z.object({
                foodType: z.string().optional().describe("General type of food or peddler to search for (e.g., 'bakso', 'siomay'). Use this if the user mentions a category."),
                keywords: z.array(z.string()).optional().describe("Specific keywords from the user's query, such as a peddler's business name (e.g., ['Bakso Pak Kumis'], ['Soto Ayam Lamongan Cak Har']). Use this for specific names."),
                city: z.string().optional().describe("City name to search within (e.g., 'Depok')."),
                kecamatan: z.string().optional().describe("Kecamatan (sub-district) name to search within."),
                kelurahan: z.string().optional().describe("Kelurahan (village/urban ward) name to search within."),
            }),
            execute: async ({ foodType, keywords, city, kecamatan, kelurahan }) => {
                // userLocation is available in the outer scope of the POST handler
                console.log(
                    '!!! findNearbyPeddlers TOOL - INSIDE EXECUTE - UserLocation value:',
                    JSON.stringify(userLocation, null, 2)
                );
                console.log(
                    '!!! findNearbyPeddlers TOOL - INSIDE EXECUTE - foodType:', foodType
                );
                console.log(
                    '!!! findNearbyPeddlers TOOL - INSIDE EXECUTE - keywords:', keywords
                );
                console.log(
                    '!!! findNearbyPeddlers TOOL - INSIDE EXECUTE - Admin areas:',
                    JSON.stringify({ city, kecamatan, kelurahan }, null, 2)
                );

                if (!keywords && !foodType && !city && !kecamatan && !kelurahan) {
                    return { peddlersFound: [], message: "Please specify what you're looking for (e.g., food type, peddler name, or area)." };
                }

                if ((!city && !kecamatan && !kelurahan) && (!userLocation || !userLocation.lat || !userLocation.lng)) {
                    return { peddlersFound: [], message: "I need either your specific current location or an administrative area to find peddlers. If you want to use your current location, please enable it first." };
                }
                try {
                    const result = await findNearbyPeddlersService({
                        userLocation: userLocation && userLocation.lat && userLocation.lng ? { lat: userLocation.lat, lon: userLocation.lng } : undefined,
                        peddlerType: foodType,
                        keywords: keywords,
                        city: city,
                        kecamatan: kecamatan,
                        kelurahan: kelurahan,
                        limit: 5,
                    });
                    let message;
                    if (result.peddlers && result.peddlers.length > 0) {
                        message = `I found ${result.peddlers.length} peddler(s) that might match your search.`;
                        if (foodType) message = `I found ${result.peddlers.length} ${foodType} peddler(s).`;
                        if (keywords && keywords.length > 0) message = `I found ${result.peddlers.length} peddler(s) matching '${keywords.join(', ')}'.`;
                        if (foodType && keywords && keywords.length > 0) message = `I found ${result.peddlers.length} ${foodType} peddler(s) matching '${keywords.join(', ')}'.`;

                    } else {
                        message = "I couldn't find any peddlers matching your current search criteria.";
                    }
                    return {
                        peddlers: result.peddlers,
                        hasMore: result.hasMore,
                        message: message
                    };
                } catch (error: any) {
                    console.error("Error in findNearbyPeddlers tool (inside execute):", error);
                    return { peddlersFound: [], message: `Error finding peddlers: ${error.message}` };
                }
            },
        }),
        getRouteToPeddler: tool({
            description: "Calculates a walking route to a selected peddler or a named destination.",
            parameters: z.object({
                peddlerIdToRoute: z.string().optional().describe("ID of the peddler to navigate to. Use this if a specific peddler is selected or mentioned."),
                destinationPlaceName: z.string().optional().describe("Name of a general place or point of interest to navigate to (e.g., 'Monas', 'Pasar Santa'). Use this if no specific peddler ID is available but a place is mentioned, typically after getting its coordinates via 'getCoordinatesForPlace'."),
            }),
            execute: async ({ peddlerIdToRoute, destinationPlaceName }) => {
                console.log(
                    '!!! getRouteToPeddler TOOL - INSIDE EXECUTE - UserLocation value:',
                    JSON.stringify(userLocation, null, 2)
                );
                console.log('!!! getRouteToPeddler TOOL - Args:', { peddlerIdToRoute, destinationPlaceName });

                if (!userLocation || !userLocation.lat || !userLocation.lng) {
                    return { routeInfo: null, message: "I need your location to calculate a route. If you want to use your current location, please enable it first.", peddlerName: null };
                }

                let targetLocation: { lat: number; lng: number } | null = null;
                let targetName: string = "the destination";

                if (peddlerIdToRoute) {
                    if (!currentPeddlers || currentPeddlers.length === 0) {
                        return { routeInfo: null, message: "No peddlers available to route to. Please find peddlers first.", peddlerName: null };
                    }
                    const peddler = currentPeddlers.find((p: Peddler) => p.id === peddlerIdToRoute);
                    if (!peddler || !peddler.location || !peddler.location.lat || !peddler.location.lon) {
                        return { routeInfo: null, message: `Peddler with ID ${peddlerIdToRoute} not found or has no location.`, peddlerName: null };
                    }
                    targetLocation = { lat: peddler.location.lat, lng: peddler.location.lon };
                    targetName = peddler.name;
                } else if (destinationPlaceName) {
                    return {
                        routeInfo: null,
                        message: `To route to '${destinationPlaceName}', I need its specific coordinates. Please ask me to find its coordinates first using the 'getCoordinatesForPlace' tool.`,
                        peddlerName: null
                    };
                } else {
                    return { routeInfo: null, message: "Please specify a peddler ID or a destination place name (after getting its coordinates) to get a route.", peddlerName: null };
                }

                if (!targetLocation) {
                    return { routeInfo: null, message: "Could not determine the destination location.", peddlerName: null };
                }

                try {
                    const route = await calculateRouteService(
                        { lat: userLocation.lat, lng: userLocation.lng },
                        targetLocation,
                        "WALKING"
                    );
                    return { routeInfo: route, message: `Route to ${targetName} calculated.`, peddlerName: targetName };
                } catch (error: any) {
                    console.error("Error in getRouteToPeddler tool (inside execute):", error);
                    return { routeInfo: null, message: `Error calculating route: ${error.message}`, peddlerName: targetName };
                }
            },
        }),
        getCoordinatesForPlace: tool({
            description: "Gets the geographic coordinates (latitude and longitude) for a given place name, optionally within a city context. Useful for then calculating routes to general points of interest if a specific peddler ID is not known.",
            parameters: z.object({
                placeName: z.string().describe("The name of the place or point of interest (e.g., 'Monas', 'Pasar Santa', 'Blok M Plaza')."),
                cityContext: z.string().optional().describe("The city to search within, to improve accuracy (e.g., 'Jakarta', 'Bandung')."),
            }),
            execute: async ({ placeName, cityContext }) => {
                const apiKey = process.env.GOOGLE_MAPS_API_KEY;
                if (!apiKey) {
                    console.error("Google Maps API key is missing.");
                    return { placeName, coordinates: null, formattedAddress: null, message: "Sorry, I'm unable to look up coordinates at the moment due to a configuration issue." };
                }

                let addressToSearch = placeName;
                if (cityContext) {
                    addressToSearch += `, ${cityContext}`;
                }
                // Optional: Add ", Indonesia" to bias results, especially if cityContext is not always provided or is broad.
                // addressToSearch += ", Indonesia";


                const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressToSearch)}&key=${apiKey}`;

                try {
                    console.log(`Fetching geocoding for: ${addressToSearch}`);
                    const response = await fetch(geocodingUrl);
                    const data = await response.json();

                    if (data.status === "OK" && data.results && data.results.length > 0) {
                        const firstResult = data.results[0];
                        const location = firstResult.geometry.location; // {lat, lng}
                        const formattedAddress = firstResult.formatted_address;
                        return {
                            placeName,
                            coordinates: { lat: location.lat, lon: location.lng }, // Note: Google uses lng, we use lon internally for Peddler
                            formattedAddress,
                            message: `Found coordinates for ${placeName}: ${formattedAddress}.`
                        };
                    } else if (data.status === "ZERO_RESULTS") {
                        return {
                            placeName,
                            coordinates: null,
                            formattedAddress: null,
                            message: `Sorry, I could not find exact coordinates for '${placeName}'${cityContext ? ' in ' + cityContext : ''}. Please try a more specific name or check the spelling.`
                        };
                    } else {
                        console.error("Geocoding API error:", data.status, data.error_message);
                        return {
                            placeName,
                            coordinates: null,
                            formattedAddress: null,
                            message: `Sorry, an error occurred while trying to find coordinates for '${placeName}'. Status: ${data.status}`
                        };
                    }
                } catch (error) {
                    console.error("Error calling Geocoding API:", error);
                    return {
                        placeName,
                        coordinates: null,
                        formattedAddress: null,
                        message: "Sorry, I encountered an issue while trying to look up coordinates."
                    };
                }
            }
        }),
        requestClientLocation: tool({
            description: "Call this tool when the user's location is needed for a function (like finding nearby peddlers or calculating a route from their current position) BUT the userLocation context is missing or null. This tool will prompt the user on the client-side to share their location.",
            parameters: z.object({
                requestMessage: z.string().optional().describe("Optional message to explain why location is needed, though a default will be used if not provided."),
            }),
            execute: async ({ requestMessage }) => {
                // This tool's purpose is to signal the client. The actual location fetching happens client-side.
                // The returned object structure should be recognized by the client (FloatingChat.tsx)
                // to show a specific button or prompt.
                return {
                    status: "LOCATION_REQUIRED", // This status is key for FloatingChat.tsx
                    uiMessage: requestMessage || "Your location is needed to proceed. Please click the button below or use the main 'Locate Me' button on the page to share it.",
                    aiActionInstruction: "The user has been prompted to share their location via a client-side UI element. Wait for their next message which might include their location or a re-request of the original action."
                };
            }
        })
    };

    console.log('!!! API CHAT ROUTE - About to call streamText. userLocation at this point:', JSON.stringify(userLocation, null, 2));

    const result = await streamText({
        model: gemini,
        system: KELILINK_SYSTEM_PROMPT,
        messages: messages, // Assumes messages are already CoreMessages from useChat
        tools: toolsForAI,
        maxSteps: 5, // Added maxSteps
    });

    return result.toDataStreamResponse();
} 