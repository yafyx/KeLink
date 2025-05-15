import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  UserRound,
  Search,
  Navigation,
  Filter,
  Users,
  Share2,
  Lightbulb,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Heart,
  Bell,
  Star,
  MapPin,
  Zap,
  Utensils,
} from "lucide-react";
import { GerobakIcon } from "@/components/ui/GerobakIcon";
import { cn } from "@/lib/utils";

type OnboardingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type StepIndicatorProps = {
  currentStep: number;
  totalSteps: number;
};

const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
}) => (
  <div className="flex items-center justify-center gap-2 px-6 sm:px-8 pt-3 sm:pt-4">
    {Array.from({ length: totalSteps }).map((_, index) => {
      const step = index + 1;
      return (
        <button
          key={step}
          aria-label={`Go to step ${step}`}
          className={cn(
            "h-1.5 rounded-full transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            currentStep === step
              ? "w-8 sm:w-10 bg-primary"
              : currentStep > step
              ? "w-4 sm:w-5 bg-primary/40"
              : "w-4 sm:w-5 bg-muted"
          )}
          disabled={currentStep < step}
        />
      );
    })}
  </div>
);

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  iconBgColor: string;
}> = ({ icon, title, description, color, bgColor, iconBgColor }) => (
  <motion.li
    className={`flex items-start ${bgColor} p-3.5 sm:p-4.5 rounded-xl border border-${color}/10 shadow-sm`}
  >
    <div
      className={`${iconBgColor} p-2.5 sm:p-3 rounded-full mr-3.5 sm:mr-4.5 flex-shrink-0`}
    >
      {icon}
    </div>
    <div>
      <h4 className="font-medium text-foreground mb-1.5">{title}</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  </motion.li>
);

export const OnboardingDialog: React.FC<OnboardingDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [userType, setUserType] = useState<"customer" | "peddler" | null>(null);
  const totalSteps = 3;

  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setTimeout(() => {
        setOnboardingStep(1);
        setUserType(null);
      }, 300); // Match exit animation duration
    }
  }, [open]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    localStorage.setItem("hasVisitedKeliLinkHome", "true");
  }, [onOpenChange]);

  const handleNextStep = useCallback(
    () => setOnboardingStep((prev) => Math.min(totalSteps, prev + 1)),
    []
  );

  const handlePrevStep = useCallback(
    () => setOnboardingStep((prev) => Math.max(1, prev - 1)),
    []
  );

  const handleUserTypeSelect = useCallback(
    (type: "customer" | "peddler") => {
      setUserType(type);
      handleNextStep();
    },
    [handleNextStep]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight" && onboardingStep < totalSteps) {
        handleNextStep();
      } else if (e.key === "ArrowLeft" && onboardingStep > 1) {
        handlePrevStep();
      }
    },
    [handleNextStep, handlePrevStep, onboardingStep, totalSteps]
  );

  // Enhanced animations
  const fadeVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3,
        ease: "easeIn",
      },
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl max-w-[95vw] bg-white rounded-2xl border-0 shadow-2xl overflow-hidden p-0"
        onKeyDown={handleKeyDown}
      >
        {/* Decorative top gradient */}
        <div className="h-2 bg-gradient-to-r from-blue-500 via-primary to-amber-500"></div>

        <DialogHeader className="pt-7 px-7 sm:pt-9 sm:px-9">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground font-jakarta flex items-center">
            <div className="relative mr-3 sm:mr-4">
              <Image
                src="/kelilink-logo.png"
                alt="KeliLink Logo"
                width={48}
                height={48}
                className="h-auto"
              />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
              Welcome to KeliLink!
            </span>
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-muted-foreground pt-2.5 leading-relaxed max-w-md">
            {onboardingStep === 1
              ? "Connecting street food peddlers with hungry customers in Indonesia. Let's personalize your experience!"
              : userType === "customer"
              ? "Find and discover delicious street food nearby with these powerful features:"
              : "Grow your street food business with these innovative tools:"}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicators - now interactive */}
        <StepIndicator currentStep={onboardingStep} totalSteps={totalSteps} />

        {/* Content container with fixed height */}
        <div className="min-h-[400px] sm:min-h-[420px] relative">
          <AnimatePresence mode="wait">
            {/* Step 1: User Type Selection */}
            {onboardingStep === 1 && (
              <motion.div
                key="step1"
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="grid gap-5 sm:gap-6 py-7 px-7 sm:py-8 sm:px-8 h-full"
              >
                <div className="text-center mb-2">
                  <h3 className="font-semibold text-lg sm:text-xl text-foreground font-jakarta">
                    I am a...
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleUserTypeSelect("customer")}
                    className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
                    aria-label="Select customer role"
                  >
                    <div className="border border-blue-200 hover:border-blue-400 bg-gradient-to-br from-blue-50 to-white hover:from-blue-100 hover:to-blue-50 rounded-xl p-5 sm:p-6 flex flex-col items-center text-center shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-4 sm:mb-5 shadow-inner">
                        <UserRound className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-lg mb-2 sm:mb-3 text-blue-900">
                        Customer
                      </h4>
                      <p className="text-sm text-blue-700/80 leading-relaxed">
                        I want to discover and track street food peddlers near
                        me
                      </p>
                    </div>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleUserTypeSelect("peddler")}
                    className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 rounded-xl"
                    aria-label="Select peddler role"
                  >
                    <div className="border border-amber-200 hover:border-amber-400 bg-gradient-to-br from-amber-50 to-white hover:from-amber-100 hover:to-amber-50 rounded-xl p-5 sm:p-6 flex flex-col items-center text-center shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center mb-4 sm:mb-5 shadow-inner">
                        <GerobakIcon className="h-8 w-8 sm:h-10 sm:w-10 text-amber-600" />
                      </div>
                      <h4 className="font-semibold text-lg mb-2 sm:mb-3 text-amber-900">
                        Peddler
                      </h4>
                      <p className="text-sm text-amber-700/80 leading-relaxed">
                        I sell street food and want to grow my business
                      </p>
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 2: User Type Specific Features */}
            {onboardingStep === 2 && userType === "customer" && (
              <motion.div
                key="step2-customer"
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="grid gap-5 sm:gap-6 py-7 px-7 sm:py-8 sm:px-8 h-full"
              >
                <ul className="space-y-4 sm:space-y-5 text-sm sm:text-base text-card-foreground overflow-y-auto max-h-[400px] sm:max-h-[420px] pr-1 pb-2">
                  <FeatureCard
                    icon={
                      <Search className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    }
                    title="Natural Language Search"
                    description={`Ask naturally (e.g., "Find bakso near me" or "Spicy satay in Menteng") to discover exactly what you\'re craving.`}
                    color="blue"
                    bgColor="bg-blue-50"
                    iconBgColor="bg-blue-100"
                  />
                  <FeatureCard
                    icon={
                      <Navigation className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    }
                    title="Real-time Tracking"
                    description="See active peddlers and their latest locations updated in real-time, with estimated arrival times to your location."
                    color="green"
                    bgColor="bg-green-50"
                    iconBgColor="bg-green-100"
                  />
                  <FeatureCard
                    icon={
                      <Filter className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                    }
                    title="Browse & Discover"
                    description="Explore food categories, check popular searches, filter by dietary preferences, and find trending street food nearby."
                    color="amber"
                    bgColor="bg-amber-50"
                    iconBgColor="bg-amber-100"
                  />
                  <FeatureCard
                    icon={
                      <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                    }
                    title="Vendor Alerts"
                    description="Get notified when your favorite food peddlers are active in your area so you never miss your cravings."
                    color="purple"
                    bgColor="bg-purple-50"
                    iconBgColor="bg-purple-100"
                  />
                </ul>
              </motion.div>
            )}

            {onboardingStep === 2 && userType === "peddler" && (
              <motion.div
                key="step2-peddler"
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="grid gap-5 sm:gap-6 py-7 px-7 sm:py-8 sm:px-8 h-full"
              >
                <ul className="space-y-4 sm:space-y-5 text-sm sm:text-base text-card-foreground overflow-y-auto max-h-[400px] sm:max-h-[420px] pr-1 pb-2">
                  <FeatureCard
                    icon={
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                    }
                    title="Customer Connections"
                    description="Register your stall and let hungry customers in your area find you easily, with reviews and ratings to build your reputation."
                    color="purple"
                    bgColor="bg-purple-50"
                    iconBgColor="bg-purple-100"
                  />
                  <FeatureCard
                    icon={
                      <Share2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    }
                    title="Smart Location Sharing"
                    description="Go 'live' to share your real-time location when you're actively selling, with battery-efficient tracking and customer alerts."
                    color="blue"
                    bgColor="bg-blue-50"
                    iconBgColor="bg-blue-100"
                  />
                  <FeatureCard
                    icon={
                      <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                    }
                    title="AI Route Advisor"
                    description="Get smart suggestions to optimize your selling routes and find customer hotspots based on historical data and real-time demand."
                    color="amber"
                    bgColor="bg-amber-50"
                    iconBgColor="bg-amber-100"
                  />
                  <FeatureCard
                    icon={
                      <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    }
                    title="Business Analytics"
                    description="Track your sales performance, customer engagement, and popular items to make data-driven decisions for your business."
                    color="green"
                    bgColor="bg-green-50"
                    iconBgColor="bg-green-100"
                  />
                </ul>
              </motion.div>
            )}

            {/* Step 3: Final Step with Call to Action */}
            {onboardingStep === 3 && (
              <motion.div
                key="step3"
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="grid gap-5 sm:gap-6 py-7 px-7 sm:py-8 sm:px-8 text-center h-full place-content-center"
              >
                <div className="mx-auto mb-4 sm:mb-5 relative">
                  <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-inner">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, 0, -5, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatType: "loop",
                      }}
                    >
                      <Sparkles className="h-12 w-12 sm:h-14 sm:w-14 text-primary" />
                    </motion.div>
                  </div>

                  {/* Decorative floating elements */}
                  <motion.div
                    className="absolute -top-2 -right-2"
                    animate={{
                      y: [0, -8, 0],
                      rotate: [0, 10, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: 0.5,
                    }}
                  >
                    <Heart
                      className="h-6 w-6 text-rose-500/70"
                      fill="rgba(244,63,94,0.2)"
                    />
                  </motion.div>

                  <motion.div
                    className="absolute -bottom-2 -left-2"
                    animate={{
                      y: [0, 8, 0],
                      rotate: [0, -10, 0],
                    }}
                    transition={{
                      duration: 3.5,
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: 0.2,
                    }}
                  >
                    <Star
                      className="h-6 w-6 text-amber-500/70"
                      fill="rgba(245,158,11,0.2)"
                    />
                  </motion.div>

                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 -left-6"
                    animate={{
                      x: [0, -5, 0],
                      rotate: [0, -5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: 0.8,
                    }}
                  >
                    <Utensils className="h-5 w-5 text-blue-500/70" />
                  </motion.div>

                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 -right-6"
                    animate={{
                      x: [0, 5, 0],
                      rotate: [0, 5, 0],
                    }}
                    transition={{
                      duration: 3.2,
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: 0.3,
                    }}
                  >
                    <MapPin className="h-5 w-5 text-green-500/70" />
                  </motion.div>
                </div>

                <h3 className="font-bold text-xl sm:text-2xl text-foreground font-jakarta bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                  You're all set to go!
                </h3>

                <p className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {userType === "customer"
                    ? "Start exploring delicious street food nearby and discover your new favorites with just a few taps."
                    : "Register your peddler account to grow your business and connect with hungry customers in your area."}
                </p>

                {userType === "peddler" ? (
                  <Link
                    href="/peddler/register"
                    onClick={handleClose}
                    className="mt-3 sm:mt-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 rounded-xl"
                  >
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Button className="w-full bg-gradient-to-r from-amber-500 to-primary hover:opacity-90 transition-all text-white font-medium py-5 sm:py-6 px-6 rounded-xl shadow-lg hover:shadow-xl border-0 text-base">
                        Register as Peddler
                      </Button>
                    </motion.div>
                  </Link>
                ) : (
                  <div className="mt-3 sm:mt-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl">
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Button
                        onClick={handleClose}
                        className="w-full bg-gradient-to-r from-blue-500 to-primary hover:opacity-90 transition-all text-white font-medium py-5 sm:py-6 px-6 rounded-xl shadow-lg hover:shadow-xl border-0 text-base"
                      >
                        Start Exploring
                      </Button>
                    </motion.div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground/70 mt-3">
                  You can always change your preferences later in settings
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-7 pb-7 pt-3 sm:px-8 sm:pb-8 sm:pt-4 flex flex-row items-center justify-between">
          {onboardingStep > 1 ? (
            <Button
              variant="outline"
              onClick={handlePrevStep}
              className="rounded-xl text-sm border-border hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2 py-2.5 px-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Go back to previous step"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <div></div>
          )}

          {onboardingStep < 3 && onboardingStep > 1 && (
            <Button
              onClick={handleNextStep}
              className="bg-primary hover:bg-primary/90 text-sm text-primary-foreground rounded-xl flex items-center gap-2 py-2.5 px-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Continue to next step"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
