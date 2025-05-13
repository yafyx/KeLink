"use client";

import { PeddlerCard } from "./peddler-card";
import type { Peddler } from "@/lib/peddlers";
import { ChevronUp, ChevronDown, MapIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PeddlerSectionProps {
  type: string;
  peddlersForType: Peddler[];
  activeDropdowns: string[];
  toggleDropdown: (type: string) => void;
  selectedPeddlerId?: string;
  onPeddlerClick?: (peddler: Peddler) => void;
  getPeddlerTypeColor: (type: string) => string;
  animationSettings: any;
  preferReducedMotion: boolean | null | undefined;
  onViewAllPeddlers?: () => void;
}

export function PeddlerSection({
  type,
  peddlersForType,
  activeDropdowns,
  toggleDropdown,
  selectedPeddlerId,
  onPeddlerClick,
  getPeddlerTypeColor,
  animationSettings,
  preferReducedMotion,
  onViewAllPeddlers,
}: PeddlerSectionProps) {
  const displayType = type.replace("_", " ");
  const isDropdownOpen = activeDropdowns.includes(type);
  const colorClass = getPeddlerTypeColor(type);

  // Calculate max peddlers to show (show at most 3 peddlers in the dropdown)
  const maxPeddlersToShow = 3;
  const hasMorePeddlers = peddlersForType.length > maxPeddlersToShow;
  const peddlersToDisplay = hasMorePeddlers
    ? peddlersForType.slice(0, maxPeddlersToShow)
    : peddlersForType;

  return (
    <div className="peddler-section border border-gray-100 rounded-xl overflow-hidden shadow-sm">
      <div
        className={cn(
          "flex items-center justify-between p-3 cursor-pointer text-xs hover:bg-gray-50 transition-all",
          isDropdownOpen ? "border-b border-gray-100" : ""
        )}
        onClick={(e) => {
          e.stopPropagation();
          toggleDropdown(type);
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isDropdownOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleDropdown(type);
          }
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-6 w-6 rounded-full flex items-center justify-center",
              colorClass
            )}
          >
            <MapIcon className="h-3 w-3 text-white" />
          </div>
          <div>
            <span className="font-medium capitalize">
              {displayType} Peddlers
            </span>
            <Badge
              variant="secondary"
              className="ml-2 text-[10px] px-1.5 py-0 h-4"
            >
              {peddlersForType.length}
            </Badge>
          </div>
        </div>
        {isDropdownOpen ? (
          <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        )}
      </div>

      <AnimatePresence initial={false}>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={
              preferReducedMotion ? { duration: 0.1 } : { duration: 0.2 }
            }
            className="space-y-2 p-3 overflow-hidden bg-white"
          >
            {peddlersForType.length > 0 ? (
              <>
                <div className="space-y-2">
                  {peddlersToDisplay.map((peddler) => (
                    <PeddlerCard
                      key={peddler.id}
                      peddler={peddler}
                      selectedPeddlerId={selectedPeddlerId}
                      onPeddlerClick={onPeddlerClick}
                      getPeddlerTypeColor={getPeddlerTypeColor}
                      animationSettings={animationSettings}
                      preferReducedMotion={preferReducedMotion}
                    />
                  ))}
                </div>

                {hasMorePeddlers && (
                  <div
                    className="text-center text-xs text-blue-600 mt-2 py-1.5 cursor-pointer hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onViewAllPeddlers) {
                        onViewAllPeddlers();
                      }
                    }}
                  >
                    View {peddlersForType.length - maxPeddlersToShow} more...
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-xs text-gray-500 py-2">
                No nearby {displayType} peddlers at this time
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
