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

export type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  pending?: boolean;
};

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

  // Renamed from handleSubmit to handleFormSubmit to avoid confusion
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
      siomay: "bg-green-500",
      batagor: "bg-blue-500",
      es_cendol: "bg-purple-500",
      sate_padang: "bg-amber-500",
    };
    return colors[type] || "bg-gray-500";
  };

  // Get selected vendor name for route display
  const selectedVendor = selectedVendorId
    ? validVendors.find((v) => v.id === selectedVendorId)
    : null;

  // Latest assistant message for the chat bubble when minimized
  const latestAssistantMessage = messages
    .filter((msg) => msg.role === "assistant" && !msg.pending)
    .pop();

  return (
    <div
      className={cn(
        "flex flex-col w-full max-w-md mx-auto relative",
        className
      )}
    >
      {/* REMOVED AnimatePresence for internal isVisible state. Parent FindPage handles this. */}
      {/* <AnimatePresence mode={preferReducedMotion ? "wait" : "sync"}> */}
      {/* {isVisible && ( */}
      <>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: 20 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: 20 }}
            transition={animationSettings.transition}
            className="bg-white/95 backdrop-blur-md rounded-t-2xl overflow-hidden shadow-lg border border-gray-100 flex flex-col"
          >
            <Tabs
              defaultValue="chat"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="border-b">
                <TabsList className="w-full rounded-none border-b-0 bg-transparent p-0">
                  <TabsTrigger
                    value="chat"
                    className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none py-3"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger
                    value="vendors"
                    className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none py-3"
                    disabled={validVendors.length === 0}
                  >
                    <MapIcon className="h-4 w-4 mr-2" />
                    Vendors{" "}
                    {validVendors.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-2 h-5 w-5 p-0 flex items-center justify-center"
                      >
                        {validVendors.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  {showRoute && selectedVendorId && routeDetails && (
                    <TabsTrigger
                      value="route"
                      className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none py-3"
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Route
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <TabsContent
                value="chat"
                className="mt-0 p-0"
                style={{ height: "300px" }}
              >
                <motion.div
                  layout
                  className="overflow-hidden"
                  style={{ height: "auto", minHeight: 0 }}
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
                    onViewAllVendors={() => setVendorSheetOpen(true)}
                  />
                </motion.div>
              </TabsContent>

              <TabsContent
                value="vendors"
                className="mt-0 p-0"
                style={{ height: "300px" }}
              >
                <div
                  ref={vendorListRef}
                  className="h-full overflow-auto p-3 space-y-2"
                >
                  {validVendors.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-gray-500">No vendors found</p>
                    </div>
                  ) : (
                    validVendors.map((vendor) => (
                      <div
                        key={vendor.id}
                        data-vendor-id={vendor.id}
                        className={cn(
                          "rounded-lg p-3 transition-all cursor-pointer hover:bg-gray-50",
                          selectedVendorId === vendor.id
                            ? "bg-gray-100"
                            : "bg-white",
                          "border border-gray-100 shadow-sm"
                        )}
                        onClick={() => onVendorClick && onVendorClick(vendor)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-sm">
                              {vendor.name}
                            </h3>
                            <div className="flex items-center mt-1 space-x-2">
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-[10px] px-1.5 py-0 h-4",
                                  getVendorTypeColor(vendor.type).replace(
                                    "bg-",
                                    "bg-opacity-10 text-"
                                  )
                                )}
                              >
                                {vendor.type.replace("_", " ")}
                              </Badge>
                              <span
                                className={cn(
                                  "text-xs flex items-center",
                                  vendor.status === "active"
                                    ? "text-green-600"
                                    : "text-gray-500"
                                )}
                              >
                                <span
                                  className={cn(
                                    "inline-block h-1.5 w-1.5 rounded-full mr-1",
                                    vendor.status === "active"
                                      ? "bg-green-500"
                                      : "bg-gray-400"
                                  )}
                                ></span>
                                {vendor.status === "active"
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            {vendor.distance && (
                              <div className="text-xs text-gray-500 flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {vendor.distance}
                              </div>
                            )}
                            <div className="text-[10px] text-gray-400 mt-1">
                              {vendor.last_active}
                            </div>
                          </div>
                        </div>
                        {vendor.description && (
                          <p className="text-xs text-gray-600 mt-2">
                            {vendor.description}
                          </p>
                        )}

                        {selectedVendorId === vendor.id && onToggleRoute && (
                          <div className="flex justify-end mt-2">
                            <Button
                              variant={showRoute ? "default" : "outline"}
                              size="sm"
                              className="text-xs h-7 px-2 gap-1 rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleRoute();
                              }}
                            >
                              <Navigation className="h-3 w-3" />
                              {showRoute ? "Hide Route" : "Show Route"}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {showRoute &&
                routeDetails &&
                selectedVendorId &&
                selectedVendor && (
                  <TabsContent
                    value="route"
                    className="mt-0 p-3"
                    style={{ height: "300px", overflowY: "auto" }}
                  >
                    <RouteInfo
                      distanceText={routeDetails.distance.text}
                      durationText={routeDetails.duration.text}
                      durationValue={routeDetails.duration.value}
                      instructions={routeDetails.instructions}
                      vendorName={selectedVendor.name}
                      onClose={onToggleRoute}
                    />
                  </TabsContent>
                )}
            </Tabs>
          </motion.div>
        )}

        {/* Latest assistant message when collapsed - only shown when chat is visible but collapsed */}
        {!isExpanded && latestAssistantMessage && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={localToggleExpanded}
            className="mb-2 max-w-[85%] cursor-pointer"
          >
            <div
              className={cn(
                "py-2 px-3 rounded-2xl bg-white/95 backdrop-blur-md shadow-sm border border-gray-100 text-sm",
                bubbleClassName
              )}
            >
              <div className="line-clamp-2">
                {latestAssistantMessage.content}
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          layout
          transition={animationSettings.transition}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 z-10"
        >
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
        </motion.div>
      </>
      {/* </AnimatePresence> */}

      {/* Add the VendorSheet component */}
      <VendorSheet
        open={vendorSheetOpen}
        onOpenChange={setVendorSheetOpen}
        vendors={validVendors}
        selectedVendorId={selectedVendorId}
        onVendorClick={onVendorClick}
        getVendorTypeColor={getVendorTypeColor}
        animationSettings={animationSettings}
        preferReducedMotion={preferReducedMotion}
      />

      {/* Add custom CSS for typing indicator and animations */}
      <style jsx global>{`
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .typing-indicator span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: hsl(var(--primary));
          display: inline-block;
          opacity: 0.6;
        }
        .typing-indicator span:nth-child(1) {
          animation: pulse 1s infinite 0.1s;
        }
        .typing-indicator span:nth-child(2) {
          animation: pulse 1s infinite 0.3s;
        }
        .typing-indicator span:nth-child(3) {
          animation: pulse 1s infinite 0.5s;
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        /* Push-up animation styles */
        @keyframes push-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Force hardware acceleration for smoother animations */
        .will-change-transform {
          will-change: transform;
        }

        /* Custom scrollbar styles */
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 20px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}
