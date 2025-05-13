"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Trash2 } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface PrivacySettingsProps {
  isLoggedIn: boolean;
}

export function PrivacySettings({ isLoggedIn }: PrivacySettingsProps) {
  const [privacyConsent, setPrivacyConsent] = useLocalStorage(
    "privacy-consent",
    false
  );
  const [locationSharing, setLocationSharing] = useLocalStorage(
    "location-sharing",
    false
  );
  const [analyticsOptIn, setAnalyticsOptIn] = useLocalStorage(
    "analytics-opt-in",
    false
  );
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const handleConsentChange = (newValue: boolean) => {
    setPrivacyConsent(newValue);
    if (!newValue) {
      setLocationSharing(false);
      setAnalyticsOptIn(false);
    }
    setStatusMessage({
      text: newValue
        ? "Privacy consent enabled. You've enabled data collection to improve app functionality."
        : "Privacy consent disabled. You've disabled data collection. Some features may be limited.",
      type: "success",
    });
  };

  const handleLocationSharingChange = (newValue: boolean) => {
    if (!privacyConsent && newValue) {
      setStatusMessage({
        text: "Privacy consent required. You must enable privacy consent to use location sharing.",
        type: "error",
      });
      return;
    }
    setLocationSharing(newValue);
    setStatusMessage({
      text: newValue
        ? "Location sharing enabled. Your location will be used to find nearby vendors."
        : "Location sharing disabled. Your location will not be used. This may limit app functionality.",
      type: "success",
    });
  };

  const handleAnalyticsChange = (newValue: boolean) => {
    if (!privacyConsent && newValue) {
      setStatusMessage({
        text: "Privacy consent required. You must enable privacy consent to allow analytics.",
        type: "error",
      });
      return;
    }
    setAnalyticsOptIn(newValue);
    setStatusMessage({
      text: newValue
        ? "Analytics enabled. Anonymous usage data will be collected to improve the app."
        : "Analytics disabled. No usage data will be collected.",
      type: "success",
    });
  };

  const handleExportData = async () => {
    if (!isLoggedIn) {
      setStatusMessage({
        text: "Authentication required. You must be logged in to export your data.",
        type: "error",
      });
      return;
    }

    setIsExporting(true);
    try {
      const token = localStorage.getItem("vendor_token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch("/api/user/data-rights?action=export", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      const data = await response.json();

      // Create a downloadable file
      const blob = new Blob([JSON.stringify(data.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kelink-data-export-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMessage({
        text: "Data exported successfully. Your data has been downloaded as a JSON file.",
        type: "success",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      setStatusMessage({
        text:
          error instanceof Error ? error.message : "Failed to export your data",
        type: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteData = async () => {
    if (!isLoggedIn) {
      setStatusMessage({
        text: "Authentication required. You must be logged in to delete your data.",
        type: "error",
      });
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete all your data? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("vendor_token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch("/api/user/data-rights", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete data");
      }

      // Clear all local data and preferences
      localStorage.removeItem("vendor_token");
      localStorage.removeItem("privacy-consent");
      localStorage.removeItem("location-sharing");
      localStorage.removeItem("analytics-opt-in");

      setStatusMessage({
        text: "All your data has been deleted and your preferences reset. Redirecting...",
        type: "success",
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error) {
      console.error("Error deleting data:", error);
      setStatusMessage({
        text:
          error instanceof Error ? error.message : "Failed to delete your data",
        type: "error",
      });
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {statusMessage && (
        <div
          className={`p-3 rounded-md ${
            statusMessage.type === "success"
              ? "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200"
              : "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Privacy Preferences</h2>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="consent">Data Processing Consent</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Allow the app to collect and process your data
            </p>
          </div>
          <Switch
            id="consent"
            checked={privacyConsent}
            onCheckedChange={handleConsentChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="location">Location Sharing</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Share your location to find nearby vendors
            </p>
          </div>
          <Switch
            id="location"
            checked={locationSharing}
            disabled={!privacyConsent}
            onCheckedChange={handleLocationSharingChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="analytics">Usage Analytics</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Allow anonymous usage data collection
            </p>
          </div>
          <Switch
            id="analytics"
            checked={analyticsOptIn}
            disabled={!privacyConsent}
            onCheckedChange={handleAnalyticsChange}
          />
        </div>
      </div>

      {isLoggedIn && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Your Data</h2>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleExportData}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export your data
            </Button>

            <Button
              variant="destructive"
              className="gap-2"
              onClick={handleDeleteData}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete all your data
            </Button>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Deleting your data will permanently remove all information
            associated with your account. This action cannot be undone.
          </p>
        </div>
      )}

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          For more information about how we handle your data, please see our{" "}
          <a
            href="/privacy"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
