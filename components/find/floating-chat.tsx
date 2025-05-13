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
import { VendorSheet } from "@/components/find/vendor-sheet";
import { Message as ChatMessage } from "@/hooks/use-function-chat";
import {
  Credenza,
  CredenzaTrigger,
  CredenzaContent,
  CredenzaHeader,
  CredenzaBody,
  CredenzaFooter,
  CredenzaClose,
} from "@/components/ui/credenza";

export type Message = ChatMessage;

export interface Vendor {
  id: string;
  name: string;
  type: string;
  description?: string;
  rating?: number;
  distance?: number;
  location: {
    lat: number;
    lng: number;
  };
  eta?: string;
  averageTime?: string;
  image?: string;
  operationalStatus?: "open" | "closed" | "busy";
  lastSeen?: string;
}

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
  }, [validVendors.length, isExpanded]);

  // Scroll to bottom when new message arrives
  useEffect(() => {
    if (messagesEndRef.current && isExpanded) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isExpanded]);

  // Auto switch to route tab when route is shown
  useEffect(() => {
    if (isExpanded && showRoute && routeDetails && selectedVendorId) {
      if (activeTab !== "route") {
        setActiveTab("route");
      }
    }
  }, [showRoute, routeDetails, selectedVendorId, isExpanded]);

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

  // Non-expanded mode (just shows the input)
  if (!isExpanded) {
    return (
      <div
        className={cn(
          "relative bg-white rounded-full overflow-hidden shadow-md",
          bubbleClassName
        )}
      >
        <ChatInput
          input={input}
          setInput={setInput}
          onFormSubmit={handleFormSubmit}
          isLoading={isLoading}
          isExpanded={false}
          toggleExpanded={localToggleExpanded}
          inputRef={inputRef}
          onMinimize={onMinimizeChat}
        />
      </div>
    );
  }

  // Expanded mode content for the Credenza
  const expandedContent = (
    <Tabs
      defaultValue="chat"
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full"
    >
      <div className="border-b px-1 flex justify-between items-center">
        <TabsList className="h-10">
          <TabsTrigger
            value="chat"
            className="data-[state=active]:text-primary"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>

          {validVendors.length > 0 && (
            <TabsTrigger
              value="vendors"
              className="data-[state=active]:text-primary"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Penjual
              {validVendors.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 bg-primary/10 text-primary"
                >
                  {validVendors.length}
                </Badge>
              )}
            </TabsTrigger>
          )}

          {routeDetails && selectedVendor && (
            <TabsTrigger
              value="route"
              className="data-[state=active]:text-primary"
            >
              <MapIcon className="h-4 w-4 mr-2" />
              Rute
            </TabsTrigger>
          )}
        </TabsList>

        <Button
          variant="ghost"
          size="sm"
          onClick={onMinimizeChat}
          className="rounded-full h-8 w-8 hover:bg-gray-100"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <TabsContent
        value="chat"
        className="mt-0 focus-visible:outline-none focus-visible:ring-0 border-0"
      >
        <div className="h-[350px] overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 p-3">
            <MessageList messages={messages} />
            <div ref={messagesEndRef} />
          </ScrollArea>
        </div>
      </TabsContent>

      <TabsContent
        value="vendors"
        className="mt-0 focus-visible:outline-none focus-visible:ring-0 border-0"
      >
        <div
          className="h-[350px] overflow-y-auto py-3 px-2"
          ref={vendorListRef}
        >
          <div className="space-y-3">
            {Object.entries(vendorsByType).map(([type, vendors]) => (
              <div key={type} className="space-y-2">
                <button
                  onClick={() => toggleDropdown(type)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <div
                      className={cn(
                        "h-3 w-3 rounded-full mr-2",
                        getVendorTypeColor(type)
                      )}
                    />
                    <span className="text-base font-medium capitalize">
                      {type.replace("_", " ")}
                    </span>
                    <Badge
                      variant="secondary"
                      className="ml-2 text-xs font-normal"
                    >
                      {vendors.length}
                    </Badge>
                  </div>
                  {activeDropdowns.includes(type) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

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
                      <div className="pl-5 pr-2 space-y-2">
                        {vendors.map((vendor) => (
                          <button
                            key={vendor.id}
                            onClick={() => {
                              if (onVendorClick) onVendorClick(vendor);
                              setVendorSheetOpen(true);
                            }}
                            className={cn(
                              "w-full text-left p-2 rounded-md hover:bg-gray-100 transition-colors flex items-start gap-3",
                              selectedVendorId === vendor.id &&
                                "bg-primary/5 hover:bg-primary/10 border border-primary/20"
                            )}
                          >
                            <div className="flex-shrink-0 mt-1">
                              <Avatar className="h-8 w-8 rounded-full text-white">
                                <div
                                  className={cn(
                                    "h-full w-full rounded-full flex items-center justify-center text-xs",
                                    getVendorTypeColor(vendor.type)
                                  )}
                                >
                                  {vendor.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .substring(0, 2)}
                                </div>
                              </Avatar>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium line-clamp-1">
                                {vendor.name}
                              </div>
                              <div className="flex items-center text-sm text-gray-500 gap-2">
                                {vendor.distance && (
                                  <span className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-1 inline" />
                                    {vendor.distance < 1
                                      ? `${Math.round(vendor.distance * 1000)}m`
                                      : `${vendor.distance.toFixed(1)}km`}
                                  </span>
                                )}
                                {vendor.eta && (
                                  <span className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1 inline" />
                                    {vendor.eta}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
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
              <p className="text-gray-500">Pilih penjual untuk melihat rute</p>
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );

  return (
    <>
      {/* Non-expanded mode input (always visible) */}
      <div
        className={cn(
          "relative bg-white rounded-full overflow-hidden shadow-md",
          bubbleClassName
        )}
      >
        <ChatInput
          input={input}
          setInput={setInput}
          onFormSubmit={handleFormSubmit}
          isLoading={isLoading}
          isExpanded={false}
          toggleExpanded={localToggleExpanded}
          inputRef={inputRef}
          onMinimize={onMinimizeChat}
        />
      </div>

      {/* Credenza for expanded mode */}
      <Credenza
        open={isExpanded}
        onOpenChange={onToggleExpanded}
        forceSheet={true}
      >
        <CredenzaContent className={cn("p-0 bg-white", className)}>
          {expandedContent}

          <CredenzaFooter className="p-2 border-t bg-white">
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
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>

      {/* Vendor details sheet */}
      {selectedVendor && (
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
      )}
    </>
  );
}
