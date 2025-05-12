"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, Compass, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

interface MockMapProps {
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

export function MockMap({
  userLocation,
  vendors = [],
  onVendorClick,
  selectedVendorId,
  className,
}: MockMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredVendorId, setHoveredVendorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filter vendors to only include those with valid location data
  const validVendors = vendors.filter(
    (vendor) =>
      vendor &&
      vendor.location &&
      typeof vendor.location.lat === "number" &&
      typeof vendor.location.lng === "number"
  );

  // Update canvas size on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        const { width, height } =
          canvasRef.current.parentElement.getBoundingClientRect();
        setDimensions({ width, height });
        canvasRef.current.width = width * window.devicePixelRatio;
        canvasRef.current.height = height * window.devicePixelRatio;
        canvasRef.current.style.width = `${width}px`;
        canvasRef.current.style.height = `${height}px`;
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 800);

    return () => {
      window.removeEventListener("resize", updateDimensions);
      clearTimeout(timer);
    };
  }, []);

  // Draw map
  useEffect(() => {
    if (!canvasRef.current || isLoading) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    // Draw background with subtle gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height / dpr);
    gradient.addColorStop(0, "#F8FAFC");
    gradient.addColorStop(1, "#F1F5F9");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    // Draw grid
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1;

    const gridSize = 30;
    for (let x = 0; x < canvas.width / dpr; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height / dpr);
      ctx.stroke();
    }

    for (let y = 0; y < canvas.height / dpr; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width / dpr, y);
      ctx.stroke();
    }

    // Draw "roads"
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 5;

    // Horizontal main road
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / dpr / 2);
    ctx.lineTo(canvas.width / dpr, canvas.height / dpr / 2);
    ctx.stroke();

    // Vertical main road
    ctx.beginPath();
    ctx.moveTo(canvas.width / dpr / 2, 0);
    ctx.lineTo(canvas.width / dpr / 2, canvas.height / dpr);
    ctx.stroke();

    // Add some secondary roads
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 3;

    const quarterWidth = canvas.width / dpr / 4;
    const quarterHeight = canvas.height / dpr / 4;

    // Horizontal secondary roads
    ctx.beginPath();
    ctx.moveTo(0, quarterHeight);
    ctx.lineTo(canvas.width / dpr, quarterHeight);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, quarterHeight * 3);
    ctx.lineTo(canvas.width / dpr, quarterHeight * 3);
    ctx.stroke();

    // Vertical secondary roads
    ctx.beginPath();
    ctx.moveTo(quarterWidth, 0);
    ctx.lineTo(quarterWidth, canvas.height / dpr);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(quarterWidth * 3, 0);
    ctx.lineTo(quarterWidth * 3, canvas.height / dpr);
    ctx.stroke();

    // Draw user location
    if (userLocation) {
      const x = canvas.width / dpr / 2;
      const y = canvas.height / dpr / 2;

      // User pulse effect
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(66, 133, 244, 0.2)";
      ctx.fill();

      // User dot
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#4285F4";
      ctx.fill();

      // White border
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw vendors (only those with valid locations)
    validVendors.forEach((vendor, index) => {
      // Distribute vendors in a circle around the user
      const angle = (index / validVendors.length) * Math.PI * 2;
      const distance = 120; // distance from center
      const x = canvas.width / dpr / 2 + Math.cos(angle) * distance;
      const y = canvas.height / dpr / 2 + Math.sin(angle) * distance;

      const color = vendorTypeColors[vendor.type] || vendorTypeColors.default;
      const isSelected = vendor.id === selectedVendorId;
      const isHovered = vendor.id === hoveredVendorId;

      // Draw shadow for vendors
      ctx.beginPath();
      ctx.arc(x, y + 2, isSelected ? 9 : 7, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fill();

      // Vendor marker - custom shop icon shape
      ctx.beginPath();
      ctx.fillStyle = color;
      if (isSelected || isHovered) {
        // Expanded marker when selected or hovered
        ctx.arc(x, y, 10, 0, Math.PI * 2);
      } else {
        ctx.arc(x, y, 7, 0, Math.PI * 2);
      }
      ctx.fill();

      // White border
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, isSelected || isHovered ? 10 : 7, 0, Math.PI * 2);
      ctx.stroke();

      // Add a small icon or initial in the marker
      ctx.fillStyle = "white";
      ctx.font = `${isSelected ? "bold " : ""}10px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(vendor.name.charAt(0).toUpperCase(), x, y);

      // Vendor name with background for better readability
      if (isSelected || isHovered) {
        const nameWidth = ctx.measureText(vendor.name).width + 10;
        const nameHeight = 20;

        // Draw rounded rectangle background
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.beginPath();
        ctx.roundRect(x - nameWidth / 2, y - 30, nameWidth, nameHeight, 4);
        ctx.fill();

        // Draw text
        ctx.fillStyle = "#111";
        ctx.font = `${isSelected ? "bold " : ""}12px Arial`;
        ctx.textAlign = "center";
        ctx.fillText(vendor.name, x, y - 20);

        // Add distance info
        if (vendor.distance) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
          ctx.beginPath();
          ctx.roundRect(x - 30, y + 15, 60, 18, 4);
          ctx.fill();

          ctx.fillStyle = "#64748B";
          ctx.font = "10px Arial";
          ctx.fillText(vendor.distance, x, y + 24);
        }
      }
    });
  }, [
    userLocation,
    validVendors,
    selectedVendorId,
    hoveredVendorId,
    dimensions,
    isLoading,
  ]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (
      !canvasRef.current ||
      !onVendorClick ||
      validVendors.length === 0 ||
      isLoading
    )
      return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dpr = window.devicePixelRatio;

    validVendors.forEach((vendor, index) => {
      const angle = (index / validVendors.length) * Math.PI * 2;
      const distance = 120;
      const vendorX = canvas.width / dpr / 2 + Math.cos(angle) * distance;
      const vendorY = canvas.height / dpr / 2 + Math.sin(angle) * distance;

      const dx = x - vendorX;
      const dy = y - vendorY;
      const clickDistance = Math.sqrt(dx * dx + dy * dy);

      if (clickDistance <= 15) {
        onVendorClick(vendor);
      }
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || validVendors.length === 0 || isLoading) {
      setHoveredVendorId(null);
      return;
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dpr = window.devicePixelRatio;

    let found = false;

    for (let i = 0; i < validVendors.length; i++) {
      const vendor = validVendors[i];
      const angle = (i / validVendors.length) * Math.PI * 2;
      const distance = 120;
      const vendorX = canvas.width / dpr / 2 + Math.cos(angle) * distance;
      const vendorY = canvas.height / dpr / 2 + Math.sin(angle) * distance;

      const dx = x - vendorX;
      const dy = y - vendorY;
      const hoverDistance = Math.sqrt(dx * dx + dy * dy);

      if (hoverDistance <= 15) {
        setHoveredVendorId(vendor.id);
        found = true;
        break;
      }
    }

    if (!found) {
      setHoveredVendorId(null);
    }
  };

  const handleCanvasMouseLeave = () => {
    setHoveredVendorId(null);
  };

  return (
    <div
      className={cn(
        "w-full h-full bg-slate-50 flex flex-col items-center justify-center relative",
        className
      )}
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
        className="w-full h-full"
      />

      {/* Mock map controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full bg-white shadow-md border-0"
        >
          <Plus className="h-5 w-5 text-slate-600" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full bg-white shadow-md border-0"
        >
          <Minus className="h-5 w-5 text-slate-600" />
        </Button>
      </div>

      <div className="absolute bottom-4 left-4 bg-white p-2 rounded-md shadow-md text-xs">
        <div className="font-semibold mb-1 flex items-center">
          <Navigation className="h-3 w-3 mr-1 text-slate-500" />
          <span>Interactive Demo Map</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mr-1"></span>
          <span>Your Position</span>
        </div>
        <div className="text-slate-500 mt-1 flex items-center">
          <MapPin className="h-3 w-3 mr-1" />
          <span>{validVendors.length} penjual terdekat</span>
        </div>
      </div>

      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-sm text-gray-600">Loading map...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper components for icons not imported
function Plus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function Minus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
    </svg>
  );
}
