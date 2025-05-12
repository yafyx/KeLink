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
import { generateVendorDescription } from "@/lib/gemini";
import { useRouter } from "next/navigation";
import { MobileLayout } from "@/components/MobileLayout";
import { MobileHeader } from "@/components/ui/mobile-header";

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
      alert("Please select a vendor type first");
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const description = await generateVendorDescription(
        formData.vendorType,
        formData.name
      );
      setFormData((prev) => ({ ...prev, description }));
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
      // In a real implementation, this would call your backend API
      // to register the vendor
      console.log("Registering vendor:", formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Redirect to login page after successful registration
      router.push("/vendor/dashboard");
    } catch (error) {
      console.error("Error registering vendor:", error);
      alert("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const HeaderComponent = (
    <MobileHeader
      title="Register as Vendor"
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
      <div className="flex flex-col py-4">
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold">Join KeLink</CardTitle>
            <CardDescription>
              Reach more customers with our AI-powered platform
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Business Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendorType">Vendor Type</Label>
                <Select
                  value={formData.vendorType}
                  onValueChange={(value) =>
                    handleSelectChange("vendorType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor type" />
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

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="description">Business Description</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateDescription}
                    disabled={isGeneratingDescription || !formData.vendorType}
                  >
                    <Wand2 className="h-3.5 w-3.5 mr-2" />
                    {isGeneratingDescription
                      ? "Generating..."
                      : "Generate with AI"}
                  </Button>
                </div>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <Link href="/vendor/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </MobileLayout>
  );
}
