import { executeFunctionCall } from "@/lib/function-calling/functions";
import { FunctionSchema, ChatMessage as GeminiChatMessage, sendChatMessage, sendFunctionResult } from "@/lib/gemini";
import { useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";

// Message types
export type MessageRole = "user" | "assistant" | "function";

export interface Message {
    id: string;
    role: MessageRole;
    content: string;
    name?: string;
    pending?: boolean;
    functionCall?: {
        name: string;
        arguments: string;
    };
}

interface UseFunctionChatProps {
    userLocation: { lat: number; lng: number } | null;
    foundVendors: any[];
    onVendorResults?: (vendors: any[]) => void;
    onRouteResult?: (routeDetails: any) => void;
    onLocationRequest?: () => void;
    functionSchemas?: FunctionSchema[];
}

// Hook to manage chat with function calling capabilities
export function useFunctionChat(
    initialMessages: Message[] = [],
    {
        userLocation,
        foundVendors,
        onVendorResults,
        onRouteResult,
        onLocationRequest,
        functionSchemas,
    }: UseFunctionChatProps
) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingFunctionCall, setProcessingFunctionCall] = useState<string | null>(null);

    // Function to add a message to the chat
    const addMessage = useCallback((message: Omit<Message, "id">) => {
        const newMessage = {
            ...message,
            id: uuidv4(),
        };
        setMessages((prev) => [...prev, newMessage]);
        return newMessage;
    }, []);

    // Function to update a message in the chat
    const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
        setMessages((prev) =>
            prev.map((message) =>
                message.id === id ? { ...message, ...updates } : message
            )
        );
    }, []);

    // Function to handle the execution of function calls
    const handleFunctionCall = useCallback(
        async (functionCall: any, assistantMessageId: string) => {
            try {
                // Mark that we're processing a function call
                setProcessingFunctionCall(functionCall.name);

                // Add a function message placeholder
                const functionMessageId = addMessage({
                    role: "function",
                    content: "Processing...",
                    name: functionCall.name,
                    pending: true,
                }).id;

                // Parse the function arguments
                const args = JSON.parse(functionCall.args ? JSON.stringify(functionCall.args) : "{}");

                // Execute the function
                const functionResult = await executeFunctionCall(
                    {
                        name: functionCall.name,
                        args,
                    },
                    userLocation,
                    foundVendors,
                    onVendorResults,
                    onRouteResult,
                    onLocationRequest
                );

                // Update the function message with the result
                updateMessage(functionMessageId, {
                    content: functionResult,
                    pending: false,
                });

                // Get a response from the LLM based on the function result
                const functionMessages = messages.concat([
                    {
                        id: assistantMessageId,
                        role: "assistant",
                        content: "",
                    } as Message,
                    {
                        id: functionMessageId,
                        role: "function",
                        content: functionResult,
                        name: functionCall.name,
                    } as Message,
                ]);

                // Convert to format expected by gemini.ts
                const geminiChatHistory: GeminiChatMessage[] = functionMessages.map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                    name: msg.name,
                }));

                const response = await sendFunctionResult(
                    functionCall.name,
                    functionResult,
                    geminiChatHistory,
                    functionSchemas
                );

                // Add the assistant's response
                const newAssistantMessageId = addMessage({
                    role: "assistant",
                    content: response.text,
                    functionCall: response.functionCall
                        ? {
                            name: response.functionCall.name,
                            arguments: JSON.stringify(response.functionCall.args),
                        }
                        : undefined,
                }).id;

                // If there's another function call, handle it recursively
                if (response.functionCall) {
                    await handleFunctionCall(response.functionCall, newAssistantMessageId);
                }
            } catch (error) {
                console.error("Error handling function call:", error);
                addMessage({
                    role: "assistant",
                    content:
                        "Sorry, I encountered an error while processing your request. Please try again.",
                });
            } finally {
                setProcessingFunctionCall(null);
            }
        },
        [
            messages,
            userLocation,
            foundVendors,
            onVendorResults,
            onRouteResult,
            onLocationRequest,
            addMessage,
            updateMessage,
            functionSchemas,
        ]
    );

    // Function to send a user message
    const sendMessage = useCallback(
        async (content: string) => {
            if (!content.trim() || isProcessing) {
                return;
            }

            try {
                setIsProcessing(true);

                // Add the user message
                const userMessageId = addMessage({
                    role: "user",
                    content,
                }).id;

                // Add a pending assistant message
                const assistantMessageId = addMessage({
                    role: "assistant",
                    content: "",
                    pending: true,
                }).id;

                // Convert messages to the format expected by gemini.ts
                const geminiChatHistory: GeminiChatMessage[] = messages.map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                    name: msg.name,
                }));

                // Add the new user message to chat history
                geminiChatHistory.push({
                    role: "user",
                    content,
                    name: undefined,
                });

                const response = await sendChatMessage(content, geminiChatHistory, functionSchemas);

                // Update the assistant message with the response
                updateMessage(assistantMessageId, {
                    content: response.text,
                    pending: false,
                    functionCall: response.functionCall
                        ? {
                            name: response.functionCall.name,
                            arguments: JSON.stringify(response.functionCall.args),
                        }
                        : undefined,
                });

                // Handle function call if present
                if (response.functionCall) {
                    await handleFunctionCall(response.functionCall, assistantMessageId);
                }
            } catch (error) {
                console.error("Error sending message:", error);
                addMessage({
                    role: "assistant",
                    content:
                        "Sorry, I encountered an error while processing your message. Please try again.",
                });
            } finally {
                setIsProcessing(false);
            }
        },
        [messages, isProcessing, addMessage, updateMessage, handleFunctionCall, functionSchemas]
    );

    return {
        messages,
        isProcessing,
        processingFunctionCall,
        sendMessage,
    };
} 