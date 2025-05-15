"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MessageCircle, X, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import { type Message as AiSdkMessage } from "@ai-sdk/react";

interface FloatingChatProps {
  messages: AiSdkMessage[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  append: (
    message: AiSdkMessage | Omit<AiSdkMessage, "id">,
    options?: {
      data?: Record<string, any>; // Changed from string to any for flexibility
    }
  ) => Promise<string | null>;
  onRequestClientLocation?: () => Promise<{ lat: number; lng: number } | null>;
  isLoading: boolean;
  chatError?: Error | null;
}

export function FloatingChat({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  append,
  onRequestClientLocation,
  isLoading,
  chatError,
}: FloatingChatProps) {
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const prevMessagesLength = useRef(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Check for new messages when messages array changes
  useEffect(() => {
    if (!isChatExpanded && messages.length > prevMessagesLength.current) {
      setHasUnreadMessages(true);
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length, isChatExpanded]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current && messages.length > 0) {
      const scrollContainer = chatContainerRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  const handleToggleChat = () => {
    setIsChatExpanded((prev) => !prev);
    if (hasUnreadMessages) {
      setHasUnreadMessages(false);
    }
  };

  return (
    <div className="fixed bottom-8 left-0 right-0 z-20 mx-auto flex flex-col items-center">
      <AnimatePresence mode="wait">
        {isChatExpanded && (
          <motion.div
            key="expanded-chat"
            className="w-full max-w-md mx-auto mb-[-20px] px-4 sm:px-0 sm:max-w-105"
            initial={{ opacity: 0, y: 80, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-white/90 py-4 backdrop-blur-md shadow-lg rounded-2xl overflow-hidden border border-gray-100">
              <div
                ref={chatContainerRef}
                className="min-h-32 max-h-96 overflow-y-auto p-4 space-y-3 bg-gray-50/50 scroll-smooth"
              >
                {messages.length === 0 && !isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl px-4 py-2 bg-white border border-gray-100 rounded-bl-none shadow-sm">
                      <div className="prose prose-xs max-w-none text-sm">
                        <p>Welcome!</p>
                        <p>
                          How can I help you find nearby food vendors or get
                          directions today?
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((m: AiSdkMessage) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex",
                      m.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2 shadow-sm",
                        m.role === "user"
                          ? "bg-primary text-white rounded-br-none"
                          : "bg-white border border-gray-100 rounded-bl-none"
                      )}
                    >
                      <div className="prose prose-xs max-w-none text-sm">
                        <ReactMarkdown
                          rehypePlugins={[rehypeSanitize, rehypeHighlight]}
                          components={{
                            code({
                              node,
                              inline,
                              className,
                              children,
                              ...props
                            }: any) {
                              return (
                                <code
                                  className={cn(
                                    "bg-gray-100 rounded px-1 py-0.5",
                                    inline
                                      ? "text-xs"
                                      : "block text-xs p-2 my-1 overflow-x-auto",
                                    className
                                  )}
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            },
                            pre({ children, ...props }: any) {
                              return (
                                <pre
                                  className="bg-gray-100 rounded-md p-0 my-1 text-xs"
                                  {...props}
                                >
                                  {children}
                                </pre>
                              );
                            },
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>

                      {m.toolInvocations?.map((toolInvocation) => {
                        const { toolCallId, toolName, state } = toolInvocation;
                        let statusContent = null;

                        if (state === "call") {
                          statusContent = (
                            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
                              <span className="h-2 w-2 bg-primary/60 rounded-full animate-pulse"></span>
                              <span>Processing {toolName}...</span>
                            </div>
                          );
                        } else if (state === "result") {
                          const resultDisplay = toolInvocation.result;
                          let parsedResult = null;
                          let isLocationRequired = false;
                          let uiMessageForResult = "";

                          try {
                            if (typeof resultDisplay === "string") {
                              parsedResult = JSON.parse(resultDisplay);
                            } else if (
                              typeof resultDisplay === "object" &&
                              resultDisplay !== null
                            ) {
                              parsedResult = resultDisplay; // Already an object
                            }

                            if (
                              parsedResult &&
                              parsedResult.status === "LOCATION_REQUIRED"
                            ) {
                              isLocationRequired = true;
                              uiMessageForResult =
                                parsedResult.uiMessage ||
                                "Location is required to proceed.";
                            } else if (parsedResult && parsedResult.uiMessage) {
                              // For other structured messages from tools that have a uiMessage
                              uiMessageForResult = parsedResult.uiMessage;
                            }
                          } catch (e) {
                            // Not a JSON string we care about, or malformed
                          }

                          if (isLocationRequired) {
                            statusContent = (
                              <div className="mt-1.5 text-xs">
                                <p className="text-gray-700 mb-2">
                                  {uiMessageForResult}
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    if (onRequestClientLocation) {
                                      try {
                                        const location =
                                          await onRequestClientLocation();
                                        console.log(
                                          "!!! FLOATING CHAT - Location obtained by onRequestClientLocation:",
                                          JSON.stringify(location)
                                        );
                                        if (location) {
                                          console.log(
                                            "!!! FLOATING CHAT - Appending with EXPLICIT userLocation:",
                                            JSON.stringify(location)
                                          );
                                          append(
                                            {
                                              role: "user",
                                              content:
                                                "My location has been updated. Please try finding peddlers again.",
                                            },
                                            {
                                              data: { userLocation: location },
                                            }
                                          );
                                        } else {
                                          console.log(
                                            "!!! FLOATING CHAT - Location NOT obtained, appending failure message."
                                          );
                                          alert(
                                            "Could not get your location. Please ensure location services are enabled or try the main 'Locate Me' button."
                                          );
                                          append({
                                            role: "user",
                                            content:
                                              "I tried to share my location, but it failed.",
                                          });
                                        }
                                      } catch (error) {
                                        console.error(
                                          "!!! FLOATING CHAT - Error requesting client location:",
                                          error
                                        );
                                        alert(
                                          "An error occurred while trying to fetch your location."
                                        );
                                      }
                                    } else {
                                      console.warn(
                                        "!!! FLOATING CHAT - onRequestClientLocation prop not provided."
                                      );
                                      append({
                                        role: "user",
                                        content:
                                          "I understand I need to share my location. How can I do that?",
                                      });
                                    }
                                  }}
                                  className="text-xs py-1 px-2 h-auto"
                                >
                                  Use My Location & Retry
                                </Button>
                              </div>
                            );
                          } else {
                            statusContent = (
                              <div className="mt-1.5 text-xs bg-gray-100 p-2 rounded-lg overflow-x-auto">
                                <p className="font-medium mb-1 text-xs">
                                  Result:
                                </p>
                                <span className="text-gray-700 text-xs">
                                  {uiMessageForResult // Display parsed uiMessage if available
                                    ? uiMessageForResult
                                    : typeof resultDisplay === "string"
                                    ? resultDisplay
                                    : JSON.stringify(resultDisplay, null, 2)}
                                </span>
                              </div>
                            );
                          }
                        } else if (state === "partial-call") {
                          statusContent = (
                            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
                              <span className="h-2 w-2 bg-amber-400 rounded-full animate-pulse"></span>
                              <span>Loading {toolName}...</span>
                            </div>
                          );
                        }

                        return (
                          <div key={toolCallId} className="mt-2">
                            <div className="text-xs font-medium text-gray-500">
                              {toolName}
                            </div>
                            {statusContent}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {chatError && (
                <div className="px-4 py-2 bg-red-50 border-t border-red-100">
                  <p className="text-red-500 text-xs">{chatError.message}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md flex items-center gap-3 bg-white/90 backdrop-blur-md p-5 rounded-full shadow-lg border border-gray-100"
      >
        <Input
          className="flex-1 p-2 px-3 text-sm rounded-full shadow-none"
          value={input}
          placeholder={
            isLoading ? "AI is thinking..." : "Ask about food vendors..."
          }
          onChange={handleInputChange}
          disabled={isLoading}
        />
        <Button
          type="submit"
          disabled={isLoading}
          className="rounded-full px-4"
          aria-label="Send message"
        >
          {isLoading ? (
            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          onClick={handleToggleChat}
          className="rounded-full p-2 h-10 w-10 flex items-center justify-center relative"
          variant={isChatExpanded ? "outline" : "default"}
          aria-label={isChatExpanded ? "Hide chat" : "Show chat"}
        >
          <MessageCircle className="h-5 w-5" />
          {hasUnreadMessages && !isChatExpanded && (
            <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full animate-pulse border border-white" />
          )}
        </Button>
      </form>
    </div>
  );
}
