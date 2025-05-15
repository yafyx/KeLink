"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, Activity, User } from "lucide-react";
import { MobileLayout } from "@/components/mobile-layout";
import { Dock, DockIcon } from "@/components/ui/dock";

interface AppLayoutProps {
  children: React.ReactNode;
  header: React.ReactNode;
}

export function AppLayout({ children, header }: AppLayoutProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: <Store className="h-full w-full stroke-[1.5]" />,
    },
    {
      href: "/activity",
      label: "Activity",
      icon: <Activity className="h-full w-full stroke-[1.5]" />,
    },
    {
      href: "/profile",
      label: "Profile",
      icon: <User className="h-full w-full stroke-[1.5]" />,
    },
  ];

  const mainPages = ["/", "/account/privacy"];
  const shouldShowDock =
    mainPages.includes(pathname) || pathname.startsWith("/account");

  return (
    <MobileLayout header={header} noPadding={pathname === "/find"}>
      <div className="relative">
        <div style={{ viewTransitionName: "page-content" }}>{children}</div>

        {/* Dock Navigation */}
        {shouldShowDock && (
          <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center">
            <Dock
              className="bg-white/90 shadow-xl border border-gray-100 px-4 py-3 gap-8"
              iconSize={45}
              iconMagnification={65}
              iconDistance={160}
            >
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    tabIndex={0}
                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <DockIcon
                      className={`flex flex-col items-center justify-center transition-all duration-200 ${
                        isActive
                          ? "text-primary"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center h-7 w-7">
                          {React.cloneElement(item.icon, {
                            className: isActive
                              ? "h-full w-full stroke-[1.5] fill-black/20"
                              : "h-full w-full stroke-[1.5]",
                          })}
                        </div>
                        <span className="text-xs font-semibold mt-1.5 whitespace-nowrap">
                          {item.label}
                        </span>
                      </div>
                    </DockIcon>
                  </Link>
                );
              })}
            </Dock>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
