"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation, Plus, Minus } from "lucide-react"

interface Vendor {
  id: string
  name: string
  type: string
  isActive: boolean
  location: { lat: number; lng: number }
  distance: number
}

interface VendorMapProps {
  userLocation: { lat: number; lng: number } | null
  vendors: Vendor[]
  selectedVendor: string | null
  onVendorClick: (vendorId: string) => void
}

// Define vendor type colors
const vendorTypeColors: Record<string, string> = {
  bakso: "#E53935", // red
  siomay: "#43A047", // green
  batagor: "#1E88E5", // blue
  es_cendol: "#8E24AA", // purple
  sate_padang: "#FF9800", // orange
  default: "#757575", // gray
}

export function VendorMap({ userLocation, vendors, selectedVendor, onVendorClick }: VendorMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [zoom, setZoom] = useState(15)
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [infoCard, setInfoCard] = useState<{ vendor: Vendor; x: number; y: number } | null>(null)

  // Set initial center to user location
  useEffect(() => {
    if (userLocation && !center) {
      setCenter(userLocation)
    }
  }, [userLocation, center])

  // Update center when selected vendor changes
  useEffect(() => {
    if (selectedVendor && vendors.length > 0) {
      const vendor = vendors.find((v) => v.id === selectedVendor)
      if (vendor) {
        setCenter(vendor.location)
      }
    }
  }, [selectedVendor, vendors])

  // Draw map and markers
  useEffect(() => {
    if (!canvasRef.current || !center) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw map background
    ctx.fillStyle = "#E8EAF6"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid lines
    ctx.strokeStyle = "#C5CAE9"
    ctx.lineWidth = 1

    // Calculate grid spacing based on zoom
    const gridSpacing = 20 * (zoom / 10)

    // Draw horizontal grid lines
    for (let y = 0; y < canvas.height; y += gridSpacing) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Draw vertical grid lines
    for (let x = 0; x < canvas.width; x += gridSpacing) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }

    // Draw roads
    ctx.strokeStyle = "#90A4AE"
    ctx.lineWidth = 3

    // Main road
    const mainRoadY = canvas.height / 2
    ctx.beginPath()
    ctx.moveTo(0, mainRoadY)
    ctx.lineTo(canvas.width, mainRoadY)
    ctx.stroke()

    // Cross roads
    for (let x = canvas.width / 4; x < canvas.width; x += canvas.width / 4) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }

    // Helper function to convert geo coordinates to canvas coordinates
    const geoToCanvas = (lat: number, lng: number) => {
      // Simple linear mapping for demo purposes
      // In a real app, you'd use proper map projection
      const scale = zoom * 10000
      const x = canvas.width / 2 + (lng - center.lng) * scale
      const y = canvas.height / 2 - (lat - center.lat) * scale
      return { x, y }
    }

    // Draw user location
    if (userLocation) {
      const { x, y } = geoToCanvas(userLocation.lat, userLocation.lng)

      // Draw user location marker
      ctx.fillStyle = "#3F51B5"
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fill()

      // Draw pulse effect
      ctx.strokeStyle = "#3F51B5"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, y, 12, 0, Math.PI * 2)
      ctx.stroke()

      // Draw "You" label
      ctx.fillStyle = "#000"
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.fillText("You", x, y - 15)
    }

    // Draw vendor markers
    vendors.forEach((vendor) => {
      const { x, y } = geoToCanvas(vendor.location.lat, vendor.location.lng)

      // Draw vendor marker
      const color = vendorTypeColors[vendor.type] || vendorTypeColors.default

      // Draw shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)"
      ctx.beginPath()
      ctx.arc(x, y + 2, 8, 0, Math.PI * 2)
      ctx.fill()

      // Draw marker
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fill()

      // Highlight selected vendor
      if (vendor.id === selectedVendor) {
        ctx.strokeStyle = "#000"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(x, y, 12, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Draw vendor name
      ctx.fillStyle = "#000"
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.fillText(vendor.name, x, y - 15)
    })

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [center, userLocation, vendors, zoom, selectedVendor])

  // Handle canvas click to select vendor
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !center || vendors.length === 0) return

    // If we were dragging, don't trigger click
    if (isDragging) {
      setIsDragging(false)
      return
    }

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Helper function to convert geo coordinates to canvas coordinates
    const geoToCanvas = (lat: number, lng: number) => {
      const scale = zoom * 10000
      const x = canvas.width / 2 + (lng - center.lng) * scale
      const y = canvas.height / 2 - (lat - center.lat) * scale
      return { x, y }
    }

    // Check if click is on a vendor marker
    for (const vendor of vendors) {
      const markerPos = geoToCanvas(vendor.location.lat, vendor.location.lng)
      const distance = Math.sqrt(Math.pow(x - markerPos.x, 2) + Math.pow(y - markerPos.y, 2))

      if (distance <= 10) {
        // Show info card
        setInfoCard({ vendor, x: markerPos.x, y: markerPos.y })
        onVendorClick(vendor.id)
        return
      }
    }

    // If click is not on a marker, hide info card
    setInfoCard(null)
  }

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return

    setIsDragging(true)
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart || !center || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Calculate drag distance
    const dx = x - dragStart.x
    const dy = y - dragStart.y

    // Update center based on drag distance
    const scale = zoom * 10000
    const newCenter = {
      lat: center.lat + dy / scale,
      lng: center.lng - dx / scale,
    }

    setCenter(newCenter)
    setDragStart({ x, y })
  }

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    setIsDragging(false)
    setDragStart(null)
  }

  // Handle zoom in
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 1, 20))
  }

  // Handle zoom out
  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 1, 10))
  }

  // Handle recenter to user location
  const handleRecenter = () => {
    if (userLocation) {
      setCenter(userLocation)
    }
  }

  return (
    <div ref={mapRef} className="relative w-full h-full bg-gray-100">
      {!center && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500">Loading map...</p>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab"
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Map controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <Button variant="secondary" size="icon" onClick={handleZoomIn}>
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={handleZoomOut}>
          <Minus className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={handleRecenter}>
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <Card className="absolute top-4 left-4 w-auto">
        <CardContent className="p-3">
          <h4 className="text-sm font-medium mb-2">Vendor Types</h4>
          <div className="space-y-1">
            {Object.entries(vendorTypeColors).map(
              ([type, color]) =>
                type !== "default" && (
                  <div key={type} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                    <span className="text-xs capitalize">{type.replace("_", " ")}</span>
                  </div>
                ),
            )}
            <div className="flex items-center gap-2 mt-2">
              <div className="w-3 h-3 rounded-full bg-[#3F51B5]"></div>
              <span className="text-xs">Your Location</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info card for selected vendor */}
      {infoCard && (
        <Card
          className="absolute p-0 w-48 z-10 shadow-lg"
          style={{
            left: `${infoCard.x + 20}px`,
            top: `${infoCard.y - 80}px`,
            transform: "translateX(-50%)",
          }}
        >
          <CardContent className="p-3">
            <h3 className="font-medium text-sm">{infoCard.vendor.name}</h3>
            <p className="text-xs text-gray-500 capitalize">{infoCard.vendor.type.replace("_", " ")}</p>
            <p className="text-xs mt-1">Jarak: ± {infoCard.vendor.distance}m</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
