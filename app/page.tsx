"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  MapPin,
  Star,
  Clock,
  ChevronRight,
  Navigation,
  MessageCircle,
  Route,
  Menu,
} from "lucide-react";
import { MobileHeader } from "@/components/ui/mobile-header";
import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGeolocation } from "@/hooks/use-geolocation";
import { FeatureBanner } from "@/components/feature-card";

export default function Home() {
  const router = useRouter();
  const { location, loading, error, permissionState, requestPermission } =
    useGeolocation();
  const [locationText, setLocationText] = useState("Current Location");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<
    string | undefined
  >();
  const [selectedPeddlerId, setSelectedPeddlerId] = useState<
    string | undefined
  >();

  useEffect(() => {
    if (location) {
      setLocationText(
        `Location Updated (${location.lat.toFixed(4)}, ${location.lng.toFixed(
          4
        )})`
      );
    }
  }, [location]);

  const handleNavigateToFind = () => {
    setIsLoading(true);
    router.push("/find");
  };

  const handleRequestLocation = async () => {
    if (permissionState !== "granted") {
      const granted = await requestPermission();
      if (!granted) {
        alert("Please enable location services to get nearby peddlers");
      }
    }
  };

  return (
    <AppLayout
      header={
        <MobileHeader
          title="KeLink"
          centerContent={true}
          rightAction={
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          }
        />
      }
    >
      <motion.div
        className="flex flex-col gap-6 pb-20 mobile-container px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Location Section */}
        <motion.div
          className="flex flex-col gap-3 mt-2"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 px-1">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
            </div>
            <div className="flex flex-col">
              <p className="text-xs text-muted-foreground">Your Location</p>
              <button
                className="text-sm font-medium flex items-center gap-1 text-left"
                onClick={handleRequestLocation}
                aria-label="Update your location"
              >
                {locationText} <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <Button
            onClick={handleNavigateToFind}
            className="w-full py-2 bg-gray-50 hover:bg-gray-100 border border-gray-100 text-muted-foreground justify-start h-auto text-sm font-normal rounded-full shadow-sm"
            variant="outline"
            disabled={isLoading}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Ask for peddlers nearby
            <ArrowRight className="h-3 w-3 ml-auto" />
          </Button>
        </motion.div>

        {/* Feature Banner */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <FeatureBanner
            className="w-full"
            onButtonClick={handleNavigateToFind}
          />
        </motion.div>

        {/* Categories Section */}
        <motion.div
          className="pt-1"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-base font-semibold font-jakarta">Discover</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/find?filter=nearby" className="block">
                <Card className="border border-gray-100 shadow-sm overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm mb-0.5 font-jakarta text-blue-700">
                          Nearby
                        </h3>
                        <p className="text-xs text-blue-600/80">
                          Peddlers closest to you
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/find?filter=trending" className="block">
                <Card className="border border-gray-100 shadow-sm overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-amber-100 border-2 border-amber-200 flex items-center justify-center">
                        <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm mb-0.5 font-jakarta text-amber-700">
                          Trending
                        </h3>
                        <p className="text-xs text-amber-600/80">
                          Most popular peddlers
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Nearby Peddlers */}
        <motion.div
          className="pt-1"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-base font-semibold font-jakarta">
              Mobile Peddlers Nearby
            </h2>
            <Link href="/find" className="text-primary text-sm font-medium">
              View All
            </Link>
          </div>

          <div className="space-y-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card className="border border-gray-100 shadow-sm overflow-hidden rounded-xl">
                <CardContent className="p-0">
                  <Link
                    href="/find?peddler=siomay-mang-ujang"
                    className="block"
                  >
                    <div className="flex">
                      <div className="relative w-24 h-24">
                        <Image
                          src="/placeholder.jpg"
                          alt="Siomay Mang Ujang Peddler"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-white rounded-full p-1 shadow-sm border border-gray-100">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        </div>
                      </div>
                      <div className="p-3 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-base font-jakarta">
                            Siomay Mang Ujang
                          </h3>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            500m away
                          </p>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            Last seen: 5 min ago
                          </p>
                        </div>
                        <div className="mt-1">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Siomay
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card className="border border-gray-100 shadow-sm overflow-hidden rounded-xl">
                <CardContent className="p-0">
                  <Link
                    href="/find?peddler=es-cendol-bu-tini"
                    className="block"
                  >
                    <div className="flex">
                      <div className="relative w-24 h-24">
                        <Image
                          src="/placeholder.jpg"
                          alt="Es Cendol Bu Tini Peddler"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-white rounded-full p-1 shadow-sm border border-gray-100">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        </div>
                      </div>
                      <div className="p-3 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-base font-jakarta">
                            Es Cendol Bu Tini
                          </h3>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            350m away
                          </p>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            Last seen: 2 min ago
                          </p>
                        </div>
                        <div className="mt-1">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Es Cendol
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Services Section */}
        <motion.div
          className="pt-1"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-base font-semibold font-jakarta">
              Our Services
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/find" className="block h-full">
                <Card className="border border-gray-100 shadow-sm overflow-hidden h-full rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex flex-col h-full">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        <MessageCircle className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-medium text-sm mb-1 font-jakarta">
                        AI Chatbot
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Ask naturally to find peddlers nearby
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/find?tracking=true" className="block h-full">
                <Card className="border border-gray-100 shadow-sm overflow-hidden h-full rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex flex-col h-full">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        <Navigation className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-medium text-sm mb-1 font-jakarta">
                        Live Tracking
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Find mobile peddlers in real-time
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className="pt-1 pb-8"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card className="border border-gray-100 shadow-sm bg-primary/5 overflow-hidden rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                    <Route className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-base mb-1 font-jakarta">
                      Are you a mobile peddler?
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Join our platform and get AI-powered route advice
                    </p>
                    <div className="flex gap-2">
                      <Link href="/peddler/register">
                        <Button size="sm" className="rounded-full px-4">
                          Register
                        </Button>
                      </Link>
                      <Link href="/peddler/login">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full px-4"
                        >
                          Login
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
