"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  MapPin,
  LogOut,
  Loader2,
  BarChart3,
  Users,
  Clock,
  MapIcon,
  PlusCircle,
  Trash2,
  Star,
  TrendingUp,
  ChefHat,
  Route,
  Sparkles,
  MessageCircle,
  Navigation,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { getRouteAdvice } from "@/lib/ai/gemini";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { MobileHeader } from "@/components/ui/mobile-header";
import { MobileLayout } from "@/components/mobile-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Define types for peddler statistics
interface LocationStat {
  name: string;
  views: number;
}

interface DailyStats {
  views: number | null;
  hoursActive: number | null;
  averageRating: number | null;
  topArea: LocationStat | null;
  viewsChangePercent: number | null;
  hoursChange: number | null;
}

interface PeddlerStats {
  today: DailyStats;
  // Future: week: WeeklyStats;
  // Future: month: MonthlyStats;
}

interface SellingLocation {
  id: string;
  address: string;
}

// Mock peddler data
// const mockPeddler = {
//   id: "p1",
//   name: "Bakso Pak Budi",
//   type: "bakso",
//   description:
//     "Menyajikan bakso sapi asli dengan kuah kaldu yang kaya rasa. Tersedia bakso urat, bakso telur, dan bakso special dengan isian daging cincang. Dilengkapi dengan mie, bihun, dan pangsit goreng yang renyah.",
//   isActive: false,
//   location: null as { lat: number; lng: number } | null,
// };

// Updated initial peddler state
const initialPeddlerState = {
  id: "",
  name: "",
  type: "",
  description: "",
  profileImageUrl: "",
  isActive: false,
  location: null as { lat: number; lng: number } | null,
  stats: {
    today: {
      views: null,
      hoursActive: null,
      averageRating: null,
      topArea: null,
      viewsChangePercent: null,
      hoursChange: null,
    },
  } as PeddlerStats,
  sellingLocations: [] as SellingLocation[], // Initialize selling locations
};

export default function PeddlerDashboardPage() {
  const [peddler, setPeddler] = useState(initialPeddlerState);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [routeInput, setRouteInput] = useState("");
  const [routeAdvice, setRouteAdvice] = useState("");
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [locationWatchId, setLocationWatchId] = useState<number | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // State for "Today's Selling Locations"
  const [newLocationInput, setNewLocationInput] = useState("");
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [isFetchingLocations, setIsFetchingLocations] = useState(true); // Initial fetch is true

  // Ref for AI Route Advice section
  const routeAdviceSectionRef = useRef<HTMLDivElement | null>(null);

  // Fetch peddler profile when component mounts
  useEffect(() => {
    const fetchPeddlerProfile = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("peddlerToken");

        if (!token) {
          window.location.href = "/peddler/login";
          return;
        }

        const response = await fetch("/api/peddlers/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // if (response.status === 401) {
          //     localStorage.removeItem("peddlerToken");
          //     window.location.href = "/peddler/login";
          //     return;
          // }
          throw new Error("Failed to fetch peddler profile");
        }

        const data = await response.json();
        // console.log("API Response Data:", data);

        // Access data from the nested 'peddler' object
        const peddlerProfile = data.peddler;

        if (!peddlerProfile) {
          throw new Error("Peddler data not found in API response");
        }

        setPeddler({
          id: peddlerProfile.id,
          name: peddlerProfile.name || "",
          type: peddlerProfile.type || "",
          description: peddlerProfile.description,
          profileImageUrl: peddlerProfile.profileImageUrl || "",
          isActive: peddlerProfile.status === "active",
          location: peddlerProfile.location
            ? {
                lat: peddlerProfile.location.lat, // Assuming API sends lat/lon not latitude/longitude
                lng: peddlerProfile.location.lon,
              }
            : null,
          stats: {
            today: {
              // Assuming your API might send these directly under peddlerProfile or you might fetch them separately
              // For now, let's keep existing logic which assumes they might be part of 'data.daily_stats'
              // If daily_stats are also nested under 'peddler', adjust accordingly e.g., peddlerProfile.daily_stats?.views_today
              views:
                data.daily_stats?.views_today ??
                peddlerProfile.daily_stats?.views_today ??
                null,
              hoursActive:
                data.daily_stats?.hours_active_today ??
                peddlerProfile.daily_stats?.hours_active_today ??
                null,
              averageRating:
                data.daily_stats?.average_rating_today ??
                peddlerProfile.daily_stats?.average_rating_today ??
                null,
              topArea:
                data.daily_stats?.top_area_today ||
                peddlerProfile.daily_stats?.top_area_today
                  ? {
                      name: (
                        data.daily_stats?.top_area_today ||
                        peddlerProfile.daily_stats?.top_area_today
                      ).name,
                      views: (
                        data.daily_stats?.top_area_today ||
                        peddlerProfile.daily_stats?.top_area_today
                      ).views,
                    }
                  : null,
              viewsChangePercent:
                data.daily_stats?.views_change_percent_today ??
                peddlerProfile.daily_stats?.views_change_percent_today ??
                null,
              hoursChange:
                data.daily_stats?.hours_change_today ??
                peddlerProfile.daily_stats?.hours_change_today ??
                null,
            },
          },
          sellingLocations:
            peddlerProfile.selling_locations || data.selling_locations || [],
        });

        setIsActive(peddlerProfile.status === "active");
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error fetching peddler profile:", error);
        // You might want to show an error message to the user
        setPeddler((prev) => ({
          ...prev,
          stats: initialPeddlerState.stats, // Reset stats on error
          sellingLocations: [],
          profileImageUrl: "", // Reset profile image URL on error
        }));
      } finally {
        setIsLoading(false);
        setIsFetchingLocations(false); // Done fetching initial locations (or attempting to)
      }
    };

    fetchPeddlerProfile();
  }, []);

  const toggleActive = async () => {
    setIsUpdatingStatus(true);
    try {
      // If trying to go active but no location, get location first
      if (!isActive && !peddler.location) {
        const locationSuccess = await updateLocation();
        if (!locationSuccess) {
          setIsUpdatingStatus(false);
          return;
        }
      }

      // Get current location if switching to active
      const newLocation = !isActive ? peddler.location : peddler.location;

      if (!newLocation) {
        alert(
          "Location is required to go active. Please update your location."
        );
        setIsUpdatingStatus(false);
        return;
      }

      // Call the API to update status
      const token = localStorage.getItem("peddlerToken");
      if (!token) {
        alert("You need to log in again.");
        window.location.href = "/peddler/login";
        return;
      }

      const response = await fetch("/api/peddlers/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          location: {
            lat: newLocation.lat,
            lon: newLocation.lng,
          },
          is_active: !isActive,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Update local state
      setPeddler((prev) => ({ ...prev, isActive: !prev.isActive }));
      setIsActive(!isActive);

      // If we're activating, automatically start location sharing
      if (!isActive) {
        // Start location sharing if not already sharing
        if (!isSharing) {
          toggleLocationSharing();
        }
      } else {
        // If deactivating, stop location sharing
        if (isSharing) {
          toggleLocationSharing();
        }
      }
    } catch (error) {
      console.error("Error updating active status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const updateLocation = async () => {
    setIsGettingLocation(true);

    try {
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          }
        );

        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        // Update location in the backend
        const token = localStorage.getItem("peddlerToken");
        if (!token) {
          alert("You need to log in again.");
          window.location.href = "/peddler/login";
          return false;
        }

        const response = await fetch("/api/peddlers/location", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            location: {
              lat: newLocation.lat,
              lon: newLocation.lng,
            },
            is_active: peddler.isActive,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update location");
        }

        // Update local state
        setPeddler((prev) => ({ ...prev, location: newLocation }));
        return true;
      } else {
        alert("Geolocation is not supported by this browser.");
        return false;
      }
    } catch (error) {
      console.error("Error getting location:", error);
      alert(
        "Failed to get your location. Please check your browser permissions."
      );
      return false;
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleGetRouteAdvice = async () => {
    if (!routeInput.trim()) {
      alert("Please enter your planned areas");
      return;
    }

    setIsLoadingAdvice(true);

    try {
      const advice = await getRouteAdvice(peddler.type, routeInput);
      setRouteAdvice(advice);
    } catch (error) {
      console.error("Error getting route advice:", error);
      alert("Failed to get route advice. Please try again.");
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("peddlerToken");
    // Clear other relevant state if necessary
    setPeddler(initialPeddlerState);
    window.location.href = "/peddler/login";
  };

  // Toggle location sharing
  const toggleLocationSharing = () => {
    if (isSharing) {
      // Stop watching location
      if (locationWatchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(locationWatchId);
        setLocationWatchId(null);
      }
      setIsSharing(false);
    } else {
      // Start watching location
      if (navigator.geolocation) {
        const watchId = navigator.geolocation.watchPosition(
          async (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            // Update local state
            setPeddler((prev) => ({ ...prev, location: newLocation }));

            // Send updated location to the server
            try {
              const token = localStorage.getItem("peddlerToken");
              if (!token) {
                alert("You need to log in again.");
                window.location.href = "/peddler/login";
                return;
              }

              await fetch("/api/peddlers/location", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  location: {
                    lat: newLocation.lat,
                    lon: newLocation.lng,
                  },
                  is_active: peddler.isActive,
                }),
              });

              console.log("Location updated:", newLocation);
            } catch (error) {
              console.error("Error updating location on server:", error);
            }
          },
          (error) => {
            console.error("Error getting location:", error);
            setIsSharing(false);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 30000,
            timeout: 27000,
          }
        );
        setLocationWatchId(watchId);
        setIsSharing(true);
      } else {
        alert("Geolocation is not supported by this browser.");
      }
    }
  };

  // Clean up location watch when component unmounts
  useEffect(() => {
    return () => {
      if (locationWatchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(locationWatchId);
      }
    };
  }, [locationWatchId]);

  const handleAddLocation = async () => {
    if (!newLocationInput.trim()) {
      alert("Please enter a location address.");
      return;
    }
    setIsAddingLocation(true);
    try {
      const token = localStorage.getItem("peddlerToken");
      if (!token) {
        alert("You need to log in again.");
        window.location.href = "/peddler/login";
        return;
      }
      // Simulate API Call
      // const response = await fetch("/api/peddlers/selling-locations", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({ address: newLocationInput }),
      // });
      // if (!response.ok) throw new Error("Failed to add location");
      // const newLocation = await response.json(); // Assuming API returns the new location or updated list

      // Simulate receiving a new location object
      const newLocation: SellingLocation = {
        id: `loc-${Date.now()}`,
        address: newLocationInput.trim(),
      };

      setPeddler((prev) => ({
        ...prev,
        sellingLocations: [...prev.sellingLocations, newLocation],
      }));
      setNewLocationInput("");
    } catch (error) {
      console.error("Error adding selling location:", error);
      alert("Failed to add selling location. Please try again.");
    } finally {
      setIsAddingLocation(false);
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    // Optimistically update UI, or add a loading state per item
    const originalLocations = peddler.sellingLocations;
    setPeddler((prev) => ({
      ...prev,
      sellingLocations: prev.sellingLocations.filter(
        (loc) => loc.id !== locationId
      ),
    }));

    try {
      const token = localStorage.getItem("peddlerToken");
      if (!token) {
        alert("You need to log in again.");
        window.location.href = "/peddler/login";
        // Rollback optimistic update
        setPeddler((prev) => ({
          ...prev,
          sellingLocations: originalLocations,
        }));
        return;
      }
      // Simulate API Call
      // const response = await fetch(`/api/peddlers/selling-locations/${locationId}`, {
      //   method: "DELETE",
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //   },
      // });
      // if (!response.ok) throw new Error("Failed to delete location");

      // If API call is successful, state is already updated optimistically.
      // If API fails, we roll back (as done above for token failure, or in catch block).
      console.log(`Simulated deletion of location ${locationId}`);
    } catch (error) {
      console.error("Error deleting selling location:", error);
      alert("Failed to delete selling location. Please try again.");
      // Rollback optimistic update on error
      setPeddler((prev) => ({ ...prev, sellingLocations: originalLocations }));
    }
  };

  // Create the header component
  const HeaderComponent = (
    <MobileHeader
      title="Dashboard"
      centerContent={true}
      leftAction={
        <Link href="/">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md shadow-sm border border-gray-100"
          >
            <ArrowLeft className="h-4 w-4 text-gray-700" />
          </Button>
        </Link>
      }
      rightAction={
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="h-9 w-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md shadow-sm border border-gray-100"
        >
          <LogOut className="h-4 w-4 text-gray-700" />
        </Button>
      }
    />
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  // If still loading, show a loading state
  // The actual loading UI will be handled by app/peddler/dashboard/loading.tsx
  if (isLoading) {
    return null; // Return null here because loading.tsx will handle it
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated && !isLoading) {
    window.location.href = "/peddler/login";
    return null;
  }

  return (
    <MobileLayout header={HeaderComponent}>
      <motion.div
        className="flex flex-col pb-20 bg-gray-50/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Hero Banner */}
        <motion.div
          className="bg-gradient-to-br from-primary/90 via-primary to-primary-dark relative pt-6 pb-10 px-4 mb-6 overflow-hidden rounded-b-3xl shadow-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-8 right-4 w-32 h-32 rounded-full bg-white/10 blur-xl" />
            <div className="absolute bottom-4 left-8 w-24 h-24 rounded-full bg-white/5 blur-lg" />
            <div className="absolute top-20 left-12 w-16 h-16 rounded-full bg-white/8 blur-md" />
          </div>

          {/* Peddler Status Section */}
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-5">
              <Avatar className="h-16 w-16 border-2 border-white/30 shadow-md">
                {peddler.profileImageUrl ? (
                  <AvatarImage
                    src={peddler.profileImageUrl}
                    alt={peddler.name || "Peddler profile image"}
                  />
                ) : null}
                <AvatarFallback className="bg-white/20 text-white text-xl font-medium">
                  {peddler.name
                    ? peddler.name.slice(0, 2).toUpperCase()
                    : peddler.id
                    ? peddler.id.slice(0, 1).toUpperCase() +
                      (peddler.id.length > 1
                        ? peddler.id.slice(1, 2).toLowerCase()
                        : "D")
                    : "P"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">
                  {peddler.name || "Peddler Name"}
                </h2>
                <div className="flex items-center mt-1.5">
                  <Badge
                    variant={peddler.isActive ? "default" : "outline"}
                    className={cn(
                      "rounded-full py-0.5 px-3 text-xs font-medium mr-2.5",
                      peddler.isActive
                        ? "bg-emerald-500/20 text-emerald-100 border-emerald-400/30"
                        : "bg-white/10 text-white/80 border-white/20"
                    )}
                  >
                    {peddler.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <p className="text-sm text-white/80 capitalize">
                    {peddler.type || "Peddler Type"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-xl p-3 mb-5">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-white flex-shrink-0" />
                </div>
                <div className="ml-3">
                  <p className="text-xs text-white/70">Your Location</p>
                  <button
                    className="text-sm font-medium flex items-center gap-1 text-white text-left"
                    onClick={updateLocation}
                    disabled={isGettingLocation}
                    aria-label="Update your location"
                  >
                    {peddler.location
                      ? `${peddler.location.lat.toFixed(
                          4
                        )}, ${peddler.location.lng.toFixed(4)}`
                      : "Update location"}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <Switch
                checked={peddler.isActive}
                onCheckedChange={toggleActive}
                disabled={isGettingLocation || isUpdatingStatus}
                className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-white/20"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-white font-medium">Today's Stats</p>
                <Badge
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  <span className="text-xs">Live</span>
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center mb-1">
                    <Users className="h-3 w-3 text-white/70 mr-1" />
                    <span className="text-xs text-white/70">Views</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {isLoading ? "..." : peddler.stats.today.views ?? "N/A"}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center mb-1">
                    <Clock className="h-3 w-3 text-white/70 mr-1" />
                    <span className="text-xs text-white/70">Hours</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {isLoading
                      ? "..."
                      : peddler.stats.today.hoursActive ?? "N/A"}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center mb-1">
                    <Star className="h-3 w-3 text-white/70 mr-1" />
                    <span className="text-xs text-white/70">Rating</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {isLoading
                      ? "..."
                      : peddler.stats.today.averageRating ?? "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="px-4 mb-6"
          variants={itemVariants}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.2 }}
        >
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                routeAdviceSectionRef.current?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
              className="cursor-pointer" // Add cursor pointer for better UX
            >
              <Card className="border-0 shadow-md overflow-hidden h-full rounded-xl bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-4">
                  <div className="flex flex-col h-full">
                    <div className="h-12 w-12 rounded-full bg-blue-200/50 flex items-center justify-center mb-3">
                      <MessageCircle className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-medium text-sm mb-1 font-jakarta text-blue-900">
                      Route Advice
                    </h3>
                    <p className="text-xs text-blue-700/70">
                      Get AI suggestions for optimal routes
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={toggleLocationSharing}
              className={cn(
                "cursor-pointer",
                !peddler.isActive && "opacity-70 pointer-events-none"
              )}
            >
              <Card
                className={cn(
                  "border-0 shadow-md overflow-hidden h-full rounded-xl",
                  isSharing
                    ? "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200/30"
                    : "bg-gradient-to-br from-green-50 to-green-100 border-green-200/30"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col h-full">
                    <div
                      className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center mb-3 shadow-sm",
                        isSharing
                          ? "bg-emerald-200 animate-pulse"
                          : "bg-green-200/50"
                      )}
                    >
                      <Navigation
                        className={cn(
                          "h-6 w-6",
                          isSharing ? "text-emerald-700" : "text-green-600"
                        )}
                      />
                    </div>
                    <div className="flex justify-between items-center mb-1">
                      <h3
                        className={cn(
                          "font-medium text-sm",
                          isSharing ? "text-emerald-900" : "text-green-900"
                        )}
                      >
                        {isSharing ? "Live Tracking" : "Share Location"}
                      </h3>
                      {isSharing && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 rounded-full text-xs px-1.5">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                          Live
                        </Badge>
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-xs",
                        isSharing ? "text-emerald-700/80" : "text-green-700/70"
                      )}
                    >
                      {!peddler.isActive
                        ? "Activate your profile first"
                        : isSharing
                        ? "Real-time location tracking active"
                        : "Let customers find you easily"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Analytics Trending Card */}
        <motion.div
          className="px-5 mb-7"
          variants={itemVariants}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-md overflow-hidden rounded-xl bg-gradient-to-r from-amber-50 to-orange-100 border-amber-200/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-amber-100 flex-shrink-0 flex items-center justify-center shadow-sm">
                  <TrendingUp className="h-7 w-7 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-bold text-base text-gray-900">
                      Sales Trending Up
                    </h3>
                    <Sparkles className="h-4 w-4 text-amber-500" />
                  </div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">+33%</span> more views
                    compared to yesterday!
                  </p>
                  <div className="mt-2 pt-2 border-t border-amber-200/40">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                      <span className="text-xs text-amber-700">
                        Check analytics for more insights
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main content */}
        <motion.div
          className="px-5 space-y-7"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* AI Route Advice */}
          <motion.div variants={itemVariants} ref={routeAdviceSectionRef}>
            <Card className="overflow-hidden border-0 shadow-md rounded-xl">
              <CardHeader className="bg-white py-5 px-5 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center text-base">
                    <Route className="h-5 w-5 mr-2 text-primary" />
                    AI Route Advice
                  </CardTitle>
                  <Badge
                    className="bg-blue-50 text-blue-500 border-0 rounded-full py-1 px-2.5"
                    variant="outline"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Powered
                  </Badge>
                </div>
                <CardDescription className="mt-1">
                  Get AI-powered suggestions for potential customer hotspots
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6 px-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="route-input"
                    className="text-sm font-medium text-gray-700"
                  >
                    Enter your planned areas or stops
                  </Label>
                  <Textarea
                    id="route-input"
                    placeholder="e.g., Depok Baru, Stasiun Depok, UI, Margonda"
                    value={routeInput}
                    onChange={(e) => setRouteInput(e.target.value)}
                    rows={3}
                    className="resize-none bg-white border-gray-200 rounded-lg shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                {routeAdvice && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-5 p-5 bg-blue-50 rounded-lg border border-blue-100"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-blue-500" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium text-blue-700 mb-2 text-sm">
                          AI Suggestion:
                        </h3>
                        <p className="text-sm whitespace-pre-wrap text-blue-800">
                          {routeAdvice}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
              <CardFooter className="border-t border-gray-100 bg-white py-4 px-5">
                <Button
                  onClick={handleGetRouteAdvice}
                  disabled={isLoadingAdvice || !routeInput.trim()}
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                >
                  {isLoadingAdvice ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Getting advice...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Get Route Advice
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Activity Analytics */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-0 shadow-md rounded-xl">
              <CardHeader className="bg-white py-5 px-5 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center text-base">
                    <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                    Activity Analytics
                  </CardTitle>
                  <Badge
                    className="bg-primary/10 text-primary border-0 rounded-full py-1 px-2.5"
                    variant="outline"
                  >
                    Updated
                  </Badge>
                </div>
                <CardDescription className="mt-1">
                  Track your visibility and customer interactions
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 px-5">
                <Tabs defaultValue="today" className="w-full">
                  <TabsList className="mb-5 w-full grid grid-cols-3 rounded-lg bg-gray-100/70 p-1">
                    <TabsTrigger
                      value="today"
                      className="rounded-md data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                    >
                      Today
                    </TabsTrigger>
                    <TabsTrigger
                      value="week"
                      className="rounded-md data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                    >
                      This Week
                    </TabsTrigger>
                    <TabsTrigger
                      value="month"
                      className="rounded-md data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                    >
                      This Month
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="today" className="space-y-5 mt-0">
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="shadow-sm border-gray-100 rounded-xl overflow-hidden">
                        <CardHeader className="pb-2 pt-4 px-4">
                          <CardTitle className="text-xs font-medium text-gray-500 flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            Views
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4 px-4">
                          <div className="text-2xl font-bold">
                            {isLoading
                              ? "..."
                              : peddler.stats.today.views ?? "N/A"}
                          </div>
                          {peddler.stats.today.viewsChangePercent !== null &&
                            !isLoading && (
                              <p
                                className={cn(
                                  "text-xs flex items-center mt-1",
                                  peddler.stats.today.viewsChangePercent >= 0
                                    ? "text-emerald-500"
                                    : "text-red-500"
                                )}
                              >
                                {peddler.stats.today.viewsChangePercent >= 0 ? (
                                  <PlusCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <Trash2 className="h-3 w-3 mr-1" />
                                )}
                                {Math.abs(
                                  peddler.stats.today.viewsChangePercent
                                )}
                                % from yesterday
                              </p>
                            )}
                        </CardContent>
                      </Card>
                      <Card className="shadow-sm border-gray-100 rounded-xl overflow-hidden">
                        <CardHeader className="pb-2 pt-4 px-4">
                          <CardTitle className="text-xs font-medium text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Hours
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4 px-4">
                          <div className="text-2xl font-bold">
                            {isLoading
                              ? "..."
                              : peddler.stats.today.hoursActive ?? "N/A"}
                          </div>
                          {peddler.stats.today.hoursChange !== null &&
                            !isLoading && (
                              <p
                                className={cn(
                                  "text-xs flex items-center mt-1",
                                  peddler.stats.today.hoursChange >= 0
                                    ? "text-emerald-500"
                                    : "text-red-500"
                                )}
                              >
                                {peddler.stats.today.hoursChange >= 0 ? (
                                  <PlusCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <Trash2 className="h-3 w-3 mr-1" />
                                )}
                                {peddler.stats.today.hoursChange >= 0
                                  ? "+"
                                  : ""}
                                {peddler.stats.today.hoursChange} from yesterday
                              </p>
                            )}
                        </CardContent>
                      </Card>
                      <Card className="shadow-sm border-gray-100 rounded-xl overflow-hidden">
                        <CardHeader className="pb-2 pt-4 px-4">
                          <CardTitle className="text-xs font-medium text-gray-500 flex items-center">
                            <MapIcon className="h-3 w-3 mr-1" />
                            Top Area
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4 px-4">
                          <div className="text-md font-medium">
                            {isLoading
                              ? "..."
                              : peddler.stats.today.topArea?.name ?? "N/A"}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {isLoading
                              ? "..."
                              : `${
                                  peddler.stats.today.topArea?.views ?? "N/A"
                                } customer views`}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="h-[200px] w-full bg-gray-50 rounded-xl flex items-center justify-center p-4 border border-gray-100 shadow-sm">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col items-center text-center"
                      >
                        <BarChart3 className="h-10 w-10 text-gray-300 mb-2" />
                        <p className="text-gray-400 text-sm">
                          Activity chart will appear here
                        </p>
                      </motion.div>
                    </div>
                  </TabsContent>
                  <TabsContent value="week">
                    <div className="h-[300px] w-full bg-gray-50 rounded-xl flex items-center justify-center p-4 border border-gray-100 shadow-sm">
                      <p className="text-gray-400 text-sm">
                        Weekly analytics will appear here
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="month">
                    <div className="h-[300px] w-full bg-gray-50 rounded-xl flex items-center justify-center p-4 border border-gray-100 shadow-sm">
                      <p className="text-gray-400 text-sm">
                        Monthly analytics will appear here
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>

          {/* Today's Selling Locations */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-0 shadow-md rounded-xl">
              <CardHeader className="bg-white py-5 px-5 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center text-base">
                    <MapPin className="h-5 w-5 mr-2 text-primary" />
                    Today's Selling Locations
                  </CardTitle>
                  <Badge
                    className="bg-emerald-50 text-emerald-500 border-0 rounded-full py-1 px-2.5"
                    variant="outline"
                  >
                    Public Info
                  </Badge>
                </div>
                <CardDescription className="mt-1">
                  Add and manage your planned selling spots
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6 px-5">
                <div className="flex gap-2">
                  <Input
                    placeholder="Example: Jl. Margonda Raya, Depok"
                    value={newLocationInput}
                    onChange={(e) => setNewLocationInput(e.target.value)}
                    className="bg-white border-gray-200 rounded-lg shadow-sm focus:border-primary focus:ring-1 focus:ring-primary h-10"
                    disabled={isAddingLocation}
                  />
                  <Button
                    variant="outline"
                    onClick={handleAddLocation}
                    disabled={isAddingLocation || !newLocationInput.trim()}
                    className="border-gray-200 hover:bg-gray-50 h-10 px-4"
                  >
                    {isAddingLocation ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <PlusCircle className="h-4 w-4 mr-2" />
                    )}
                    Add
                  </Button>
                </div>

                <div className="space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700">
                      Your Locations
                    </h3>
                    <Badge
                      variant="outline"
                      className="rounded-full bg-gray-50 text-gray-500 border-gray-200"
                    >
                      {peddler.sellingLocations.length} Locations
                    </Badge>
                  </div>
                  {isFetchingLocations && (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                  {!isFetchingLocations &&
                    peddler.sellingLocations.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <MapPin className="h-8 w-8 text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500 text-center">
                          No selling locations added yet.
                        </p>
                        <p className="text-xs text-gray-400 text-center mt-1">
                          Add your first location above
                        </p>
                      </div>
                    )}
                  {!isFetchingLocations &&
                    peddler.sellingLocations.map((loc) => (
                      <Card
                        key={loc.id}
                        className="shadow-sm border-gray-100 overflow-hidden rounded-lg"
                      >
                        <CardContent className="p-3.5 flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-9 w-9 rounded-full bg-emerald-50 flex items-center justify-center mr-3">
                              <MapPin className="h-4 w-4 text-emerald-500" />
                            </div>
                            <span className="text-sm text-gray-700">
                              {loc.address}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-500"
                            onClick={() => handleDeleteLocation(loc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Call-to-action */}
          <motion.div variants={itemVariants} className="pb-10">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 via-primary/10 to-primary/15 overflow-hidden rounded-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-5">
                  <div className="h-16 w-16 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center">
                    <ChefHat className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900">
                      Need Help?
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Our team can help you optimize your routes and increase
                      your sales
                    </p>
                    <Link href="#">
                      <Button
                        size="sm"
                        className="rounded-full px-5 py-2 bg-primary hover:bg-primary/90 text-white"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contact Support
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </motion.div>
    </MobileLayout>
  );
}
