"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare, Store } from "lucide-react";
import { MobileHeader } from "@/components/ui/mobile-header";
import { AppLayout } from "@/components/AppLayout";

export default function Home() {
  return (
    <AppLayout header={<MobileHeader title="KeLink" centerContent={true} />}>
      <div className="flex flex-col gap-6 pb-6 mobile-container py-4">
        <div className="py-4">
          <h1 className="text-2xl font-bold tracking-tight font-jakarta">
            Ask, Find, Enjoy
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connecting you to mobile vendors with AI
          </p>
        </div>

        <div className="relative h-40 rounded-lg overflow-hidden">
          <img
            src="/placeholder.svg?height=160&width=400"
            alt="KeLink Platform"
            className="object-cover w-full h-full"
          />
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/find" className="w-full">
            <Button size="lg" className="w-full gap-2">
              Find Vendors <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/vendor/login" className="w-full">
              <Button variant="outline" size="lg" className="w-full">
                Vendor Login
              </Button>
            </Link>
            <Link href="/vendor/register" className="w-full">
              <Button variant="outline" size="lg" className="w-full">
                Vendor Register
              </Button>
            </Link>
          </div>
        </div>

        <div className="pt-4">
          <h2 className="text-xl font-semibold mb-3 font-jakarta">
            How It Works
          </h2>
          <div className="space-y-3">
            <div className="bg-background border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1 font-jakarta">For Vendors</h3>
                  <p className="text-sm text-muted-foreground">
                    Share your location, manage your profile, and get AI-powered
                    advice on potential routes or customer hotspots.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-background border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1 font-jakarta">
                    For Customers
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Find vendors near you. Tell us what you're looking for and
                    our AI will find active, nearby vendors using real-time
                    data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
