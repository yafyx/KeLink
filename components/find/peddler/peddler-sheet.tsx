"use client";

import { MapPin, Navigation, Clock, Phone, MapIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaBody,
  CredenzaFooter,
  CredenzaClose,
} from "@/components/ui/credenza";
import { cn } from "@/lib/utils";
import type { Peddler } from "@/lib/peddlers";

interface PeddlerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  peddler?: Peddler;
  onViewRoute?: () => void;
}

export function PeddlerSheet({
  open,
  onOpenChange,
  peddler,
  onViewRoute,
}: PeddlerSheetProps) {
  if (!peddler) return null;

  // Get peddler type color
  const getPeddlerTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      bakso: "bg-red-500",
      siomay: "bg-blue-500",
      batagor: "bg-yellow-500",
      es_cendol: "bg-green-500",
      "es cendol": "bg-green-500",
      es_cincau: "bg-emerald-500",
      "es cincau": "bg-emerald-500",
      sate: "bg-orange-500",
      sate_padang: "bg-orange-500",
      "sate padang": "bg-orange-500",
      martabak: "bg-purple-500",
    };

    return colors[type.toLowerCase()] || "bg-gray-500";
  };

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="max-w-md mx-auto">
        <CredenzaHeader className="pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-3 h-3 rounded-full",
                  getPeddlerTypeColor(peddler.type)
                )}
              />
              <CredenzaTitle className="text-xl">{peddler.name}</CredenzaTitle>
            </div>
            <CredenzaClose className="rounded-full w-8 h-8 hover:bg-gray-100 flex items-center justify-center">
              <X className="h-4 w-4" />
            </CredenzaClose>
          </div>
          <div className="flex justify-between items-center mt-1">
            <Badge variant="outline" className="capitalize">
              {peddler.type.replace("_", " ")}
            </Badge>
            <Badge
              variant={peddler.status === "active" ? "default" : "secondary"}
              className={cn(
                "text-xs",
                peddler.status === "active"
                  ? "bg-green-500 hover:bg-green-600"
                  : ""
              )}
            >
              {peddler.status === "active" ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CredenzaHeader>

        <CredenzaBody className="px-4 py-2">
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {/* Description */}
              <p className="text-sm text-gray-600">
                {peddler.description || `${peddler.type} street peddler`}
              </p>

              {/* Location and timing info */}
              <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-md">
                <div className="flex items-center text-sm text-gray-600 gap-2">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>
                    {peddler.distance
                      ? `${peddler.distance} from your location`
                      : "Location available on map"}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600 gap-2">
                  <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Last active: {peddler.last_active}</span>
                </div>
              </div>

              {/* Map preview placeholder */}
              <div className="relative aspect-video bg-gray-100 rounded-md overflow-hidden flex flex-col items-center justify-center">
                <MapIcon className="h-10 w-10 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">
                  View {peddler.name}'s location on the map
                </p>
              </div>

              {/* Additional info - can be filled with more data when available */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Notes</h4>
                <p className="text-sm text-gray-600">
                  Peddler availability may change. Please contact the peddler
                  for more information.
                </p>
              </div>
            </div>
          </ScrollArea>
        </CredenzaBody>

        <CredenzaFooter>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            {onViewRoute && (
              <Button className="flex-1 gap-1" onClick={onViewRoute}>
                <Navigation className="h-4 w-4" />
                View Route
              </Button>
            )}
          </div>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
