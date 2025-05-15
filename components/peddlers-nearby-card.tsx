"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  MapPin,
  Star,
  Clock,
  Navigation,
  Heart,
  Bike,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface Peddler {
  id: string;
  name: string;
  imageSrc: string;
  imageAlt: string;
  distance: string;
  rating: number;
  reviewCount: number;
  location: string;
  walkTime: string;
  lastUpdated: string;
  tags: string[];
  href: string;
}

interface PeddlersNearbyCardProps {
  favorites: string[];
  toggleFavorite: (id: string) => void;
  containerVariants?: any;
  itemVariants?: any;
}

const peddlersData: Peddler[] = [
  {
    id: "siomay-mang-ujang",
    name: "Siomay Mang Ujang",
    imageSrc: "/vendor/siomay.png",
    imageAlt: "Siomay Mang Ujang Peddler",
    distance: "500m away",
    rating: 4.8,
    reviewCount: 124,
    location: "Jl. Tebet Timur",
    walkTime: "5 min walk",
    lastUpdated: "5 min ago",
    tags: ["Siomay", "Seafood", "Popular"],
    href: "/find?peddler=siomay-mang-ujang",
  },
  {
    id: "bakso-bang-gondrong",
    name: "Bakso Si Gondrong",
    imageSrc: "/vendor/bakso.png",
    imageAlt: "Bakso Bang Gondrong Peddler",
    distance: "420m away",
    rating: 4.7,
    reviewCount: 98,
    location: "Jl. Menteng Raya",
    walkTime: "4 min walk",
    lastUpdated: "3 min ago",
    tags: ["Bakso", "Meatballs", "Top Rated"],
    href: "/find?peddler=bakso-bang-gondrong",
  },
];

const defaultContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const defaultItemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
};

export function PeddlersNearbyCard({
  favorites,
  toggleFavorite,
  containerVariants = defaultContainerVariants,
  itemVariants = defaultItemVariants,
}: PeddlersNearbyCardProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <motion.div
      className="py-6 px-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold font-jakarta text-gray-900">
          Nearby Peddlers
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary flex items-center gap-1 font-medium hover:bg-primary/5 -mr-2"
          asChild
        >
          <Link href="/find">
            <span>View all</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        {peddlersData.map((peddler) => (
          <motion.div
            key={peddler.id}
            variants={itemVariants}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onHoverStart={() => setHoveredId(peddler.id)}
            onHoverEnd={() => setHoveredId(null)}
            className="w-full"
          >
            <Card
              className="p-0 overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
              onClick={() => (window.location.href = peddler.href)}
            >
              <div className="grid grid-cols-3 h-36">
                {/* Left image section */}
                <div className="relative col-span-1">
                  <div className="absolute inset-0">
                    <Image
                      src={peddler.imageSrc}
                      alt={peddler.imageAlt}
                      fill
                      className="object-cover transition-transform duration-500"
                      style={{
                        transform:
                          hoveredId === peddler.id ? "scale(1.05)" : "scale(1)",
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent z-10"></div>

                  {/* Distance badge */}
                  <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-sm rounded-md py-1 px-2 shadow-sm flex items-center justify-center z-30">
                    <Navigation className="h-3 w-3 text-primary mr-1.5 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-800 truncate">
                      {peddler.distance}
                    </span>
                  </div>
                </div>

                {/* Right content section */}
                <div className="col-span-2 p-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-base font-jakarta text-gray-900 leading-tight">
                        {peddler.name}
                      </h3>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 px-1.5 py-0.5 text-xs"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        Active
                      </Badge>
                    </div>

                    {/* Rating with stars */}
                    <div className="flex items-center">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={`star-${i}`}
                            className={cn(
                              "h-3.5 w-3.5",
                              i < Math.floor(peddler.rating)
                                ? "text-yellow-500 fill-yellow-500"
                                : i < Math.ceil(peddler.rating) &&
                                  peddler.rating % 1 > 0
                                ? "text-yellow-500 fill-yellow-500 opacity-80" // Half star
                                : "text-gray-300"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium ml-1.5 text-gray-700">
                        {peddler.rating.toFixed(1)}
                        <span className="text-gray-500">
                          ({peddler.reviewCount})
                        </span>
                      </span>
                    </div>

                    {/* Location and details */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <p className="text-xs text-gray-700 truncate">
                          {peddler.location}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Bike className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                        <p className="text-xs text-gray-600">
                          {peddler.walkTime}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 col-span-2">
                        <Clock className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                        <p className="text-xs text-gray-500">
                          Updated {peddler.lastUpdated}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mt-auto pt-1">
                    {peddler.tags.map((tag) => (
                      <Badge
                        key={tag}
                        className={cn(
                          "border-0 px-2 py-0.5 text-xs font-medium",
                          tag === "Siomay" || tag === "Bakso"
                            ? "bg-primary/10 text-primary"
                            : tag === "Popular" || tag === "Top Rated"
                            ? "bg-amber-50 text-amber-700"
                            : tag === "Seafood" || tag === "Meatballs"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        )}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Favorite button */}
                <button
                  className={cn(
                    "absolute right-3 top-3 z-50 bg-white/95 backdrop-blur-sm rounded-full p-1.5 shadow-md transition-all duration-300",
                    favorites.includes(peddler.id)
                      ? "scale-110"
                      : hoveredId === peddler.id
                      ? "scale-105"
                      : "scale-100"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavorite(peddler.id);
                  }}
                  aria-label={
                    favorites.includes(peddler.id)
                      ? `Remove ${peddler.name} from favorites`
                      : `Add ${peddler.name} to favorites`
                  }
                >
                  <Heart
                    className={cn(
                      "h-4 w-4 transition-colors duration-300",
                      favorites.includes(peddler.id)
                        ? "text-red-500 fill-red-500"
                        : "text-gray-400 hover:text-gray-600"
                    )}
                  />
                </button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
