"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrivacySettings } from "@/components/privacy-settings";
import { MobileHeader } from "@/components/ui/mobile-header";

export default function PrivacySettingsPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("vendor_token");
    setIsLoggedIn(!!token);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <MobileHeader
        title="Privacy Settings"
        centerContent={true}
        leftAction={
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 flex items-center justify-center"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />

      <main className="flex-1 container p-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold mb-4">Privacy & Data Settings</h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Manage your privacy preferences and control how your data is used
            throughout the application.
          </p>

          <PrivacySettings isLoggedIn={isLoggedIn} />
        </div>
      </main>
    </div>
  );
}
