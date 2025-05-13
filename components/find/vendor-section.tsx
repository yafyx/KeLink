"use client";

import { Vendor, VendorCard } from "./vendor-card"; // Assuming Vendor type will be exported from vendor-card.tsx or a shared types file
import { ChevronUp, ChevronDown, MapIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VendorSectionProps {
  type: string;
  vendorsForType: Vendor[];
  activeDropdowns: string[];
  toggleDropdown: (type: string) => void;
  selectedVendorId?: string;
  onVendorClick?: (vendor: Vendor) => void;
  getVendorTypeColor: (type: string) => string;
  animationSettings: any; // From FloatingChat
  preferReducedMotion: boolean | null | undefined;
  // vendorListRef?: React.RefObject<HTMLDivElement>; // Optional, for scroll logic
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
}: VendorSectionProps) {
  const displayType = type.replace("_", " ");
  const isDropdownOpen = activeDropdowns.includes(type);

  return (
    <div className="vendor-section border border-gray-200 rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between bg-gray-100 px-3 py-2 cursor-pointer text-xs hover:bg-gray-200"
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
        <div className="flex items-center gap-1.5">
          <MapIcon className="h-3 w-3" />
          <span className="font-medium capitalize">
            Penjual {displayType} Terdekat ({vendorsForType.length})
          </span>
        </div>
        {isDropdownOpen ? (
          <ChevronUp className="h-3 w-3 text-gray-500" />
        ) : (
          <ChevronDown className="h-3 w-3 text-gray-500" />
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
            className="space-y-2 overflow-hidden p-2 bg-white"
          >
            {vendorsForType.length > 0 ? (
              vendorsForType.map((vendor) => (
                <VendorCard
                  key={vendor.id}
                  vendor={vendor}
                  selectedVendorId={selectedVendorId}
                  onVendorClick={onVendorClick}
                  getVendorTypeColor={getVendorTypeColor}
                  animationSettings={animationSettings} // Pass down
                  preferReducedMotion={preferReducedMotion} // Pass down
                  // The ref for scrolling selected card is tricky here.
                  // The original effect in FloatingChat might be better as it has access to vendorListRef.
                  // We'll rely on selectedVendorId for styling for now.
                />
              ))
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
