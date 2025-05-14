# KeliLink - Mobile Peddler Finder

KeliLink is a platform that connects street food peddlers in Indonesia with customers. This application helps customers find mobile food peddlers around them, and helps peddlers optimize their routes and connect with their customers.

## Features

### For Customers

- **Find Peddlers:** Search for food peddlers near your location using natural language queries
- **Interactive Map:** View peddler locations on an interactive map
- **Chat Interface:** Interact with the app using a conversational interface
- **Multilingual Support:** Available in Indonesian language

### For Peddlers

- **Profile Management:** Create and manage a peddler profile
- **Location Sharing:** Share real-time location with potential customers
- **Status Toggle:** Go "live" when actively selling and "offline" when not
- **Route Optimization:** Get AI-powered advice for optimizing your selling route
- **Analytics Dashboard:** View customer interaction statistics

## Tech Stack

- **Frontend:** Next.js, React, TailwindCSS, Shadcn/UI
- **Backend:** Next.js API Routes
- **Database:** Firestore (Firebase)
- **Authentication:** JWT with Firebase Auth
- **AI/ML:** Google Gemini API for natural language processing and route optimization
- **Maps:** Google Maps API

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- Firebase account with Firestore enabled
- Google Gemini API key
- Google Maps API key

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/kelink.git
   cd kelink
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   pnpm install
   ```

3. Copy the `.env.example` file to `.env.local` and fill in your API keys and configuration:

   ```bash
   cp .env.example .env.local
   ```

4. Set up Firebase:

   - Create a Firebase project in the Firebase console
   - Enable Firestore database
   - Set up Firebase Authentication
   - Generate a private key for the Firebase Admin SDK and add it to your environment variables

5. Run the development server:

   ```bash
   npm run dev
   # or
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Deployment

### Deploying to Vercel

1. Create a Vercel account if you don't have one.
2. Install the Vercel CLI:

   ```bash
   npm install -g vercel
   ```

3. Log in to Vercel:

   ```bash
   vercel login
   ```

4. Deploy the project:

   ```bash
   vercel
   ```

5. Add your environment variables in the Vercel dashboard.

### Environment Variables

Make sure to set the following environment variables in your deployment environment:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_DATABASE_URL=
FIREBASE_STORAGE_BUCKET=
JWT_SECRET=
GEMINI_API_KEY=
NEXT_PUBLIC_GEMINI_API_KEY=
```

## Project Structure

- `/app` - Next.js app directory with pages and API routes
  - `/api` - Backend API endpoints
  - `/find` - Customer-facing peddler search interface
  - `/peddler` - Peddler portal for profile management, dashboard, and route advice
- `/components` - Reusable React components
- `/lib` - Utility functions and shared code
- `/public` - Static assets
- `/hooks` - Custom React hooks

## Testing

1. **Peddler Flow Testing:**

   - Test registration and login
   - Test profile updates
   - Test location sharing and status toggling
   - Test route advice functionality

2. **Customer Flow Testing:**
   - Test searching for peddlers
   - Test geolocation permission handling
   - Test chatbot responses
   - Test map interactions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Shadcn/UI for the beautiful component library
- Google Gemini for the AI capabilities
- Firebase for database and authentication
- The street peddlers of Indonesia for inspiration
