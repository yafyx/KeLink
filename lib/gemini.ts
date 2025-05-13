/**
 * lib/gemini.ts
 * 
 * Utility functions for Gemini API calls in the KeLink app.
 * 
 * Note: This is a placeholder implementation for the MVP. In the real
 * implementation, these functions would make actual calls to the Gemini API.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google Generative AI with API key from environment variable
// Will be initialized only when needed to avoid issues with SSR
let genAI: GoogleGenerativeAI | null = null;

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

/**
 * Generates a description for a vendor based on their name and type
 */
export async function generateVendorDescription(
  vendorName: string,
  vendorType: string
): Promise<string> {
  try {
    // Use Gemini API to generate a description
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash'
    });

    const prompt = `
      Generate a short, engaging description for a street food vendor in Indonesia named "${vendorName}" who sells "${vendorType}".
      The description should highlight the quality, taste, and specialties of their food.
      Write the description in Indonesian language.
      Keep it under 100 words.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating vendor description with Gemini:', error);

    // Fallback to mock responses if the API call fails
    switch (vendorType.toLowerCase()) {
      case 'bakso':
        return `${vendorName} menyajikan bakso dengan daging sapi pilihan yang diproses secara higienis. Kuah kaldu yang kaya rasa dengan tambahan bawang goreng dan seledri segar. Tersedia berbagai pilihan seperti bakso urat, bakso telur, dan bakso special dengan isian daging cincang. Dilengkapi dengan mie, bihun, dan pangsit goreng yang renyah.`
      case 'siomay':
      case 'batagor':
        return `${vendorName} menawarkan siomay ikan tenggiri dengan tekstur yang lembut dan rasa yang gurih. Disajikan dengan bumbu kacang yang kaya akan rasa, perpaduan antara kacang tanah, bawang putih, dan cabai. Tersedia juga tahu, kentang, pare, dan telur sebagai pelengkap.`
      case 'es cendol':
      case 'es':
        return `${vendorName} menghadirkan es cendol dengan cendol yang kenyal dan segar, dibuat dari tepung beras pilihan. Disajikan dengan santan kental, gula merah asli, dan es serut yang menyegarkan. Nikmati sensasi manis dan gurih yang menyatu dalam setiap sendoknya.`
      case 'martabak':
        return `${vendorName} spesialis martabak dengan berbagai varian rasa. Martabak manis kami memiliki tekstur yang lembut di dalam dan renyah di luar, dengan topping melimpah seperti cokelat, keju, kacang, dan susu. Martabak telur kami dibuat dengan isian daging cincang, telur, dan rempah-rempah pilihan.`
      default:
        return `${vendorName} menyajikan makanan/minuman berkualitas tinggi dengan bahan-bahan segar dan pilihan. Diproses secara higienis dan dengan resep tradisional yang telah diwariskan selama bertahun-tahun. Rasakan kenikmatan otentik dalam setiap sajian kami.`
    }
  }
}

/**
 * Generates route advice for a vendor based on their type, planned areas, and time
 */
export async function getRouteAdvice(
  vendorType: string,
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
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-001' });

    const prompt = `
      Sebagai asisten untuk pedagang kaki lima di Indonesia, berikan saran rute untuk:
      
      Jenis pedagang: ${vendorType}
      Lokasi: ${city}
      Area yang direncanakan: ${plannedAreas.join(', ')}
      ${timeOfDay ? `Waktu: ${timeOfDay}` : `Waktu: ${getCurrentTimeOfDay()}`}
      
      Berikan saran rute termasuk:
      1. Rekomendasi waktu terbaik untuk berjualan berdasarkan jenis pedagang
      2. Prioritas rute di area yang direncanakan
      3. Tips khusus untuk penjual jenis ${vendorType}
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
      const response = await fetch('/api/vendors/route-advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendor_type: vendorType,
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
      return `Saran rute untuk penjual ${vendorType} di ${city}:

${getTimeContextForType(vendorType, getCurrentTimeOfDay())}

Berdasarkan rencana Anda di ${plannedAreas.join(', ')}, saya sarankan untuk memprioritaskan rute berikut:
1. ${plannedAreas[0] || 'Area perumahan'} (pagi/siang)
2. ${plannedAreas[1] || 'Area perkantoran'} (siang/sore)
3. ${plannedAreas[2] || 'Area kampus'} (sore/malam)

Tips khusus untuk penjual ${vendorType}:
${getVendorSpecificTips(vendorType)}

Ingat untuk selalu update lokasi Anda di aplikasi KeLink agar pelanggan dapat dengan mudah menemukan Anda!`;
    }
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

// Helper function to get time context for vendor type
function getTimeContextForType(vendorType: string, timeOfDay: string): string {
  const genericTimeAdvice = {
    morning: 'Di pagi hari, fokus pada area perumahan dan kantoran saat orang memulai hari mereka. Area sekolah juga ramai di pagi hari.',
    afternoon: 'Siang hari adalah waktu makan siang, jadi area perkantoran, kampus, dan pusat perbelanjaan akan ramai. Pertimbangkan untuk berada di lokasi ini sekitar jam 11:30-14:00.',
    evening: 'Sore hari adalah waktu ketika orang pulang kerja/sekolah. Area perumahan, taman, dan jalan-jalan utama menuju perumahan akan ramai.',
    night: 'Malam hari cocok untuk area hiburan, pusat kota, atau area dengan aktivitas malam seperti taman yang ramai di malam hari.',
  }

  // Specific advice for vendor types during this time of day
  switch (vendorType.toLowerCase()) {
    case 'bakso':
      if (timeOfDay === 'morning') {
        return 'Pagi hari kurang optimal untuk penjual bakso. Pertimbangkan untuk mulai berjualan menjelang siang di sekitar area kantor atau sekolah.'
      }
      if (timeOfDay === 'afternoon') {
        return 'Siang hari adalah waktu yang sangat baik untuk penjual bakso di area perkantoran atau kampus saat jam makan siang (11:30-14:00).'
      }
      return genericTimeAdvice[timeOfDay as keyof typeof genericTimeAdvice]

    case 'siomay':
    case 'batagor':
      if (timeOfDay === 'evening') {
        return 'Sore hari sangat baik untuk penjual siomay/batagor saat orang pulang kerja/sekolah. Posisikan di area perumahan atau jalur pulang kerja.'
      }
      return genericTimeAdvice[timeOfDay as keyof typeof genericTimeAdvice]

    case 'es cendol':
    case 'es':
      if (timeOfDay === 'afternoon') {
        return 'Siang hari saat panas adalah waktu terbaik untuk penjual minuman dingin. Posisikan di area yang ramai dan terkena sinar matahari.'
      }
      return genericTimeAdvice[timeOfDay as keyof typeof genericTimeAdvice]

    case 'martabak':
      if (timeOfDay === 'night') {
        return 'Malam hari adalah waktu optimal untuk penjual martabak. Cari lokasi yang ramai di malam hari seperti pusat keramaian atau area perumahan.'
      }
      return genericTimeAdvice[timeOfDay as keyof typeof genericTimeAdvice]

    default:
      return genericTimeAdvice[timeOfDay as keyof typeof genericTimeAdvice]
  }
}

// Helper function to get vendor-specific tips
function getVendorSpecificTips(vendorType: string): string {
  switch (vendorType.toLowerCase()) {
    case 'bakso':
      return 'Sediakan cukup kuah dan pastikan tetap panas. Pilih lokasi yang teduh agar kuah tidak cepat dingin.'
    case 'siomay':
    case 'batagor':
      return 'Siomay dan batagor paling laku di sore hari. Pastikan saus kacang selalu fresh dan tersedia cukup.'
    case 'es cendol':
    case 'es':
      return 'Pastikan es tetap beku dan bahan-bahan segar. Carilah area teduh untuk menjaga kualitas es.'
    case 'martabak':
      return 'Martabak biasanya paling laris di malam hari. Pastikan semua topping tersedia dan wajan tetap panas.'
    default:
      return 'Pastikan produk Anda tetap dalam kondisi terbaik dan tersedia cukup untuk melayani pelanggan sepanjang hari.'
  }
}
