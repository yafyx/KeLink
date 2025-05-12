"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Bell,
  Search,
  MapPin,
  Utensils,
  Coffee,
  Pizza,
  ShoppingBag,
  Truck,
  Star,
  Clock,
  ChevronRight,
  Navigation,
  MessageCircle,
  Route,
} from "lucide-react";
import { MobileHeader } from "@/components/ui/mobile-header";
import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Home() {
  const [chatQuery, setChatQuery] = useState("");

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In the real implementation, this would call the chatbot API
    // For now just reset the input
    setChatQuery("");
    // Navigate to find page as a fallback
    // window.location.href = "/find";
  };

  return (
    <AppLayout header={<MobileHeader title="KeLink" centerContent={true} />}>
      <div className="flex flex-col gap-5 pb-6 mobile-container">
        {/* Chatbot Interface */}
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex flex-col">
              <p className="text-xs text-muted-foreground">Your Location</p>
              <p className="text-sm font-medium flex items-center">
                Current Location <ChevronRight className="h-4 w-4 ml-1" />
              </p>
            </div>
          </div>

          <form onSubmit={handleChatSubmit} className="mt-1">
            <div className="relative">
              <Input
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                placeholder="Ask for vendors nearby... (e.g., 'Cari siomay dekat sini?')"
                className="pl-10 py-6 bg-gray-50 border-gray-200 pr-14"
              />
              <MessageCircle className="h-5 w-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-primary text-white p-1.5 rounded-full"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Promo Banner */}
        <div className="relative h-40 w-full rounded-xl overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary/40 z-10" />
          <Image
            src="/placeholder.jpg"
            alt="Mobile Vendor Discovery"
            fill
            className="object-cover transition-all duration-500 group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 z-20 flex flex-col justify-center p-5">
            <div className="bg-white/20 text-white px-3 py-1 rounded-full w-fit text-xs font-medium mb-2">
              New Feature
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-jakarta">
              Ask, Find, Enjoy!
            </h1>
            <p className="text-sm text-white/90 mt-1 max-w-xs">
              Find mobile vendors near you with our AI chatbot
            </p>
            <Link href="/find" className="mt-3 w-fit">
              <Button
                size="sm"
                className="gap-2 rounded-full bg-white text-primary hover:bg-white/90 shadow-lg"
              >
                Try Now <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Categories Section */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold font-jakarta">Discover</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link href="/find?filter=nearby">
              <Card className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100">
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
                        Vendors closest to you
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/find?filter=trending">
              <Card className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100">
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
                        Most popular vendors
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Nearby Vendors */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold font-jakarta">
              Mobile Vendors Nearby
            </h2>
            <Link href="/find" className="text-primary text-sm font-medium">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="flex">
                  <div className="relative w-24 h-24">
                    <Image
                      src="/placeholder.jpg"
                      alt="Vendor"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-white rounded-full p-1 shadow-sm">
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
                      <p className="text-xs text-muted-foreground">500m away</p>
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
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="flex">
                  <div className="relative w-24 h-24">
                    <Image
                      src="/placeholder.jpg"
                      alt="Vendor"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-white rounded-full p-1 shadow-sm">
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
                      <p className="text-xs text-muted-foreground">350m away</p>
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
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Services Section */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold font-jakarta">
              Our Services
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium text-sm mb-1 font-jakarta">
                    AI Chatbot
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Ask naturally to find vendors nearby
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Navigation className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium text-sm mb-1 font-jakarta">
                    Live Tracking
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Find mobile vendors in real-time
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* For Vendors Section */}
        <div className="pt-1">
          <Card className="border border-primary/20 shadow-sm bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-base mb-1 font-jakarta">
                    Are you a mobile vendor?
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Join our platform and get AI-powered route advice
                  </p>
                  <div className="flex gap-2">
                    <Link href="/vendor/register">
                      <Button size="sm" className="rounded-full">
                        Register
                      </Button>
                    </Link>
                    <Link href="/vendor/login">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                      >
                        Login
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="h-16 w-16 flex items-center justify-center">
                  <Route className="h-10 w-10 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
