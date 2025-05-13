import React from "react";
import { Clock, Navigation, MapPin, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateEstimatedArrival } from "@/lib/route-mapper";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RouteInfoProps {
  distanceText: string;
  durationText: string;
  durationValue: number;
  instructions: string[];
  vendorName: string;
  className?: string;
  onClose?: () => void;
}

export function RouteInfo({
  distanceText,
  durationText,
  durationValue,
  instructions,
  vendorName,
  className,
  onClose,
}: RouteInfoProps) {
  const estimatedArrival = calculateEstimatedArrival(durationValue);

  return (
    <Card className={cn("w-full overflow-hidden shadow-lg", className)}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Route to {vendorName}</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100"
            >
              <span className="sr-only">Close</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>{distanceText}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>{durationText}</span>
          </div>
        </div>

        <div className="mt-1 flex items-center text-xs text-gray-500">
          <Clock className="h-3.5 w-3.5 mr-1.5" />
          <span>Estimated arrival: {estimatedArrival}</span>
        </div>

        {instructions && instructions.length > 0 && (
          <div className="mt-3">
            <h4 className="text-xs font-medium mb-1.5">Directions</h4>
            <ScrollArea className="h-[120px] rounded border border-gray-100 bg-gray-50 p-2">
              <ol className="space-y-2 pl-1">
                {instructions.map((instruction, index) => (
                  <li
                    key={index}
                    className="flex items-start text-xs text-gray-600"
                  >
                    <span className="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[10px] text-white mr-2">
                      {index + 1}
                    </span>
                    <span dangerouslySetInnerHTML={{ __html: instruction }} />
                  </li>
                ))}
              </ol>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
