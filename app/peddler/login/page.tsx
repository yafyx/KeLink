"use client";

import { GalleryVerticalEnd, ArrowLeft } from "lucide-react";
import { PeddlerLoginForm } from "@/components/peddler-login-form";
import { MobileLayout } from "@/components/mobile-layout";
import { MobileHeader } from "@/components/ui/mobile-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function VendorLoginPage() {
  const HeaderComponent = (
    <MobileHeader
      title="Peddler Login"
      centerContent={true}
      leftAction={
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      }
    />
  );

  return (
    <MobileLayout header={HeaderComponent}>
      <div className="flex flex-col items-center justify-center py-8">
        <div className="flex w-full flex-col gap-6">
          <a
            href="/"
            className="flex items-center gap-2 self-center font-medium"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            KeliLink
          </a>
          <PeddlerLoginForm />
        </div>
      </div>
    </MobileLayout>
  );
}
