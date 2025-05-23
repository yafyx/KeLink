import type React from "react";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter_Tight } from "next/font/google";
import "./globals.css";
import { ClientThemeProvider } from "@/components/client-theme-provider";
import { ConsentBanner } from "@/components/consent-banner";
import { AuthProvider } from "@/hooks/useAuth";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta-sans",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
});

export const metadata: Metadata = {
  title: "KeliLink",
  description: "Ask, Find, Enjoy: Connecting You to Mobile Peddlers with AI",
  generator: "v0.dev",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jakartaSans.variable} ${interTight.variable}`}
    >
      <body className={interTight.className}>
        <ClientThemeProvider>
          <AuthProvider>
            <div className="mx-auto max-w-md min-h-screen overflow-x-hidden">
              {children}
            </div>
            <ConsentBanner />
          </AuthProvider>
        </ClientThemeProvider>
      </body>
    </html>
  );
}
