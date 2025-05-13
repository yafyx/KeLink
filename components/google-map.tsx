"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  InfoWindow,
  Polyline,
} from "@react-google-maps/api";
import { MockMap } from "./mock-map";
import { motion } from "framer-motion";
import { RouteDetails, RoutePoint, calculateRoute } from "@/lib/route-mapper";
import ReactDOM from "react-dom/client";

const hideGoogleElements = `
  .gm-style-cc { display: none !important; }
  .gmnoprint { display: none !important; }
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

type Peddler = {
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
  peddlers?: Peddler[];
  onVendorClick?: (peddler: Peddler) => void;
  selectedVendorId?: string;
  className?: string;
  showRoute?: boolean;
}

// Define peddler type colors (can be customized)
const vendorTypeColors: Record<string, string> = {
  bakso: "#E53935", // red
  siomay: "#43A047", // green
  batagor: "#1E88E5", // blue
  es_cendol: "#8E24AA", // purple
  sate_padang: "#FF9800", // orange
  default: "#757575", // gray
};

// Custom HTML Marker components
const UserLocationMarkerIcon = () => (
  <div
    style={{
      width: "24px",
      height: "24px",
      borderRadius: "50%",
      backgroundColor: "#4285F4",
      border: "2px solid white",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    }}
  >
    <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  </div>
);

interface VendorMarkerIconProps {
  type: string;
  isSelected: boolean;
}

const VendorMarkerIcon = ({ type, isSelected }: VendorMarkerIconProps) => {
  const color = vendorTypeColors[type] || vendorTypeColors.default;
  const scale = isSelected ? 1.2 : 1; // Adjust scale for bounce effect
  const bounceAnimation = isSelected ? "bounce 0.8s infinite" : "none";

  return (
    <div
      style={{
        width: `${28 * scale}px`,
        height: `${28 * scale}px`,
        transformOrigin: "bottom center",
        animation: bounceAnimation,
      }}
    >
      <style>
        {`
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {transform: translateY(0) scale(${scale});}
            40% {transform: translateY(-10px) scale(${scale * 1.1});}
            60% {transform: translateY(-5px) scale(${scale * 1.05});}
          }
        `}
      </style>
      <svg
        viewBox="0 0 24 24"
        fill={color}
        style={{
          width: "100%",
          height: "100%",
          filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.3))",
        }}
      >
        {/* Simplified pin shape, original SVG was complex for direct HTML styling */}
        <path d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13C12 15.86 12 2 12 2zm0 9a2.5 2.5 0 000-5 2.5 2.5 0 000 5z" />
        {/* Outer circle to mimic original design's feel, with white stroke */}
        <circle
          cx="12"
          cy="9"
          r="3.5"
          fill="transparent"
          stroke="white"
          strokeWidth="1.5"
        />
        {/* Inner dot */}
        <circle cx="12" cy="9" r="1.5" fill="white" />
      </svg>
    </div>
  );
};

// Define AdvancedMarkerWrapper component
interface AdvancedMarkerWrapperProps {
  map: google.maps.Map | null;
  position: google.maps.LatLngLiteral;
  zIndex?: number;
  onClick?: () => void;
  children?: React.ReactNode;
  gMapApi?: typeof google.maps; // Pass google.maps object
  onMarkerInstance?: (
    marker: google.maps.marker.AdvancedMarkerElement | null
  ) => void; // Callback to get marker instance
}

const AdvancedMarkerWrapper: React.FC<AdvancedMarkerWrapperProps> = ({
  map,
  position,
  zIndex,
  onClick,
  children,
  gMapApi,
  onMarkerInstance,
}) => {
  const [marker, setMarker] =
    useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [root, setRoot] = useState<ReactDOM.Root | null>(null);

  useEffect(() => {
    if (!map || !gMapApi || !gMapApi.marker) {
      if (marker) {
        marker.map = null;
        setMarker(null);
        if (onMarkerInstance) onMarkerInstance(null);
      }
      return;
    }

    if (!contentRef.current) {
      contentRef.current = document.createElement("div");
    }

    const newAdvancedMarker = new gMapApi.marker.AdvancedMarkerElement({
      position,
      map,
      zIndex,
      content: contentRef.current,
    });

    setMarker(newAdvancedMarker);
    if (onMarkerInstance) onMarkerInstance(newAdvancedMarker);

    if (!root && contentRef.current) {
      setRoot(ReactDOM.createRoot(contentRef.current));
    }

    return () => {
      newAdvancedMarker.map = null;
      setMarker(null);
      if (onMarkerInstance) onMarkerInstance(null);
    };
  }, [map, position, zIndex, gMapApi, onMarkerInstance]);

  useEffect(() => {
    if (root && children) {
      root.render(<div>{children}</div>);
    } else if (root && !children) {
      root.render(null);
    }
  }, [root, children]);

  useEffect(() => {
    if (marker && onClick && gMapApi) {
      const listener = marker.addListener("click", onClick);
      return () => {
        gMapApi.event.removeListener(listener);
      };
    }
  }, [marker, onClick, gMapApi]);

  return null;
};

export function GoogleMapComponent({
  userLocation,
  peddlers = [],
  onVendorClick,
  selectedVendorId,
  className,
  showRoute = false,
}: GoogleMapComponentProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const hasApiKey =
    apiKey && apiKey !== "YOUR_GOOGLE_MAPS_API_KEY_HERE" && apiKey.length > 10;

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries: ["marker"],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedVendor, setSelectedVendor] = useState<Peddler | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  const [selectedMarkerInstance, setSelectedMarkerInstance] =
    useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  const peddlerMarkerRefs = useRef<
    Record<string, google.maps.marker.AdvancedMarkerElement | null>
  >({});

  if (!hasApiKey) {
    return (
      <MockMap
        userLocation={userLocation}
        peddlers={peddlers}
        onVendorClick={onVendorClick}
        selectedVendorId={selectedVendorId}
        className={className}
      />
    );
  }

  useEffect(() => {
    if (mapContainerRef.current && mapContainerRef.current.parentElement) {
      mapContainerRef.current.style.height = "100%";
      mapContainerRef.current.style.minHeight = "calc(100vh - 64px)";
    }
  }, []);

  useEffect(() => {
    if (selectedVendorId) {
      const peddler = peddlers.find((v) => v.id === selectedVendorId);
      setSelectedVendor(peddler || null);

      if (showRoute && userLocation && peddler) {
        calculateBestRoute(userLocation, peddler.location);
      } else {
        setRouteDetails(null);
      }
    } else {
      setSelectedVendor(null);
      setRouteDetails(null);
    }
  }, [selectedVendorId, peddlers, userLocation, showRoute]);

  const calculateBestRoute = async (
    origin: RoutePoint,
    destination: RoutePoint
  ) => {
    setIsLoadingRoute(true);
    try {
      const route = await calculateRoute(origin, destination, "WALKING");
      setRouteDetails(route);
    } catch (error) {
      console.error("Error calculating route:", error);
      setRouteDetails(null);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const onLoad = useCallback(
    function callback(map: google.maps.Map) {
      const bounds = new window.google.maps.LatLngBounds();

      if (userLocation) {
        bounds.extend(
          new window.google.maps.LatLng(userLocation.lat, userLocation.lng)
        );
      }

      peddlers.forEach((peddler) => {
        if (
          peddler.location &&
          typeof peddler.location.lat === "number" &&
          typeof peddler.location.lng === "number"
        ) {
          bounds.extend(
            new window.google.maps.LatLng(
              peddler.location.lat,
              peddler.location.lng
            )
          );
        }
      });

      if (
        (userLocation ||
          peddlers.some(
            (v) => v.location && typeof v.location.lat === "number"
          )) &&
        !bounds.isEmpty()
      ) {
        map.fitBounds(bounds);

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
        map.setCenter({ lat: -6.2088, lng: 106.8456 });
        map.setZoom(14);
      }

      map.setOptions({
        styles: mapStyles,
        disableDefaultUI: true,
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false,
        zoomControl: false,
        mapId: "YOUR_MAP_ID_HERE",
      });

      setMap(map);
      setTimeout(() => setIsMapReady(true), 500);
    },
    [userLocation, peddlers]
  );

  const onUnmount = useCallback(function callback() {
    setMap(null);
    setIsMapReady(false);
  }, []);

  useEffect(() => {
    if (map && (userLocation || peddlers.length > 0)) {
      const bounds = new window.google.maps.LatLngBounds();

      if (userLocation) {
        bounds.extend(
          new window.google.maps.LatLng(userLocation.lat, userLocation.lng)
        );
      }

      let hasValidLocations = false;
      peddlers.forEach((peddler) => {
        if (
          peddler &&
          peddler.location &&
          typeof peddler.location.lat === "number" &&
          typeof peddler.location.lng === "number"
        ) {
          bounds.extend(
            new window.google.maps.LatLng(
              peddler.location.lat,
              peddler.location.lng
            )
          );
          hasValidLocations = true;
        }
      });

      if ((userLocation || hasValidLocations) && !bounds.isEmpty()) {
        map.fitBounds(bounds);

        if ((userLocation && peddlers.length <= 1) || peddlers.length <= 2) {
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
  }, [map, userLocation, peddlers]);

  const onMapClick = useCallback(() => {
    setSelectedVendor(null);
  }, []);

  const handleMarkerClick = (peddler: Peddler) => {
    setSelectedVendor(peddler);
    setSelectedMarkerInstance(peddlerMarkerRefs.current[peddler.id] || null);
    if (onVendorClick) {
      onVendorClick(peddler);
    }
  };

  const createUserLocationMarker = () => ({
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    fillColor: "#4285F4",
    fillOpacity: 1,
    strokeColor: "#FFFFFF",
    strokeWeight: 2,
    scale: 1.5,
  });

  const createVendorMarker = (type: string, isSelected: boolean) => ({
    path: "M12 2C8.14 2 5 5.14 5 9c0 3.09 1.97 5.42 3 6.25V18h8v-2.75c1.03-0.83 3-3.16 3-6.25 0-3.86-3.14-7-7-7zm2.44 11.33c-.35.2-.75.33-1.19.4v1.67h-2.5v-1.67c-.44-.07-.84-.2-1.19-.4-.43-.25-.78-.59-1.06-1.23.82-.65 1.41-1.27 1.82-2.43.41 1.16 1 1.77 1.82 2.43-.28.64-.63.98-1.06 1.23z",
    fillColor: vendorTypeColors[type] || vendorTypeColors.default,
    fillOpacity: 1,
    strokeColor: "#FFFFFF",
    strokeWeight: 2,
    scale: isSelected ? 1.8 : 1.3,
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
              mapId: "YOUR_MAP_ID_HERE",
            }}
          >
            {userLocation &&
              isMapReady &&
              map &&
              window.google &&
              window.google.maps && (
                <AdvancedMarkerWrapper
                  map={map}
                  position={userLocation}
                  zIndex={1000}
                  gMapApi={window.google.maps}
                >
                  <UserLocationMarkerIcon />
                </AdvancedMarkerWrapper>
              )}

            {isMapReady &&
              map &&
              window.google &&
              window.google.maps &&
              peddlers
                .filter(
                  (peddler) =>
                    peddler &&
                    peddler.location &&
                    typeof peddler.location.lat === "number" &&
                    typeof peddler.location.lng === "number"
                )
                .map((peddler) => {
                  const isSelected = peddler.id === selectedVendorId;
                  return (
                    <AdvancedMarkerWrapper
                      key={peddler.id}
                      map={map}
                      position={peddler.location}
                      onClick={() => handleMarkerClick(peddler)}
                      zIndex={isSelected ? 100 : 10}
                      gMapApi={window.google.maps}
                      onMarkerInstance={(instance) => {
                        peddlerMarkerRefs.current[peddler.id] = instance;
                        if (
                          selectedVendor &&
                          selectedVendor.id === peddler.id
                        ) {
                          setSelectedMarkerInstance(instance);
                        }
                      }}
                    >
                      <VendorMarkerIcon
                        type={peddler.type}
                        isSelected={isSelected}
                      />
                    </AdvancedMarkerWrapper>
                  );
                })}

            {showRoute && routeDetails && routeDetails.path.length > 0 && (
              <Polyline
                path={routeDetails.path}
                options={{
                  strokeColor: "#4285F4",
                  strokeOpacity: 0.8,
                  strokeWeight: 5,
                  geodesic: true,
                }}
              />
            )}

            {selectedVendor && selectedMarkerInstance && map && (
              <InfoWindow
                anchor={
                  selectedMarkerInstance as unknown as google.maps.MVCObject
                }
                onCloseClick={() => {
                  setSelectedVendor(null);
                  setSelectedMarkerInstance(null);
                }}
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
                  {routeDetails && (
                    <div className="text-xs mt-1 flex flex-col">
                      <span className="flex items-center">
                        <span
                          className="inline-block h-2 w-2 rounded-full mr-1"
                          style={{
                            backgroundColor:
                              vendorTypeColors[selectedVendor.type] ||
                              vendorTypeColors.default,
                          }}
                        ></span>
                        <span>{routeDetails.distance.text}</span>
                      </span>
                      <span className="mt-1">{routeDetails.duration.text}</span>
                    </div>
                  )}
                  {selectedVendor.distance && !routeDetails && (
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

          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.05)]"></div>

          {!isMapReady && (
            <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-sm text-gray-600">Loading map...</p>
              </div>
            </div>
          )}

          {isLoadingRoute && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 px-4 py-2 rounded-full shadow-md z-50 flex items-center space-x-2">
              <div className="h-3 w-3 bg-primary rounded-full animate-pulse"></div>
              <span className="text-sm">Calculating best route...</span>
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
