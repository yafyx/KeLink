"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VendorCard } from "./vendor-card";
import { Vendor } from "./floating-chat";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface VendorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendors: Vendor[];
  selectedVendorId?: string;
  onVendorClick?: (vendor: Vendor) => void;
  getVendorTypeColor: (type: string) => string;
  animationSettings: any;
  preferReducedMotion: boolean | null | undefined;
}

export function VendorSheet({
  open,
  onOpenChange,
  vendors,
  selectedVendorId,
  onVendorClick,
  getVendorTypeColor,
  animationSettings,
  preferReducedMotion,
}: VendorSheetProps) {
  // Group vendors by type
  const vendorsByType: Record<string, Vendor[]> = {};

  vendors.forEach((vendor) => {
    if (!vendorsByType[vendor.type]) {
      vendorsByType[vendor.type] = [];
    }
    vendorsByType[vendor.type].push(vendor);
  });

  // Get the types for tab creation
  const vendorTypes = Object.keys(vendorsByType);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] p-0 pt-0 rounded-t-xl">
        <SheetHeader className="px-4 pt-6 pb-2">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
          <SheetTitle className="text-center">Pedagang Terdekat</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue={vendorTypes[0]} className="w-full">
          <TabsList className="w-full h-auto flex overflow-x-auto px-4 py-2 bg-transparent rounded-none gap-2 justify-start">
            {vendorTypes.map((type) => (
              <TabsTrigger
                key={type}
                value={type}
                className="px-3 py-1.5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-1.5"
              >
                <span className="capitalize">{type.replace("_", " ")}</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-1 h-5 min-w-5 p-0 flex items-center justify-center",
                    "data-[state=active]:bg-white data-[state=active]:text-primary"
                  )}
                >
                  {vendorsByType[type].length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {vendorTypes.map((type) => (
            <TabsContent key={type} value={type} className="m-0 p-0">
              <ScrollArea className="h-[calc(85vh-110px)] px-4 py-2">
                <div className="space-y-3">
                  {vendorsByType[type].map((vendor) => (
                    <VendorCard
                      key={vendor.id}
                      vendor={vendor}
                      selectedVendorId={selectedVendorId}
                      onVendorClick={(v) => {
                        onVendorClick && onVendorClick(v);
                        onOpenChange(false);
                      }}
                      getVendorTypeColor={getVendorTypeColor}
                      animationSettings={animationSettings}
                      preferReducedMotion={preferReducedMotion}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
