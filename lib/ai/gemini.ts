/**
 * lib/ai/gemini.ts
 * 
 * Unified utility functions for AI interactions in the KeliLink app.
 */

import { google } from '@ai-sdk/google';
import { generateText, streamText, tool } from 'ai';
import { z } from 'zod';

// Use a consistent model reference
const geminiModel = google('gemini-2.0-flash');

// Types for function calling
export interface FunctionSchema {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface FunctionCallResult {
  name: string;
  args: Record<string, any>;
}

export interface ChatMessage {
  role: "user" | "assistant" | "function";
  content: string;
  name?: string;
  toolInvocations?: {
    toolCallId: string;
    toolName: string;
    args: any;
    result: any
  }[];
}

/**
 * Generates a description for a peddler based on their name and type
 */
export async function generatePeddlerDescription(
  peddlerName: string,
  peddlerType: string
): Promise<string> {
  try {
    const prompt = `
      Generate a short, engaging description for a street food peddler in Indonesia named "${peddlerName}" who sells "${peddlerType}".
      The description should highlight the quality, taste, and specialties of their food.
      Write the description in English.
      Keep it under 100 words.
    `;

    const { text } = await generateText({
      model: geminiModel,
      prompt,
    });

    return text;
  } catch (error) {
    console.error('Error generating peddler description:', error);
    return generateFallbackDescription(peddlerName, peddlerType);
  }
}

/**
 * Generates route advice for a peddler based on their type, planned areas, and time
 */
export async function getRouteAdvice(
  peddlerType: string,
  plannedAreasText: string,
  city: string = 'Depok',
  timeOfDay?: string
): Promise<string> {
  // Parse the planned areas text into an array
  const plannedAreas = plannedAreasText
    .split('\n')
    .map((area) => area.trim())
    .filter((area) => area.length > 0);

  const currentTimeOfDay = timeOfDay || getCurrentTimeOfDay();

  try {
    const prompt = `
      As an assistant for street food peddlers in Indonesia, provide route advice for:
      
      Peddler type: ${peddlerType}
      Location: ${city}
      Planned areas: ${plannedAreas.join(', ')}
      Time: ${currentTimeOfDay}
      
      Provide route advice including:
      1. Best time recommendations for selling based on peddler type
      2. Route prioritization in planned areas
      3. Specific tips for ${peddlerType} sellers
      4. Specific insights about ${city} relevant to peddlers
      
      Format your response in clear and structured English.
    `;

    const { text } = await generateText({
      model: geminiModel,
      prompt,
    });

    return text;
  } catch (error) {
    console.error('Error getting route advice:', error);

    try {
      // Try calling the backend API if direct Gemini call fails
      const response = await fetch('/api/peddlers/route-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          peddler_type: peddlerType,
          planned_areas: plannedAreas,
          city,
          time_of_day: currentTimeOfDay,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get route advice from backend API');
      }

      const data = await response.json();
      return data.advice;
    } catch (backendError) {
      console.error('Backend API call also failed:', backendError);
      return generateFallbackRouteAdvice(peddlerType, plannedAreas, city, currentTimeOfDay);
    }
  }
}

/**
 * Process a chat message and handle function calling
 */
export async function sendChatMessage(
  userInput: string,
  history: ChatMessage[],
  availableFunctions?: FunctionSchema[],
  systemPrompt?: string
) {
  // Convert messages to AI SDK format
  const convertedMessages = convertToAiSdkMessages(history);

  // Add the current user input as the last message
  convertedMessages.push({ role: "user", content: userInput });

  const tools = createToolsFromFunctions(availableFunctions || []);

  // Define a base system prompt for Markdown
  const baseSystemPrompt = "You are a helpful assistant. All your responses must be formatted in Markdown.";
  const finalSystemPrompt = systemPrompt ? `${baseSystemPrompt}\n\n${systemPrompt}` : baseSystemPrompt;

  console.log("Sending to AI SDK (chat):", {
    convertedMessages,
    tools,
    systemPrompt: finalSystemPrompt,
  });

  const result = await streamText({
    model: geminiModel,
    messages: convertedMessages,
    tools: tools && Object.keys(tools).length > 0 ? tools : undefined,
    system: finalSystemPrompt,
    temperature: 0.2,
  });

  // For usage tracking, if needed in the future
  // console.log('Token usage:', await usage);

  return processResponseStream(result);
}

/**
 * Process a function result and continue the conversation
 */
export async function sendFunctionResult(
  toolCallId: string,
  toolName: string,
  toolResult: any,
  history: ChatMessage[],
  availableFunctions?: FunctionSchema[],
  systemPrompt?: string
) {
  // Convert messages to AI SDK format
  const convertedMessages = convertToAiSdkMessages(history);

  // Add the tool call result
  convertedMessages.push({
    role: "tool",
    content: [
      {
        type: "tool-result",
        toolCallId: toolCallId,
        toolName: toolName,
        result: toolResult,
      },
    ],
  });

  const tools = createToolsFromFunctions(availableFunctions || []);

  // Define a base system prompt for Markdown
  const baseSystemPrompt = "You are a helpful assistant. All your responses must be formatted in Markdown.";
  const finalSystemPrompt = systemPrompt ? `${baseSystemPrompt}\n\n${systemPrompt}` : baseSystemPrompt;

  console.log("Sending to AI SDK (function result):", {
    convertedMessages,
    tools,
    systemPrompt: finalSystemPrompt,
  });

  const result = await streamText({
    model: geminiModel,
    messages: convertedMessages,
    tools: tools && Object.keys(tools).length > 0 ? tools : undefined,
    system: finalSystemPrompt,
    temperature: 0.2,
  });

  // For usage tracking, if needed in the future
  // console.log('Token usage (function result):', await usage);

  return processResponseStream(result);
}

// Helper function to process response stream
async function processResponseStream(result: any): Promise<{ text: string; toolCalls?: any[] }> {
  let responseText = "";
  const newToolCalls: Array<{ toolCallId: string, toolName: string, args: any }> = [];

  for await (const part of result.fullStream) {
    if (part.type === 'text-delta') {
      responseText += part.textDelta;
    } else if (part.type === 'tool-call') {
      newToolCalls.push({
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        args: part.args,
      });
    }
  }

  if (newToolCalls.length > 0) {
    return { text: responseText, toolCalls: newToolCalls };
  }

  return { text: responseText };
}

// Helper function to convert our app's message format to AI SDK's format
function convertToAiSdkMessages(chatHistory: ChatMessage[]) {
  const aiMessages: any[] = [];

  for (const msg of chatHistory) {
    if (msg.role === 'user') {
      aiMessages.push({
        role: 'user',
        content: msg.content
      });
    }
    else if (msg.role === 'assistant') {
      const assistantMsg: any = {
        role: 'assistant',
        content: msg.content || ""
      };

      if (msg.toolInvocations?.length) {
        assistantMsg.toolCalls = msg.toolInvocations.map(inv => ({
          toolCallId: inv.toolCallId,
          toolName: inv.toolName,
          args: inv.args,
        }));
      }

      aiMessages.push(assistantMsg);
    }
    else if (msg.role === 'function' && msg.name && msg.toolInvocations) {
      aiMessages.push({
        role: 'tool',
        content: msg.toolInvocations.map(toolInv => ({
          type: 'tool-result',
          toolCallId: toolInv.toolCallId,
          toolName: toolInv.toolName || msg.name!,
          result: toolInv.result,
        }))
      });
    }
  }

  return aiMessages;
}

// Helper function to create tools from function schemas
function createToolsFromFunctions(functions: FunctionSchema[]): Record<string, ReturnType<typeof tool>> {
  const tools: Record<string, ReturnType<typeof tool>> = {};

  functions.forEach(fn => {
    tools[fn.name] = tool({
      description: fn.description,
      parameters: createZodSchemaFromParameters(fn.parameters),
    });
  });

  return tools;
}

// Helper function to create Zod schema from function parameters
function createZodSchemaFromParameters(parameters: FunctionSchema['parameters']) {
  const schemaEntries = Object.entries(parameters.properties).map(([key, schema]) => {
    let zodSchema;

    switch (schema.type) {
      case 'string': zodSchema = z.string(); break;
      case 'number': zodSchema = z.number(); break;
      case 'boolean': zodSchema = z.boolean(); break;
      default: zodSchema = z.any();
    }

    if (schema.description) {
      zodSchema = zodSchema.describe(schema.description);
    }

    return [key, zodSchema];
  });

  const required = parameters.required || [];
  const requiredEntries = required.map(r => [r, true]);

  return z.object(Object.fromEntries(schemaEntries))
    .required(Object.fromEntries(requiredEntries));
}

// Helper function to get current time of day
function getCurrentTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'pagi';
  if (hour >= 11 && hour < 15) return 'siang';
  if (hour >= 15 && hour < 19) return 'sore';
  return 'malam';
}

// Helper function for fallback peddler descriptions
function generateFallbackDescription(peddlerName: string, peddlerType: string): string {
  switch (peddlerType.toLowerCase()) {
    case 'bakso':
      return `${peddlerName} serves meatballs made from selected beef, hygienically processed. The rich broth soup with a sprinkle of fried onions and fresh celery. Various options available such as vein meatballs, egg meatballs, and special meatballs with minced meat filling.`;
    case 'siomay':
    case 'batagor':
      return `${peddlerName} offers mackerel fish dumplings with a soft texture and savory taste. Served with a rich peanut sauce, a blend of peanuts, garlic, and chili.`;
    case 'es cendol':
    case 'es':
      return `${peddlerName} presents es cendol with chewy and fresh cendol, made from selected rice flour. Served with thick coconut milk, authentic palm sugar, and refreshing shaved ice.`;
    case 'martabak':
      return `${peddlerName} specializes in martabak with various flavors. Our sweet martabak has a soft texture on the inside and crispy on the outside, with abundant toppings like chocolate, cheese, peanuts, and milk.`;
    default:
      return `${peddlerName} serves high-quality food/drinks with fresh and selected ingredients. Hygienically processed and with traditional recipes passed down for generations.`;
  }
}

// Helper function for fallback route advice
function generateFallbackRouteAdvice(
  peddlerType: string,
  plannedAreas: string[],
  city: string,
  timeOfDay: string
): string {
  return `Route advice for ${peddlerType} sellers in ${city}:

${getTimeContextForType(peddlerType, timeOfDay)}

Based on your plan in ${plannedAreas.join(', ')}, I suggest prioritizing the following routes:
1. ${plannedAreas[0] || 'Residential area'} (morning/afternoon)
2. ${plannedAreas[1] || 'Office area'} (afternoon/evening)
3. ${plannedAreas[2] || 'Campus area'} (evening/night)

Specific tips for ${peddlerType} sellers:
${getPeddlerSpecificTips(peddlerType)}

Remember to always update your location in the KeliLink application so customers can easily find you!`;
}

// Helper function to get time context for peddler type
function getTimeContextForType(peddlerType: string, timeOfDay: string): string {
  const defaultTime = "Adjust your selling time according to local customs and the type of food you sell.";

  // Specific advice for peddler types during this time of day
  switch (peddlerType.toLowerCase()) {
    case 'bakso':
      if (timeOfDay === 'pagi') return "Meatballs are less popular in the morning. Consider starting to sell towards noon.";
      if (timeOfDay === 'siang') return "Noon is the ideal time for meatballs, especially in office and campus areas.";
      if (timeOfDay === 'sore') return "Afternoon is a good time for meatballs, especially in residential areas when people are coming home from work.";
      if (timeOfDay === 'malam') return "Meatballs are popular at night in crowded areas or hangouts.";
      return defaultTime;

    case 'siomay':
    case 'batagor':
      if (timeOfDay === 'pagi') return "Siomay/batagor are less popular in the morning. It's better to start selling towards noon.";
      if (timeOfDay === 'siang') return "Noon is a good time for siomay/batagor, especially in office areas for lunch.";
      if (timeOfDay === 'sore') return "Afternoon is the best time for siomay/batagor, especially in school and residential areas.";
      if (timeOfDay === 'malam') return "Siomay/batagor can be popular at night in crowded areas, but demand is usually lower than in the afternoon.";
      return defaultTime;

    case 'es cendol':
    case 'es':
      if (timeOfDay === 'pagi') return "Ice drinks are less popular in the morning. Start selling when the sun starts to feel hot.";
      if (timeOfDay === 'siang') return "Noon is the ideal time for ice drinks, especially when the weather is hot.";
      if (timeOfDay === 'sore') return "Afternoon is still a good time for ice drinks, although demand starts to decrease towards dusk.";
      if (timeOfDay === 'malam') return "Ice drinks are less popular at night unless the weather is still hot or in crowded areas.";
      return defaultTime;

    case 'martabak':
      if (timeOfDay === 'pagi') return "Martabak is not popular in the morning. Start selling in the afternoon or evening.";
      if (timeOfDay === 'siang') return "Martabak is less popular at noon. The best time is from afternoon to evening.";
      if (timeOfDay === 'sore') return "Late afternoon is a good time to start selling martabak.";
      if (timeOfDay === 'malam') return "Night is the most ideal time for martabak, especially in crowded and residential areas.";
      return defaultTime;

    default:
      const generalTimeContext: Record<string, string> = {
        pagi: "Morning (6:00-10:00) is suitable for breakfast foods and snacks.",
        siang: "Noon (11:00-14:00) is a busy lunchtime.",
        sore: "Afternoon (15:00-18:00) is a busy time when people return from work/school.",
        malam: "Night (19:00-22:00) is suitable for heavy meals and night snacks."
      };
      return generalTimeContext[timeOfDay] || defaultTime;
  }
}

// Helper function to get peddler-specific tips
function getPeddlerSpecificTips(peddlerType: string): string {
  switch (peddlerType.toLowerCase()) {
    case 'bakso':
      return "Ensure the meatball soup stays hot. Provide various types of meatballs (vein, egg, tofu). Maintain the cleanliness of bowls and spoons. Bring enough water to wash equipment.";
    case 'siomay':
    case 'batagor':
      return "Prepare enough fresh peanut sauce. Cut siomay/batagor after ordering to maintain quality. Provide lime wedges to add freshness.";
    case 'es cendol':
    case 'es kelapa':
    case 'es':
      return "Bring enough ice cubes and ensure they stay frozen. Use fresh ingredients. Place ice in an insulated container so it doesn't melt quickly. Sell in a shaded location.";
    case 'martabak':
      return "Ensure the pan stays hot. Bring various popular toppings (chocolate, cheese, peanuts). For egg martabak, ensure the meat/egg filling is plentiful. Cut martabak neatly.";
    default:
      return "Prioritize cleanliness and product quality. Friendly interaction with customers is important for building loyalty. Maintain consistency in the taste and portion of your product.";
  }
}
