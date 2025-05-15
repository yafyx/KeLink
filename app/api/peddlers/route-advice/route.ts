import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';

const routeAdviceModel = google('gemini-2.0-flash');

export async function POST(request: Request) {
    try {
        const { peddler_type, planned_areas, city, time_of_day } = await request.json()

        if (!peddler_type || !planned_areas || !city) {
            return NextResponse.json(
                { error: 'Peddler type, planned areas, and city are required' },
                { status: 400 }
            )
        }

        const prompt = `
            As an assistant for street peddlers in Indonesia, provide route advice for:
            
            Peddler type: ${peddler_type}
            Location: ${city}
            Planned areas: ${planned_areas.join(', ')}
            ${time_of_day ? `Time of day: ${time_of_day}` : ''}
            
            Provide route suggestions including:
            1. Recommended best times to sell based on peddler type
            2. Route priorities in the planned areas
            3. Special tips for ${peddler_type} peddlers
            4. Specific insights about ${city} relevant to peddlers
            
            Format your response in clear and structured English.
        `

        const result = await streamText({
            model: routeAdviceModel,
            prompt: prompt,
        });

        return result.toDataStreamResponse();

    } catch (error) {
        console.error('Error generating route advice:', error)

        let peddlerType = '';
        let plannedAreas: string[] = [];
        let city = '';
        let timeOfDay: string | undefined;

        try {
            const requestData = await request.json();
            peddlerType = requestData.peddler_type || '';
            plannedAreas = requestData.planned_areas || [];
            city = requestData.city || '';
            timeOfDay = requestData.time_of_day;
        } catch (jsonError) {
            console.error('Error parsing request in error handler:', jsonError);
        }

        const fallbackResponse = generateRouteAdvice(
            peddlerType,
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

function generateRouteAdvice(
    peddlerType: string,
    plannedAreas: string[],
    city: string,
    timeOfDay?: string
): string {
    const timeContext = timeOfDay ? getTimeContext(timeOfDay) : getTimeContext(getCurrentTimeOfDay())
    const citySpecific = getCitySpecificAdvice(city, peddlerType)

    let areaSpecificAdvice = ''
    if (plannedAreas.length > 0) {
        const prioritizedAreas = prioritizeAreas(plannedAreas, peddlerType, timeOfDay)
        areaSpecificAdvice = `\n\nBerdasarkan rencana Anda di ${plannedAreas.join(', ')}, saya sarankan untuk memprioritaskan rute berikut:\n${prioritizedAreas.map((area, i) => `${i + 1}. ${area}`).join('\n')}`
    }

    let peddlerSpecificTips = ''
    switch (peddlerType.toLowerCase()) {
        case 'bakso':
            peddlerSpecificTips = 'Sediakan cukup kuah dan pastikan tetap panas. Pilih lokasi yang teduh agar kuah tidak cepat dingin.'
            break
        case 'siomay':
        case 'batagor':
            peddlerSpecificTips = 'Siomay dan batagor paling laku di sore hari. Pastikan saus kacang selalu fresh dan tersedia cukup.'
            break
        case 'es':
        case 'es cendol':
        case 'es kelapa':
            peddlerSpecificTips = 'Pastikan es tetap beku dan bahan-bahan segar. Carilah area teduh untuk menjaga kualitas es.'
            break
        case 'martabak':
            peddlerSpecificTips = 'Martabak biasanya paling laris di malam hari. Pastikan semua topping tersedia dan wajan tetap panas.'
            break
        default:
            peddlerSpecificTips = 'Pastikan produk Anda tetap dalam kondisi terbaik dan tersedia cukup untuk melayani pelanggan sepanjang hari.'
    }

    return `Saran rute untuk penjual ${peddlerType} di ${city}:

${timeContext}

${citySpecific}${areaSpecificAdvice}

Tips khusus untuk penjual ${peddlerType}:
${peddlerSpecificTips}

Ingat untuk selalu update lokasi Anda di aplikasi KeliLink agar pelanggan dapat dengan mudah menemukan Anda!`
}

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

function getCurrentTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'pagi';
    if (hour >= 11 && hour < 15) return 'siang';
    if (hour >= 15 && hour < 19) return 'sore';
    return 'malam';
}

function getCitySpecificAdvice(city: string, peddlerType: string): string {
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

function prioritizeAreas(areas: string[], peddlerType: string, timeOfDay?: string): string[] {
    return [...areas].sort(() => Math.random() - 0.5);
}