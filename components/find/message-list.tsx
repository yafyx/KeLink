"use client";

import { MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { ChatMessagesContainer } from "./chat-messages-container";
import { TypingIndicator } from "./typing-indicator";
import type { Message, Vendor } from "./floating-chat";
import { cn } from "@/lib/utils";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  validVendors?: Vendor[];
  activeDropdowns?: string[];
  toggleDropdown?: (type: string) => void;
  selectedVendorId?: string;
  onVendorClick?: (vendor: Vendor) => void;
  getVendorTypeColor?: (type: string) => string;
  animationSettings?: any;
  preferReducedMotion?: boolean | null | undefined;
  bubbleClassName?: string;
  messagesEndRef?: React.RefObject<HTMLDivElement | null>;
  toggleExpanded?: () => void;
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
      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
        <MessageSquare className="h-12 w-12 mb-2 opacity-20" />
        <p className="text-sm mb-1">Belum ada percakapan</p>
        <p className="text-xs">Cari penjual keliling untuk memulai</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={cn(
            "p-3 rounded-lg",
            message.role === "user" ? "bg-primary/10 ml-6" : "bg-gray-100 mr-6"
          )}
        >
          <p className="text-sm">{message.content}</p>
        </div>
      ))}
    </div>
  );
}
