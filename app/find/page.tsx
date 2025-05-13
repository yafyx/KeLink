"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  MapPin,
  ArrowLeft,
  Compass,
  Search,
  AlertCircle,
  Navigation,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobileHeader } from "@/components/ui/mobile-header";
import { AppLayout } from "@/components/AppLayout";
import { GoogleMapComponent } from "@/components/google-map";
import { FloatingChat } from "@/components/find/floating-chat";
import { motion, AnimatePresence } from "framer-motion";
import { useGeolocation } from "@/hooks/use-geolocation";
import { PermissionRequest } from "@/components/find/permission-request";
import {
  RouteDetails,
  calculateEstimatedArrival,
  calculateRoute,
} from "@/lib/route-mapper";
import {
  useFunctionChat,
  Message as ChatMessage,
} from "@/hooks/use-function-chat";
import { availableFunctions } from "@/lib/function-calling/functions";

type Vendor = {
  id: string;
  name: string;
  type: string;
  description?: string;
  distance?: string;
  status: "active" | "inactive";
  last_active: string;
  location: {
    lat: number;
    lng: number;
  };
};

// Sample data for testing when API is unavailable
const SAMPLE_VENDORS: Vendor[] = [
  {
    id: "1",
    name: "Bakso Pak Joko",
    type: "bakso",
    description: "Bakso sapi asli dengan kuah gurih",
    distance: "200m",
    status: "active",
    last_active: "5 menit yang lalu",
    location: {
      lat: -6.2088,
      lng: 106.8456,
    },
  },
  {
    id: "2",
    name: "Siomay Bu Tini",
    type: "siomay",
    description: "Siomay ikan dengan bumbu kacang",
    distance: "350m",
    status: "active",
    last_active: "15 menit yang lalu",
    location: {
      lat: -6.2072,
      lng: 106.8464,
    },
  },
  {
    id: "3",
    name: "Batagor Mang Ujang",
    type: "batagor",
    description: "Batagor renyah dengan sambel pedas",
    distance: "500m",
    status: "inactive",
    last_active: "2 jam yang lalu",
    location: {
      lat: -6.209,
      lng: 106.842,
    },
  },
];

export default function FindPage() {
  // Initialize with a welcome message
  const initialMessages: ChatMessage[] = [
    {
      id: "1",
      role: "assistant",
      content:
        "Halo! Saya dapat membantu Anda mencari penjual keliling terdekat. Apa yang Anda cari hari ini?",
    },
  ];

  // State for the component
  const [foundVendors, setFoundVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPermissionRequest, setShowPermissionRequest] = useState(false);
  const [showRouteToVendor, setShowRouteToVendor] = useState(false);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isChatVisible, setIsChatVisible] = useState(true);

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

  // Handler for vendors found via function call
  const handleVendorsFound = (vendors: Vendor[]) => {
    // Process vendors if they have proper location data
    const processedVendors = vendors.map((vendor) => {
      // Create a deep copy to avoid mutating the original
      const vendorCopy = { ...vendor };

      // Ensure vendor has a valid location
      if (!vendorCopy.location || typeof vendorCopy.location !== "object") {
        vendorCopy.location = {
          lat: userLocation
            ? userLocation.lat + (Math.random() * 0.01 - 0.005)
            : -6.2088,
          lng: userLocation
            ? userLocation.lng + (Math.random() * 0.01 - 0.005)
            : 106.8456,
        };
      } else {
        // Convert from API format (lon) to frontend format (lng) if needed
        vendorCopy.location = {
          lat:
            typeof vendorCopy.location.lat === "number"
              ? vendorCopy.location.lat
              : userLocation?.lat || -6.2088,
          lng:
            typeof vendorCopy.location.lng === "number"
              ? vendorCopy.location.lng
              : typeof (vendorCopy.location as any).lon === "number"
              ? (vendorCopy.location as any).lon
              : userLocation?.lng || 106.8456,
        };
      }

      return vendorCopy;
    });

    setFoundVendors(processedVendors);
  };

  // Handler for route details found via function call
  const handleRouteFound = (route: RouteDetails) => {
    setRouteDetails(route);
    setShowRouteToVendor(true);
    setIsLoadingRoute(false);
  };

  // Handler for location request via function call
  const handleLocationRequest = async () => {
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

  // Use the function chat hook
  const { messages, isProcessing, processingFunctionCall, sendMessage } =
    useFunctionChat(initialMessages, {
      userLocation,
      foundVendors,
      onVendorResults: handleVendorsFound,
      onRouteResult: handleRouteFound,
      onLocationRequest: handleLocationRequest,
      functionSchemas: availableFunctions,
    });

  // Added: Handler for FloatingChat's expansion toggle
  const handleToggleChatExpansion = () => {
    setIsExpanded((prev) => !prev);
  };

  // Auto-expand chat when vendors are found
  useEffect(() => {
    if (foundVendors.length > 0 && isChatVisible) {
      setIsExpanded(true);
    }
  }, [foundVendors, isChatVisible, setIsExpanded]);

  // Auto-expand chat when a vendor is selected (if chat is visible)
  useEffect(() => {
    if (selectedVendorId && isChatVisible) {
      setIsExpanded(true);
    }
  }, [selectedVendorId, isChatVisible, setIsExpanded]);

  // Auto-expand chat when route is shown (if chat is visible)
  useEffect(() => {
    if (
      showRouteToVendor &&
      routeDetails &&
      selectedVendorId &&
      isChatVisible
    ) {
      setIsExpanded(true);
    }
  }, [
    showRouteToVendor,
    routeDetails,
    selectedVendorId,
    isChatVisible,
    setIsExpanded,
  ]);

  // Check if we should show the permission request dialog
  useEffect(() => {
    // Show the permission request dialog when:
    // 1. The app is loaded for the first time and permission state is prompt
    // 2. The user has denied permission
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      sendMessage(
        "Saya tidak bisa mengakses lokasi Anda. Tolong beri izin lokasi."
      );
    }
  };

  const handleVendorClick = (vendor: Vendor) => {
    // If selecting a different vendor, clear the route
    if (selectedVendorId !== vendor.id) {
      setShowRouteToVendor(false);
      setRouteDetails(null);
    }

    setSelectedVendorId(vendor.id);
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

    // If enabling route and we have both user location and selected vendor
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
            selectedVendor.location,
            "WALKING"
          );

          setRouteDetails(route);
          setIsLoadingRoute(false);

          // Add a message about the route via the chat system
          if (route) {
            sendMessage(`Tunjukkan rute ke ${selectedVendor.name}`);
          }
        } catch (error) {
          console.error("Error calculating route:", error);
          setIsLoadingRoute(false);
          sendMessage(
            "Gagal menghitung rute ke vendor yang dipilih. Coba lagi nanti."
          );
        }
      }
    } else {
      // If disabling route, clear the route details
      setRouteDetails(null);
    }
  };

  // Function to toggle chat visibility
  const toggleChatVisibility = () => {
    setIsChatVisible(!isChatVisible);
  };

  // When a new message arrives from assistant, ensure chat is visible
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage &&
      lastMessage.role === "assistant" &&
      !lastMessage.pending
    ) {
      setIsChatVisible(true);
    }
  }, [messages]);

  return (
    <AppLayout header={HeaderComponent}>
      <div className="flex flex-col h-full relative" ref={mapContainerRef}>
        {/* Map container with explicit height */}
        <div className="absolute inset-0 w-full h-full z-0">
          <GoogleMapComponent
            userLocation={userLocation}
            vendors={foundVendors}
            onVendorClick={handleVendorClick}
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
          >
            {isLocating ? (
              <Compass className="h-5 w-5 text-primary animate-spin" />
            ) : permissionState === "denied" ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : (
              <Compass className="h-5 w-5 text-primary" />
            )}
          </Button>
        </motion.div>

        {/* Route Toggle Button - Show only when a vendor is selected */}
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

        {/* Chat toggle button - always visible */}
        <motion.div
          className="absolute top-4 right-28 z-10"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Button
            variant={isChatVisible ? "default" : "outline"}
            size="icon"
            className={cn(
              "h-10 w-10 rounded-full backdrop-blur-sm shadow-md border-0",
              isChatVisible ? "bg-primary" : "bg-white/90"
            )}
            onClick={toggleChatVisibility}
          >
            <MessageSquare
              className={cn(
                "h-5 w-5",
                isChatVisible ? "text-white" : "text-primary"
              )}
            />
          </Button>
        </motion.div>

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

        {/* Floating chat positioned at the bottom - only render when visible */}
        <AnimatePresence>
          {isChatVisible && (
            <motion.div
              className="absolute bottom-6 left-0 right-0 px-4 z-10 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{
                delay: 0.3,
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            >
              <FloatingChat
                messages={messages}
                isLoading={isProcessing}
                onSendMessage={sendMessage}
                vendors={foundVendors}
                selectedVendorId={selectedVendorId || undefined}
                onVendorClick={handleVendorClick}
                isExpanded={isExpanded}
                onToggleExpanded={handleToggleChatExpansion}
                onMinimizeChat={toggleChatVisibility}
                className={cn(
                  "max-w-md mx-auto",
                  isExpanded ? "rounded-xl shadow-xl" : "shadow-lg"
                )}
                bubbleClassName="rounded-xl shadow-sm"
                routeDetails={routeDetails}
                showRoute={showRouteToVendor}
                onToggleRoute={toggleRouteDisplay}
              />
            </motion.div>
          )}
        </AnimatePresence>

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
