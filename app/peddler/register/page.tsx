"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { MobileLayout } from "@/components/mobile-layout";
import { MobileHeader } from "@/components/ui/mobile-header";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

export default function VendorRegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    vendorType: "",
    description: "",
    phone: "",
  });

  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateDescription = async () => {
    if (!formData.vendorType) {
      alert("Please select a peddler type first");
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const response = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          peddlerType: formData.vendorType,
          peddlerName: formData.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to generate description from API"
        );
      }

      const data = await response.json();
      setFormData((prev) => ({ ...prev, description: data.description }));
    } catch (error) {
      console.error("Error generating description:", error);
      alert("Failed to generate description. Please try manually.");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const { confirmPassword, ...payload } = formData; // Exclude confirmPassword
      const response = await fetch("/api/peddlers/register", {
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

      console.log("Peddler registered:", data.peddler);
      alert("Registration successful! Please log in.");
      router.push("/peddler/login");
    } catch (error: any) {
      console.error("Error registering peddler:", error);
      alert(error.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const HeaderComponent = (
    <MobileHeader
      title="Register as Peddler"
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
              Expand your reach with our AI-powered platform.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 px-4 py-2">
              {/* Section 1: Business Information */}
              <div className="space-y-3 rounded-lg bg-accent/10 p-3">
                <h3 className="text-base font-medium text-primary flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                    1
                  </span>
                  Business Information
                </h3>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Business Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., Bakso Pak Kumis"
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
                        required
                        aria-required="true"
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="vendorType" className="text-sm font-medium">
                      Peddler Type
                    </Label>
                    <Select
                      value={formData.vendorType}
                      onValueChange={(value) =>
                        handleSelectChange("vendorType", value)
                      }
                      name="vendorType"
                    >
                      <SelectTrigger
                        id="vendorType"
                        aria-label="Select peddler type"
                        className="h-9"
                      >
                        <SelectValue placeholder="Select your peddler type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bakso">Bakso</SelectItem>
                        <SelectItem value="siomay">Siomay</SelectItem>
                        <SelectItem value="batagor">Batagor</SelectItem>
                        <SelectItem value="es_cendol">Es Cendol</SelectItem>
                        <SelectItem value="sate_padang">Sate Padang</SelectItem>
                        <SelectItem value="martabak">Martabak</SelectItem>
                        <SelectItem value="bubur_ayam">Bubur Ayam</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section 2: Business Description */}
              <div className="space-y-3 rounded-lg bg-accent/10 p-3">
                <h3 className="text-base font-medium text-primary flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                    2
                  </span>
                  Business Description
                </h3>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label
                        htmlFor="description"
                        className="text-sm font-medium"
                      >
                        Tell us about your business
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateDescription}
                        disabled={
                          isGeneratingDescription || !formData.vendorType
                        }
                        aria-label="Generate business description with AI"
                        className="h-7 px-2 text-xs"
                      >
                        {isGeneratingDescription ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-3 w-3 mr-1" />
                            Generate with AI
                          </>
                        )}
                      </Button>
                    </div>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="resize-none text-sm min-h-[70px]"
                      placeholder="Describe what you sell, your specialties, etc."
                    />
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="descriptionPreview"
                      className="text-sm font-medium"
                    >
                      Description Preview
                    </Label>
                    <div
                      id="descriptionPreview"
                      className="p-2 border rounded-md min-h-[60px] bg-background prose dark:prose-invert max-w-full text-xs"
                    >
                      <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                        {formData.description ||
                          "Your AI-generated or manually typed description will appear here."}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Account Credentials */}
              <div className="space-y-3 rounded-lg bg-accent/10 p-3">
                <h3 className="text-base font-medium text-primary flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                    3
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
                  "Create Peddler Account"
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/peddler/login"
                  className="font-medium text-primary hover:underline"
                  aria-label="Log in to your existing peddler account"
                >
                  Log in here
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </MobileLayout>
  );
}
