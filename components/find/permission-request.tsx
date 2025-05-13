import React from "react";
import {
  AlertCircle,
  MapPin,
  Info,
  Check,
  X,
  Settings,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";

type PermissionRequestProps = {
  permissionState: PermissionState | "unknown";
  onRequestPermission: () => Promise<boolean | void>;
  onSkip: () => void;
  className?: string;
};

export function PermissionRequest({
  permissionState,
  onRequestPermission,
  onSkip,
  className,
}: PermissionRequestProps) {
  const handleRequestClick = async () => {
    await onRequestPermission();
  };

  // Show different content based on permission state
  const renderContent = () => {
    switch (permissionState) {
      case "denied":
        return (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                Location Access Denied
              </CardTitle>
              <CardDescription>
                You've denied location access, which limits functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300">
                <p>
                  KeLink uses your location to find peddlers near you. Without
                  location access, we can only show sample results or peddlers
                  in default areas.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">To enable location access:</h4>
                <ol className="ml-5 list-decimal space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>Open your browser settings</li>
                  <li>Navigate to Site Settings or Permissions</li>
                  <li>Find KeLink and allow location access</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full flex gap-2 items-center"
                onClick={onSkip}
              >
                <Check className="h-4 w-4" />
                Continue with limited functionality
              </Button>
            </CardFooter>
          </>
        );

      case "granted":
        return (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Check className="h-5 w-5" />
                Location Access Granted
              </CardTitle>
              <CardDescription>
                Your location is being used to find nearby peddlers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-700 dark:text-green-300">
                <p>
                  Thank you for allowing location access. We can now provide
                  accurate information about peddlers in your area.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full flex gap-2 items-center"
                onClick={onSkip}
              >
                <Check className="h-4 w-4" />
                Continue
              </Button>
            </CardFooter>
          </>
        );

      default: // prompt or unknown
        return (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Access Needed
              </CardTitle>
              <CardDescription>
                KeLink uses your location to find peddlers near you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  To show relevant results, we need to know where you are. Your
                  location is only used to find peddlers nearby and is not
                  stored permanently.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-gray-500" />
                  What to expect:
                </h4>
                <ul className="ml-5 list-disc space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>Your browser will show a permission prompt</li>
                  <li>You can change this setting anytime</li>
                  <li>
                    Location data is only shared while using the application
                  </li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                className="w-full flex gap-2 items-center"
                onClick={handleRequestClick}
              >
                <MapPin className="h-4 w-4" />
                Allow Location Access
              </Button>
              <Button
                variant="outline"
                className="w-full flex gap-2 items-center"
                onClick={onSkip}
              >
                <X className="h-4 w-4" />
                Skip for now
              </Button>
            </CardFooter>
          </>
        );
    }
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <Card className="shadow-lg border-gray-200 dark:border-gray-800">
        {renderContent()}
      </Card>
    </motion.div>
  );
}
