"use client";

import React from "react";
import Link from "next/link";

interface MobileHeaderProps {
  title: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  centerContent?: boolean;
}

export function MobileHeader({
  title,
  leftAction,
  rightAction,
  centerContent = false,
}: MobileHeaderProps) {
  return (
    <div className="bg-background/80 backdrop-blur-sm border-b border-border w-full">
      <div className="mobile-container">
        <div className="h-14 flex items-center justify-between">
          <div className="w-14 flex items-center justify-start">
            {leftAction}
          </div>

          <h1
            className={`text-lg font-semibold truncate font-jakarta ${
              centerContent
                ? "absolute left-1/2 transform -translate-x-1/2"
                : ""
            }`}
          >
            {title}
          </h1>

          <div className="w-14 flex items-center justify-end">
            {rightAction}
          </div>
        </div>
      </div>
    </div>
  );
}
