"use client";

import { useRef } from "react";
import { Send, ChevronUp, ChevronDown, MinusCircle } from "lucide-react";
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
  onMinimize?: () => void;
}

export function ChatInput({
  input,
  setInput,
  onFormSubmit,
  isLoading,
  isExpanded,
  toggleExpanded,
  inputRef,
  onMinimize,
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !(isLoading || !input.trim())) {
      onFormSubmit(e as unknown as React.FormEvent);
    } else if (e.key === "Escape") {
      if (isExpanded) {
        e.preventDefault();
        toggleExpanded();
      }
    }
  };

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
              : "Tanya saya atau cari pedagang keliling..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className={cn(
            "flex-1 h-10 border border-input bg-transparent transition-all duration-200 w-full",
            isLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-gray-50/50"
          )}
        />
        {isLoading && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center justify-center">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
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

      {onMinimize && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 rounded-full absolute -top-9 right-0 bg-white/90 shadow-sm flex items-center justify-center hover:bg-gray-100"
          onClick={onMinimize}
          aria-label="Hide chat"
          title="Hide chat"
        >
          <MinusCircle className="h-4 w-4" />
        </Button>
      )}
    </form>
  );
}
