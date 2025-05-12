"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MapPin, ArrowLeft, Compass, Search } from "lucide-react";
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
import { FloatingChat } from "@/components/floating-chat";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  pending?: boolean;
};

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Halo! Saya dapat membantu Anda mencari penjual keliling terdekat. Apa yang Anda cari hari ini?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [foundVendors, setFoundVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Get user location when component mounts
  useEffect(() => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          console.log(
            "User location:",
            position.coords.latitude,
            position.coords.longitude
          );
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Use a default location for Jakarta if geolocation fails
          setUserLocation({
            lat: -6.2088,
            lng: 106.8456,
          });
          setIsLocating(false);
        }
      );
    } else {
      // Geolocation not supported
      setUserLocation({
        lat: -6.2088,
        lng: 106.8456,
      });
      setIsLocating(false);
    }
  }, []);

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

  const handleSubmit = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
    };

    const pendingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "...",
      pending: true,
    };

    setMessages((prev) => [...prev, userMessage, pendingMessage]);
    setIsLoading(true);
    setIsExpanded(true);

    try {
      // Call the find API endpoint
      const response = await fetch("/api/find", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          location: userLocation,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from find API");
      }

      const data = await response.json();

      // Update vendors if any were found
      if (data.response.vendors && data.response.vendors.length > 0) {
        // Ensure each vendor has a proper location structure
        const processedVendors = data.response.vendors.map((vendor: any) => {
          // Ensure vendor has a valid location
          if (!vendor.location || typeof vendor.location !== "object") {
            vendor.location = {
              lat: userLocation
                ? userLocation.lat + (Math.random() * 0.01 - 0.005)
                : -6.2088,
              lng: userLocation
                ? userLocation.lng + (Math.random() * 0.01 - 0.005)
                : 106.8456,
            };
          }

          // If location is missing lat/lng properties or they're not numbers
          if (
            typeof vendor.location.lat !== "number" ||
            typeof vendor.location.lng !== "number"
          ) {
            vendor.location.lat = userLocation
              ? userLocation.lat + (Math.random() * 0.01 - 0.005)
              : -6.2088;
            vendor.location.lng = userLocation
              ? userLocation.lng + (Math.random() * 0.01 - 0.005)
              : 106.8456;
          }

          return vendor;
        });

        setFoundVendors(processedVendors);
      } else {
        setFoundVendors([]);
      }

      setMessages((prev) => {
        const newMessages = [...prev];
        const pendingIndex = newMessages.findIndex((msg) => msg.pending);

        if (pendingIndex !== -1) {
          // Replace the pending message with the actual response
          newMessages[pendingIndex] = {
            id: Date.now().toString(),
            role: "assistant",
            content: data.response.text,
          };
        }

        return newMessages;
      });
    } catch (error) {
      console.error("Error sending message:", error);

      // For testing/development: Use sample data when API fails
      if (
        message.toLowerCase().includes("bakso") ||
        message.toLowerCase().includes("makanan") ||
        message.toLowerCase().includes("jual")
      ) {
        setFoundVendors(SAMPLE_VENDORS);

        setMessages((prev) => {
          const newMessages = [...prev];
          const pendingIndex = newMessages.findIndex((msg) => msg.pending);

          if (pendingIndex !== -1) {
            newMessages[pendingIndex] = {
              id: Date.now().toString(),
              role: "assistant",
              content: `Saya menemukan ${SAMPLE_VENDORS.length} penjual di sekitar Anda. Anda dapat melihat lokasi mereka pada peta.`,
            };
          }

          return newMessages;
        });
      } else {
        setMessages((prev) => {
          const newMessages = [...prev];
          const pendingIndex = newMessages.findIndex((msg) => msg.pending);

          if (pendingIndex !== -1) {
            newMessages[pendingIndex] = {
              id: Date.now().toString(),
              role: "assistant",
              content:
                "Maaf, terjadi kesalahan. Silakan coba lagi nanti. Coba tanyakan tentang 'bakso' atau 'makanan' untuk melihat contoh hasil.",
            };
          }

          return newMessages;
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVendorClick = (vendor: Vendor) => {
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
  const handleLocateMe = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsLocating(false);
        },
        (error) => {
          console.error("Error refreshing location:", error);
          setIsLocating(false);
        }
      );
    }
  };

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
          />
        </div>

        {/* Location button */}
        <motion.div
          className="absolute top-4 right-4 z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md border-0"
            onClick={handleLocateMe}
            disabled={isLocating}
          >
            <Compass
              className={cn(
                "h-5 w-5 text-primary",
                isLocating && "animate-spin"
              )}
            />
          </Button>
        </motion.div>

        {/* Floating chat positioned at the bottom */}
        <AnimatePresence>
          <motion.div
            className="absolute bottom-6 left-0 right-0 px-4 z-10 w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.3,
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          >
            <FloatingChat
              messages={messages}
              isLoading={isLoading}
              onSendMessage={handleSubmit}
              vendors={foundVendors}
              selectedVendorId={selectedVendorId || undefined}
              onVendorClick={handleVendorClick}
              className={cn(
                "max-w-md mx-auto",
                isExpanded ? "rounded-xl shadow-xl" : "shadow-lg"
              )}
              bubbleClassName="rounded-xl shadow-sm"
            />
          </motion.div>
        </AnimatePresence>

        {/* Status indicator when locating or loading */}
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
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
