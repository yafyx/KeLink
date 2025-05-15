"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Compass,
  AlertCircle,
  Navigation,
  LocateFixed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MobileHeader } from "@/components/ui/mobile-header";
import { AppLayout } from "@/components/app-layout";
import { GoogleMapComponent } from "@/components/google-map";
import { motion, AnimatePresence } from "framer-motion";
import { useGeolocation } from "@/hooks/use-geolocation";
import { PermissionRequest } from "@/components/find/permission-request";
import { RouteDetails, calculateRoute } from "@/lib/route-mapper";
import type { Peddler } from "@/lib/peddlers";
import { useChat } from "@ai-sdk/react";
import { FloatingChat } from "@/components/find/floating-chat";

// Sample data for testing when API is unavailable
// const SAMPLE_VENDORS: Peddler[] = [
//   {
//     id: "1",
//     name: "Bakso Pak Joko",
//     type: "bakso",
//     description: "Bakso sapi asli dengan kuah gurih",
//     distance: "200m",
//     status: "active",
//     last_active: "5 menit yang lalu",
//     location: {
//       lat: -6.2088,
//       lng: 106.8456,
//     },
//   },
//   {
//     id: "2",
//     name: "Siomay Bu Tini",
//     type: "siomay",
//     description: "Siomay ikan dengan bumbu kacang",
//     distance: "350m",
//     status: "active",
//     last_active: "15 menit yang lalu",
//     location: {
//       lat: -6.2072,
//       lng: 106.8464,
//     },
//   },
//   {
//     id: "3",
//     name: "Batagor Mang Ujang",
//     type: "batagor",
//     description: "Batagor renyah dengan sambel pedas",
//     distance: "500m",
//     status: "inactive",
//     last_active: "2 jam yang lalu",
//     location: {
//       lat: -6.209,
//       lng: 106.842,
//     },
//   },
// ];

// Add helper type and function

type MapVendor = Omit<Peddler, "location"> & {
  location: { lat: number; lng: number; lon: number };
};
const toMapVendor = (p: Peddler): MapVendor => ({
  ...p,
  location: { lat: p.location.lat, lng: p.location.lon, lon: p.location.lon },
});

export default function FindPage() {
  // State for the component
  const [foundVendors, setFoundVendors] = useState<Peddler[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [showPermissionRequest, setShowPermissionRequest] = useState(false);
  const [showRouteToVendor, setShowRouteToVendor] = useState(false);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Default Jakarta location if geolocation fails
  const defaultLocation = { lat: -6.2088, lng: 106.8456 };

  // Use the geolocation hook
  const {
    location: userLocation,
    loading: isLocating,
    error: locationError,
    permissionState,
    update: updateLocation,
    requestPermission,
  } = useGeolocation(defaultLocation);

  // Prepare data for useChat body
  const chatRequestBody = {
    userLocation: userLocation
      ? { lat: userLocation.lat, lng: userLocation.lng }
      : null,
    currentPeddlers: foundVendors, // Send the current list of found vendors
    selectedPeddlerId: selectedVendorId, // Send the currently selected vendor ID
  };

  // Initialize useChat hook with the body containing contextual data
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: isChatLoading,
    error: chatError,
    setMessages,
  } = useChat({
    body: chatRequestBody,
    // The API route is /api/chat by default, which we created.
    // We might need to handle tool results on the client to update state (e.g. setFoundVendors)
    onToolCall: ({ toolCall }) => {
      // This is a basic handler. The AI SDK might offer more structured ways.
      // We need to see what `toolCall` contains and how to best update client state.
      // Example: if toolCall.toolName === 'findNearbyPeddlers' and it returns peddlers,
      // we'd update `foundVendors` state here.
      console.log("Client received onToolCall:", toolCall);
      // For now, this is a placeholder. Tool results are handled by the `toolInvocation.state === 'result'` in message rendering.
      // Actual state updates based on tool *results* will likely happen by observing changes in `messages`
      // or by the AI sending a text message indicating success/failure of a tool that the user acts upon.
      // The AI SDK's `useChat` handles appending tool results to the messages array automatically.
      // Our main job client-side, if tools directly modify client-visible state (like foundVendors),
      // is to call our state setters when the tool result comes back via the messages.
    },
    // `onFinish` or observing `messages` could be places to parse tool results if needed for client state updates
    onFinish: (message) => {
      console.log("Chat finished:", message);
      // Check message for tool invocations with results that need to update client state
      if (message.toolInvocations) {
        for (const toolInvocation of message.toolInvocations) {
          if (
            toolInvocation.state === "result" &&
            toolInvocation.toolName === "findNearbyPeddlers"
          ) {
            const result = toolInvocation.result as any; // Cast for now
            if (result && result.peddlers && Array.isArray(result.peddlers)) {
              console.log(
                "Tool findNearbyPeddlers returned peddlers, updating state:",
                result.peddlers
              );
              setFoundVendors(
                result.peddlers.filter(
                  (v: any) =>
                    v.location &&
                    typeof v.location.lat === "number" &&
                    typeof v.location.lon === "number"
                ) as Peddler[]
              );
              // Potentially send a follow-up message or let AI summarize.
            }
          } else if (
            toolInvocation.state === "result" &&
            toolInvocation.toolName === "getRouteToPeddler"
          ) {
            const result = toolInvocation.result as any; // Cast for now
            if (result && result.routeInfo) {
              console.log(
                "Tool getRouteToPeddler returned routeInfo, updating state:",
                result.routeInfo
              );
              setRouteDetails(result.routeInfo as RouteDetails);
              setShowRouteToVendor(true); // Automatically show the route
              // If the AI doesn't confirm, maybe send a client message: "Route displayed."
            }
          }
        }
      }
    },
  });

  // Check if we should show the permission request dialog
  useEffect(() => {
    if (permissionState === "prompt" || permissionState === "denied") {
      setShowPermissionRequest(true);
    } else {
      setShowPermissionRequest(false);
    }
  }, [permissionState]);

  // Ensure map container takes full height
  useEffect(() => {
    if (mapContainerRef.current) {
      const updateHeight = () => {
        const windowHeight = window.innerHeight;
        const headerHeight = 64; // Approximate header height
        mapContainerRef.current!.style.height = `${
          windowHeight - headerHeight
        }px`;
      };

      updateHeight();
      window.addEventListener("resize", updateHeight);

      return () => {
        window.removeEventListener("resize", updateHeight);
      };
    }
  }, []);

  const handlePermissionRequest = async () => {
    const granted = await requestPermission();
    // If granted, automatically hide the permission request
    if (granted) {
      setShowPermissionRequest(false);
    }
  };

  const handleSkipPermission = () => {
    setShowPermissionRequest(false);
    // If user skips, add a helpful message
    if (permissionState === "denied") {
      console.log("User skipped permission with denied state.");
    }
  };

  const handleVendorClick = (peddler: MapVendor) => {
    if (selectedVendorId !== peddler.id) {
      setShowRouteToVendor(false);
      setRouteDetails(null);
    }
    setSelectedVendorId(peddler.id);
  };

  const HeaderComponent = (
    <MobileHeader
      title="Find"
      centerContent={true}
      leftAction={
        <Link href="/">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 flex items-center justify-center"
            aria-label="Go back to homepage"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      }
    />
  );

  // Get current location
  const handleLocateMe = async () => {
    // For users who denied permission, show permission request dialog
    if (permissionState === "denied") {
      setShowPermissionRequest(true);
      return;
    }

    // If permission is prompt or unknown, request permission
    if (permissionState === "prompt" || permissionState === "unknown") {
      await requestPermission();
    } else {
      // Just update location if permission already granted
      await updateLocation();
    }
  };

  // Function to toggle route display
  const toggleRouteDisplay = async () => {
    const newState = !showRouteToVendor;
    setShowRouteToVendor(newState);

    // If enabling route and we have both user location and selected peddler
    if (newState && selectedVendorId && userLocation) {
      setIsLoadingRoute(true);

      const selectedVendor = foundVendors.find(
        (v) => v.id === selectedVendorId
      );
      if (selectedVendor) {
        try {
          // Calculate the route
          const route = await calculateRoute(
            userLocation,
            {
              lat: selectedVendor.location!.lat,
              lng: selectedVendor.location!.lon,
            },
            "WALKING"
          );

          setRouteDetails(route);
          setIsLoadingRoute(false);

          // Placeholder for user feedback, old sendMessage is gone
          // if (route) { console.log(`Route calculated to ${selectedVendor.name}`); }
        } catch (error) {
          console.error("Error calculating route:", error);
          setIsLoadingRoute(false);
          // Placeholder for user feedback
          // console.log("Failed to calculate route");
        }
      }
    } else {
      // If disabling route, clear the route details
      setRouteDetails(null);
    }
  };

  // Add before render:
  const foundVendorsForMap: MapVendor[] = foundVendors.map(toMapVendor);

  return (
    <AppLayout header={HeaderComponent}>
      <div className="flex flex-col h-full relative" ref={mapContainerRef}>
        {/* Map container with explicit height */}
        <div className="absolute inset-0 w-full h-full z-0">
          <GoogleMapComponent
            userLocation={userLocation}
            peddlers={foundVendorsForMap}
            onVendorClick={handleVendorClick as any}
            selectedVendorId={selectedVendorId || undefined}
            showRoute={showRouteToVendor}
          />
        </div>

        {/* Location button - moved right if chat is hidden */}
        <motion.div
          className={cn("absolute top-4 z-10 right-4")}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md border-0",
              permissionState === "denied" && "bg-red-50"
            )}
            onClick={handleLocateMe}
            disabled={isLocating}
            aria-label={
              isLocating
                ? "Locating your position"
                : permissionState === "denied"
                ? "Location permission denied"
                : "Locate me"
            }
          >
            {isLocating ? (
              <Compass className="h-5 w-5 text-primary animate-spin" />
            ) : permissionState === "denied" ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : (
              <LocateFixed className="h-5 w-5 text-primary" />
            )}
          </Button>
        </motion.div>

        {/* Route Toggle Button - Show only when a peddler is selected */}
        {selectedVendorId && (
          <motion.div
            className={cn("absolute top-4 z-10 right-16")}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            <Button
              variant={showRouteToVendor ? "default" : "outline"}
              size="icon"
              className={cn(
                "h-10 w-10 rounded-full backdrop-blur-sm shadow-md border-0",
                showRouteToVendor ? "bg-primary" : "bg-white/90"
              )}
              onClick={toggleRouteDisplay}
              disabled={isLoadingRoute}
              aria-label={
                isLoadingRoute
                  ? "Calculating route"
                  : showRouteToVendor
                  ? "Hide route"
                  : "Show route to selected peddler"
              }
            >
              {isLoadingRoute ? (
                <span className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Navigation
                  className={cn(
                    "h-5 w-5",
                    showRouteToVendor ? "text-white" : "text-primary"
                  )}
                />
              )}
            </Button>
          </motion.div>
        )}

        {/* Permission request dialog */}
        <AnimatePresence>
          {showPermissionRequest && (
            <div className="absolute inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <PermissionRequest
                permissionState={permissionState}
                onRequestPermission={handlePermissionRequest}
                onSkip={handleSkipPermission}
                className="max-w-md w-full"
              />
            </div>
          )}
        </AnimatePresence>

        {/* Chat UI */}
        <FloatingChat
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isChatLoading}
          chatError={chatError}
        />

        {/* Status indicators */}
        <AnimatePresence>
          {isLocating && (
            <motion.div
              className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md flex items-center space-x-2 border border-gray-100"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-sm font-medium">
                Finding your location...
              </span>
            </motion.div>
          )}

          {isLoadingRoute && (
            <motion.div
              className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md flex items-center space-x-2 border border-gray-100"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-sm font-medium">
                Calculating best route...
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
