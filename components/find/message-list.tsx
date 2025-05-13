"use client";

import { MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { ChatMessagesContainer } from "./chat-messages-container";
import { TypingIndicator } from "./typing-indicator";
import type { Message, Vendor } from "./floating-chat";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  validVendors: Vendor[];
  activeDropdowns: string[];
  toggleDropdown: (type: string) => void;
  selectedVendorId?: string;
  onVendorClick?: (vendor: Vendor) => void;
  getVendorTypeColor: (type: string) => string;
  animationSettings: any;
  preferReducedMotion: boolean | null | undefined;
  bubbleClassName?: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  toggleExpanded: () => void;
  onViewAllVendors?: () => void;
}

export function MessageList({
  messages,
  isLoading,
  validVendors,
  activeDropdowns,
  toggleDropdown,
  selectedVendorId,
  onVendorClick,
  getVendorTypeColor,
  animationSettings,
  preferReducedMotion,
  bubbleClassName,
  messagesEndRef,
  toggleExpanded,
  onViewAllVendors,
}: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="h-[350px] relative">
        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
          <MessageSquare className="h-12 w-12 mb-2 opacity-20" />
          <p className="text-sm mb-1">No conversation yet</p>
          <p className="text-xs">Search for street vendors to start</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${
        messages.length > 3 ? "h-[350px]" : "h-auto max-h-[350px]"
      }`}
    >
      {/* Main chat container that adapts to content height */}
      <div className="h-full relative overflow-hidden">
        <ChatMessagesContainer
          messages={messages}
          validVendors={validVendors}
          activeDropdowns={activeDropdowns}
          toggleDropdown={toggleDropdown}
          selectedVendorId={selectedVendorId}
          onVendorClick={onVendorClick}
          getVendorTypeColor={getVendorTypeColor}
          animationSettings={animationSettings}
          preferReducedMotion={preferReducedMotion}
          bubbleClassName={bubbleClassName}
          isLoading={isLoading}
          onViewAllVendors={onViewAllVendors}
        />

        {/* Typing indicator at the bottom */}
        {isLoading && (
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 p-4 pb-2 bg-white bg-opacity-90 z-10">
            <Avatar className="h-6 w-6">
              <div className="bg-primary text-xs text-white flex items-center justify-center h-full rounded-full">
                K
              </div>
            </Avatar>
            <div className="bg-gray-100 rounded-2xl px-4 py-2.5 rounded-tl-none">
              <TypingIndicator />
            </div>
          </div>
        )}

        {/* Hidden reference div for compatibility with existing code */}
        <div ref={messagesEndRef} className="hidden" />
      </div>
    </div>
  );
}
