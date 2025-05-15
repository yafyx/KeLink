"use client";

import React from "react";

// Minimal Peddler type, assuming similar structure to PeddlerCard
interface Peddler {
  id: string;
  name: string;
  location?: { lat: number; lng: number; lon?: number }; // lon is sometimes used alongside lng
  // Add other relevant fields
}

interface MapViewProps {
  center?: { lat: number; lng: number };
  peddlers?: Peddler[];
  selectedPeddler?: Peddler | null;
  onPeddlerSelect?: (peddler: Peddler) => void;
  userLocation?: { lat: number; lng: number } | null;
  route?: any; // Keeping route as any for simplicity
  zoom?: number;
}

const MapView: React.FC<MapViewProps> = ({
  center = { lat: -6.2088, lng: 106.8456 }, // Default to Jakarta
  peddlers = [],
  selectedPeddler,
  onPeddlerSelect,
  userLocation,
  route,
  zoom = 12,
}) => {
  return (
    <div style={{ width: "100%", height: "100%", background: "#e0e0e0" }}>
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2 style={{ color: "#333" }}>MapView Placeholder</h2>
        <p style={{ color: "#555" }}>
          This is a placeholder for the MapView component.
        </p>
        {userLocation && (
          <p style={{ color: "#777", fontSize: "0.9em" }}>
            User Location: Lat: {userLocation.lat.toFixed(4)}, Lng:{" "}
            {userLocation.lng.toFixed(4)}
          </p>
        )}
        <p style={{ color: "#777", fontSize: "0.9em" }}>
          Center: Lat: {center.lat.toFixed(4)}, Lng: {center.lng.toFixed(4)},
          Zoom: {zoom}
        </p>
        <p style={{ color: "#777", fontSize: "0.9em" }}>
          Peddlers: {peddlers.length}
        </p>
        {selectedPeddler && (
          <p style={{ color: "#777", fontSize: "0.9em" }}>
            Selected: {selectedPeddler.name}
          </p>
        )}
        {route && (
          <p style={{ color: "#777", fontSize: "0.9em" }}>
            Route details are present.
          </p>
        )}
        {peddlers.length > 0 && onPeddlerSelect && (
          <button
            onClick={() => onPeddlerSelect(peddlers[0])}
            style={{
              padding: "8px 12px",
              marginTop: "10px",
              background: "#ccc",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Select First Peddler (Test)
          </button>
        )}
      </div>
    </div>
  );
};

export { MapView }; // Exporting as named export as per the import in page.tsx
