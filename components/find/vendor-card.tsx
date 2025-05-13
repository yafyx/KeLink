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
  const isSelected = selectedVendorId === vendor.id;
  const colorClass = getVendorTypeColor(vendor.type);

  return (
    <motion.div
      key={vendor.id}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={preferReducedMotion ? { duration: 0.1 } : { duration: 0.2 }}
      data-vendor-id={vendor.id}
      className={cn(
        "p-3 rounded-xl transition-all border hover:shadow-md text-xs flex gap-3",
        isSelected
          ? "bg-primary/5 border-primary shadow-sm"
          : "border-gray-100 hover:border-gray-200 bg-white"
      )}
      onClick={() => onVendorClick?.(vendor)}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onVendorClick?.(vendor);
        }
      }}
    >
      <div
        className={cn(
          "h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-medium shadow-sm",
          colorClass
        )}
      >
        {vendor.name.charAt(0)}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex justify-between items-start gap-1 mb-1">
          <div className="font-medium truncate">{vendor.name}</div>
          <Badge
            variant={vendor.status === "active" ? "default" : "secondary"}
            className={cn(
              "text-[9px] h-4 px-1 flex-shrink-0",
              vendor.status === "active"
                ? "bg-green-500 hover:bg-green-500/90"
                : "bg-gray-200 text-gray-700"
            )}
          >
            {vendor.status === "active" ? "Active" : "Not Active"}
          </Badge>
        </div>

        {vendor.description && (
          <p className="text-[10px] text-gray-600 line-clamp-2 mb-1.5">
            {vendor.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto">
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
    </motion.div>
  );
}
