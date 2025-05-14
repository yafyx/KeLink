/**
 * lib/gemini.ts
 * 
 * Unified utility functions for Gemini API calls in the KeliLink app.
 * Handles both general text generation and function calling capabilities.
 */

import { GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google Generative AI with API key from environment variable
// Will be initialized only when needed to avoid issues with SSR
let genAI: GoogleGenerativeAI | null = null;
let gemini2Flash: GenerativeModel | null = null;

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
}

// Function to get or initialize the Gemini client
function getGeminiClient(): GoogleGenerativeAI {
  // If already initialized, return the existing instance
  if (genAI) return genAI;

  // Check if we're in a browser environment (client side)
  const isBrowser = typeof window !== 'undefined';

  if (isBrowser) {
    // In browser environment, use the NEXT_PUBLIC_ variable if available
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    genAI = new GoogleGenerativeAI(apiKey);
  } else {
    // In server environment, use the server-side env variable
    const apiKey = process.env.GEMINI_API_KEY || '';
    genAI = new GoogleGenerativeAI(apiKey);
  }

  return genAI;
}

// Get or initialize the Gemini 2.0 Flash model
function getGemini2Flash(): GenerativeModel {
  if (gemini2Flash) return gemini2Flash;

  const client = getGeminiClient();
  gemini2Flash = client.getGenerativeModel({
    model: 'gemini-2.0-flash'
  });

  return gemini2Flash;
}

/**
 * Generates a description for a peddler based on their name and type
 */
export async function generatePeddlerDescription(
  peddlerName: string,
  peddlerType: string
): Promise<string> {
  try {
    // Use Gemini API to generate a description
    const model = getGemini2Flash();

    const prompt = `
      Generate a short, engaging description for a street food peddler in Indonesia named "${peddlerName}" who sells "${peddlerType}".
      The description should highlight the quality, taste, and specialties of their food.
      Write the description in Indonesian language.
      Keep it under 100 words.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating peddler description with Gemini:', error);

    // Fallback to mock responses if the API call fails
    switch (peddlerType.toLowerCase()) {
      case 'bakso':
        return `${peddlerName} menyajikan bakso dengan daging sapi pilihan yang diproses secara higienis. Kuah kaldu yang kaya rasa dengan tambahan bawang goreng dan seledri segar. Tersedia berbagai pilihan seperti bakso urat, bakso telur, dan bakso special dengan isian daging cincang. Dilengkapi dengan mie, bihun, dan pangsit goreng yang renyah.`
      case 'siomay':
      case 'batagor':
        return `${peddlerName} menawarkan siomay ikan tenggiri dengan tekstur yang lembut dan rasa yang gurih. Disajikan dengan bumbu kacang yang kaya akan rasa, perpaduan antara kacang tanah, bawang putih, dan cabai. Tersedia juga tahu, kentang, pare, dan telur sebagai pelengkap.`
      case 'es cendol':
      case 'es':
        return `${peddlerName} menghadirkan es cendol dengan cendol yang kenyal dan segar, dibuat dari tepung beras pilihan. Disajikan dengan santan kental, gula merah asli, dan es serut yang menyegarkan. Nikmati sensasi manis dan gurih yang menyatu dalam setiap sendoknya.`
      case 'martabak':
        return `${peddlerName} spesialis martabak dengan berbagai varian rasa. Martabak manis kami memiliki tekstur yang lembut di dalam dan renyah di luar, dengan topping melimpah seperti cokelat, keju, kacang, dan susu. Martabak telur kami dibuat dengan isian daging cincang, telur, dan rempah-rempah pilihan.`
      default:
        return `${peddlerName} menyajikan makanan/minuman berkualitas tinggi dengan bahan-bahan segar dan pilihan. Diproses secara higienis dan dengan resep tradisional yang telah diwariskan selama bertahun-tahun. Rasakan kenikmatan otentik dalam setiap sajian kami.`
    }
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
    .filter((area) => area.length > 0)

  try {
    // Direct call to Gemini API
    const model = getGemini2Flash();

    const prompt = `
      Sebagai asisten untuk pedagang kaki lima di Indonesia, berikan saran rute untuk:
      
      Jenis pedagang: ${peddlerType}
      Lokasi: ${city}
      Area yang direncanakan: ${plannedAreas.join(', ')}
      ${timeOfDay ? `Waktu: ${timeOfDay}` : `Waktu: ${getCurrentTimeOfDay()}`}
      
      Berikan saran rute termasuk:
      1. Rekomendasi waktu terbaik untuk berjualan berdasarkan jenis pedagang
      2. Prioritas rute di area yang direncanakan
      3. Tips khusus untuk penjual jenis ${peddlerType}
      4. Wawasan khusus tentang ${city} yang relevan untuk pedagang
      
      Format respons Anda dalam bahasa Indonesia yang jelas dan terstruktur.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting route advice with Gemini:', error);

    // Try calling the backend API if direct Gemini call fails
    try {
      const response = await fetch('/api/peddlers/route-advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          peddler_type: peddlerType,
          planned_areas: plannedAreas,
          city,
          time_of_day: timeOfDay || getCurrentTimeOfDay(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get route advice from backend API');
      }

      const data = await response.json();
      return data.advice;
    } catch (backendError) {
      console.error('Backend API call also failed:', backendError);

      // Fallback to a generic response if both methods fail
      return `Saran rute untuk penjual ${peddlerType} di ${city}:

${getTimeContextForType(peddlerType, getCurrentTimeOfDay())}

Berdasarkan rencana Anda di ${plannedAreas.join(', ')}, saya sarankan untuk memprioritaskan rute berikut:
1. ${plannedAreas[0] || 'Area perumahan'} (pagi/siang)
2. ${plannedAreas[1] || 'Area perkantoran'} (siang/sore)
3. ${plannedAreas[2] || 'Area kampus'} (sore/malam)

Tips khusus untuk penjual ${peddlerType}:
${getPeddlerSpecificTips(peddlerType)}

Ingat untuk selalu update lokasi Anda di aplikasi KeliLink agar pelanggan dapat dengan mudah menemukan Anda!`;
    }
  }
}

/**
 * Function calling for chat interactions
 */

// Process a chat message and handle function calling
export async function sendChatMessage(
  message: string,
  chatHistory: ChatMessage[],
  availableFunctions?: FunctionSchema[]
): Promise<{ text: string; functionCall?: FunctionCallResult }> {
  try {
    // Check if API key is available
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY && !process.env.GEMINI_API_KEY) {
      return {
        text: "API key is not configured. Please add a valid Gemini API key in your environment variables.",
      };
    }

    // Get the Gemini model
    const model = getGemini2Flash();

    // Prepare history in the format Gemini expects
    const contents = [];

    // Add chat history
    for (const msg of chatHistory) {
      if (msg.role === "user") {
        contents.push({ role: "user", parts: [{ text: msg.content }] });
      } else if (msg.role === "assistant") {
        contents.push({ role: "model", parts: [{ text: msg.content }] });
      } else if (msg.role === "function" && msg.name) {
        contents.push({
          role: "model",
          parts: [{
            functionResponse: {
              name: msg.name,
              response: { text: msg.content }
            }
          }]
        });
      }
    }

    // Add the new user message
    contents.push({ role: "user", parts: [{ text: message }] });

    // Generate content with optional function declarations
    const generateOptions: any = {
      contents,
      generationConfig: {
        temperature: 0.2,
      },
    };

    // Add function declarations if available
    if (availableFunctions && availableFunctions.length > 0) {
      generateOptions.tools = [{
        functionDeclarations: availableFunctions
      }];
    }

    // Send the request to Gemini
    const result = await model.generateContent(generateOptions);
    const response = result.response;

    // Check if the response includes a function call
    let functionCall = null;
    try {
      functionCall = response.functionCall();
    } catch (e) {
      // No function call in the response
    }

    if (functionCall) {
      // Return both the text response and the function call details
      return {
        text: response.text() || "",
        functionCall: {
          name: functionCall.name,
          args: functionCall.args || {},
        },
      };
    }

    // If no function call, return just the text response
    return { text: response.text() || "" };
  } catch (error) {
    console.error("Error sending message to Gemini:", error);

    // Return a fallback response
    return {
      text: "I'm having trouble connecting to my AI services right now. Please try again later.",
    };
  }
}

// Process a function result and continue the conversation
export async function sendFunctionResult(
  functionName: string,
  result: string,
  chatHistory: ChatMessage[],
  availableFunctions?: FunctionSchema[]
): Promise<{ text: string; functionCall?: FunctionCallResult }> {
  try {
    // Check if API key is available
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY && !process.env.GEMINI_API_KEY) {
      return {
        text: "API key is not configured. Please add a valid Gemini API key in your environment variables.",
      };
    }

    // Get the Gemini model
    const model = getGemini2Flash();

    // Prepare history in the format Gemini expects
    const contents = [];

    // Add chat history
    for (const msg of chatHistory) {
      if (msg.role === "user") {
        contents.push({ role: "user", parts: [{ text: msg.content }] });
      } else if (msg.role === "assistant") {
        contents.push({ role: "model", parts: [{ text: msg.content }] });
      } else if (msg.role === "function" && msg.name) {
        contents.push({
          role: "model",
          parts: [{
            functionResponse: {
              name: msg.name,
              response: { text: msg.content }
            }
          }]
        });
      }
    }

    // Add the function result
    contents.push({
      role: "model",
      parts: [{
        functionResponse: {
          name: functionName,
          response: { text: result }
        }
      }]
    });

    // Generate content with optional function declarations
    const generateOptions: any = {
      contents,
      generationConfig: {
        temperature: 0.2,
      },
    };

    // Add function declarations if available
    if (availableFunctions && availableFunctions.length > 0) {
      generateOptions.tools = [{
        functionDeclarations: availableFunctions
      }];
    }

    // Send the request to Gemini
    const response = await model.generateContent(generateOptions);

    // Check if the response includes a function call
    let functionCall = null;
    try {
      functionCall = response.response.functionCall();
    } catch (e) {
      // No function call in the response
    }

    if (functionCall) {
      // Return both the text response and the function call details
      return {
        text: response.response.text() || "",
        functionCall: {
          name: functionCall.name,
          args: functionCall.args || {},
        },
      };
    }

    // If no function call, return just the text response
    return { text: response.response.text() || "" };
  } catch (error) {
    console.error("Error sending function result to Gemini:", error);

    // Return a fallback response
    return {
      text: "I processed your request, but I'm having trouble connecting to my AI services for follow-up. Please try again later.",
    };
  }
}

// Helper function to get current time of day
function getCurrentTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 15) return 'afternoon'
  if (hour >= 15 && hour < 19) return 'evening'
  return 'night'
}

// Helper function to get time context for peddler type
function getTimeContextForType(peddlerType: string, timeOfDay: string): string {
  const defaultTime = "Sesuaikan waktu berjualan Anda dengan kebiasaan masyarakat setempat dan jenis makanan yang Anda jual."

  // Common time advice for all types
  const generalTimeContext: Record<string, string> = {
    pagi: "Pagi hari (6:00-10:00) cocok untuk makanan sarapan dan jajanan.",
    siang: "Siang hari (11:00-14:00) adalah waktu makan siang yang ramai.",
    sore: "Sore hari (15:00-18:00) adalah waktu pulang kerja/sekolah yang ramai.",
    malam: "Malam hari (19:00-22:00) cocok untuk makanan berat dan jajanan malam."
  }

  // Specific advice for peddler types during this time of day
  switch (peddlerType.toLowerCase()) {
    case 'bakso':
      if (timeOfDay === 'pagi') return "Bakso di pagi hari kurang populer. Pertimbangkan untuk mulai berjualan menjelang siang.";
      if (timeOfDay === 'siang') return "Siang hari adalah waktu ideal untuk bakso, terutama di area perkantoran dan kampus.";
      if (timeOfDay === 'sore') return "Sore hari adalah waktu yang baik untuk bakso, terutama di area perumahan saat orang pulang kerja.";
      if (timeOfDay === 'malam') return "Bakso di malam hari populer di area keramaian atau tempat nongkrong.";
      return defaultTime;

    case 'siomay':
    case 'batagor':
      if (timeOfDay === 'pagi') return "Siomay/batagor kurang populer di pagi hari. Lebih baik mulai berjualan menjelang siang.";
      if (timeOfDay === 'siang') return "Siang hari adalah waktu yang baik untuk siomay/batagor, terutama di area perkantoran untuk makan siang.";
      if (timeOfDay === 'sore') return "Sore hari adalah waktu terbaik untuk siomay/batagor, terutama di area sekolah dan perumahan.";
      if (timeOfDay === 'malam') return "Siomay/batagor bisa populer di malam hari di area keramaian, tapi permintaan biasanya lebih rendah dibanding sore hari.";
      return defaultTime;

    case 'es cendol':
    case 'es':
      if (timeOfDay === 'pagi') return "Es kurang populer di pagi hari. Mulailah berjualan saat matahari mulai terasa panas.";
      if (timeOfDay === 'siang') return "Siang hari adalah waktu ideal untuk es, terutama saat cuaca panas.";
      if (timeOfDay === 'sore') return "Sore hari masih merupakan waktu yang baik untuk es, meskipun permintaan mulai menurun menjelang senja.";
      if (timeOfDay === 'malam') return "Es di malam hari kurang populer kecuali cuaca masih terasa panas atau di area keramaian.";
      return defaultTime;

    case 'martabak':
      if (timeOfDay === 'pagi') return "Martabak tidak populer di pagi hari. Mulailah berjualan di sore atau malam hari.";
      if (timeOfDay === 'siang') return "Martabak kurang populer di siang hari. Waktu terbaik adalah sore hingga malam.";
      if (timeOfDay === 'sore') return "Sore menjelang malam adalah waktu yang baik untuk mulai berjualan martabak.";
      if (timeOfDay === 'malam') return "Malam hari adalah waktu paling ideal untuk martabak, terutama di area keramaian dan perumahan.";
      return defaultTime;

    default:
      return generalTimeContext[timeOfDay] || defaultTime;
  }
}

// Helper function to get peddler-specific tips
function getPeddlerSpecificTips(peddlerType: string): string {
  switch (peddlerType.toLowerCase()) {
    case 'bakso':
      return "Pastikan kuah bakso tetap panas. Sediakan berbagai jenis bakso (urat, telur, tahu). Jaga kebersihan mangkok dan sendok. Bawa cukup air untuk mencuci peralatan.";
    case 'siomay':
    case 'batagor':
      return "Siapkan saus kacang yang cukup dan fresh. Potong siomay/batagor setelah dipesan untuk menjaga kualitas. Sediakan potongan jeruk nipis untuk menambah kesegaran.";
    case 'es cendol':
    case 'es kelapa':
    case 'es':
      return "Bawa cukup es batu dan pastikan tetap beku. Gunakan bahan-bahan segar. Tempatkan es di wadah yang terisolasi agar tidak cepat mencair. Jual di lokasi teduh.";
    case 'martabak':
      return "Pastikan wajan tetap panas. Bawa berbagai topping populer (cokelat, keju, kacang). Untuk martabak telur, pastikan isian daging/telur cukup banyak. Potong martabak dengan rapi.";
    default:
      return "Prioritaskan kebersihan dan kualitas produk. Interaksi yang ramah dengan pelanggan penting untuk membangun loyalitas. Jaga konsistensi rasa dan porsi produk Anda.";
  }
}
