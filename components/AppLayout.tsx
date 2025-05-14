"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, MessageSquare, Activity, User } from "lucide-react";
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
      href: "/profile",
      label: "Profile",
      icon: <User className="h-5 w-5" />,
    },
  ];

  const mainPages = ["/", "/account/privacy"];
  const shouldShowDock =
    mainPages.includes(pathname) || pathname.startsWith("/account");

  return (
    <MobileLayout header={header} noPadding={pathname === "/find"}>
      <div className="relative">
        <div style={{ viewTransitionName: "page-content" }}>{children}</div>

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
                  const isActive =
                    item.href === "/"
                      ? pathname === item.href
                      : pathname === item.href ||
                        pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-label={item.label}
                      tabIndex={0}
                      className="flex flex-col items-center w-14 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary relative"
                    >
                      <div
                        className={`flex flex-col items-center justify-center h-14 w-14 rounded-full transition-colors duration-200 gap-0.5 ${
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "bg-transparent text-muted-foreground"
                        }`}
                      >
                        <motion.div
                          className="flex items-center justify-center h-8 w-8"
                          whileHover={{ scale: 1.2 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 17,
                          }}
                        >
                          {item.icon}
                        </motion.div>
                        <span className="text-[10px] whitespace-nowrap text-center font-jakarta font-semibold">
                          {item.label}
                        </span>
                      </div>
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
