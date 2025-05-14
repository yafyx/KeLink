"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Cookie, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/use-local-storage";

export function ConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [consentGiven, setConsentGiven] = useLocalStorage(
    "privacy-consent",
    false
  );

  useEffect(() => {
    // Show banner if consent hasn't been given yet
    // Using a small delay to avoid showing banner during hydration
    const timer = setTimeout(() => {
      setIsVisible(!consentGiven);
    }, 500);

    return () => clearTimeout(timer);
  }, [consentGiven]);

  const handleAccept = () => {
    setConsentGiven(true);
    setIsVisible(false);
  };

  const handleDecline = () => {
    // When declining, we need to let users know about limited functionality
    alert(
      "Some features of KeliLink may not work without location and data collection consent. You can change your preferences anytime."
    );
    // We close the banner but don't set the consent cookie
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 mx-auto max-w-3xl px-4">
      <div className="rounded-xl bg-white/90 backdrop-blur-sm dark:bg-gray-900/90 shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="relative p-6">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
              <Cookie className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                We value your privacy
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                We use cookies and collect location data to provide you with a
                better experience. By clicking "Accept", you consent to the use
                of cookies and location tracking for the purposes described in
                our{" "}
                <Link
                  href="/privacy"
                  className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  Privacy Policy
                </Link>
                .
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDecline}
                  className="rounded-full border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Decline
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAccept}
                  className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ShieldCheck className="mr-1.5 h-4 w-4" />
                  Accept All
                </Button>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsVisible(false)}
              className="absolute right-4 top-4 h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
