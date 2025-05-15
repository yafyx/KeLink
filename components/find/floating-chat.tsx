"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
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
  isLoading: boolean;
  chatError?: Error | null;
}

export function FloatingChat({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  chatError,
}: FloatingChatProps) {
  const [isChatExpanded, setIsChatExpanded] = useState(false);
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
                  <div className="flex justify-center py-4">
                    <div className="max-w-[90%] text-center rounded-xl px-4 py-3 bg-white border border-gray-100 shadow-sm">
                      <p className="text-sm text-gray-700 font-medium">
                        Welcome!
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        How can I help you find nearby food vendors or get
                        directions today?
                      </p>
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
                      <div className="prose prose-sm max-w-none">
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
                                      : "block text-xs p-2 my-2 overflow-x-auto",
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
                                  className="bg-gray-100 rounded-md p-0 my-2"
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
                          statusContent = (
                            <div className="mt-1.5 text-xs bg-gray-100 p-2 rounded-lg overflow-x-auto">
                              <p className="font-medium mb-1">Result:</p>
                              <span className="text-gray-700">
                                {typeof resultDisplay === "string"
                                  ? resultDisplay
                                  : JSON.stringify(resultDisplay, null, 2)}
                              </span>
                            </div>
                          );
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
        className="w-full max-w-md flex gap-3 bg-white/90 backdrop-blur-md p-5 rounded-full shadow-lg border border-gray-100"
      >
        <input
          className="flex-1 p-2 px-3 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
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
