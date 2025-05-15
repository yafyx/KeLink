"use client";

import { useState, useEffect } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

const initialPeddlerState = {
  id: "",
  name: "",
  type: "",
  description: "",
  isActive: false,
  location: null as { lat: number; lng: number } | null,
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
          if (response.status === 401) {
            localStorage.removeItem("peddlerToken");
            window.location.href = "/peddler/login";
            return;
          }
          throw new Error("Failed to fetch peddler profile");
        }

        const data = await response.json();

        // Update peddler state with the fetched data
        setPeddler({
          id: data.id,
          name: data.name,
          type: data.type,
          description: data.description,
          isActive: data.status === "active",
          location: data.location
            ? {
                lat: data.location.lat,
                lng: data.location.lon,
              }
            : null,
        });

        setIsActive(data.status === "active");
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error fetching peddler profile:", error);
        // You might want to show an error message to the user
      } finally {
        setIsLoading(false);
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
            className="h-9 w-9 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      }
      rightAction={
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="h-9 w-9 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm"
        >
          <LogOut className="h-4 w-4" />
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
  if (isLoading) {
    return (
      <MobileLayout header={HeaderComponent}>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center bg-background/50 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-border/20"
          >
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            <h3 className="mt-4 text-lg font-medium">
              Loading peddler dashboard...
            </h3>
          </motion.div>
        </div>
      </MobileLayout>
    );
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
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-14 w-14 border-2 border-white/30">
                <AvatarFallback className="bg-white/20 text-white text-lg">
                  {peddler.name ? peddler.name.slice(0, 2).toUpperCase() : "PD"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">
                  {peddler.name || "Peddler"}
                </h2>
                <div className="flex items-center mt-1">
                  <Badge
                    variant={peddler.isActive ? "default" : "outline"}
                    className="bg-white/20 text-white border-white/30 mr-2"
                  >
                    {peddler.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <p className="text-sm text-white/80 capitalize">
                    {peddler.type || "Unknown"}
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
                className="data-[state=checked]:bg-white data-[state=checked]:text-primary"
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
                  <p className="text-xl font-bold text-white">12</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center mb-1">
                    <Clock className="h-3 w-3 text-white/70 mr-1" />
                    <span className="text-xs text-white/70">Hours</span>
                  </div>
                  <p className="text-xl font-bold text-white">4.5</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center mb-1">
                    <Star className="h-3 w-3 text-white/70 mr-1" />
                    <span className="text-xs text-white/70">Rating</span>
                  </div>
                  <p className="text-xl font-bold text-white">4.8</p>
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
            >
              <Card className="border-0 shadow-md overflow-hidden h-full rounded-xl bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-4">
                  <div className="flex flex-col h-full">
                    <div className="h-12 w-12 rounded-full bg-green-200/50 flex items-center justify-center mb-3">
                      <Navigation className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-medium text-sm mb-1 font-jakarta text-green-900">
                      {isSharing ? "Stop Sharing" : "Share Location"}
                    </h3>
                    <p className="text-xs text-green-700/70">
                      {isSharing
                        ? "Currently sharing your location"
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
          className="px-4 mb-6"
          variants={itemVariants}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-md bg-gradient-to-r from-amber-50 to-amber-100 overflow-hidden rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-amber-200 flex-shrink-0 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-base font-jakarta text-gray-900">
                      Sales Trending Up
                    </h3>
                    <Sparkles className="h-4 w-4 text-amber-500" />
                  </div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">+33%</span> more views
                    compared to yesterday!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main content */}
        <motion.div
          className="px-4 space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* AI Route Advice */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-border/40 shadow-md">
              <CardHeader className="bg-card/50 backdrop-blur-sm">
                <CardTitle className="flex items-center">
                  <Route className="h-5 w-5 mr-2 text-primary" />
                  AI Route Advice
                </CardTitle>
                <CardDescription>
                  Get AI-powered suggestions for potential customer hotspots
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="route-input" className="text-sm">
                    Enter your planned areas or stops
                  </Label>
                  <Textarea
                    id="route-input"
                    placeholder="e.g., Depok Baru, Stasiun Depok, UI, Margonda"
                    value={routeInput}
                    onChange={(e) => setRouteInput(e.target.value)}
                    rows={3}
                    className="resize-none bg-background"
                  />
                </div>

                {routeAdvice && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 p-4 bg-muted/50 backdrop-blur-sm rounded-lg border border-border/40"
                  >
                    <h3 className="font-medium mb-2 text-sm">AI Suggestion:</h3>
                    <p className="text-sm whitespace-pre-wrap">{routeAdvice}</p>
                  </motion.div>
                )}
              </CardContent>
              <CardFooter className="border-t bg-card/50 backdrop-blur-sm">
                <Button
                  onClick={handleGetRouteAdvice}
                  disabled={isLoadingAdvice || !routeInput.trim()}
                  className="w-full"
                >
                  {isLoadingAdvice ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Getting advice...
                    </>
                  ) : (
                    "Get Route Advice"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Activity Analytics */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-border/40 shadow-md">
              <CardHeader className="bg-card/50 backdrop-blur-sm">
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                  Activity Analytics
                </CardTitle>
                <CardDescription>
                  Track your visibility and customer interactions
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Tabs defaultValue="today">
                  <TabsList className="mb-4 w-full grid grid-cols-3">
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="week">This Week</TabsTrigger>
                    <TabsTrigger value="month">This Month</TabsTrigger>
                  </TabsList>
                  <TabsContent value="today" className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="shadow-sm border-border/40">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            Views
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="text-2xl font-bold">12</div>
                          <p className="text-xs text-emerald-500 flex items-center">
                            <PlusCircle className="h-3 w-3 mr-1" />
                            33% from yesterday
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="shadow-sm border-border/40">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Hours
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="text-2xl font-bold">4.5</div>
                          <p className="text-xs text-red-500 flex items-center">
                            <Trash2 className="h-3 w-3 mr-1" />
                            -0.5 from yesterday
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="shadow-sm border-border/40">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center">
                            <MapIcon className="h-3 w-3 mr-1" />
                            Top Area
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="text-md font-medium">Depok</div>
                          <p className="text-xs text-muted-foreground">
                            8 customer views
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="h-[200px] w-full bg-muted/30 rounded-lg flex items-center justify-center p-4 border border-border/40 shadow-sm">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col items-center text-center"
                      >
                        <BarChart3 className="h-10 w-10 text-muted-foreground mb-2 opacity-40" />
                        <p className="text-muted-foreground text-sm">
                          Activity chart will appear here
                        </p>
                      </motion.div>
                    </div>
                  </TabsContent>
                  <TabsContent value="week">
                    <div className="h-[300px] w-full bg-muted/30 rounded-lg flex items-center justify-center p-4 border border-border/40 shadow-sm">
                      <p className="text-muted-foreground text-sm">
                        Weekly analytics will appear here
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="month">
                    <div className="h-[300px] w-full bg-muted/30 rounded-lg flex items-center justify-center p-4 border border-border/40 shadow-sm">
                      <p className="text-muted-foreground text-sm">
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
            <Card className="overflow-hidden border-border/40 shadow-md">
              <CardHeader className="bg-card/50 backdrop-blur-sm">
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-primary" />
                  Today's Selling Locations
                </CardTitle>
                <CardDescription>
                  Add and manage your planned selling spots
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="Example: Jl. Margonda Raya, Depok"
                    className="bg-background"
                  />
                  <Button variant="outline">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Your Locations</h3>
                    <Badge variant="outline">{2} Locations</Badge>
                  </div>
                  <Card className="shadow-sm border-border/40">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <span>Depan Kampus UI Depok</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm border-border/40">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <span>Jl. Margonda Raya (depan ITC)</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Call-to-action */}
          <motion.div variants={itemVariants} className="pb-10">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center">
                    <ChefHat className="h-9 w-9 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1 font-jakarta text-gray-900">
                      Need Help?
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Our team can help you optimize your routes and increase
                      your sales
                    </p>
                    <Link href="#">
                      <Button
                        size="sm"
                        className="rounded-full px-5 py-2 bg-primary hover:bg-primary/90"
                      >
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
