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
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";

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

  // We handle scrolling in ChatMessagesContainer now
  // Keep the messagesEndRef for compatibility with existing code

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

  // Renamed from handleSubmit to handleFormSubmit to avoid confusion
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentInput = input.trim();
    if (!currentInput) return;

    // Expand the chat if it's collapsed
    if (!isExpanded) {
      setIsExpanded(true);
      setActiveTab("chat");
    }

    // Add visual feedback by briefly disabling the input
    setInput("");
    onSendMessage(currentInput);

    // Return focus to input after sending
    // Use a small timeout to ensure the state update has propagated
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
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
            className="bg-white/95 backdrop-blur-md rounded-t-2xl overflow-hidden shadow-lg border border-gray-100 flex flex-col"
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
                toggleExpanded={toggleExpanded}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        layout
        transition={animationSettings.transition}
        className="bg-white rounded-b-2xl shadow-lg border border-t-0 border-gray-100 z-10"
      >
        <ChatInput
          input={input}
          setInput={setInput}
          onFormSubmit={handleFormSubmit}
          isLoading={isLoading}
          isExpanded={isExpanded}
          toggleExpanded={toggleExpanded}
          inputRef={inputRef}
        />
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
