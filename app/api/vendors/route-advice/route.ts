import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { vendor_type, planned_areas, city, time_of_day } = await request.json()

        if (!vendor_type || !planned_areas || !city) {
            return NextResponse.json(
                { error: 'Vendor type, planned areas, and city are required' },
                { status: 400 }
            )
        }

        // For MVP, we'll use a mock response based on the inputs
        // In the real implementation, this would call the Gemini API
        const response = generateRouteAdvice(vendor_type, planned_areas, city, time_of_day)

        return NextResponse.json({ advice: response }, { status: 200 })
    } catch (error) {
        console.error('Error generating route advice:', error)
        return NextResponse.json(
            { error: 'Failed to generate route advice' },
            { status: 500 }
        )
    }
}

// Mock function to generate route advice
// Will be replaced with actual Gemini API call
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