"use client";

import { Button } from "@/components/ui/button";
import { MapIcon, ArrowRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewAllPeddlersButtonProps {
  onClick: () => void;
  peddlerCount: number;
  className?: string;
}

export function ViewAllPeddlersButton({
  onClick,
  peddlerCount,
  className,
}: ViewAllPeddlersButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn(
        "mt-2 w-full justify-between text-xs bg-gray-50 border-gray-200 hover:bg-gray-100",
        className
      )}
    >
      <div className="flex items-center">
        <MapIcon className="h-3.5 w-3.5 mr-1.5" />
        <span>View all nearby peddlers</span>
      </div>
      <div className="flex items-center">
        <span className="text-muted-foreground mr-1.5">{peddlerCount}</span>
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </div>
    </Button>
  );
}
