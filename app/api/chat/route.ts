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
- If the tool execution is successful and provides information (e.g., finds peddlers, calculates a route), ALWAYS summarize this information in a natural, conversational way. For example, instead of just outputting raw data, say something like: "I found a few bakso peddlers near you: Bakso Pak Kumis (200m) and Bakso Enak (500m)." or "Okay, the route to Bakso Pak Kumis is about a 5-minute walk."
- If the tool execution is successful but finds no results (e.g., no peddlers of a certain type are found), clearly inform the user. For example: "I searched for 'sate padang' peddlers, but it seems there aren\'t any active near you right now. Would you like to try a different food?"
- If you need the user\'s location to perform an action and you don\'t have it, politely ask them to use the location button on the page to share their location, and then retry their request. For example: "I need your location to find nearby peddlers. Could you please use the 'Locate Me' button and then ask again?"

General Guidelines:
- Be concise and to the point.
- When providing peddler information, list their name, type, and distance if available.
- If a user\'s request is unclear, ask for clarification.
- Do not output raw JSON or overly technical details from tools directly to the user. Integrate the information smoothly into your response.`;

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
            description: "Searches for nearby food peddlers based on type, current user location, and/or administrative areas (city, kecamatan, kelurahan).",
            parameters: z.object({
                foodType: z.string().describe("Type of food or peddler to search for (e.g., 'bakso', 'siomay')."),
                city: z.string().optional().describe("City name to search within (e.g., 'Depok')."),
                kecamatan: z.string().optional().describe("Kecamatan (sub-district) name to search within."),
                kelurahan: z.string().optional().describe("Kelurahan (village/urban ward) name to search within."),
            }),
            execute: async ({ foodType, city, kecamatan, kelurahan }) => {
                // userLocation is available in the outer scope of the POST handler
                console.log(
                    '!!! findNearbyPeddlers TOOL - INSIDE EXECUTE - UserLocation value:',
                    JSON.stringify(userLocation, null, 2)
                );
                console.log(
                    '!!! findNearbyPeddlers TOOL - INSIDE EXECUTE - Type of userLocation:',
                    typeof userLocation
                );
                console.log(
                    '!!! findNearbyPeddlers TOOL - INSIDE EXECUTE - Admin areas:',
                    JSON.stringify({ city, kecamatan, kelurahan }, null, 2)
                );

                if ((!city && !kecamatan && !kelurahan) && (!userLocation || !userLocation.lat || !userLocation.lng)) {
                    console.log('!!! findNearbyPeddlers TOOL - Location missing or invalid (inside execute), returning LOCATION_REQUIRED status.');
                    return { peddlersFound: [], message: "I need either your specific location (lat/lng) or an administrative area (city/kecamatan/kelurahan) to find peddlers. Please enable location services, use the locate me button, or specify an area." };
                }
                try {
                    const result = await findNearbyPeddlersService({
                        userLocation: userLocation && userLocation.lat && userLocation.lng ? { lat: userLocation.lat, lon: userLocation.lng } : undefined,
                        peddlerType: foodType,
                        city: city,
                        kecamatan: kecamatan,
                        kelurahan: kelurahan,
                        limit: 5, // Keep limit for chat reasonable
                    });
                    return {
                        peddlers: result.peddlers,
                        hasMore: result.hasMore,
                        message: result.peddlers.length > 0 ? `Found ${result.peddlers.length} ${foodType} peddlers near you.` : `No ${foodType} peddlers found nearby.`
                    };
                } catch (error: any) {
                    console.error("Error in findNearbyPeddlers tool (inside execute):", error);
                    return { peddlersFound: [], message: `Error finding peddlers: ${error.message}` };
                }
            },
        }),
        getRouteToPeddler: tool({
            description: "Calculates a walking route to a selected peddler.",
            parameters: z.object({
                peddlerIdToRoute: z.string().describe("ID of the peddler to navigate to."),
            }),
            execute: async ({ peddlerIdToRoute }) => {
                console.log(
                    '!!! getRouteToPeddler TOOL - INSIDE EXECUTE - UserLocation value:',
                    JSON.stringify(userLocation, null, 2)
                );
                if (!userLocation || !userLocation.lat || !userLocation.lng) {
                    return { routeInfo: null, message: "I need your location to calculate a route." };
                }
                if (!currentPeddlers || currentPeddlers.length === 0) {
                    return { routeInfo: null, message: "No peddlers available to route to. Please find peddlers first." };
                }
                const peddler = currentPeddlers.find((p: Peddler) => p.id === peddlerIdToRoute);
                if (!peddler || !peddler.location || !peddler.location.lat || !peddler.location.lon) {
                    return { routeInfo: null, message: `Peddler with ID ${peddlerIdToRoute} not found or has no location.` };
                }

                try {
                    const route = await calculateRouteService(
                        { lat: userLocation.lat, lng: userLocation.lng },
                        { lat: peddler.location.lat, lng: peddler.location.lon }, // Service expects lng
                        "WALKING"
                    );
                    return { routeInfo: route, message: `Route to ${peddler.name} calculated.` };
                } catch (error: any) {
                    console.error("Error in getRouteToPeddler tool (inside execute):", error);
                    return { routeInfo: null, message: `Error calculating route: ${error.message}` };
                }
            },
        }),
        // We can add a simplified requestLocation tool if AI needs to explicitly ask for it,
        // though the client-side "Locate Me" button is the primary mechanism.
        // requestLocationAccess: tool({ ...})
    };

    console.log('!!! API CHAT ROUTE - About to call streamText. userLocation at this point:', JSON.stringify(userLocation, null, 2));

    const result = await streamText({
        model: gemini,
        system: KELILINK_SYSTEM_PROMPT,
        messages: messages, // Assumes messages are already CoreMessages from useChat
        tools: toolsForAI,
    });

    return result.toDataStreamResponse();
} 