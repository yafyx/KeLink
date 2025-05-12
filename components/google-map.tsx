"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { MockMap } from "./mock-map";
import { motion } from "framer-motion";

const hideGoogleElements = `
  .gm-style-cc { display: none !important; }
  .gmnoprint { display: none !important; }
  .gm-style .gm-style-iw-c { display: none !important; }
  .gm-style a[href^="https://maps.google.com/maps"] { display: none !important; }
  .gm-style-moc { display: none !important; }
  .gm-control-active { display: none !important; }
  .gm-svpc { display: none !important; }
  a[href^="http://maps.google.com/maps"] { display: none !important; }
  a[href^="https://maps.google.com/maps"] { display: none !important; }
`;

// Add custom map styles
const mapStyles = [
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#e9e9e9" }, { lightness: 17 }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#f5f5f5" }, { lightness: 20 }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: "#ffffff" }, { lightness: 17 }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#ffffff" }, { lightness: 29 }, { weight: 0.2 }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }, { lightness: 18 }],
  },
  {
    featureType: "road.local",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }, { lightness: 16 }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#f5f5f5" }, { lightness: 21 }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#dedede" }, { lightness: 21 }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#f2f2f2" }, { lightness: 19 }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.fill",
    stylers: [{ color: "#fefefe" }, { lightness: 20 }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#fefefe" }, { lightness: 17 }, { weight: 1.2 }],
  },
];

const containerStyle = {
  width: "100%",
  height: "100%",
};

type Vendor = {
  id: string;
  name: string;
  type: string;
  description?: string;
  distance?: string;
  status: "active" | "inactive";
  last_active: string;
  location: {
    lat: number;
    lng: number;
  };
};

interface GoogleMapComponentProps {
  userLocation: { lat: number; lng: number } | null;
  vendors?: Vendor[];
  onVendorClick?: (vendor: Vendor) => void;
  selectedVendorId?: string;
  className?: string;
}

// Define vendor type colors (can be customized)
const vendorTypeColors: Record<string, string> = {
  bakso: "#E53935", // red
  siomay: "#43A047", // green
  batagor: "#1E88E5", // blue
  es_cendol: "#8E24AA", // purple
  sate_padang: "#FF9800", // orange
  default: "#757575", // gray
};

export function GoogleMapComponent({
  userLocation,
  vendors = [],
  onVendorClick,
  selectedVendorId,
  className,
}: GoogleMapComponentProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const hasApiKey =
    apiKey && apiKey !== "YOUR_GOOGLE_MAPS_API_KEY_HERE" && apiKey.length > 10;

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Use mock map if no API key is provided
  if (!hasApiKey) {
    return (
      <MockMap
        userLocation={userLocation}
        vendors={vendors}
        onVendorClick={onVendorClick}
        selectedVendorId={selectedVendorId}
        className={className}
      />
    );
  }

  // Add effect to ensure map container has proper height
  useEffect(() => {
    if (mapContainerRef.current && mapContainerRef.current.parentElement) {
      mapContainerRef.current.style.height = "100%";
      mapContainerRef.current.style.minHeight = "calc(100vh - 64px)"; // Adjust based on your header height
    }
  }, []);

  // Set selected vendor when selectedVendorId changes
  useEffect(() => {
    if (selectedVendorId) {
      const vendor = vendors.find((v) => v.id === selectedVendorId);
      setSelectedVendor(vendor || null);
    } else {
      setSelectedVendor(null);
    }
  }, [selectedVendorId, vendors]);

  const onLoad = useCallback(
    function callback(map: google.maps.Map) {
      const bounds = new window.google.maps.LatLngBounds();

      // Add user location to bounds
      if (userLocation) {
        bounds.extend(
          new window.google.maps.LatLng(userLocation.lat, userLocation.lng)
        );
      }

      // Add vendor locations to bounds
      vendors.forEach((vendor) => {
        // Only add vendor to bounds if it has valid location data
        if (
          vendor.location &&
          typeof vendor.location.lat === "number" &&
          typeof vendor.location.lng === "number"
        ) {
          bounds.extend(
            new window.google.maps.LatLng(
              vendor.location.lat,
              vendor.location.lng
            )
          );
        }
      });

      // Only fit bounds if we have points to show
      if (
        (userLocation ||
          vendors.some(
            (v) => v.location && typeof v.location.lat === "number"
          )) &&
        !bounds.isEmpty()
      ) {
        map.fitBounds(bounds);

        // Limit zoom level to prevent excessive zoom on single point
        const listener = google.maps.event.addListener(
          map,
          "idle",
          function () {
            if (
              map &&
              typeof map.getZoom() === "number" &&
              map.getZoom()! > 16
            ) {
              map.setZoom(16);
            }
            google.maps.event.removeListener(listener);
          }
        );
      } else {
        // Default to Jakarta if no valid locations
        map.setCenter({ lat: -6.2088, lng: 106.8456 });
        map.setZoom(14);
      }

      // Apply custom styling
      map.setOptions({
        styles: mapStyles,
        disableDefaultUI: true,
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false,
        zoomControl: false,
      });

      setMap(map);
      setTimeout(() => setIsMapReady(true), 500); // Delay to allow map to render fully
    },
    [userLocation, vendors]
  );

  const onUnmount = useCallback(function callback() {
    setMap(null);
    setIsMapReady(false);
  }, []);

  // Update bounds when vendors or user location changes
  useEffect(() => {
    if (map && (userLocation || vendors.length > 0)) {
      const bounds = new window.google.maps.LatLngBounds();

      if (userLocation) {
        bounds.extend(
          new window.google.maps.LatLng(userLocation.lat, userLocation.lng)
        );
      }

      // Add valid vendor locations to bounds
      let hasValidLocations = false;
      vendors.forEach((vendor) => {
        if (
          vendor &&
          vendor.location &&
          typeof vendor.location.lat === "number" &&
          typeof vendor.location.lng === "number"
        ) {
          bounds.extend(
            new window.google.maps.LatLng(
              vendor.location.lat,
              vendor.location.lng
            )
          );
          hasValidLocations = true;
        }
      });

      // Only fit bounds if we have valid locations and more than one point
      if ((userLocation || hasValidLocations) && !bounds.isEmpty()) {
        map.fitBounds(bounds);

        // Set a more reasonable zoom level if only one or two points
        if ((userLocation && vendors.length <= 1) || vendors.length <= 2) {
          const listener = google.maps.event.addListener(
            map,
            "idle",
            function () {
              if (
                map &&
                typeof map.getZoom() === "number" &&
                map.getZoom()! > 15
              ) {
                map.setZoom(15);
              }
              google.maps.event.removeListener(listener);
            }
          );
        }
      }
    }
  }, [map, userLocation, vendors]);

  // Close info window when clicking elsewhere on map
  const onMapClick = useCallback(() => {
    setSelectedVendor(null);
  }, []);

  // Handle marker click
  const handleMarkerClick = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    if (onVendorClick) {
      onVendorClick(vendor);
    }
  };

  // Create user location marker icon
  const createUserLocationMarker = () => ({
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    fillColor: "#4285F4",
    fillOpacity: 1,
    strokeColor: "#FFFFFF",
    strokeWeight: 2,
    scale: 1.5,
    anchor: new google.maps.Point(12, 22),
  });

  // Create vendor marker icon
  const createVendorMarker = (type: string, isSelected: boolean) => ({
    path: "M12 2C8.14 2 5 5.14 5 9c0 3.09 1.97 5.42 3 6.25V18h8v-2.75c1.03-0.83 3-3.16 3-6.25 0-3.86-3.14-7-7-7zm2.44 11.33c-.35.2-.75.33-1.19.4v1.67h-2.5v-1.67c-.44-.07-.84-.2-1.19-.4-.43-.25-.78-.59-1.06-1.23.82-.65 1.41-1.27 1.82-2.43.41 1.16 1 1.77 1.82 2.43-.28.64-.63.98-1.06 1.23z",
    fillColor: vendorTypeColors[type] || vendorTypeColors.default,
    fillOpacity: 1,
    strokeColor: "#FFFFFF",
    strokeWeight: 2,
    scale: isSelected ? 1.8 : 1.3,
    anchor: new google.maps.Point(12, 22),
  });

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg p-4">
        <p className="text-red-500">
          Failed to load Google Maps: Check your API key
        </p>
      </div>
    );
  }

  return (
    <div ref={mapContainerRef} className="w-full h-full relative">
      {/* CSS to hide Google branding elements */}
      <style dangerouslySetInnerHTML={{ __html: hideGoogleElements }} />

      {isLoaded ? (
        <>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={
              userLocation ? userLocation : { lat: -6.2088, lng: 106.8456 }
            }
            zoom={14}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onClick={onMapClick}
            options={{
              disableDefaultUI: true,
              fullscreenControl: false,
              streetViewControl: false,
              mapTypeControl: false,
              zoomControl: false,
              styles: mapStyles,
            }}
          >
            {/* User location marker */}
            {userLocation && isMapReady && (
              <Marker
                position={userLocation}
                icon={createUserLocationMarker()}
                animation={google.maps.Animation.DROP}
                zIndex={1000}
              />
            )}

            {/* Vendor markers */}
            {isMapReady &&
              vendors
                .filter(
                  (vendor) =>
                    vendor &&
                    vendor.location &&
                    typeof vendor.location.lat === "number" &&
                    typeof vendor.location.lng === "number"
                )
                .map((vendor, index) => {
                  const isSelected = vendor.id === selectedVendorId;
                  return (
                    <Marker
                      key={vendor.id}
                      position={vendor.location}
                      onClick={() => handleMarkerClick(vendor)}
                      icon={createVendorMarker(vendor.type, isSelected)}
                      animation={
                        isSelected
                          ? google.maps.Animation.BOUNCE
                          : google.maps.Animation.DROP
                      }
                      zIndex={isSelected ? 100 : 10}
                    />
                  );
                })}

            {/* Info window for selected vendor */}
            {selectedVendor && (
              <InfoWindow
                position={selectedVendor.location}
                onCloseClick={() => setSelectedVendor(null)}
                options={{
                  pixelOffset: new google.maps.Size(0, -40),
                }}
              >
                <div className="p-1">
                  <h3 className="font-semibold text-sm">
                    {selectedVendor.name}
                  </h3>
                  <div className="text-xs text-gray-600">
                    {selectedVendor.type}
                  </div>
                  {selectedVendor.distance && (
                    <div className="text-xs mt-1 flex items-center">
                      <span
                        className="inline-block h-2 w-2 rounded-full mr-1"
                        style={{
                          backgroundColor:
                            vendorTypeColors[selectedVendor.type] ||
                            vendorTypeColors.default,
                        }}
                      ></span>
                      <span>{selectedVendor.distance}</span>
                    </div>
                  )}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>

          {/* Decorative overlay for map */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.05)]"></div>

          {/* Loading overlay */}
          {!isMapReady && (
            <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-sm text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <div className="flex flex-col items-center">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
