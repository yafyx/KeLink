"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[];
  initialSnapPoint?: number;
  showHandle?: boolean;
  fullHeight?: boolean;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  snapPoints = [0.9],
  initialSnapPoint = 0,
  showHandle = true,
  fullHeight = false,
}: BottomSheetProps) {
  const [currentSnapPoint, setCurrentSnapPoint] = useState(initialSnapPoint);
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentHeight = snapPoints[currentSnapPoint] * 100;

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.y > threshold) {
      if (currentSnapPoint < snapPoints.length - 1) {
        setCurrentSnapPoint(currentSnapPoint + 1);
      } else {
        onClose();
      }
    } else if (info.offset.y < -threshold) {
      if (currentSnapPoint > 0) {
        setCurrentSnapPoint(currentSnapPoint - 1);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            ref={sheetRef}
            className={`fixed bottom-0 left-0 right-0 bg-background rounded-t-xl z-50 overflow-hidden no-scrollbar ${
              fullHeight ? "max-h-screen" : ""
            }`}
            initial={{ y: "100%" }}
            animate={{ y: `${100 - contentHeight}%` }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
          >
            {showHandle && (
              <div className="pt-2 pb-4 flex justify-center">
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
              </div>
            )}

            <div
              className={`overflow-y-auto no-scrollbar ${
                fullHeight ? "max-h-screen pb-safe-bottom" : ""
              }`}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
