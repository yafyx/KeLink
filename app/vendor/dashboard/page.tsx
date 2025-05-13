"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MapPin, LogOut, Loader2 } from "lucide-react";
import { getRouteAdvice } from "@/lib/gemini";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Navigation, RefreshCw, Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Mock vendor data
const mockVendor = {
  id: "v1",
  name: "Bakso Pak Budi",
  type: "bakso",
  description:
    "Menyajikan bakso sapi asli dengan kuah kaldu yang kaya rasa. Tersedia bakso urat, bakso telur, dan bakso special dengan isian daging cincang. Dilengkapi dengan mie, bihun, dan pangsit goreng yang renyah.",
  isActive: false,
  location: null as { lat: number; lng: number } | null,
};

export default function VendorDashboardPage() {
  const [vendor, setVendor] = useState(mockVendor);
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

  // Fetch vendor profile when component mounts
  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        setIsLoading(true);
        // Check for JWT token in localStorage
        const token = localStorage.getItem("vendor_token");

        if (!token) {
          // Redirect to login if no token found
          window.location.href = "/vendor/login";
          return;
        }

        // Fetch vendor profile from the API
        const response = await fetch("/api/vendors/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // Handle unauthorized or other errors
          if (response.status === 401) {
            localStorage.removeItem("vendor_token");
            window.location.href = "/vendor/login";
            return;
          }
          throw new Error("Failed to fetch vendor profile");
        }

        const data = await response.json();

        // Update vendor state with the fetched data
        setVendor({
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
        console.error("Error fetching vendor profile:", error);
        // You might want to show an error message to the user
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendorProfile();
  }, []);

  const toggleActive = async () => {
    setIsUpdatingStatus(true);
    try {
      // If trying to go active but no location, get location first
      if (!isActive && !vendor.location) {
        const locationSuccess = await updateLocation();
        if (!locationSuccess) {
          setIsUpdatingStatus(false);
          return;
        }
      }

      // Get current location if switching to active
      const newLocation = !isActive ? vendor.location : vendor.location;

      if (!newLocation) {
        alert(
          "Location is required to go active. Please update your location."
        );
        setIsUpdatingStatus(false);
        return;
      }

      // Call the API to update status
      const token = localStorage.getItem("vendor_token");
      if (!token) {
        alert("You need to log in again.");
        window.location.href = "/vendor/login";
        return;
      }

      const response = await fetch("/api/vendors/location", {
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
      setVendor((prev) => ({ ...prev, isActive: !prev.isActive }));
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
        const token = localStorage.getItem("vendor_token");
        if (!token) {
          alert("You need to log in again.");
          window.location.href = "/vendor/login";
          return false;
        }

        const response = await fetch("/api/vendors/location", {
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
            is_active: vendor.isActive,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update location");
        }

        // Update local state
        setVendor((prev) => ({ ...prev, location: newLocation }));
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
      const advice = await getRouteAdvice(vendor.type, routeInput);
      setRouteAdvice(advice);
    } catch (error) {
      console.error("Error getting route advice:", error);
      alert("Failed to get route advice. Please try again.");
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  const handleLogout = () => {
    // Clear the token from localStorage
    localStorage.removeItem("vendor_token");
    window.location.href = "/vendor/login";
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
            setVendor((prev) => ({ ...prev, location: newLocation }));

            // Send updated location to the server
            try {
              const token = localStorage.getItem("vendor_token");
              if (!token) {
                alert("You need to log in again.");
                window.location.href = "/vendor/login";
                return;
              }

              await fetch("/api/vendors/location", {
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
                  is_active: vendor.isActive,
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

  // If still loading, show a loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
          <h3 className="mt-4 text-lg font-medium">
            Loading vendor dashboard...
          </h3>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated && !isLoading) {
    window.location.href = "/vendor/login";
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <h1 className="font-semibold">Vendor Dashboard</h1>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Profile</CardTitle>
              <CardDescription>
                Manage your profile and visibility to customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Business Name</h3>
                <p>{vendor.name}</p>
              </div>

              <div>
                <h3 className="font-medium">Vendor Type</h3>
                <p className="capitalize">{vendor.type}</p>
              </div>

              <div>
                <h3 className="font-medium">Description</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {vendor.description}
                </p>
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="active-status" className="font-medium">
                    Active Status
                  </Label>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {vendor.isActive
                      ? "You are visible to customers"
                      : "You are not visible to customers"}
                  </span>
                </div>
                <Switch
                  id="active-status"
                  checked={vendor.isActive}
                  onCheckedChange={toggleActive}
                  disabled={isGettingLocation}
                />
              </div>

              <div>
                <h3 className="font-medium mb-2">Current Location</h3>
                {vendor.location ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p>Latitude: {vendor.location.lat.toFixed(6)}</p>
                    <p>Longitude: {vendor.location.lng.toFixed(6)}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No location shared yet
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={updateLocation}
                  disabled={isGettingLocation}
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Getting location...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      Update Location
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Route Advice</CardTitle>
              <CardDescription>
                Get AI-powered suggestions for potential customer hotspots
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="route-input">
                  Enter your planned areas or stops
                </Label>
                <Textarea
                  id="route-input"
                  placeholder="e.g., Depok Baru, Stasiun Depok, UI, Margonda"
                  value={routeInput}
                  onChange={(e) => setRouteInput(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleGetRouteAdvice}
                disabled={isLoadingAdvice || !routeInput.trim()}
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

              {routeAdvice && (
                <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <h3 className="font-medium mb-2">AI Suggestion:</h3>
                  <p className="text-sm whitespace-pre-wrap">{routeAdvice}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Activity Analytics</CardTitle>
            <CardDescription>
              Track your visibility and customer interactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="today">
              <TabsList className="mb-4">
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="week">This Week</TabsTrigger>
                <TabsTrigger value="month">This Month</TabsTrigger>
              </TabsList>
              <TabsContent value="today" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Customer Views
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">12</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        +33% from yesterday
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Active Hours
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">4.5</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        -0.5 from yesterday
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Popular Areas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-md font-medium">Depok Baru</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        8 customer views
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <div className="h-[200px] w-full bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Activity chart will appear here
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="week">
                <div className="h-[300px] w-full bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Weekly analytics will appear here
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="month">
                <div className="h-[300px] w-full bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Monthly analytics will appear here
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Location Sharing</CardTitle>
            <CardDescription>
              Share your location with customers to increase visibility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center space-y-4 py-6">
              <MapPin
                className={`w-12 h-12 ${
                  isSharing ? "text-green-500" : "text-gray-400"
                }`}
              />
              <div className="text-center">
                <h3 className="text-lg font-medium">
                  {isSharing
                    ? "Lokasi Sedang Dibagikan"
                    : "Lokasi Tidak Dibagikan"}
                </h3>
                {vendor.location && isSharing && (
                  <p className="text-sm text-muted-foreground">
                    Lat: {vendor.location.lat.toFixed(4)}, Lon:{" "}
                    {vendor.location.lng.toFixed(4)}
                  </p>
                )}
              </div>
              <Button
                onClick={toggleLocationSharing}
                variant={isSharing ? "destructive" : "default"}
              >
                {isSharing ? "Berhenti Bagikan Lokasi" : "Mulai Bagikan Lokasi"}
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Lokasi Berjualan Hari Ini</h3>
              <p className="text-sm text-muted-foreground">
                Tambahkan lokasi tempat Anda berencana berjualan hari ini.
              </p>
              <div className="flex gap-2">
                <Input placeholder="Contoh: Jl. Margonda Raya, Depok" />
                <Button variant="outline">Tambah</Button>
              </div>

              <div className="mt-4">
                <ul className="space-y-2">
                  <li className="flex items-center justify-between border p-2 rounded-md">
                    <span>Depan Kampus UI Depok</span>
                    <Button variant="ghost" size="icon">
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </li>
                  <li className="flex items-center justify-between border p-2 rounded-md">
                    <span>Jl. Margonda Raya (depan ITC)</span>
                    <Button variant="ghost" size="icon">
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
