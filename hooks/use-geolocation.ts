import { useEffect, useState } from "react";
import { useLocalStorage } from "./use-local-storage";

// Extended permission state type to include 'unknown'
type GeolocationPermissionState = PermissionState | "unknown";

type GeolocationState = {
    location: {
        lat: number;
        lng: number;
    } | null;
    loading: boolean;
    error: GeolocationPositionError | Error | null;
    permissionState: GeolocationPermissionState;
    update: () => Promise<void>;
    requestPermission: () => Promise<boolean>;
};

/**
 * Hook for handling geolocation with permission state management
 * Handles permissions, updates, and fallback locations
 */
export function useGeolocation(defaultLocation?: { lat: number; lng: number }): GeolocationState {
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<GeolocationPositionError | Error | null>(null);
    const [permissionState, setPermissionState] = useState<GeolocationPermissionState>("unknown");
    const [locationSharing] = useLocalStorage("location-sharing", false);

    // Check permission status
    const checkPermission = async (): Promise<GeolocationPermissionState> => {
        try {
            // Only available in secure contexts (HTTPS) and not all browsers
            if (navigator.permissions && navigator.permissions.query) {
                const result = await navigator.permissions.query({ name: "geolocation" as PermissionName });
                setPermissionState(result.state);

                // Add event listener for permission changes
                result.addEventListener("change", () => {
                    setPermissionState(result.state);
                });

                return result.state;
            }
        } catch (err) {
            console.error("Error checking permission:", err);
        }

        // Fallback to "unknown" if permissions API is not available
        return "unknown";
    };

    // Request permission and get location
    const requestPermission = async (): Promise<boolean> => {
        if (!navigator.geolocation) {
            setError(new Error("Geolocation is not supported by this browser"));
            setLoading(false);
            return false;
        }

        try {
            setLoading(true);

            // This will trigger the permission prompt if not already granted
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 10000,
                });
            });

            setLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            });

            setError(null);
            await checkPermission(); // Update permission state
            return true;
        } catch (err) {
            if (err instanceof GeolocationPositionError) {
                setError(err);

                // Set permission denied if that's the error code
                if (err.code === err.PERMISSION_DENIED) {
                    setPermissionState("denied");
                }
            } else {
                setError(err as Error);
            }

            // Use default location if provided
            if (defaultLocation) {
                setLocation(defaultLocation);
            }

            return false;
        } finally {
            setLoading(false);
        }
    };

    // Update location
    const update = async (): Promise<void> => {
        if (!navigator.geolocation) {
            setError(new Error("Geolocation is not supported by this browser"));
            setLoading(false);
            return;
        }

        if (permissionState === "denied") {
            setError(new Error("Location permission has been denied"));
            if (defaultLocation) {
                setLocation(defaultLocation);
            }
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0, // Get fresh location
                });
            });

            setLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            });

            setError(null);
        } catch (err) {
            if (err instanceof GeolocationPositionError) {
                setError(err);
            } else {
                setError(err as Error);
            }

            // Use default location if provided
            if (defaultLocation) {
                setLocation(defaultLocation);
            }
        } finally {
            setLoading(false);
        }
    };

    // Initial setup
    useEffect(() => {
        // Check permissions first
        const initialSetup = async () => {
            await checkPermission();

            // If locationSharing is enabled in settings or permission is already granted, get location
            if (locationSharing || permissionState === "granted") {
                await update();
            } else if (defaultLocation) {
                // Use default location if permission not yet granted
                setLocation(defaultLocation);
                setLoading(false);
            } else {
                setLoading(false);
            }
        };

        initialSetup();
    }, [locationSharing]);

    return {
        location,
        loading,
        error,
        permissionState,
        update,
        requestPermission,
    };
} 