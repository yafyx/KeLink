# KeLink

KeLink is a platform that connects street food vendors with customers in Indonesia. The application helps vendors plan optimal routes while allowing customers to find and chat with nearby vendors.

## Features

- **Vendor Management**: Registration, login, and profile management for street food vendors
- **Route Advice**: AI-powered route recommendations for vendors
- **Live Tracking**: Enables vendors to share their location with customers
- **Customer Chat**: Allows customers to find and chat with vendors

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- pnpm (or npm/yarn)
- Google account for API keys

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/KeLink.git
   cd KeLink
   ```

2. Install dependencies

   ```bash
   pnpm install
   ```

3. Set up environment variables

   - Copy `.env.example` to `.env.local`
   - Fill in the required API keys and credentials

4. Run the development server

   ```bash
   pnpm dev
   ```

### Setting up Google Gemini API

The application uses Google's Gemini API for generating route advice. Follow these steps to set up your API key:

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Navigate to "Get API Key" from the left sidebar menu
4. Click "Create API Key"
5. Copy the generated API key
6. Add the key to your `.env.local` file:

   ```bash
   GEMINI_API_KEY=your_api_key_here
   NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```

Note: The application uses both server-side and client-side implementations of the Gemini API, which is why both environment variables are needed.

### Setting up Firebase

The application uses Firebase for authentication and data storage. Follow these steps to set up Firebase:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Set up Authentication (Email/Password)
4. Set up Firestore Database
5. Generate a service account key (Project settings > Service accounts > Generate new private key)
6. Add the Firebase configuration to your `.env.local` file

## Project Structure

- `/app`: Next.js app router files
  - `/api`: Backend API endpoints
  - `/find`: Customer-facing pages
  - `/vendor`: Vendor-facing pages
- `/components`: React components
- `/lib`: Utility functions and shared code
- `/hooks`: Custom React hooks
