"use client";

import { useRef } from "react";
import { Send, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onFormSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  isExpanded: boolean;
  toggleExpanded: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function ChatInput({
  input,
  setInput,
  onFormSubmit,
  isLoading,
  isExpanded,
  toggleExpanded,
  inputRef,
}: ChatInputProps) {
  // const inputRef = useRef<HTMLInputElement>(null);

  // Return focus to input after sending (moved logic to parent if needed elsewhere)
  // useEffect(() => {
  //   if (!isLoading && isExpanded) { // Assuming we only focus when expanded
  //     inputRef.current?.focus();
  //   }
  // }, [isLoading, isExpanded]); // Need isExpanded state here

  return (
    <form
      onSubmit={onFormSubmit}
      className="flex items-center gap-2 p-2 relative"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all duration-200"
        onClick={toggleExpanded}
        aria-label={isExpanded ? "Minimize chat" : "Expand chat"}
        title={isExpanded ? "Minimize chat" : "Expand chat"}
      >
        {isExpanded ? (
          <ChevronDown className="h-5 w-5" />
        ) : (
          <ChevronUp className="h-5 w-5" />
        )}
      </Button>
      <div className="relative flex-1">
        <Input
          ref={inputRef}
          type="text"
          placeholder={
            isLoading
              ? "Menunggu..."
              : "Ask for vendors nearby... (e.g., 'Cari siomay dekat sini?')"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !(isLoading || !input.trim())
            ) {
              onFormSubmit(e as unknown as React.FormEvent);
            } else if (e.key === "Escape") {
              if (isExpanded) {
                e.preventDefault();
                toggleExpanded();
              }
            }
          }}
          disabled={isLoading}
          className={cn(
            "flex-1 h-10 border border-input bg-transparent transition-all duration-200 w-full",
            isLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-gray-50/50"
          )}
        />
      </div>
      <Button
        type="submit"
        size="icon"
        disabled={isLoading || !input.trim()}
        className={cn(
          "h-10 w-10 rounded-full transition-all duration-200",
          input.trim()
            ? "bg-primary hover:bg-primary/90 scale-100"
            : "bg-gray-200 scale-95"
        )}
      >
        <Send
          className={cn(
            "h-4 w-4",
            input.trim() ? "text-white" : "text-gray-400"
          )}
        />
      </Button>
    </form>
  );
}
