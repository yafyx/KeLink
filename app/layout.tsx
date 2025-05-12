import type React from "react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter_Tight } from "next/font/google";
import "./globals.css";
import { ClientThemeProvider } from "@/components/client-theme-provider";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta-sans",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
});

export const metadata: Metadata = {
  title: "KeLink",
  description: "Ask, Find, Enjoy: Connecting You to Mobile Vendors with AI",
  generator: "v0.dev",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
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
          <div className="mx-auto max-w-md min-h-screen overflow-x-hidden">
            {children}
          </div>
        </ClientThemeProvider>
      </body>
    </html>
  );
}
