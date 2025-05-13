"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock } from "lucide-react";
import { motion } from "framer-motion";
import type { Vendor } from "./floating-chat"; // Import type

interface VendorCardProps {
  vendor: Vendor;
  selectedVendorId?: string;
  onVendorClick?: (vendor: Vendor) => void;
  getVendorTypeColor: (type: string) => string;
  animationSettings: any; // Simplified for now, could be more specific
  preferReducedMotion: boolean | null | undefined;
}

export function VendorCard({
  vendor,
  selectedVendorId,
  onVendorClick,
  getVendorTypeColor,
  animationSettings, // In FloatingChat, this is an object with a transition property
  preferReducedMotion,
}: VendorCardProps) {
  // The ref forwarding logic for scrolling the selected card into view
  // needs to be handled carefully. The original component uses a direct child ref.
  // For now, we'll render the card and the parent (`VendorSection` or `ChatMessage`) will manage the ref.

  return (
    <motion.div
      key={vendor.id}
      // The ref logic from the original component is complex and might be better handled
      // by the parent component that manages the scroll container (vendorListRef).
      // For now, we remove the direct ref assignment here.
      // ref={selectedVendorId === vendor.id ? (node) => { ... } : undefined}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={preferReducedMotion ? { duration: 0.1 } : { duration: 0.2 }}
      data-vendor-id={vendor.id}
      className={cn(
        "p-3 rounded-xl transition-all border hover:shadow-md text-xs",
        selectedVendorId === vendor.id
          ? "bg-primary/5 shadow-md border-primary"
          : "border-gray-100 hover:border-gray-200"
      )}
      onClick={() => onVendorClick?.(vendor)}
      tabIndex={0}
      role="button"
      aria-pressed={selectedVendorId === vendor.id}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onVendorClick?.(vendor);
        }
      }}
    >
      <div className="flex items-start gap-2">
        <div
          className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium shadow-sm",
            getVendorTypeColor(vendor.type)
          )}
        >
          {vendor.name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div className="font-medium">{vendor.name}</div>
            <Badge
              variant={vendor.status === "active" ? "default" : "secondary"}
              className="text-[9px] h-4 ml-2"
            >
              {vendor.status === "active" ? "Aktif" : "Tidak Aktif"}
            </Badge>
          </div>
          {vendor.description && (
            <div className="text-[10px] mt-1 text-gray-700 leading-relaxed">
              {vendor.description}
            </div>
          )}
          <div className="flex items-center justify-between mt-1.5">
            <div className="flex items-center text-[9px] text-muted-foreground bg-gray-50 px-1.5 py-0.5 rounded-full">
              <MapPin className="h-2.5 w-2.5 mr-0.5 text-gray-400" />
              <span>{vendor.distance}</span>
            </div>
            <div className="flex items-center text-[9px] text-muted-foreground bg-gray-50 px-1.5 py-0.5 rounded-full">
              <Clock className="h-2.5 w-2.5 mr-0.5 text-gray-400" />
              <span>{vendor.last_active}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
