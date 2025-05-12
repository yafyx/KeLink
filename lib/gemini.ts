/**
 * lib/gemini.ts
 * 
 * Utility functions for Gemini API calls in the KeLink app.
 * 
 * Note: This is a placeholder implementation for the MVP. In the real
 * implementation, these functions would make actual calls to the Gemini API.
 */

/**
 * Generates a description for a vendor based on their name and type
 */
export async function generateVendorDescription(
  vendorName: string,
  vendorType: string
): Promise<string> {
  // In a real implementation, this would call the Gemini API with a prompt
  // For the MVP, we'll just simulate a delay and return a hardcoded response

  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Mock AI-generated descriptions based on vendor type
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

/**
 * Generates route advice for a vendor based on their type, planned areas, and time
 */
export async function getRouteAdvice(
  vendorType: string,
  plannedAreasText: string,
  city: string = 'Depok',
  timeOfDay?: string
): Promise<string> {
  // In a real implementation, this would call the backend API which uses Gemini
  // For the MVP, we'll simulate a delay and return a mock response

  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Parse the planned areas text into an array
  const plannedAreas = plannedAreasText
    .split('\n')
    .map((area) => area.trim())
    .filter((area) => area.length > 0)

  // Call the backend API
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
    })

    if (!response.ok) {
      throw new Error('Failed to get route advice')
    }

    const data = await response.json()
    return data.advice
  } catch (error) {
    // If the API call fails, return a generic response as fallback
    console.error('Error getting route advice:', error)

    return `Saran rute untuk penjual ${vendorType} di ${city}:

${getTimeContextForType(vendorType, getCurrentTimeOfDay())}

Berdasarkan rencana Anda di ${plannedAreas.join(', ')}, saya sarankan untuk memprioritaskan rute berikut:
1. ${plannedAreas[0] || 'Area perumahan'} (pagi/siang)
2. ${plannedAreas[1] || 'Area perkantoran'} (siang/sore)
3. ${plannedAreas[2] || 'Area kampus'} (sore/malam)

Tips khusus untuk penjual ${vendorType}:
${getVendorSpecificTips(vendorType)}

Ingat untuk selalu update lokasi Anda di aplikasi KeLink agar pelanggan dapat dengan mudah menemukan Anda!`
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
