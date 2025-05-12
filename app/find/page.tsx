"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MapPin, ArrowLeft } from "lucide-react";
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
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { AppLayout } from "@/components/AppLayout";

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
};

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
    lon: number;
  } | null>(null);
  const [foundVendors, setFoundVendors] = useState<Vendor[]>([]);
  const [showVendorSheet, setShowVendorSheet] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // User location and message handling

  // Get user location when component mounts
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          console.log(
            "User location:",
            position.coords.latitude,
            position.coords.longitude
          );
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    const pendingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "...",
      pending: true,
    };

    setMessages((prev) => [...prev, userMessage, pendingMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call the find API endpoint
      const response = await fetch("/api/find", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          location: userLocation,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from find API");
      }

      const data = await response.json();

      // Update vendors if any were found
      if (data.response.vendors && data.response.vendors.length > 0) {
        setFoundVendors(data.response.vendors);
        setShowVendorSheet(true);
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

      setMessages((prev) => {
        const newMessages = [...prev];
        const pendingIndex = newMessages.findIndex((msg) => msg.pending);

        if (pendingIndex !== -1) {
          newMessages[pendingIndex] = {
            id: Date.now().toString(),
            role: "assistant",
            content: "Maaf, terjadi kesalahan. Silakan coba lagi nanti.",
          };
        }

        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const HeaderComponent = (
    <MobileHeader
      title="Find"
      centerContent={true}
      leftAction={
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      }
    />
  );

  // Header component for the find page

  return (
    <AppLayout header={HeaderComponent}>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-4 mb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex w-fit max-w-[80%] rounded-lg p-4",
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p>{message.content}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t p-4 bg-background/80 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Cari penjual keliling..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      <BottomSheet
        isOpen={showVendorSheet}
        onClose={() => setShowVendorSheet(false)}
        snapPoints={[0.5, 0.8]}
      >
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">Penjual Terdekat</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {foundVendors.length} penjual ditemukan di sekitar Anda
          </p>
          <div className="space-y-4">
            {foundVendors.map((vendor) => (
              <Card key={vendor.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{vendor.name}</CardTitle>
                    <Badge
                      variant={
                        vendor.status === "active" ? "default" : "outline"
                      }
                    >
                      {vendor.status === "active" ? "Aktif" : "Tidak Aktif"}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {vendor.type}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3 pt-0">
                  <div className="flex items-center text-xs text-muted-foreground gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{vendor.distance} dari lokasi Anda</span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end pt-0">
                  <Button variant="outline" size="sm">
                    Lihat Detail
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </BottomSheet>
    </AppLayout>
  );
}
