"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  ChevronUp,
  ChevronDown,
  MapPin,
  Star,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
  const [showMessages, setShowMessages] = useState(true);
  const [showVendors, setShowVendors] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const vendorListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show vendors section when vendors are found
  useEffect(() => {
    if (vendors.length > 0) {
      setShowVendors(true);
    }
  }, [vendors]);

  // Scroll selected vendor into view
  useEffect(() => {
    if (selectedVendorId && vendorListRef.current) {
      const selectedCard = vendorListRef.current.querySelector(
        `[data-vendor-id="${selectedVendorId}"]`
      );
      if (selectedCard) {
        selectedCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedVendorId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    onSendMessage(input);
    setInput("");

    // Return focus to input after sending
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const toggleMessages = () => {
    setShowMessages(!showMessages);
  };

  const toggleVendors = () => {
    setShowVendors(!showVendors);
  };

  const validVendors = vendors.filter(
    (vendor) =>
      vendor &&
      vendor.location &&
      typeof vendor.location.lat === "number" &&
      typeof vendor.location.lng === "number"
  );

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
      ref={containerRef}
      className={cn(
        "flex flex-col w-full max-w-md mx-auto rounded-xl shadow-lg",
        className
      )}
    >
      {/* Vendors section */}
      <AnimatePresence>
        {validVendors.length > 0 && showVendors && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: 1,
              height: "auto",
              transition: { duration: 0.3 },
            }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/95 backdrop-blur-sm rounded-t-lg shadow-lg overflow-hidden mb-2"
          >
            <div className="p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold flex items-center">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                  Penjual Terdekat ({validVendors.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={toggleVendors}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>

              <div
                ref={vendorListRef}
                className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar"
              >
                {validVendors.map((vendor) => (
                  <motion.div
                    key={vendor.id}
                    data-vendor-id={vendor.id}
                    className={cn(
                      "p-3 rounded-lg transition-all hover:shadow",
                      selectedVendorId === vendor.id
                        ? "border-primary bg-primary/5 shadow"
                        : "border border-gray-100"
                    )}
                    onClick={() => onVendorClick && onVendorClick(vendor)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium",
                          getVendorTypeColor(vendor.type)
                        )}
                      >
                        {vendor.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div className="font-medium text-sm">
                            {vendor.name}
                          </div>
                          <Badge
                            variant={
                              vendor.status === "active" ? "default" : "outline"
                            }
                            className="text-[10px] h-5"
                          >
                            {vendor.status === "active"
                              ? "Aktif"
                              : "Tidak Aktif"}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <span
                            className={cn(
                              "h-2 w-2 rounded-full",
                              getVendorTypeColor(vendor.type)
                            )}
                          ></span>
                          {vendor.type}
                        </div>
                        {vendor.description && (
                          <div className="text-xs mt-1 text-gray-700">
                            {vendor.description}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-1.5">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span>{vendor.distance}</span>
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{vendor.last_active}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages area with transition */}
      <AnimatePresence>
        {showMessages && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: 1,
              height: "auto",
              transition: { duration: 0.3 },
            }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-1 overflow-y-auto bg-white/90 backdrop-blur-sm rounded-t-lg shadow-lg max-h-[300px]"
          >
            <div className="p-4 space-y-3">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className={cn(
                    "flex w-fit max-w-[80%] rounded-lg p-3",
                    message.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-muted",
                    message.pending && "opacity-70",
                    bubbleClassName
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 p-2"
                >
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <motion.div
        className="bg-white p-3 rounded-lg shadow-lg border border-gray-100"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-full flex items-center justify-center"
            onClick={toggleMessages}
            aria-label={showMessages ? "Hide messages" : "Show messages"}
          >
            {showMessages ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
          <Input
            ref={inputRef}
            type="text"
            placeholder="Cari penjual keliling..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 h-10 rounded-full border-gray-200 focus:border-primary focus:ring-primary"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className={cn(
              "h-10 w-10 rounded-full transition-all duration-200",
              input.trim() ? "bg-primary scale-100" : "bg-gray-200 scale-95"
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

      {/* Add custom CSS for typing indicator */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(155, 155, 155, 0.5);
          border-radius: 20px;
        }
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .typing-indicator span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: hsl(var(--primary));
          display: inline-block;
          opacity: 0.6;
        }
        .typing-indicator span:nth-child(1) {
          animation: bounce 1s infinite 0.1s;
        }
        .typing-indicator span:nth-child(2) {
          animation: bounce 1s infinite 0.3s;
        }
        .typing-indicator span:nth-child(3) {
          animation: bounce 1s infinite 0.5s;
        }
        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </div>
  );
}
