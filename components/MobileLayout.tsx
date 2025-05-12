"use client";

import React from "react";

interface MobileLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  fullHeight?: boolean;
  bgColor?: string;
  noPadding?: boolean;
}

export function MobileLayout({
  children,
  header,
  footer,
  fullHeight = true,
  bgColor = "bg-background",
  noPadding = false,
}: MobileLayoutProps) {
  return (
    <div
      className={`flex flex-col ${fullHeight ? "min-h-screen" : ""} ${bgColor}`}
    >
      {header && (
        <header className="sticky top-0 z-10 w-full safe-top">{header}</header>
      )}

      <main className={`flex-1 ${noPadding ? "" : "mobile-container py-4"}`}>
        {children}
      </main>

      {footer && (
        <footer className="sticky bottom-0 z-10 w-full safe-bottom">
          {footer}
        </footer>
      )}
    </div>
  );
}
