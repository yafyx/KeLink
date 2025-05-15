"use client";

import { MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { ChatMessagesContainer } from "./chat-messages-container";
import { TypingIndicator } from "./typing-indicator";
import type { Message, Peddler } from "./floating-chat";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  validVendors: Peddler[];
  activeDropdowns: string[];
  toggleDropdown: (type: string) => void;
  selectedVendorId?: string;
  onVendorClick?: (peddler: Peddler) => void;
  getVendorTypeColor: (type: string) => string;
  animationSettings: any;
  preferReducedMotion: boolean | null | undefined;
  bubbleClassName?: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  toggleExpanded: () => void;
  onViewAllVendors?: () => void;
  className?: string;
}

export function MessageList({
  messages,
  isLoading,
  validVendors,
  activeDropdowns,
  toggleDropdown,
  selectedVendorId,
  onVendorClick,
  getVendorTypeColor,
  animationSettings,
  preferReducedMotion,
  bubbleClassName,
  messagesEndRef,
  toggleExpanded,
  onViewAllVendors,
  className,
}: MessageListProps) {
  const messagesEndRefInternal = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRefInternal.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="h-[350px] relative">
        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
          <MessageSquare className="h-12 w-12 mb-2 opacity-20" />
          <p className="text-sm mb-1">No conversation yet</p>
          <p className="text-xs">Search for street peddlers to start</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${
        messages.length > 3 ? "h-[350px]" : "h-auto max-h-[350px]"
      } ${className}`}
    >
      {/* Main chat container that adapts to content height */}
      <div className="h-full relative overflow-hidden">
        <ScrollArea className={cn("flex-1 p-4", className)}>
          <div className="flex flex-col gap-3">
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={cn(
                  "flex items-start gap-3",
                  message.role === "user" && "flex-row-reverse"
                )}
              >
                <Avatar
                  className={cn(
                    "h-8 w-8",
                    message.role === "user" && "bg-primary",
                    message.role === "assistant" && "bg-muted",
                    message.role === "function" && "bg-yellow-500"
                  )}
                >
                  {message.role === "user" && (
                    <span className="text-xs text-white">You</span>
                  )}
                  {message.role === "assistant" && (
                    <span className="text-xs">AI</span>
                  )}
                  {message.role === "function" && (
                    <span className="text-xs text-white">Fn</span>
                  )}
                </Avatar>
                <div
                  className={cn(
                    "rounded-lg px-4 py-2 max-w-[80%]",
                    message.role === "user" &&
                      "bg-primary text-primary-foreground",
                    message.role === "assistant" && "bg-muted",
                    message.role === "function" &&
                      "bg-yellow-100 text-yellow-900",
                    message.pending && "opacity-70",
                    bubbleClassName
                  )}
                >
                  {message.pending ? (
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-current animate-bounce" />
                      <div
                        className="h-2 w-2 rounded-full bg-current animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <div
                        className="h-2 w-2 rounded-full bg-current animate-bounce"
                        style={{ animationDelay: "0.4s" }}
                      />
                    </div>
                  ) : message.role === "assistant" ? (
                    <div className="markdown-content">
                      <ReactMarkdown
                        rehypePlugins={[rehypeRaw, rehypeSanitize]}
                        components={{
                          a: ({ node, ...props }) => (
                            <a
                              {...props}
                              className="text-blue-600 hover:underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            />
                          ),
                          p: ({ node, ...props }) => (
                            <p {...props} className="mb-2" />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul {...props} className="list-disc pl-5 mb-2" />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol {...props} className="list-decimal pl-5 mb-2" />
                          ),
                          li: ({ node, ...props }) => (
                            <li {...props} className="mb-1" />
                          ),
                          h1: ({ node, ...props }) => (
                            <h1 {...props} className="text-xl font-bold mb-2" />
                          ),
                          h2: ({ node, ...props }) => (
                            <h2 {...props} className="text-lg font-bold mb-2" />
                          ),
                          h3: ({ node, ...props }) => (
                            <h3 {...props} className="text-md font-bold mb-2" />
                          ),
                          code: ({
                            node,
                            inline,
                            className,
                            children,
                            ...props
                          }: {
                            node?: any;
                            inline?: boolean;
                            className?: string;
                            children?: React.ReactNode;
                          } & React.HTMLAttributes<HTMLElement>) => {
                            const match = /language-(\w+)/.exec(
                              className || ""
                            );
                            return !inline && match ? (
                              <pre
                                className={cn(
                                  "bg-gray-100 p-2 rounded overflow-x-auto mb-2",
                                  className
                                )}
                                {...props}
                              >
                                <code>{children}</code>
                              </pre>
                            ) : (
                              <code
                                className={cn(
                                  "bg-gray-100 px-1 py-0.5 rounded text-sm",
                                  className
                                )}
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                          pre: ({
                            node,
                            children,
                            ...props
                          }: {
                            node?: any;
                            children?: React.ReactNode;
                          } & React.HTMLAttributes<HTMLPreElement>) => (
                            <pre
                              {...props}
                              className="bg-gray-100 p-2 rounded overflow-x-auto mb-2"
                            >
                              {children}
                            </pre>
                          ),
                          blockquote: ({ node, ...props }) => (
                            <blockquote
                              {...props}
                              className="border-l-4 border-gray-300 pl-4 italic"
                            />
                          ),
                          table: ({ node, ...props }) => (
                            <div className="overflow-x-auto">
                              <table
                                {...props}
                                className="min-w-full divide-y divide-gray-200"
                              />
                            </div>
                          ),
                          th: ({ node, ...props }) => (
                            <th
                              {...props}
                              className="px-3 py-2 bg-gray-100 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                            />
                          ),
                          td: ({ node, ...props }) => (
                            <td
                              {...props}
                              className="px-3 py-2 whitespace-nowrap text-sm"
                            />
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div>{message.content}</div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRefInternal} />
          </div>
        </ScrollArea>

        {/* Typing indicator at the bottom */}
        {isLoading && (
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 p-4 pb-2 bg-white bg-opacity-90 z-10">
            <Avatar className="h-6 w-6">
              <div className="bg-primary text-xs text-white flex items-center justify-center h-full rounded-full">
                K
              </div>
            </Avatar>
            <div className="bg-gray-100 rounded-2xl px-4 py-2.5 rounded-tl-none">
              <TypingIndicator />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
