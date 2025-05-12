import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { message, location } = await request.json()

        // For the MVP, we're implementing a mock response function
        // In the real implementation, this would call the Gemini API with function calling

        const response = await mockGeminiResponse(message, location)

        return NextResponse.json({ response }, { status: 200 })
    } catch (error) {
        console.error('Error processing find request:', error)
        return NextResponse.json(
            { error: 'Failed to process your request' },
            { status: 500 }
        )
    }
}

// Mock function to simulate Gemini API responses
// Will be replaced with actual Gemini API call with function calling
async function mockGeminiResponse(query: string, location: { lat: number; lon: number } | null) {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000))

    const lowercaseQuery = query.toLowerCase()

    if (lowercaseQuery.includes('bakso') || lowercaseQuery.includes('meatball')) {
        return {
            text: `Ada 2 penjual bakso aktif di sekitar Anda:
1. Bakso Pak Jono (sekitar 500m dari lokasi Anda)
2. Bakso Malang Bu Siti (sekitar 1.2km)

Keduanya masih aktif berjualan. Ingin info lebih lanjut tentang salah satu penjual?`,
            vendors: [
                {
                    id: 'v1',
                    name: 'Bakso Pak Jono',
                    type: 'Bakso',
                    distance: '500m',
                    status: 'active',
                    last_active: new Date().toISOString(),
                },
                {
                    id: 'v2',
                    name: 'Bakso Malang Bu Siti',
                    type: 'Bakso',
                    distance: '1.2km',
                    status: 'active',
                    last_active: new Date().toISOString(),
                }
            ]
        }
    } else if (lowercaseQuery.includes('siomay') || lowercaseQuery.includes('batagor')) {
        return {
            text: `Saya menemukan 1 penjual siomay yang aktif di dekat Anda:
Siomay & Batagor Mang Ujang (sekitar 750m dari lokasi Anda)

Mang Ujang terkenal dengan saus kacangnya yang nikmat. Penjual sedang aktif berjualan.`,
            vendors: [
                {
                    id: 'v3',
                    name: 'Siomay & Batagor Mang Ujang',
                    type: 'Siomay/Batagor',
                    distance: '750m',
                    status: 'active',
                    last_active: new Date().toISOString(),
                }
            ]
        }
    } else if (lowercaseQuery.includes('es') || lowercaseQuery.includes('ice') || lowercaseQuery.includes('cendol')) {
        return {
            text: `Saat ini ada 3 penjual minuman dingin di sekitar Anda:
1. Es Cendol Pak Wawan (sekitar 300m)
2. Es Kelapa Muda Bu Ratna (sekitar 850m)
3. Es Cincau Mas Budi (sekitar 1.5km)

Semua penjual sedang aktif berjualan.`,
            vendors: [
                {
                    id: 'v4',
                    name: 'Es Cendol Pak Wawan',
                    type: 'Es Cendol',
                    distance: '300m',
                    status: 'active',
                    last_active: new Date().toISOString(),
                },
                {
                    id: 'v5',
                    name: 'Es Kelapa Muda Bu Ratna',
                    type: 'Es Kelapa',
                    distance: '850m',
                    status: 'active',
                    last_active: new Date().toISOString(),
                },
                {
                    id: 'v6',
                    name: 'Es Cincau Mas Budi',
                    type: 'Es Cincau',
                    distance: '1.5km',
                    status: 'active',
                    last_active: new Date().toISOString(),
                }
            ]
        }
    } else {
        return {
            text: `Maaf, saat ini saya tidak menemukan penjual "${query}" yang aktif di sekitar Anda. Coba cari jenis makanan lain seperti bakso, siomay, atau es cendol.`,
            vendors: []
        }
    }
} 