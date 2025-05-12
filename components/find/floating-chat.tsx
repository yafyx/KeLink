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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface FloatingChatProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  vendors?: Vendor[];
  selectedVendorId?: string;
  onVendorClick?: (vendor: Vendor) => void;
  className?: string;
  bubbleClassName?: string;
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
}: FloatingChatProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "vendors" | string>(
    "chat"
  );

  // Initialize with empty array (no dropdowns open by default)
  const [activeDropdowns, setActiveDropdowns] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const vendorListRef = useRef<HTMLDivElement>(null);
  const preferReducedMotion = useReducedMotion();

  // Define animation settings based on user's motion preference
  const animationSettings = {
    transition: preferReducedMotion
      ? { duration: 0.1 }
      : { type: "spring", stiffness: 500, damping: 30 },
  };

  // Remove test vendors array
  const validVendors = vendors.filter(
    (vendor) =>
      vendor &&
      vendor.location &&
      typeof vendor.location.lat === "number" &&
      typeof vendor.location.lng === "number"
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && activeTab === "chat") {
      const scrollTimer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(scrollTimer);
    }
  }, [messages, activeTab]);

  // Focus input on mount and after sending message
  useEffect(() => {
    if (!isLoading && isExpanded && activeTab === "chat") {
      inputRef.current?.focus();
    }
  }, [isLoading, isExpanded, activeTab]);

  // Auto switch to vendors tab when vendors are found and show a nice animation
  useEffect(() => {
    if (validVendors.length > 0) {
      // First expand the panel
      setIsExpanded(true);

      // Then switch to vendors tab with a slight delay for better UX
      const timer = setTimeout(() => {
        setActiveTab("vendors");
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [validVendors.length]);

  // Scroll selected vendor into view
  useEffect(() => {
    if (selectedVendorId && vendorListRef.current) {
      // Make sure vendors tab is active and panel is expanded when selecting a vendor
      if (activeTab !== "vendors") {
        setActiveTab("vendors");
      }

      if (!isExpanded) {
        setIsExpanded(true);
      }

      // Small delay to ensure DOM is updated
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
  }, [selectedVendorId, activeTab, isExpanded, preferReducedMotion]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Expand the chat if it's collapsed
    if (!isExpanded) {
      setIsExpanded(true);
      setActiveTab("chat");
    }

    // Add visual feedback by briefly disabling the input
    const currentInput = input.trim();
    setInput("");
    onSendMessage(currentInput);

    // Return focus to input after sending
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const toggleExpanded = () => setIsExpanded(!isExpanded);

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

  return (
    <div
      className={cn(
        "flex flex-col w-full max-w-md mx-auto relative",
        className
      )}
    >
      <AnimatePresence mode={preferReducedMotion ? "wait" : "sync"}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: 20 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: 20 }}
            transition={animationSettings.transition}
            className="bg-white/95 backdrop-blur-md rounded-t-2xl overflow-hidden shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="font-medium">KeLink Ask</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full -mr-1"
                onClick={toggleExpanded}
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-[350px]">
              <ScrollArea className="h-full px-4 py-3">
                <div className="flex flex-col space-y-3 pb-2">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                      <MessageSquare className="h-12 w-12 mb-2 opacity-20" />
                      <p className="text-sm mb-1">Belum ada percakapan</p>
                      <p className="text-xs">
                        Cari penjual keliling untuk memulai
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      // Extract mentioned vendor types from the message
                      const vendorTypes = [
                        "bakso",
                        "siomay",
                        "batagor",
                        "es_cendol",
                        "sate_padang",
                      ];
                      const mentionedTypes = vendorTypes.filter((type) => {
                        const normalizedType = type.replace("_", " ");
                        const messageContent = message.content.toLowerCase();
                        return (
                          messageContent.includes(normalizedType) ||
                          messageContent.includes(type)
                        );
                      });

                      // Remove testing condition that forces bakso to show

                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={
                            preferReducedMotion
                              ? { duration: 0.1 }
                              : { duration: 0.2 }
                          }
                          className={cn(
                            "w-full flex flex-col",
                            message.role === "user"
                              ? "items-end"
                              : "items-start"
                          )}
                        >
                          <div
                            className={cn(
                              "flex",
                              message.role === "user"
                                ? "justify-end"
                                : "justify-start",
                              "w-full"
                            )}
                          >
                            {message.role === "assistant" && (
                              <Avatar className="h-6 w-6 mr-2">
                                <div className="bg-primary text-xs text-white flex items-center justify-center h-full rounded-full">
                                  K
                                </div>
                              </Avatar>
                            )}
                            <div
                              className={cn(
                                "max-w-[85%] rounded-2xl px-4 py-2.5",
                                message.role === "user"
                                  ? "bg-primary text-primary-foreground rounded-tr-none"
                                  : "bg-gray-100 text-gray-800 rounded-tl-none",
                                message.pending && "opacity-70",
                                bubbleClassName
                              )}
                            >
                              <p className="text-sm break-words leading-relaxed">
                                {message.content}
                              </p>
                            </div>
                          </div>

                          {/* Show relevant vendors underneath the message if types are mentioned */}
                          {message.role === "assistant" &&
                            mentionedTypes.length > 0 && (
                              <div className="mt-2 ml-8 w-[90%] space-y-2">
                                {mentionedTypes.map((type) => {
                                  // Filter vendors case-insensitively
                                  const typeVendors = validVendors.filter(
                                    (v) =>
                                      v.type.toLowerCase() ===
                                      type.toLowerCase()
                                  );
                                  const displayType = type.replace("_", " ");

                                  // Remove debugging console log

                                  // Always show the section header even if no vendors
                                  return (
                                    <div
                                      key={type}
                                      className="vendor-section border border-gray-200 rounded-lg overflow-hidden"
                                    >
                                      <div
                                        className="flex items-center justify-between bg-gray-100 px-3 py-2 cursor-pointer text-xs hover:bg-gray-200"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleDropdown(type);
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        aria-expanded={activeDropdowns.includes(
                                          type
                                        )}
                                        onKeyDown={(e) => {
                                          if (
                                            e.key === "Enter" ||
                                            e.key === " "
                                          ) {
                                            e.preventDefault();
                                            toggleDropdown(type);
                                          }
                                        }}
                                      >
                                        <div className="flex items-center gap-1.5">
                                          <MapIcon className="h-3 w-3" />
                                          <span className="font-medium capitalize">
                                            Penjual {displayType} Terdekat (
                                            {typeVendors.length})
                                          </span>
                                        </div>
                                        {activeDropdowns.includes(type) ? (
                                          <ChevronUp className="h-3 w-3 text-gray-500" />
                                        ) : (
                                          <ChevronDown className="h-3 w-3 text-gray-500" />
                                        )}
                                      </div>

                                      <AnimatePresence>
                                        {activeDropdowns.includes(type) && (
                                          <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{
                                              opacity: 1,
                                              height: "auto",
                                            }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={
                                              preferReducedMotion
                                                ? { duration: 0.1 }
                                                : { duration: 0.2 }
                                            }
                                            className="space-y-2 overflow-hidden p-2 bg-white"
                                          >
                                            {typeVendors.length > 0 ? (
                                              typeVendors.map((vendor) => (
                                                <motion.div
                                                  key={vendor.id}
                                                  ref={
                                                    selectedVendorId ===
                                                    vendor.id
                                                      ? (node) => {
                                                          if (
                                                            node &&
                                                            selectedVendorId ===
                                                              vendor.id
                                                          ) {
                                                            const container =
                                                              vendorListRef.current;
                                                            if (container) {
                                                              container.appendChild(
                                                                node
                                                              );
                                                            }
                                                          }
                                                        }
                                                      : undefined
                                                  }
                                                  initial={{
                                                    opacity: 0,
                                                    scale: 0.95,
                                                  }}
                                                  animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                  }}
                                                  transition={
                                                    preferReducedMotion
                                                      ? { duration: 0.1 }
                                                      : { duration: 0.2 }
                                                  }
                                                  data-vendor-id={vendor.id}
                                                  className={cn(
                                                    "p-3 rounded-xl transition-all border hover:shadow-md text-xs",
                                                    selectedVendorId ===
                                                      vendor.id
                                                      ? "bg-primary/5 shadow-md border-primary"
                                                      : "border-gray-100 hover:border-gray-200"
                                                  )}
                                                  onClick={() =>
                                                    onVendorClick?.(vendor)
                                                  }
                                                  tabIndex={0}
                                                  role="button"
                                                  aria-pressed={
                                                    selectedVendorId ===
                                                    vendor.id
                                                  }
                                                  onKeyDown={(e) => {
                                                    if (
                                                      e.key === "Enter" ||
                                                      e.key === " "
                                                    ) {
                                                      e.preventDefault();
                                                      onVendorClick?.(vendor);
                                                    }
                                                  }}
                                                >
                                                  <div className="flex items-start gap-2">
                                                    <div
                                                      className={cn(
                                                        "h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium shadow-sm",
                                                        getVendorTypeColor(
                                                          vendor.type
                                                        )
                                                      )}
                                                    >
                                                      {vendor.name.charAt(0)}
                                                    </div>
                                                    <div className="flex-1">
                                                      <div className="flex justify-between items-start">
                                                        <div className="font-medium">
                                                          {vendor.name}
                                                        </div>
                                                        <Badge
                                                          variant={
                                                            vendor.status ===
                                                            "active"
                                                              ? "default"
                                                              : "secondary"
                                                          }
                                                          className="text-[9px] h-4 ml-2"
                                                        >
                                                          {vendor.status ===
                                                          "active"
                                                            ? "Aktif"
                                                            : "Tidak Aktif"}
                                                        </Badge>
                                                      </div>
                                                      {vendor.description && (
                                                        <div className="text-[10px] mt-1 text-gray-700 leading-relaxed">
                                                          {vendor.description}
                                                        </div>
                                                      )}
                                                      <div className="flex items-center justify-between mt-1.5">
                                                        <div className="flex items-center text-[9px] text-muted-foreground bg-gray-50 px-1.5 py-0.5 rounded-full">
                                                          <MapPin className="h-2.5 w-2.5 mr-0.5 text-gray-400" />
                                                          <span>
                                                            {vendor.distance}
                                                          </span>
                                                        </div>
                                                        <div className="flex items-center text-[9px] text-muted-foreground bg-gray-50 px-1.5 py-0.5 rounded-full">
                                                          <Clock className="h-2.5 w-2.5 mr-0.5 text-gray-400" />
                                                          <span>
                                                            {vendor.last_active}
                                                          </span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </motion.div>
                                              ))
                                            ) : (
                                              <div className="text-center text-xs text-gray-500 py-2">
                                                Tidak ada penjual {displayType}{" "}
                                                terdekat saat ini
                                              </div>
                                            )}
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                        </motion.div>
                      );
                    })
                  )}
                </div>
                {isLoading && (
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-6 w-6">
                      <div className="bg-primary text-xs text-white flex items-center justify-center h-full rounded-full">
                        K
                      </div>
                    </Avatar>
                    <div className="bg-gray-100 rounded-2xl px-4 py-2.5 rounded-tl-none">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        layout
        transition={animationSettings.transition}
        className="bg-white rounded-b-2xl shadow-lg border border-t-0 border-gray-100 z-10"
      >
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 p-2 relative"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all duration-200"
            onClick={toggleExpanded}
            aria-label={isExpanded ? "Minimize chat" : "Expand chat"}
            title={isExpanded ? "Minimize chat" : "Expand chat"}
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </Button>
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              type="text"
              placeholder={
                isLoading
                  ? "Menunggu..."
                  : "Ask for vendors nearby... (e.g., 'Cari siomay dekat sini?"
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  if (isExpanded) {
                    e.preventDefault();
                    toggleExpanded();
                  }
                }
              }}
              disabled={isLoading}
              className={cn(
                "flex-1 h-10 border border-input bg-transparent transition-all duration-200 w-full",
                isLoading
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:bg-gray-50/50"
              )}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className={cn(
              "h-10 w-10 rounded-full transition-all duration-200",
              input.trim()
                ? "bg-primary hover:bg-primary/90 scale-100"
                : "bg-gray-200 scale-95"
            )}
          >
            <Send
              className={cn(
                "h-4 w-4",
                input.trim() ? "text-white" : "text-gray-400"
              )}
            />
          </Button>
        </form>
      </motion.div>

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
      `}</style>
    </div>
  );
}
