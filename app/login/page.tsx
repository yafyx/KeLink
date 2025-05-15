"use client";

import { GalleryVerticalEnd, ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { MobileLayout } from "@/components/mobile-layout";
import { MobileHeader } from "@/components/ui/mobile-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function UserLoginPage() {
  const HeaderComponent = (
    <MobileHeader
      title="User Login"
      centerContent={true}
      leftAction={
        <Link href="/" aria-label="Go back to homepage">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      }
    />
  );

  return (
    <MobileLayout header={HeaderComponent}>
      <div className="flex flex-col items-center justify-start w-full px-4 bg-background py-4">
        <div className="flex w-full flex-col gap-6 items-center max-w-md">
          <LoginForm />
        </div>
      </div>
    </MobileLayout>
  );
}
