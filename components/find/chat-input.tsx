"use client";

import { FormEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  className?: string;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  inputRef,
  className,
}: ChatInputProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex items-center gap-2 p-2", className)}
    >
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type a message..."
        disabled={isLoading}
        className="flex-1"
      />
      <Button
        type="submit"
        size="icon"
        disabled={isLoading || !value.trim()}
        className={cn("h-8 w-8 rounded-full", !value.trim() && "opacity-50")}
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
