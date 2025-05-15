"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
import { useChat, type Message as AiSdkMessage } from "@ai-sdk/react";
import { FloatingChat } from "@/components/find/floating-chat";
import PeddlerCard from "@/components/find/peddler/peddler-card";

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
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: -6.2088,
    lng: 106.8456,
  });

  // Default Jakarta location if geolocation fails
  const defaultLocation = { lat: -6.2088, lng: 106.8456 };

  // Use the geolocation hook
  const {
    location: userLocationFromHook,
    loading: isLocating,
    error: locationError,
    permissionState,
    update: updateLocation,
    requestPermission,
  } = useGeolocation(defaultLocation);

  // Update userLocation state and mapCenter when location from hook changes
  useEffect(() => {
    if (userLocationFromHook) {
      setUserLocation(userLocationFromHook);
      setMapCenter(userLocationFromHook);
    }
  }, [userLocationFromHook]);

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
    append: originalAppend,
    reload,
    data,
    setMessages,
  } = useChat({
    api: "/api/chat",
    body: {
      userLocation: userLocation,
    },
  } as any); // Keep 'as any' for now due to persistent type issues with useChat options

  // Wrapper for the append function to satisfy FloatingChat's expected prop type
  const appendForFloatingChat = async (
    message: AiSdkMessage | Omit<AiSdkMessage, "id">,
    options?: any // Simplified options type to bypass ChatRequestOptions issues
  ): Promise<string | null> => {
    const result = await originalAppend(message, options);
    return result === undefined ? null : result;
  };

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
    }
  };

  const handleVendorClick = useCallback(
    (peddler: MapVendor) => {
      if (selectedVendorId !== peddler.id) {
        setShowRouteToVendor(false);
        setRouteDetails(null);
      }
      setSelectedVendorId(peddler.id);
    },
    [selectedVendorId]
  );

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
  const foundVendorsForMap: MapVendor[] = useMemo(() => {
    return foundVendors.map(toMapVendor);
  }, [foundVendors]);

  // Function to handle client-side location request
  const handleRequestClientLocation = (): Promise<{
    lat: number;
    lng: number;
  } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.error("Geolocation is not supported by this browser.");
        alert("Geolocation is not supported by this browser.");
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(newLocation);
          setMapCenter(newLocation);
          resolve(newLocation);
        },
        (geoError) => {
          console.error("Error getting client location:", geoError);
          alert(
            `Error getting location: ${geoError.message}. Please ensure location services are enabled.`
          );
          resolve(null);
        }
      );
    });
  };

  useEffect(() => {
    // Log initial userLocation state
    if (!userLocation) {
      // handleRequestClientLocation(); // Let's not auto-locate on mount for now to test manual flow
    }
  }, []); // Empty dependency array means this runs once on mount

  // Log when userLocation state changes
  useEffect(() => {}, [userLocation]);

  // Process messages to ensure natural chat flow:
  // 1. Filter out dedicated 'tool' role messages.
  // 2. For assistant messages, remove structured tool invocation data (toolInvocations property or tool-invocation parts)
  //    to rely on the AI's natural language content.
  const finalProcessedMessages = messages
    .filter((msg: AiSdkMessage) => {
      // Filter based on linter feedback for project's type definitions.
      return msg.role !== "data";
    })
    .map((msg: AiSdkMessage) => {
      if (msg.role === "assistant") {
        // Destructure to isolate properties we want to control
        const {
          toolInvocations,
          parts: originalParts,
          content: originalContent,
          ...restOfMsg
        } = msg;

        let currentContent = originalContent; // Base content
        let textOnlyParts: AiSdkMessage["parts"] | undefined = undefined; // Default to no parts override

        if (originalParts && originalParts.length > 0) {
          const filteredTextParts = originalParts.filter(
            (part) => part.type === "text"
          );

          if (filteredTextParts.length > 0) {
            textOnlyParts = filteredTextParts; // These are the parts we'll pass to the renderer

            // If original content was empty/null, and we have text parts,
            // populate currentContent from these text parts.
            if (currentContent == null || currentContent === "") {
              currentContent = filteredTextParts
                .map((p) => (p as { type: "text"; text: string }).text)
                .join("");
            }
          }
          // If originalParts contained only non-text parts, textOnlyParts will be empty (or undefined if initialised so),
          // and currentContent will remain originalContent.
        }

        // Ensure content is at least an empty string if it ended up null/undefined
        if (currentContent == null) {
          currentContent = "";
        }

        // Return the assistant message, stripped of toolInvocations,
        // with 'parts' containing only text parts (or undefined),
        // and 'content' being the original or text-parts-derived content.
        return { ...restOfMsg, content: currentContent, parts: textOnlyParts };
      }
      return msg;
    });

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
          messages={finalProcessedMessages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          append={appendForFloatingChat}
          isLoading={isChatLoading}
          chatError={chatError}
          onRequestClientLocation={handleRequestClientLocation}
          reloadChat={reload}
          setUserLocation={setUserLocation}
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

        {selectedVendorId && (
          <div className="absolute bottom-0 left-0 right-0 p-4 z-10 md:bottom-24">
            <PeddlerCard
              peddler={
                foundVendors.find((v) => v.id === selectedVendorId) as Peddler
              }
              onClose={() => setSelectedVendorId(null)}
              onGetDirections={() => {
                if (selectedVendorId) {
                  appendForFloatingChat({
                    role: "user",
                    content: `Get directions to ${
                      foundVendors.find((v) => v.id === selectedVendorId)?.name
                    } (ID: ${selectedVendorId})`,
                  });
                }
              }}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
