"use client";

import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { PeddlerSection } from "./peddler/peddler-section";
import { ViewAllPeddlersButton } from "./peddler/view-all-peddlers-button";
import type { Message } from "./floating-chat";
import type { Peddler } from "@/lib/peddlers";

// Assuming Message type is defined in a shared location or passed as a generic
/*
export type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  pending?: boolean;
};
*/

interface ChatMessageProps {
  message: Message;
  validVendors: Peddler[];
  activeDropdowns: string[];
  toggleDropdown: (type: string) => void;
  selectedVendorId?: string;
  onVendorClick?: (peddler: Peddler) => void;
  getVendorTypeColor: (type: string) => string;
  animationSettings: any;
  preferReducedMotion: boolean | null | undefined;
  bubbleClassName?: string;
  onViewAllVendors?: () => void;
}

export function ChatMessage({
  message,
  validVendors,
  activeDropdowns,
  toggleDropdown,
  selectedVendorId,
  onVendorClick,
  getVendorTypeColor,
  animationSettings,
  preferReducedMotion,
  bubbleClassName,
  onViewAllVendors,
}: ChatMessageProps) {
  // Extract mentioned peddler types from the message
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
      messageContent.includes(normalizedType) || messageContent.includes(type)
    );
  });

  // Get peddlers that match the mentioned types
  const relevantVendors = validVendors.filter((peddler) =>
    mentionedTypes.includes(peddler.type.toLowerCase())
  );

  return (
    <div
      className={cn(
        "w-full flex flex-col mb-3",
        message.role === "user" ? "items-end" : "items-start"
      )}
    >
      <div
        className={cn(
          "flex",
          message.role === "user" ? "justify-end" : "justify-start",
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

      {/* Show relevant peddlers underneath the message if types are mentioned */}
      {message.role === "assistant" &&
        mentionedTypes.length > 0 &&
        validVendors.length > 0 && (
          <motion.div
            className="mt-2 ml-8 w-[90%] space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.2,
              duration: preferReducedMotion ? 0.1 : 0.2,
            }}
          >
            {/* Display peddlers for mentioned types */}
            {mentionedTypes.map((type) => {
              const typeVendors = validVendors.filter(
                (v) => v.type.toLowerCase() === type.toLowerCase()
              );

              if (typeVendors.length === 0) return null;

              return (
                <PeddlerSection
                  key={type}
                  type={type}
                  peddlersForType={typeVendors}
                  activeDropdowns={activeDropdowns}
                  toggleDropdown={toggleDropdown}
                  selectedPeddlerId={selectedVendorId}
                  onPeddlerClick={onVendorClick}
                  getPeddlerTypeColor={getVendorTypeColor}
                  animationSettings={animationSettings}
                  preferReducedMotion={preferReducedMotion}
                  onViewAllPeddlers={onViewAllVendors}
                />
              );
            })}

            {/* View all peddlers button */}
            {validVendors.length > 0 && onViewAllVendors && (
              <ViewAllPeddlersButton
                onClick={onViewAllVendors}
                peddlerCount={validVendors.length}
              />
            )}
          </motion.div>
        )}
    </div>
  );
}
