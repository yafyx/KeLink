"use client";

import { MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  toggleExpanded: () => void;
}

export function ChatHeader({ toggleExpanded }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-3 border-b">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        <span className="font-medium">KeLink Ask</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-full -mr-1"
        onClick={toggleExpanded}
        aria-label="Close panel"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
