import React from "react";
import { Clock, Navigation, MapPin, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateEstimatedArrival, RouteDetails } from "@/lib/route-mapper";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "../ui/button";

interface RouteInfoProps {
  routeDetails: RouteDetails;
  vendorName: string;
  className?: string;
  showRoute: boolean;
  onToggleRoute?: () => void;
}

export function RouteInfo({
  routeDetails,
  vendorName,
  className,
  showRoute,
  onToggleRoute,
}: RouteInfoProps) {
  // Extract the route details
  const { distance, duration, instructions } = routeDetails;
  const estimatedArrival = calculateEstimatedArrival(duration.value);

  return (
    <Card className={cn("w-full overflow-hidden border-0", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Rute ke {vendorName}</h3>
          {onToggleRoute && (
            <Button
              variant={showRoute ? "default" : "outline"}
              size="sm"
              className="h-8 rounded-full flex items-center gap-1.5"
              onClick={onToggleRoute}
            >
              <Navigation className="h-3.5 w-3.5" />
              {showRoute ? "Sembunyikan Rute" : "Tampilkan Rute"}
            </Button>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center space-x-1.5">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{distance.text}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Clock className="h-4 w-4 text-primary" />
            <span>{duration.text}</span>
          </div>
        </div>

        <div className="mt-2 flex items-center text-sm text-gray-500">
          <Clock className="h-4 w-4 mr-1.5" />
          <span>Estimasi tiba: {estimatedArrival}</span>
        </div>

        {instructions && instructions.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Petunjuk Arah</h4>
            <ScrollArea className="h-[200px] rounded border border-gray-100 bg-gray-50 p-3">
              <ol className="space-y-3 pl-1">
                {instructions.map((instruction, index) => (
                  <li
                    key={index}
                    className="flex items-start text-sm text-gray-600"
                  >
                    <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[11px] text-white mr-2">
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
