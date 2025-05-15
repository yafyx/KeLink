"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function PeddlerLoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await login(formData.email, formData.password, "peddler");
      router.push("/peddler/dashboard");
    } catch (error: any) {
      alert(
        error.message ||
          "Failed to log in. Please check your credentials and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg border-border/60">
      <CardHeader className="py-3">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Peddler Dashboard
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Sign in to manage your peddler account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 px-4 py-2">
          <div className="space-y-3 rounded-lg bg-accent/10 p-3">
            <div className="space-y-2">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Link
                    href="/peddler/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  aria-required="true"
                  className="h-9"
                />
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
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Don't have a peddler account?{" "}
            <Link
              href="/peddler/register"
              className="font-medium text-primary hover:underline"
              aria-label="Register as a new peddler"
            >
              Register here
            </Link>
          </p>
          <p className="text-center text-xs text-muted-foreground pt-1">
            Looking for your user account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
              aria-label="Log in as a regular user"
            >
              User Login
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
