"use client";

import { VendorCard } from "./vendor-card";
import type { Vendor } from "./floating-chat";
import { ChevronUp, ChevronDown, MapIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface VendorSectionProps {
  type: string;
  vendorsForType: Vendor[];
  activeDropdowns: string[];
  toggleDropdown: (type: string) => void;
  selectedVendorId?: string;
  onVendorClick?: (vendor: Vendor) => void;
  getVendorTypeColor: (type: string) => string;
  animationSettings: any;
  preferReducedMotion: boolean | null | undefined;
  onViewAllVendors?: () => void;
}

export function VendorSection({
  type,
  vendorsForType,
  activeDropdowns,
  toggleDropdown,
  selectedVendorId,
  onVendorClick,
  getVendorTypeColor,
  animationSettings,
  preferReducedMotion,
  onViewAllVendors,
}: VendorSectionProps) {
  const displayType = type.replace("_", " ");
  const isDropdownOpen = activeDropdowns.includes(type);
  const colorClass = getVendorTypeColor(type);

  // Calculate max vendors to show (show at most 3 vendors in the dropdown)
  const maxVendorsToShow = 3;
  const hasMoreVendors = vendorsForType.length > maxVendorsToShow;
  const vendorsToDisplay = hasMoreVendors
    ? vendorsForType.slice(0, maxVendorsToShow)
    : vendorsForType;

  return (
    <div className="vendor-section border border-gray-100 rounded-xl overflow-hidden shadow-sm">
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
              Penjual {displayType}
            </span>
            <Badge
              variant="secondary"
              className="ml-2 text-[10px] px-1.5 py-0 h-4"
            >
              {vendorsForType.length}
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
            {vendorsForType.length > 0 ? (
              <>
                <div className="space-y-2">
                  {vendorsToDisplay.map((vendor) => (
                    <VendorCard
                      key={vendor.id}
                      vendor={vendor}
                      selectedVendorId={selectedVendorId}
                      onVendorClick={onVendorClick}
                      getVendorTypeColor={getVendorTypeColor}
                      animationSettings={animationSettings}
                      preferReducedMotion={preferReducedMotion}
                    />
                  ))}
                </div>

                {hasMoreVendors && (
                  <div
                    className="text-center text-xs text-blue-600 mt-2 py-1.5 cursor-pointer hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onViewAllVendors) {
                        onViewAllVendors();
                      }
                    }}
                  >
                    Lihat {vendorsForType.length - maxVendorsToShow} lainnya...
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-xs text-gray-500 py-2">
                Tidak ada penjual {displayType} terdekat saat ini
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
