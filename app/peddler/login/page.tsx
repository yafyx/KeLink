"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MobileLayout } from "@/components/MobileLayout";
import { MobileHeader } from "@/components/ui/mobile-header";

export default function VendorLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // In a real app, this would call your backend API to authenticate the peddler
      // For now, let's just simulate a delay and redirect to the dashboard
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to the dashboard upon successful login
      router.push("/peddler/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      alert("Failed to log in. Please check your credentials and try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold">Peddler Login</CardTitle>
            <CardDescription>
              Enter your email and password to access your peddler dashboard
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/peddler/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  href="/peddler/register"
                  className="text-primary hover:underline"
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
