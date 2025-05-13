"use client";

import { useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Message, Vendor } from "./floating-chat";
import { ChatMessage } from "./chat-message";

interface ChatMessagesContainerProps {
  messages: Message[];
  validVendors: Vendor[];
  activeDropdowns: string[];
  toggleDropdown: (type: string) => void;
  selectedVendorId?: string;
  onVendorClick?: (vendor: Vendor) => void;
  getVendorTypeColor: (type: string) => string;
  animationSettings: any;
  preferReducedMotion: boolean | null | undefined;
  bubbleClassName?: string;
  isLoading: boolean;
}

export function ChatMessagesContainer({
  messages,
  validVendors,
  activeDropdowns,
  toggleDropdown,
  selectedVendorId,
  onVendorClick,
  getVendorTypeColor,
  animationSettings,
  preferReducedMotion,
  bubbleClassName,
  isLoading,
}: ChatMessagesContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full overflow-y-auto px-4 py-3"
    >
      <div className="flex-grow"></div>{" "}
      {/* Spacer that pushes content to bottom */}
      <div className="space-y-3">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={
              preferReducedMotion ? { duration: 0.1 } : { duration: 0.2 }
            }
            layout
            className="will-change-transform"
          >
            <ChatMessage
              message={message}
              validVendors={validVendors}
              activeDropdowns={activeDropdowns}
              toggleDropdown={toggleDropdown}
              selectedVendorId={selectedVendorId}
              onVendorClick={onVendorClick}
              getVendorTypeColor={getVendorTypeColor}
              animationSettings={animationSettings}
              preferReducedMotion={preferReducedMotion}
              bubbleClassName={bubbleClassName}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
