"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Star,
  MessageCircle,
  ChevronRight,
  Search,
  Clock,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FeatureBannerProps {
  className?: string;
  onButtonClick?: () => void;
}

export function FeatureBanner({
  className,
  onButtonClick,
}: FeatureBannerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const features = [
    {
      id: "discover",
      title: "Find Nearby Peddlers",
      description: "Discover street food peddlers in your neighborhood",
      icon: MapPin,
      color: "#3B82F6", // blue
      bgGradient: "from-blue-400/80 to-blue-600/80",
    },
    {
      id: "chat",
      title: "Ask Naturally",
      description: "Find specific foods with our AI chatbot",
      icon: MessageCircle,
      color: "#10B981", // emerald
      bgGradient: "from-emerald-400/80 to-emerald-600/80",
    },
    {
      id: "track",
      title: "Live Tracking",
      description: "See peddlers' real-time location",
      icon: Navigation,
      color: "#F43F5E", // rose
      bgGradient: "from-rose-400/80 to-rose-600/80",
    },
    {
      id: "popular",
      title: "Popular Choices",
      description: "Discover trending peddlers with high ratings",
      icon: Star,
      color: "#F59E0B", // amber
      bgGradient: "from-amber-400/80 to-amber-600/80",
    },
    {
      id: "time",
      title: "Real-time Updates",
      description: "See when peddlers were last active",
      icon: Clock,
      color: "#8B5CF6", // violet
      bgGradient: "from-violet-400/80 to-violet-600/80",
    },
  ];

  // Auto-advance carousel
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % features.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [features.length, isPaused]);

  const currentFeature = features[currentStep];

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden relative min-h-[11rem] h-auto group shadow-md",
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Animated Background Gradient */}
      <motion.div
        className={cn(
          "absolute inset-0 bg-gradient-to-br z-0",
          currentFeature.bgGradient
        )}
        key={currentFeature.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      />

      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 grid grid-cols-8 grid-rows-4 z-0 opacity-20">
        {Array.from({ length: 32 }).map((_, i) => (
          <div key={i} className="border border-white/10" />
        ))}
      </div>

      {/* Decorative Circle */}
      <div className="absolute -right-16 -bottom-16 w-48 h-48 rounded-full bg-white/10 z-0" />
      <div className="absolute -left-12 -top-12 w-32 h-32 rounded-full bg-white/10 z-0" />

      {/* Content Container */}
      <div className="relative w-full py-4 px-3 sm:p-5 z-10">
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-5">
          {/* Icon */}
          <motion.div
            key={`icon-${currentFeature.id}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white/20 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full h-10 w-10 sm:h-14 sm:w-14 flex items-center justify-center flex-shrink-0 sm:mx-0"
          >
            <currentFeature.icon className="h-5 w-5 sm:h-7 sm:w-7" />
          </motion.div>

          {/* Text Content */}
          <div className="flex-1 w-full">
            <motion.div
              key={`title-${currentFeature.id}`}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="text-left"
            >
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 mb-2">
                Feature {currentStep + 1}/{features.length}
              </Badge>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                {currentFeature.title}
              </h2>
              <p className="text-xs sm:text-sm text-white/90 mb-3 w-full">
                {currentFeature.description}
              </p>
            </motion.div>

            <motion.div
              key={`button-${currentFeature.id}`}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex justify-start"
            >
              <Button
                size="sm"
                onClick={onButtonClick}
                className="gap-2 rounded-full bg-white text-primary hover:bg-white/90 shadow-sm font-medium px-4 sm:px-5 text-xs sm:text-sm"
              >
                Try Now <ChevronRight className="h-3 w-3" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="absolute bottom-2 right-3 sm:bottom-3 sm:right-5 flex gap-1 z-10">
        {features.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentStep(index)}
            className={cn(
              "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300",
              currentStep === index
                ? "bg-white w-4 sm:w-6"
                : "bg-white/40 hover:bg-white/60"
            )}
            aria-label={`Go to feature ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
