"use client";

import type React from "react";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation, Plus, Minus } from "lucide-react";

interface Peddler {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  location: { lat: number; lng: number };
  distance: number;
}

interface PeddlerMapProps {
  userLocation: { lat: number; lng: number } | null;
  peddlers: Peddler[];
  selectedPeddler: string | null;
  onPeddlerClick: (peddlerId: string) => void;
}

// Define peddler type colors
const peddlerTypeColors: Record<string, string> = {
  bakso: "#E53935", // red
  siomay: "#43A047", // green
  batagor: "#1E88E5", // blue
  es_cendol: "#8E24AA", // purple
  sate_padang: "#FF9800", // orange
  default: "#757575", // gray
};

export function PeddlerMap({
  userLocation,
  peddlers,
  selectedPeddler,
  onPeddlerClick,
}: PeddlerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(15);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [infoCard, setInfoCard] = useState<{
    peddler: Peddler;
    x: number;
    y: number;
  } | null>(null);

  // Set initial center to user location
  useEffect(() => {
    if (userLocation && !center) {
      setCenter(userLocation);
    }
  }, [userLocation, center]);

  // Update center when selected peddler changes
  useEffect(() => {
    if (selectedPeddler && peddlers.length > 0) {
      const peddler = peddlers.find((v) => v.id === selectedPeddler);
      if (peddler) {
        setCenter(peddler.location);
      }
    }
  }, [selectedPeddler, peddlers]);

  // Draw map and markers
  useEffect(() => {
    if (!canvasRef.current || !center) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw map background
    ctx.fillStyle = "#E8EAF6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = "#C5CAE9";
    ctx.lineWidth = 1;

    // Calculate grid spacing based on zoom
    const gridSpacing = 20 * (zoom / 10);

    // Draw horizontal grid lines
    for (let y = 0; y < canvas.height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw vertical grid lines
    for (let x = 0; x < canvas.width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Draw roads
    ctx.strokeStyle = "#90A4AE";
    ctx.lineWidth = 3;

    // Main road
    const mainRoadY = canvas.height / 2;
    ctx.beginPath();
    ctx.moveTo(0, mainRoadY);
    ctx.lineTo(canvas.width, mainRoadY);
    ctx.stroke();

    // Cross roads
    for (let x = canvas.width / 4; x < canvas.width; x += canvas.width / 4) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Helper function to convert geo coordinates to canvas coordinates
    const geoToCanvas = (lat: number, lng: number) => {
      // Simple linear mapping for demo purposes
      // In a real app, you'd use proper map projection
      const scale = zoom * 10000;
      const x = canvas.width / 2 + (lng - center.lng) * scale;
      const y = canvas.height / 2 - (lat - center.lat) * scale;
      return { x, y };
    };

    // Draw user location
    if (userLocation) {
      const { x, y } = geoToCanvas(userLocation.lat, userLocation.lng);

      // Draw user location marker
      ctx.fillStyle = "#3F51B5";
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Draw pulse effect
      ctx.strokeStyle = "#3F51B5";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.stroke();

      // Draw "You" label
      ctx.fillStyle = "#000";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText("You", x, y - 15);
    }

    // Draw peddler markers
    peddlers.forEach((peddler) => {
      const { x, y } = geoToCanvas(peddler.location.lat, peddler.location.lng);

      // Draw peddler marker
      const color =
        peddlerTypeColors[peddler.type] || peddlerTypeColors.default;

      // Draw shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.beginPath();
      ctx.arc(x, y + 2, 8, 0, Math.PI * 2);
      ctx.fill();

      // Draw marker
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Highlight selected peddler
      if (peddler.id === selectedPeddler) {
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw peddler name
      ctx.fillStyle = "#000";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(peddler.name, x, y - 15);
    });

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [center, userLocation, peddlers, zoom, selectedPeddler]);

  // Handle canvas click to select peddler
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !center || peddlers.length === 0) return;

    // If we were dragging, don't trigger click
    if (isDragging) {
      setIsDragging(false);
      return;
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Helper function to convert geo coordinates to canvas coordinates
    const geoToCanvas = (lat: number, lng: number) => {
      const scale = zoom * 10000;
      const x = canvas.width / 2 + (lng - center.lng) * scale;
      const y = canvas.height / 2 - (lat - center.lat) * scale;
      return { x, y };
    };

    // Check if click is on a peddler marker
    for (const peddler of peddlers) {
      const markerPos = geoToCanvas(peddler.location.lat, peddler.location.lng);
      const distance = Math.sqrt(
        Math.pow(x - markerPos.x, 2) + Math.pow(y - markerPos.y, 2)
      );

      if (distance <= 10) {
        // Show info card
        setInfoCard({ peddler, x: markerPos.x, y: markerPos.y });
        onPeddlerClick(peddler.id);
        return;
      }
    }

    // If click is not on a marker, hide info card
    setInfoCard(null);
  };

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    setIsDragging(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart || !canvasRef.current || !center) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;

    // Update center position based on drag
    const scale = zoom * 10000;
    setCenter({
      lat: center.lat + deltaY / scale,
      lng: center.lng - deltaX / scale,
    });

    setDragStart({ x, y });
  };

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  // Zoom in function
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 1, 20));
  };

  // Zoom out function
  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 1, 5));
  };

  // Recenter on user location
  const handleRecenter = () => {
    if (userLocation) {
      setCenter(userLocation);
    }
  };

  return (
    <Card className="w-full h-full overflow-hidden border-0 bg-transparent shadow-none">
      <CardContent className="p-0 h-full relative">
        <div ref={mapRef} className="w-full h-full">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-grab"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleCanvasClick}
          />
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <Button size="icon" onClick={handleZoomIn} variant="secondary">
            <Plus className="h-4 w-4" />
          </Button>
          <Button size="icon" onClick={handleZoomOut} variant="secondary">
            <Minus className="h-4 w-4" />
          </Button>
          <Button size="icon" onClick={handleRecenter} variant="secondary">
            <Navigation className="h-4 w-4" />
          </Button>
        </div>

        {/* Info card */}
        {infoCard && (
          <div
            className="absolute bg-white rounded-lg shadow-lg p-3 w-48"
            style={{
              left: infoCard.x + 20,
              top: infoCard.y - 100,
            }}
          >
            <h3 className="font-bold text-sm">{infoCard.peddler.name}</h3>
            <p className="text-xs text-gray-500">{infoCard.peddler.type}</p>
            <p className="text-xs">{infoCard.peddler.distance}m away</p>
            <p className="text-xs">
              {infoCard.peddler.isActive ? "Active" : "Inactive"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
