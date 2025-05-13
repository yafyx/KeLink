"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  ChevronUp,
  ChevronDown,
  MapPin,
  Clock,
  X,
  MessageSquare,
  MapIcon,
  Navigation,
  MinusCircle,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";
import { RouteInfo } from "./route-info";
import { RouteDetails } from "@/lib/route-mapper";
import { VendorSheet } from "./vendor-sheet";
import { Message as ChatMessage } from "@/hooks/use-function-chat";

export type Message = ChatMessage;

export type Vendor = {
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

interface FloatingChatProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  vendors?: Vendor[];
  selectedVendorId?: string;
  onVendorClick?: (vendor: Vendor) => void;
  className?: string;
  bubbleClassName?: string;
  routeDetails?: RouteDetails | null;
  showRoute?: boolean;
  onToggleRoute?: () => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onMinimizeChat?: () => void;
}

export function FloatingChat({
  messages,
  isLoading,
  onSendMessage,
  vendors = [],
  selectedVendorId,
  onVendorClick,
  className,
  bubbleClassName,
  routeDetails,
  showRoute = false,
  onToggleRoute,
  isExpanded,
  onToggleExpanded,
  onMinimizeChat,
}: FloatingChatProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<
    "chat" | "vendors" | "route" | string
  >("chat");

  // Initialize with empty array (no dropdowns open by default)
  const [activeDropdowns, setActiveDropdowns] = useState<string[]>([]);
  const [vendorSheetOpen, setVendorSheetOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const vendorListRef = useRef<HTMLDivElement>(null);
  const preferReducedMotion = useReducedMotion();

  // Define animation settings based on user's motion preference
  const animationSettings = {
    transition: preferReducedMotion
      ? { duration: 0.1 }
      : { type: "spring", stiffness: 500, damping: 30 },
  };

  const validVendors = vendors.filter(
    (vendor) =>
      vendor &&
      vendor.location &&
      typeof vendor.location.lat === "number" &&
      typeof vendor.location.lng === "number"
  );

  // Focus input on mount and after sending message
  useEffect(() => {
    if (!isLoading && isExpanded && activeTab === "chat") {
      inputRef.current?.focus();
    }
  }, [isLoading, isExpanded, activeTab]);

  // Effect for handling tab switch when new vendors are found
  useEffect(() => {
    if (isExpanded && validVendors.length > 0 && activeTab === "chat") {
      const timer = setTimeout(() => {
        setActiveTab("vendors");
      }, 300); // Delay for better UX after expansion
      return () => clearTimeout(timer);
    }
  }, [validVendors.length, isExpanded]); // Removed activeTab from deps

  // Scroll selected vendor into view and ensure vendors tab is active
  useEffect(() => {
    if (isExpanded && selectedVendorId && vendorListRef.current) {
      if (activeTab !== "vendors") {
        setActiveTab("vendors");
      }
      // Small delay to ensure DOM is updated and tab switch has occurred
      setTimeout(() => {
        const selectedCard = vendorListRef.current?.querySelector(
          `[data-vendor-id="${selectedVendorId}"]`
        );
        selectedCard?.scrollIntoView({
          behavior: preferReducedMotion ? "auto" : "smooth",
          block: "nearest",
        });
      }, 150);
    }
  }, [selectedVendorId, isExpanded, preferReducedMotion]); // Removed activeTab from deps

  // Auto switch to route tab when route is shown
  useEffect(() => {
    if (isExpanded && showRoute && routeDetails && selectedVendorId) {
      if (activeTab !== "route") {
        setActiveTab("route");
      }
    }
  }, [showRoute, routeDetails, selectedVendorId, isExpanded]); // Removed activeTab from deps

  // Auto EXPAND VENDOR DROPDOWNS when vendors prop updates
  useEffect(() => {
    // Filter vendors passed in props
    const currentValidVendors = vendors.filter(
      (vendor) =>
        vendor &&
        vendor.location &&
        typeof vendor.location.lat === "number" &&
        typeof vendor.location.lng === "number"
    );

    // Only proceed if there are valid vendors from the latest prop update
    if (currentValidVendors.length > 0) {
      // Find the latest assistant message
      const latestAssistantMessage = messages
        .slice()
        .reverse()
        .find((msg) => msg.role === "assistant" && !msg.pending);

      if (latestAssistantMessage) {
        // Extract mentioned types from this message
        const vendorTypes = [
          "bakso",
          "siomay",
          "batagor",
          "es_cendol",
          "sate_padang",
        ];
        const mentionedTypesInLastMessage = vendorTypes.filter((type) => {
          const normalizedType = type.replace("_", " ");
          const messageContent = latestAssistantMessage.content.toLowerCase();
          return (
            messageContent.includes(normalizedType) ||
            messageContent.includes(type)
          );
        });

        // Set ONLY these types as active dropdowns
        if (mentionedTypesInLastMessage.length > 0) {
          setActiveDropdowns(mentionedTypesInLastMessage);
        } else {
          setActiveDropdowns([]); // Clear if message doesn't mention types
        }
      } else {
        // No relevant assistant message found? Clear dropdowns.
        setActiveDropdowns([]);
      }
    } else {
      // No valid vendors in the latest prop update, clear dropdowns.
      setActiveDropdowns([]);
    }
    // Rerun when vendors prop changes OR messages change
  }, [vendors, messages]);

  // Function to toggle a specific dropdown
  const toggleDropdown = (type: string) => {
    setActiveDropdowns((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Handle form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentInput = input.trim();
    if (!currentInput) return;

    // Expand the chat if it's collapsed
    if (!isExpanded) {
      if (onToggleExpanded) onToggleExpanded();
    }
    setActiveTab("chat"); // Ensure chat tab is active when sending a message

    // Add visual feedback by briefly disabling the input
    setInput("");
    onSendMessage(currentInput);

    // Return focus to input after sending
    // Use a small timeout to ensure the state update has propagated
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const localToggleExpanded = () => {
    if (onToggleExpanded) onToggleExpanded();
  };

  // Get vendor type color for badges and indicators
  const getVendorTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      bakso: "bg-red-500",
      siomay: "bg-blue-500",
      batagor: "bg-yellow-500",
      es_cendol: "bg-green-500",
      "es cendol": "bg-green-500",
      es_cincau: "bg-emerald-500",
      "es cincau": "bg-emerald-500",
      sate: "bg-orange-500",
      sate_padang: "bg-orange-500",
      "sate padang": "bg-orange-500",
      martabak: "bg-purple-500",
    };

    // Default color if type is not recognized
    return colors[type.toLowerCase()] || "bg-gray-500";
  };

  // Find the number of vendors for each type to show in the dropdown
  const vendorCounts: Record<string, number> = {};
  validVendors.forEach((vendor) => {
    const type = vendor.type.toLowerCase();
    vendorCounts[type] = (vendorCounts[type] || 0) + 1;
  });

  // Group vendors by type with proper case
  const vendorsByType: Record<string, Vendor[]> = {};
  validVendors.forEach((vendor) => {
    const type = vendor.type.toLowerCase();
    if (!vendorsByType[type]) {
      vendorsByType[type] = [];
    }
    vendorsByType[type].push(vendor);
  });

  // Filter for the selected vendor
  const selectedVendor = selectedVendorId
    ? validVendors.find((v) => v.id === selectedVendorId)
    : undefined;

  return (
    <div
      className={cn(
        "relative backdrop-blur-sm flex flex-col w-full overflow-hidden",
        isExpanded ? "bg-white shadow-lg rounded-2xl" : "",
        className
      )}
    >
      {/* If expanded, show the tabbed interface */}
      {isExpanded ? (
        <Tabs
          defaultValue="chat"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="border-b px-1 flex justify-between items-center">
            <TabsList className="h-12">
              <TabsTrigger
                value="chat"
                className="data-[state=active]:bg-gray-100/80 px-3 relative"
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Chat
                {activeTab !== "chat" &&
                  messages.filter((m) => m.role === "assistant" && !m.pending)
                    .length > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
                  )}
              </TabsTrigger>
              <TabsTrigger
                value="vendors"
                className="data-[state=active]:bg-gray-100/80 px-3 relative"
                disabled={validVendors.length === 0}
              >
                <MapPin className="h-4 w-4 mr-1" />
                Vendors
                {activeTab !== "vendors" && validVendors.length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
                )}
              </TabsTrigger>
              {routeDetails && selectedVendor && (
                <TabsTrigger
                  value="route"
                  className="data-[state=active]:bg-gray-100/80 px-3 relative"
                >
                  <Navigation className="h-4 w-4 mr-1" />
                  Route
                </TabsTrigger>
              )}
            </TabsList>

            <Button
              variant="ghost"
              size="sm"
              className="mr-2 h-8 w-8 rounded-full"
              onClick={onMinimizeChat}
            >
              <MinusCircle className="h-4 w-4" />
            </Button>
          </div>

          <TabsContent
            value="chat"
            className="mt-0 focus-visible:outline-none focus-visible:ring-0 border-0"
          >
            <MessageList
              messages={messages}
              isLoading={isLoading}
              validVendors={validVendors}
              activeDropdowns={activeDropdowns}
              toggleDropdown={toggleDropdown}
              selectedVendorId={selectedVendorId}
              onVendorClick={onVendorClick}
              getVendorTypeColor={getVendorTypeColor}
              animationSettings={animationSettings}
              preferReducedMotion={preferReducedMotion}
              bubbleClassName={bubbleClassName}
              messagesEndRef={messagesEndRef}
              toggleExpanded={localToggleExpanded}
              onViewAllVendors={() => setActiveTab("vendors")}
            />
          </TabsContent>

          <TabsContent
            value="vendors"
            className="mt-0 focus-visible:outline-none focus-visible:ring-0 border-0 relative"
          >
            <div className="h-[350px] relative">
              <ScrollArea className="h-full flex flex-col w-full">
                <div
                  className="flex flex-col p-4 space-y-4"
                  ref={vendorListRef}
                >
                  {Object.entries(vendorsByType).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-60 text-gray-400">
                      <MapIcon className="h-12 w-12 mb-2 opacity-30" />
                      <p className="text-sm">Tidak ada penjual ditemukan</p>
                      <p className="text-xs mt-1">
                        Coba cari dengan kata kunci lain
                      </p>
                    </div>
                  ) : (
                    Object.entries(vendorsByType).map(([type, vendors]) => (
                      <div key={type} className="space-y-2">
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => toggleDropdown(type)}
                        >
                          <div className="flex items-center space-x-2">
                            <div
                              className={`h-3 w-3 rounded-full ${getVendorTypeColor(
                                type
                              )}`}
                            ></div>
                            <h3 className="font-medium capitalize">
                              {type.replace("_", " ")}
                            </h3>
                            <Badge variant="outline" className="ml-2">
                              {vendors.length}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 rounded-full"
                          >
                            {activeDropdowns.includes(type) ? (
                              <MinusCircle className="h-4 w-4" />
                            ) : (
                              <PlusCircle className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        <AnimatePresence>
                          {activeDropdowns.includes(type) && (
                            <motion.div
                              initial={
                                preferReducedMotion
                                  ? { opacity: 1, height: "auto" }
                                  : { opacity: 0, height: 0 }
                              }
                              animate={
                                preferReducedMotion
                                  ? { opacity: 1, height: "auto" }
                                  : { opacity: 1, height: "auto" }
                              }
                              exit={
                                preferReducedMotion
                                  ? { opacity: 0, height: 0 }
                                  : { opacity: 0, height: 0 }
                              }
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-2 mt-2">
                                {vendors.map((vendor) => (
                                  <div
                                    key={vendor.id}
                                    data-vendor-id={vendor.id}
                                    className={cn(
                                      "p-3 rounded-lg border cursor-pointer transition-all duration-200",
                                      selectedVendorId === vendor.id
                                        ? "bg-primary/5 border-primary/30"
                                        : "bg-white hover:bg-gray-50 border-gray-200"
                                    )}
                                    onClick={() =>
                                      onVendorClick && onVendorClick(vendor)
                                    }
                                  >
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h4 className="font-medium">
                                          {vendor.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1">
                                          {vendor.description ||
                                            `${vendor.type} pedagang keliling`}
                                        </p>
                                      </div>
                                      {vendor.distance && (
                                        <Badge
                                          variant="outline"
                                          className="ml-2 text-xs"
                                        >
                                          {vendor.distance}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                                      <div className="flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {vendor.last_active}
                                      </div>
                                      <div
                                        className={cn(
                                          "px-1.5 py-0.5 rounded-full text-white text-[10px] uppercase font-medium",
                                          vendor.status === "active"
                                            ? "bg-green-500"
                                            : "bg-gray-400"
                                        )}
                                      >
                                        {vendor.status}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Bottom fade effect */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            </div>
          </TabsContent>

          <TabsContent
            value="route"
            className="mt-0 focus-visible:outline-none focus-visible:ring-0 border-0"
          >
            {routeDetails && selectedVendor ? (
              <div className="h-[350px] flex flex-col">
                <RouteInfo
                  routeDetails={routeDetails}
                  vendorName={selectedVendor.name}
                  showRoute={showRoute || false}
                  onToggleRoute={onToggleRoute}
                />
              </div>
            ) : (
              <div className="h-[350px] flex items-center justify-center">
                <div className="text-center">
                  <Navigation className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">
                    Pilih penjual untuk melihat rute
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <div className="p-2 border-t">
            <ChatInput
              input={input}
              setInput={setInput}
              onFormSubmit={handleFormSubmit}
              isLoading={isLoading}
              isExpanded={isExpanded}
              toggleExpanded={localToggleExpanded}
              inputRef={inputRef}
              onMinimize={onMinimizeChat}
            />
          </div>
        </Tabs>
      ) : (
        // Collapsed view just shows the mini chat bubble
        <div
          className={cn(
            "flex items-center gap-3 p-3 bg-white/95 rounded-full shadow-md cursor-pointer transition-transform hover:scale-102 active:scale-98",
            bubbleClassName
          )}
          onClick={localToggleExpanded}
        >
          <div className="bg-primary h-10 w-10 flex items-center justify-center rounded-full">
            <MessageSquare className="text-white h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Chat with KeLink</p>
            <p className="text-xs text-gray-500 truncate">
              Cari penjual keliling atau tanya jalan...
            </p>
          </div>
          <ChevronUp className="h-5 w-5 text-gray-400" />
        </div>
      )}

      {/* Vendor detail sheet */}
      <VendorSheet
        open={vendorSheetOpen}
        onOpenChange={setVendorSheetOpen}
        vendor={selectedVendor}
        onViewRoute={
          selectedVendor && onToggleRoute
            ? () => {
                setVendorSheetOpen(false);
                onToggleRoute();
                setActiveTab("route");
              }
            : undefined
        }
      />
    </div>
  );
}
