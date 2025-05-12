"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, MessageSquare, Activity } from "lucide-react";
import { MobileLayout } from "@/components/MobileLayout";
import { motion } from "motion/react";

interface AppLayoutProps {
  children: React.ReactNode;
  header: React.ReactNode;
}

export function AppLayout({ children, header }: AppLayoutProps) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: <Store className="h-5 w-5" />,
    },
    {
      href: "/activity",
      label: "Activity",
      icon: <Activity className="h-5 w-5" />,
    },
    {
      href: "/chat",
      label: "Chat",
      icon: <MessageSquare className="h-5 w-5" />,
    },
  ];

  // Only show the dock on main pages
  const mainPages = ["/", "/activity", "/chat"];
  const shouldShowDock = mainPages.includes(pathname);

  return (
    <MobileLayout header={header} noPadding={pathname === "/find"}>
      <div className="relative">
        {children}

        {/* Floating Dock Navigation */}
        {shouldShowDock && (
          <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center">
            <motion.div
              className="bg-background/90 backdrop-blur-md shadow-lg border rounded-full py-1.5 px-6"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <div className="flex items-center gap-6">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex flex-col items-center w-10"
                    >
                      <motion.div
                        className={`flex items-center justify-center h-8 w-8 rounded-full ${
                          isActive ? "text-primary" : "text-muted-foreground"
                        }`}
                        whileHover={{ scale: 1.2 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 17,
                        }}
                      >
                        {item.icon}
                      </motion.div>
                      <span
                        className={`text-[10px] mt-0.5 whitespace-nowrap text-center font-jakarta ${
                          isActive
                            ? "text-primary font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
