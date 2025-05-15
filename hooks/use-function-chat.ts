import { executeFunctionCall } from "@/lib/ai/functions";
import { FunctionSchema, ChatMessage as GeminiChatMessage, sendChatMessage, sendFunctionResult as sendFunctionResultToAI } from "@/lib/ai/gemini";
import { useCallback, useEffect, useState } from "react";

export interface Message {
    id: string;
    role: "user" | "assistant" | "function";
    content: string;
    name?: string;
    pending?: boolean;
    toolInvocations?: { toolCallId: string; toolName: string; args: any; result: any }[];
}

interface UseFunctionChatOptions {
    availableFunctions?: FunctionSchema[];
    markdownResponse?: boolean; // Option to get markdown responses
    initialMessages?: Message[];
}

export function useFunctionChat({
    availableFunctions = [],
    markdownResponse = false, // Default to false for backward compatibility
    initialMessages = [],
}: UseFunctionChatOptions = {}) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [isProcessing, setIsProcessing] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [foundVendors, setFoundVendors] = useState<any[]>([]);

    // Generate a unique ID for messages
    const generateId = () => {
        return Math.random().toString(36).substring(2, 15);
    };

    // Handle vendor results from function calls
    const handleVendorResults = useCallback((peddlers: any[]) => {
        setFoundVendors(peddlers);
    }, []);

    // Handle route results from function calls
    const handleRouteResult = useCallback((routeDetails: any) => {
        // This function could be expanded to handle route results
        // For now, we're just logging it
        console.log("Route details:", routeDetails);
    }, []);

    // Handle location results from function calls
    const handleLocationResult = useCallback(() => {
        // This function could be expanded to handle location updates
        // For now, it's just a placeholder
        console.log("Location updated");
    }, []);

    // Update user location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (error) => {
                    console.error("Error getting location:", error);
                }
            );
        }
    }, []);

    // Send a message to the AI
    const sendMessage = useCallback(
        async (content: string) => {
            // Add user message to the state
            const userMessageId = generateId();
            const userMessage: Message = {
                id: userMessageId,
                role: "user",
                content,
            };

            // Add assistant's pending message
            const pendingAssistantMessageId = generateId();
            const pendingAssistantMessage: Message = {
                id: pendingAssistantMessageId,
                role: "assistant",
                content: "",
                pending: true,
            };

            setMessages((prev) => [...prev, userMessage, pendingAssistantMessage]);
            setIsProcessing(true);

            try {
                // Convert our messages to the format expected by the AI
                const chatHistory: GeminiChatMessage[] = messages.map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                    name: msg.name,
                    toolInvocations: msg.toolInvocations,
                }));

                // Add the new user message
                chatHistory.push({
                    role: "user",
                    content,
                } as GeminiChatMessage);

                // Add system prompt for markdown if enabled
                let systemPrompt = "";
                if (markdownResponse) {
                    systemPrompt = "Please format your responses in markdown for better readability. Ensure that any lists are properly formatted with hyphens or numbers, and code blocks are enclosed in triple backticks. Bold text should use double asterisks and italics single asterisks.";
                }

                // Send the message to the AI
                const response = await sendChatMessage(content, chatHistory, availableFunctions, systemPrompt);

                // Remove the pending message and add the real response
                setMessages((prev) =>
                    prev.filter((msg) => msg.id !== pendingAssistantMessageId).concat({
                        id: generateId(),
                        role: "assistant",
                        content: response.text || "",
                        toolInvocations: response.toolCalls?.map((tc) => ({
                            toolCallId: tc.toolCallId,
                            toolName: tc.toolName,
                            args: tc.args,
                            result: null, // Initialize with null since we don't have results yet
                        })),
                    })
                );

                // Handle function calls if any
                if (response.toolCalls && response.toolCalls.length > 0) {
                    // For each function call, execute it and send the result back
                    for (const toolCall of response.toolCalls) {
                        await handleFunctionCall(toolCall);
                    }
                }
            } catch (error) {
                console.error("Error sending message:", error);

                // Update the pending message with an error
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === pendingAssistantMessageId
                            ? {
                                ...msg,
                                content: "Sorry, there was an error processing your request.",
                                pending: false,
                            }
                            : msg
                    )
                );
            } finally {
                setIsProcessing(false);
            }
        },
        [messages, availableFunctions, markdownResponse]
    );

    // Handle function calls from the AI
    const handleFunctionCall = useCallback(
        async (toolCall: { toolCallId: string; toolName: string; args: any }) => {
            const { toolCallId, toolName, args } = toolCall;

            try {
                // Execute the function
                const functionCallResult = {
                    name: toolName,
                    args,
                };

                // Execute the function call
                const result = await executeFunctionCall(
                    functionCallResult,
                    userLocation,
                    foundVendors,
                    handleVendorResults,
                    handleRouteResult,
                    handleLocationResult
                );

                // Add function result message
                const functionResultMessageId = generateId();
                setMessages((prev) => [
                    ...prev,
                    {
                        id: functionResultMessageId,
                        role: "function",
                        name: toolName,
                        content: result,
                        toolInvocations: [
                            {
                                toolCallId,
                                toolName,
                                args,
                                result,
                            },
                        ],
                    },
                ]);

                // Add pending assistant message
                const pendingAssistantMessageId = generateId();
                setMessages((prev) => [
                    ...prev,
                    {
                        id: pendingAssistantMessageId,
                        role: "assistant",
                        content: "",
                        pending: true,
                    },
                ]);

                setIsProcessing(true);

                // Send the function result back to the AI
                const chatHistory: GeminiChatMessage[] = messages.map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                    name: msg.name,
                    toolInvocations: msg.toolInvocations,
                }));

                // Add the function result message
                chatHistory.push({
                    role: "function",
                    name: toolName,
                    content: result,
                    toolInvocations: [
                        {
                            toolCallId,
                            toolName,
                            args,
                            result,
                        },
                    ],
                } as GeminiChatMessage);

                // Add system prompt for markdown if enabled (consistency)
                let systemPromptForResult = "";
                if (markdownResponse) {
                    systemPromptForResult = "Please format your responses in markdown for better readability. Ensure that any lists are properly formatted with hyphens or numbers, and code blocks are enclosed in triple backticks. Bold text should use double asterisks and italics single asterisks.";
                }

                const response = await sendFunctionResultToAI(
                    toolCallId,
                    toolName,
                    result,
                    chatHistory,
                    availableFunctions,
                    systemPromptForResult
                );

                // Remove the pending message and add the real response
                setMessages((prev) =>
                    prev.filter((msg) => msg.id !== pendingAssistantMessageId).concat({
                        id: generateId(),
                        role: "assistant",
                        content: response.text || "",
                        toolInvocations: response.toolCalls?.map((tc) => ({
                            toolCallId: tc.toolCallId,
                            toolName: tc.toolName,
                            args: tc.args,
                            result: null, // Initialize with null since we don't have results yet
                        })),
                    })
                );

                // Handle any new function calls
                if (response.toolCalls && response.toolCalls.length > 0) {
                    for (const newToolCall of response.toolCalls) {
                        await handleFunctionCall(newToolCall);
                    }
                }
            } catch (error) {
                console.error("Error handling function call:", error);

                // Add an error message
                setMessages((prev) => [
                    ...prev,
                    {
                        id: generateId(),
                        role: "assistant",
                        content: "Sorry, there was an error processing the function call.",
                    },
                ]);
            } finally {
                setIsProcessing(false);
            }
        },
        [
            messages,
            userLocation,
            foundVendors,
            handleVendorResults,
            handleRouteResult,
            handleLocationResult,
            availableFunctions,
        ]
    );

    // Manually send a function result (useful for external integrations)
    const sendFunctionResult = useCallback(
        async (toolCallId: string, toolName: string, result: any) => {
            // Add function result message
            const functionResultMessageId = generateId();
            setMessages((prev) => [
                ...prev,
                {
                    id: functionResultMessageId,
                    role: "function",
                    name: toolName,
                    content: JSON.stringify(result),
                    toolInvocations: [
                        {
                            toolCallId,
                            toolName,
                            args: {},
                            result,
                        },
                    ],
                },
            ]);

            // Add pending assistant message
            const pendingAssistantMessageId = generateId();
            setMessages((prev) => [
                ...prev,
                {
                    id: pendingAssistantMessageId,
                    role: "assistant",
                    content: "",
                    pending: true,
                },
            ]);

            setIsProcessing(true);

            try {
                // Convert our messages to the format expected by the AI
                const chatHistory: GeminiChatMessage[] = messages.map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                    name: msg.name,
                    toolInvocations: msg.toolInvocations,
                }));

                // Add the function result message
                chatHistory.push({
                    role: "function",
                    name: toolName,
                    content: JSON.stringify(result),
                    toolInvocations: [
                        {
                            toolCallId,
                            toolName,
                            args: {},
                            result,
                        },
                    ],
                } as GeminiChatMessage);

                // Add system prompt for markdown if enabled (consistency)
                let systemPromptForManualResult = "";
                if (markdownResponse) {
                    systemPromptForManualResult = "Please format your responses in markdown for better readability. Ensure that any lists are properly formatted with hyphens or numbers, and code blocks are enclosed in triple backticks. Bold text should use double asterisks and italics single asterisks.";
                }

                // Send the function result to the AI
                const response = await sendFunctionResultToAI(
                    toolCallId,
                    toolName,
                    result,
                    chatHistory,
                    availableFunctions,
                    systemPromptForManualResult
                );

                // Remove the pending message and add the real response
                setMessages((prev) =>
                    prev.filter((msg) => msg.id !== pendingAssistantMessageId).concat({
                        id: generateId(),
                        role: "assistant",
                        content: response.text || "",
                        toolInvocations: response.toolCalls?.map((tc) => ({
                            toolCallId: tc.toolCallId,
                            toolName: tc.toolName,
                            args: tc.args,
                            result: null, // Initialize with null since we don't have results yet
                        })),
                    })
                );

                // Handle any new function calls
                if (response.toolCalls && response.toolCalls.length > 0) {
                    for (const toolCall of response.toolCalls) {
                        await handleFunctionCall(toolCall);
                    }
                }
            } catch (error) {
                console.error("Error sending function result:", error);

                // Update the pending message with an error
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === pendingAssistantMessageId
                            ? {
                                ...msg,
                                content: "Sorry, there was an error processing your request.",
                                pending: false,
                            }
                            : msg
                    )
                );
            } finally {
                setIsProcessing(false);
            }
        },
        [messages, availableFunctions, handleFunctionCall]
    );

    return {
        messages,
        sendMessage,
        sendFunctionResult,
        isProcessing,
        foundVendors,
    };
} 