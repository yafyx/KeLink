"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MobileLayout } from "@/components/mobile-layout";
import { MobileHeader } from "@/components/ui/mobile-header";

export default function UserRegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const { confirmPassword, ...payload } = formData;
      const response = await fetch("/api/user/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      router.push("/login?registered=true");
    } catch (error: any) {
      alert(
        error.message ||
          "Failed to register. Please check your information and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const HeaderComponent = (
    <MobileHeader
      title="User Registration"
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
      <div className="flex flex-col items-center justify-start w-full px-4 bg-background">
        <Card className="w-full max-w-md shadow-lg border-border/60">
          <CardHeader className="py-3">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Join KeliLink
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Create your account to find local street vendors.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 px-4 py-2">
              {/* Section 1: Personal Information */}
              <div className="space-y-3 rounded-lg bg-accent/10 p-3">
                <h3 className="text-base font-medium text-primary flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                    1
                  </span>
                  Personal Information
                </h3>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      aria-required="true"
                      className="h-9"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        aria-required="true"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="081234567890"
                        value={formData.phone}
                        onChange={handleChange}
                        className="h-9"
                      />
                      <p className="text-xs text-muted-foreground">Optional</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Account Credentials */}
              <div className="space-y-3 rounded-lg bg-accent/10 p-3">
                <h3 className="text-base font-medium text-primary flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                    2
                  </span>
                  Account Credentials
                </h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="password" className="text-sm font-medium">
                        Password
                      </Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        aria-required="true"
                        placeholder="Min. 8 characters"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="confirmPassword"
                        className="text-sm font-medium"
                      >
                        Confirm Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        aria-required="true"
                        placeholder="Re-enter password"
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2 px-4 py-3 bg-muted/20 border-t">
              <Button
                className="w-full h-10 font-medium"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline"
                  aria-label="Log in to your existing account"
                >
                  Log in here
                </Link>
              </p>
              <p className="text-center text-xs text-muted-foreground pt-1">
                Want to sell your food?{" "}
                <Link
                  href="/peddler/register"
                  className="font-medium text-primary hover:underline"
                  aria-label="Register as a peddler"
                >
                  Register as a peddler
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </MobileLayout>
  );
}
