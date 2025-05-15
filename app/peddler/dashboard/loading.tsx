import { MobileHeader } from "@/components/ui/mobile-header";
import { MobileLayout } from "@/components/mobile-layout";
import { ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const SkeletonCard = ({ className }: { className?: string }) => (
  <div
    className={`bg-gray-200/80 animate-pulse rounded-xl p-4 ${className || ""}`}
  >
    <div className="h-6 bg-gray-300/80 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-300/80 rounded w-1/2"></div>
  </div>
);

const HeaderComponent = (
  <MobileHeader
    title="Dashboard"
    centerContent={true}
    leftAction={
      <Link href="/">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md shadow-sm border border-gray-100"
          disabled // Disabled in loading state
        >
          <ArrowLeft className="h-4 w-4 text-gray-700" />
        </Button>
      </Link>
    }
    rightAction={
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md shadow-sm border border-gray-100"
        disabled // Disabled in loading state
      >
        <LogOut className="h-4 w-4 text-gray-700" />
      </Button>
    }
  />
);

export default function PeddlerDashboardLoading() {
  return (
    <MobileLayout header={HeaderComponent}>
      <div className="flex flex-col pb-20 bg-gray-50/50 animate-pulse">
        {/* Hero Banner Skeleton */}
        <div className="bg-gray-200/80 pt-6 pb-10 px-4 mb-6 rounded-b-3xl shadow-lg">
          <div className="flex items-center gap-4 mb-5">
            <div className="h-16 w-16 rounded-full bg-gray-300/80"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-300/80 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-300/80 rounded w-1/2"></div>
            </div>
          </div>
          <div className="bg-gray-300/60 rounded-xl p-3 mb-5 h-20"></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-300/60 rounded-lg p-3 h-16"></div>
            <div className="bg-gray-300/60 rounded-lg p-3 h-16"></div>
            <div className="bg-gray-300/60 rounded-lg p-3 h-16"></div>
          </div>
        </div>

        {/* Quick Actions Skeleton */}
        <div className="px-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <SkeletonCard className="h-32" />
            <SkeletonCard className="h-32" />
          </div>
        </div>

        {/* Analytics Trending Card Skeleton */}
        <div className="px-5 mb-7">
          <SkeletonCard className="h-24" />
        </div>

        {/* Main content Skeleton */}
        <div className="px-5 space-y-7">
          {/* AI Route Advice Skeleton */}
          <SkeletonCard className="h-48" />

          {/* Activity Analytics Skeleton */}
          <SkeletonCard className="h-64" />

          {/* Today's Selling Locations Skeleton */}
          <SkeletonCard className="h-56" />

          {/* Call-to-action Skeleton */}
          <SkeletonCard className="h-36" />
        </div>
      </div>
    </MobileLayout>
  );
}
