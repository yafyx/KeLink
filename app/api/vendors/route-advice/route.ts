import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

// Initialize Google Generative AI with API key
// Use server-side env variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: Request) {
    try {
        const { vendor_type, planned_areas, city, time_of_day } = await request.json()

        if (!vendor_type || !planned_areas || !city) {
            return NextResponse.json(
                { error: 'Vendor type, planned areas, and city are required' },
                { status: 400 }
            )
        }

        // Call Gemini API to generate route advice
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

        // Construct prompt for Gemini API
        const prompt = `
            Sebagai asisten untuk pedagang kaki lima di Indonesia, berikan saran rute untuk:
            
            Jenis pedagang: ${vendor_type}
            Lokasi: ${city}
            Area yang direncanakan: ${planned_areas.join(', ')}
            ${time_of_day ? `Waktu: ${time_of_day}` : ''}
            
            Berikan saran rute termasuk:
            1. Rekomendasi waktu terbaik untuk berjualan berdasarkan jenis pedagang
            2. Prioritas rute di area yang direncanakan
            3. Tips khusus untuk penjual jenis ${vendor_type}
            4. Wawasan khusus tentang ${city} yang relevan untuk pedagang
            
            Format respons Anda dalam bahasa Indonesia yang jelas dan terstruktur.
        `

        const result = await model.generateContent(prompt)
        const response = result.response
        const text = response.text()

        return NextResponse.json({ advice: text }, { status: 200 })
    } catch (error) {
        console.error('Error generating route advice:', error)

        let vendorType = '';
        let plannedAreas: string[] = [];
        let city = '';
        let timeOfDay: string | undefined;

        try {
            // Try to extract request data if possible
            const requestData = await request.json();
            vendorType = requestData.vendor_type || '';
            plannedAreas = requestData.planned_areas || [];
            city = requestData.city || '';
            timeOfDay = requestData.time_of_day;
        } catch (jsonError) {
            console.error('Error parsing request in error handler:', jsonError);
        }

        // Fallback to the mock response if API call fails
        const fallbackResponse = generateRouteAdvice(
            vendorType,
            plannedAreas,
            city,
            timeOfDay
        )

        return NextResponse.json(
            {
                advice: fallbackResponse,
                note: "Using fallback response due to API error"
            },
            { status: 200 }
        )
    }
}

// Mock function to generate route advice
// Will be used as fallback if the Gemini API call fails
function generateRouteAdvice(
    vendorType: string,
    plannedAreas: string[],
    city: string,
    timeOfDay?: string
): string {
    // Example logic for various vendor types
    const timeContext = timeOfDay ? getTimeContext(timeOfDay) : getTimeContext(getCurrentTimeOfDay())
    const citySpecific = getCitySpecificAdvice(city, vendorType)

    let areaSpecificAdvice = ''
    if (plannedAreas.length > 0) {
        const prioritizedAreas = prioritizeAreas(plannedAreas, vendorType, timeOfDay)
        areaSpecificAdvice = `\n\nBerdasarkan rencana Anda di ${plannedAreas.join(', ')}, saya sarankan untuk memprioritaskan rute berikut:\n${prioritizedAreas.map((area, i) => `${i + 1}. ${area}`).join('\n')}`
    }

    let vendorSpecificTips = ''
    switch (vendorType.toLowerCase()) {
        case 'bakso':
            vendorSpecificTips = 'Sediakan cukup kuah dan pastikan tetap panas. Pilih lokasi yang teduh agar kuah tidak cepat dingin.'
            break
        case 'siomay':
        case 'batagor':
            vendorSpecificTips = 'Siomay dan batagor paling laku di sore hari. Pastikan saus kacang selalu fresh dan tersedia cukup.'
            break
        case 'es':
        case 'es cendol':
        case 'es kelapa':
            vendorSpecificTips = 'Pastikan es tetap beku dan bahan-bahan segar. Carilah area teduh untuk menjaga kualitas es.'
            break
        case 'martabak':
            vendorSpecificTips = 'Martabak biasanya paling laris di malam hari. Pastikan semua topping tersedia dan wajan tetap panas.'
            break
        default:
            vendorSpecificTips = 'Pastikan produk Anda tetap dalam kondisi terbaik dan tersedia cukup untuk melayani pelanggan sepanjang hari.'
    }

    return `Saran rute untuk penjual ${vendorType} di ${city}:

${timeContext}

${citySpecific}${areaSpecificAdvice}

Tips khusus untuk penjual ${vendorType}:
${vendorSpecificTips}

Ingat untuk selalu update lokasi Anda di aplikasi KeLink agar pelanggan dapat dengan mudah menemukan Anda!`
}

// Helper function to get time-specific advice
function getTimeContext(timeOfDay: string): string {
    switch (timeOfDay.toLowerCase()) {
        case 'morning':
        case 'pagi':
            return 'Di pagi hari, fokus pada area perumahan dan kantoran saat orang memulai hari mereka. Area sekolah juga ramai di pagi hari.';
        case 'afternoon':
        case 'siang':
            return 'Siang hari adalah waktu makan siang, jadi area perkantoran, kampus, dan pusat perbelanjaan akan ramai. Pertimbangkan untuk berada di lokasi ini sekitar jam 11:30-14:00.';
        case 'evening':
        case 'sore':
            return 'Sore hari adalah waktu ketika orang pulang kerja/sekolah. Area perumahan, taman, dan jalan-jalan utama menuju perumahan akan ramai.';
        case 'night':
        case 'malam':
            return 'Malam hari cocok untuk area hiburan, pusat kota, atau area dengan aktivitas malam seperti taman yang ramai di malam hari.';
        default:
            return 'Sesuaikan waktu berjualan dengan kebiasaan masyarakat setempat. Perhatikan jam-jam sibuk di area yang Anda pilih.';
    }
}

// Get current time of day
function getCurrentTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'pagi';
    if (hour >= 11 && hour < 15) return 'siang';
    if (hour >= 15 && hour < 19) return 'sore';
    return 'malam';
}

// Helper function for city-specific advice
function getCitySpecificAdvice(city: string, vendorType: string): string {
    // Just a few examples
    if (city.toLowerCase().includes('jakarta')) {
        return 'Jakarta memiliki banyak area perkantoran yang ramai di jam makan siang dan jam pulang kerja. Di pagi hari, stasiun MRT dan halte TransJakarta bisa menjadi lokasi strategis.';
    } else if (city.toLowerCase().includes('bandung')) {
        return 'Bandung memiliki banyak area kampus dan wisata. Area kampus seperti ITB dan UNPAD ramai di siang hari, sementara area wisata seperti Dago ramai di akhir pekan.';
    } else if (city.toLowerCase().includes('yogyakarta') || city.toLowerCase().includes('jogja')) {
        return 'Jogja memiliki banyak kampus dan tempat wisata. Area Malioboro ramai sepanjang hari, sedangkan area kampus seperti UGM dan UNY ramai di hari kerja.';
    } else if (city.toLowerCase().includes('surabaya')) {
        return 'Surabaya memiliki pusat bisnis di area Tunjungan dan kampus ITS/UNAIR yang ramai di hari kerja. Area Kenjeran dan Pakuwon ramai di akhir pekan.';
    } else {
        return `Ketahui pola keramaian di ${city} dan fokuslah pada area dengan banyak aktivitas sesuai waktu berjualan Anda.`;
    }
}

// Helper function to prioritize areas
function prioritizeAreas(areas: string[], vendorType: string, timeOfDay?: string): string[] {
    // This is a simplified mock implementation
    // In a real implementation, this would use more complex logic or AI

    // Just shuffle the array to simulate prioritization
    return [...areas].sort(() => Math.random() - 0.5);
} 