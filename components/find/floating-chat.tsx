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
      data?: Record<string, any>;
    }
  ) => Promise<string | null>;
  onRequestClientLocation?: () => Promise<{ lat: number; lng: number } | null>;
  isLoading: boolean;
  chatError?: Error | null;
  reloadChat?: () => void;
  setUserLocation?: React.Dispatch<
    React.SetStateAction<{ lat: number; lng: number } | null>
  >;
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
  reloadChat,
  setUserLocation,
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

                {messages.map((m: AiSdkMessage) => {
                  const isAIMessage = m.role !== "user";
                  const locationRequestTriggerPhrase = "I need your location";
                  const aiRequestsLocation =
                    isAIMessage &&
                    m.content
                      .toLowerCase()
                      .includes(locationRequestTriggerPhrase.toLowerCase());

                  const showLocationButtonFromAIContent =
                    aiRequestsLocation && reloadChat && setUserLocation;

                  return (
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

                        {showLocationButtonFromAIContent && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 text-xs py-1 px-2 h-auto"
                            onClick={() => {
                              if (
                                navigator.geolocation &&
                                setUserLocation &&
                                append
                              ) {
                                navigator.geolocation.getCurrentPosition(
                                  (position) => {
                                    const newLocation = {
                                      lat: position.coords.latitude,
                                      lng: position.coords.longitude,
                                    };
                                    setUserLocation(newLocation);
                                    append({
                                      role: "user",
                                      content:
                                        "I have provided my location. Please try my previous request again.",
                                    });
                                  },
                                  (error) => {
                                    console.error(
                                      "Error getting location:",
                                      error
                                    );
                                    alert(
                                      "Failed to get location. Please ensure location services are enabled."
                                    );
                                  }
                                );
                              } else {
                                alert(
                                  "Geolocation is not supported or action cannot be performed."
                                );
                              }
                            }}
                          >
                            Use My Location & Retry
                          </Button>
                        )}

                        {m.toolInvocations?.map((toolInvocation) => {
                          const { toolCallId, toolName, state } =
                            toolInvocation;
                          let statusContent: React.ReactNode = null;

                          if (state === "call") {
                            statusContent = (
                              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
                                <span className="h-2 w-2 bg-primary/60 rounded-full animate-pulse"></span>
                                <span>Processing {toolName}...</span>
                              </div>
                            );
                          } else if (state === "result") {
                            const resultDisplay = toolInvocation.result;
                            let parsedResult: any = null;
                            let isLocationRequiredFromTool = false;
                            let uiMessageForResult = "";

                            try {
                              if (typeof resultDisplay === "string") {
                                parsedResult = JSON.parse(resultDisplay);
                              } else if (
                                typeof resultDisplay === "object" &&
                                resultDisplay !== null
                              ) {
                                parsedResult = resultDisplay;
                              }

                              if (
                                parsedResult &&
                                parsedResult.status === "LOCATION_REQUIRED"
                              ) {
                                isLocationRequiredFromTool = true;
                                uiMessageForResult =
                                  parsedResult.uiMessage ||
                                  "Location is required to proceed.";
                              } else if (
                                parsedResult &&
                                parsedResult.uiMessage
                              ) {
                                uiMessageForResult = parsedResult.uiMessage;
                              }
                            } catch (e) {
                              // Not a JSON string we care about for structured status, or malformed
                            }

                            if (isLocationRequiredFromTool) {
                              statusContent = (
                                <div className="mt-1.5 text-xs">
                                  <p className="text-gray-700 mb-2">
                                    {uiMessageForResult}
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs py-1 px-2 h-auto"
                                    onClick={async () => {
                                      if (onRequestClientLocation) {
                                        try {
                                          const location =
                                            await onRequestClientLocation();
                                          if (location) {
                                            append(
                                              {
                                                role: "user",
                                                content:
                                                  "My location has been updated. Please try again.",
                                              },
                                              {
                                                data: {
                                                  userLocation: location,
                                                },
                                              }
                                            );
                                          } else {
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
                                            "Error requesting client location:",
                                            error
                                          );
                                          alert(
                                            "An error occurred while trying to fetch your location."
                                          );
                                        }
                                      } else {
                                        console.warn(
                                          "onRequestClientLocation prop not provided for tool button."
                                        );
                                        append({
                                          role: "user",
                                          content:
                                            "Location action for tool is not fully configured. Please use the main page button or retry.",
                                        });
                                      }
                                    }}
                                  >
                                    Use My Location & Retry (Tool)
                                  </Button>
                                </div>
                              );
                            } else {
                              statusContent = (
                                <div className="mt-1.5 text-xs bg-gray-100 p-2 rounded-lg overflow-x-auto">
                                  <p className="font-medium mb-1 text-xs">
                                    Result for {toolName}:
                                  </p>
                                  <span className="text-gray-700 text-xs">
                                    {uiMessageForResult
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

                          return statusContent ? (
                            <div key={toolCallId} className="mt-2">
                              {statusContent}
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  );
                })}
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
