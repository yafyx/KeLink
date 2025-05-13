"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock } from "lucide-react";
import { motion } from "framer-motion";
import type { Peddler } from "@/lib/peddlers"; // Import type from the correct location

interface PeddlerCardProps {
  peddler: Peddler;
  selectedPeddlerId?: string;
  onPeddlerClick?: (peddler: Peddler) => void;
  getPeddlerTypeColor: (type: string) => string;
  animationSettings: any; // Simplified for now, could be more specific
  preferReducedMotion: boolean | null | undefined;
}

export function PeddlerCard({
  peddler,
  selectedPeddlerId,
  onPeddlerClick,
  getPeddlerTypeColor,
  animationSettings, // In FloatingChat, this is an object with a transition property
  preferReducedMotion,
}: PeddlerCardProps) {
  const isSelected = selectedPeddlerId === peddler.id;
  const colorClass = getPeddlerTypeColor(peddler.type);

  return (
    <motion.div
      key={peddler.id}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={preferReducedMotion ? { duration: 0.1 } : { duration: 0.2 }}
      data-peddler-id={peddler.id}
      className={cn(
        "p-3 rounded-xl transition-all border hover:shadow-md text-xs flex gap-3",
        isSelected
          ? "bg-primary/5 border-primary shadow-sm"
          : "border-gray-100 hover:border-gray-200 bg-white"
      )}
      onClick={() => onPeddlerClick?.(peddler)}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPeddlerClick?.(peddler);
        }
      }}
    >
      <div
        className={cn(
          "h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-medium shadow-sm",
          colorClass
        )}
      >
        {peddler.name.charAt(0)}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex justify-between items-start gap-1 mb-1">
          <div className="font-medium truncate">{peddler.name}</div>
          <Badge
            variant={peddler.status === "active" ? "default" : "secondary"}
            className={cn(
              "text-[9px] h-4 px-1 flex-shrink-0",
              peddler.status === "active"
                ? "bg-green-500 hover:bg-green-500/90"
                : "bg-gray-200 text-gray-700"
            )}
          >
            {peddler.status === "active" ? "Active" : "Not Active"}
          </Badge>
        </div>

        {peddler.description && (
          <p className="text-[10px] text-gray-600 line-clamp-2 mb-1.5">
            {peddler.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center text-[9px] text-muted-foreground bg-gray-50 px-1.5 py-0.5 rounded-full">
            <MapPin className="h-2.5 w-2.5 mr-0.5 text-gray-400" />
            <span>{peddler.distance}</span>
          </div>
          <div className="flex items-center text-[9px] text-muted-foreground bg-gray-50 px-1.5 py-0.5 rounded-full">
            <Clock className="h-2.5 w-2.5 mr-0.5 text-gray-400" />
            <span>{peddler.last_active}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
