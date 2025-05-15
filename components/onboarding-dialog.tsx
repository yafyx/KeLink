import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
} from "lucide-react";
import { GerobakIcon } from "@/components/ui/GerobakIcon";

type OnboardingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const OnboardingDialog: React.FC<OnboardingDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [userType, setUserType] = useState<"customer" | "peddler" | null>(null);

  useEffect(() => {
    if (!open) {
      setOnboardingStep(1);
      setUserType(null);
    }
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
    localStorage.setItem("hasVisitedKeliLinkHome", "true");
  };

  const handleNextStep = () => setOnboardingStep((prev) => prev + 1);
  const handlePrevStep = () =>
    setOnboardingStep((prev) => Math.max(1, prev - 1));
  const handleUserTypeSelect = (type: "customer" | "peddler") => {
    setUserType(type);
    handleNextStep();
  };

  const fadeVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.3 } },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-w-[95vw] bg-white rounded-xl border-0 shadow-xl overflow-hidden p-0">
        <div className="h-2 bg-gradient-to-r from-blue-500 via-primary to-amber-500"></div>

        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>

        <DialogHeader className="pt-6 px-6 sm:pt-8 sm:px-8">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground font-jakarta flex items-center">
            <Image
              src="/kelilink-logo.png"
              alt="KeliLink Logo"
              width={40}
              height={40}
              className="mr-2.5 sm:mr-3 h-auto"
            />
            Welcome to KeliLink!
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-muted-foreground pt-2 leading-relaxed">
            {onboardingStep === 1
              ? "Connecting street food vendors with hungry customers in Indonesia. Let's personalize your experience!"
              : userType === "customer"
              ? "Find and discover delicious street food nearby with these powerful features:"
              : "Grow your street food business with these innovative tools:"}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicators */}
        <div className="flex items-center justify-center gap-2 px-6 sm:px-8 pt-3 sm:pt-4">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                onboardingStep === step
                  ? "w-8 sm:w-10 bg-primary"
                  : onboardingStep > step
                  ? "w-4 sm:w-5 bg-primary/40"
                  : "w-4 sm:w-5 bg-muted"
              }`}
            ></div>
          ))}
        </div>

        {/* Content container with fixed height */}
        <div className="min-h-[380px] sm:min-h-[400px] relative">
          <AnimatePresence mode="wait">
            {/* Step 1: User Type Selection */}
            {onboardingStep === 1 && (
              <motion.div
                key="step1"
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="grid gap-4 sm:gap-5 py-6 px-6 sm:py-8 sm:px-8 h-full"
              >
                <div className="text-center mb-2">
                  <h3 className="font-semibold text-base sm:text-lg text-foreground font-jakarta">
                    I am a...
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleUserTypeSelect("customer")}
                    className="cursor-pointer"
                  >
                    <div className="border border-border hover:border-blue-300 bg-card hover:bg-blue-50 rounded-xl p-4 sm:p-5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-blue-100 flex items-center justify-center mb-3 sm:mb-4">
                        <UserRound className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-base mb-1 sm:mb-2">
                        Customer
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        I want to discover and track street food vendors near me
                      </p>
                    </div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleUserTypeSelect("peddler")}
                    className="cursor-pointer"
                  >
                    <div className="border border-border hover:border-amber-300 bg-card hover:bg-amber-50 rounded-xl p-4 sm:p-5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-amber-100 flex items-center justify-center mb-3 sm:mb-4">
                        <GerobakIcon className="h-7 w-7 sm:h-8 sm:w-8 text-amber-600" />
                      </div>
                      <h4 className="font-semibold text-base mb-1 sm:mb-2">
                        Peddler
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        I sell street food and want to grow my business
                      </p>
                    </div>
                  </motion.div>
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
                className="grid gap-4 sm:gap-5 py-6 px-6 sm:py-8 sm:px-8 h-full"
              >
                <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-card-foreground overflow-y-auto max-h-[380px] sm:max-h-[400px] pr-1">
                  <li className="flex items-start bg-blue-50 p-3 sm:p-4 rounded-xl">
                    <div className="bg-blue-100 p-2 sm:p-2.5 rounded-full mr-3 sm:mr-4 flex-shrink-0">
                      <Search className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">
                        Natural Language Search
                      </h4>
                      <p>
                        Ask naturally (e.g., "Find bakso near me" or "Spicy
                        satay in Menteng") to discover exactly what you're
                        craving when you want it.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start bg-green-50 p-3 sm:p-4 rounded-xl">
                    <div className="bg-green-100 p-2 sm:p-2.5 rounded-full mr-3 sm:mr-4 flex-shrink-0">
                      <Navigation className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">
                        Real-time Tracking
                      </h4>
                      <p>
                        See active peddlers and their latest locations updated
                        in real-time, with estimated arrival times to your
                        location.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start bg-amber-50 p-3 sm:p-4 rounded-xl">
                    <div className="bg-amber-100 p-2 sm:p-2.5 rounded-full mr-3 sm:mr-4 flex-shrink-0">
                      <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">
                        Browse & Discover
                      </h4>
                      <p>
                        Explore food categories, check popular searches, filter
                        by dietary preferences, and find trending street food in
                        your neighborhood.
                      </p>
                    </div>
                  </li>
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
                className="grid gap-4 sm:gap-5 py-6 px-6 sm:py-8 sm:px-8 h-full"
              >
                <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-card-foreground overflow-y-auto max-h-[380px] sm:max-h-[400px] pr-1">
                  <li className="flex items-start bg-purple-50 p-3 sm:p-4 rounded-xl">
                    <div className="bg-purple-100 p-2 sm:p-2.5 rounded-full mr-3 sm:mr-4 flex-shrink-0">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">
                        Customer Connections
                      </h4>
                      <p>
                        Register your stall and let hungry customers in your
                        area find you easily, with reviews and ratings to build
                        your reputation.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start bg-blue-50 p-3 sm:p-4 rounded-xl">
                    <div className="bg-blue-100 p-2 sm:p-2.5 rounded-full mr-3 sm:mr-4 flex-shrink-0">
                      <Share2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">
                        Smart Location Sharing
                      </h4>
                      <p>
                        Go 'live' to share your real-time location when you're
                        actively selling, with battery-efficient tracking and
                        automatic alerts to nearby customers.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start bg-amber-50 p-3 sm:p-4 rounded-xl">
                    <div className="bg-amber-100 p-2 sm:p-2.5 rounded-full mr-3 sm:mr-4 flex-shrink-0">
                      <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">
                        AI Route Advisor
                      </h4>
                      <p>
                        Get smart suggestions to optimize your selling routes
                        and find customer hotspots based on historical data and
                        real-time demand.
                      </p>
                    </div>
                  </li>
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
                className="grid gap-4 sm:gap-5 py-6 px-6 sm:py-8 sm:px-8 text-center h-full place-content-center"
              >
                <div className="mx-auto mb-3 sm:mb-4">
                  <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-inner">
                    <motion.div
                      animate={{
                        scale: [1, 1.05, 1],
                        rotate: [0, 5, 0, -5, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatType: "loop",
                      }}
                    >
                      <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                    </motion.div>
                  </div>
                </div>
                <h3 className="font-bold text-lg sm:text-xl text-foreground font-jakarta">
                  You're all set to go!
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {userType === "customer"
                    ? "Start exploring delicious street food nearby and discover your new favorites with just a few taps."
                    : "Register your peddler account to grow your business and connect with hungry customers in your area."}
                </p>
                {userType === "peddler" ? (
                  <Link
                    href="/peddler/register"
                    onClick={handleClose}
                    className="mt-2 sm:mt-3"
                  >
                    <Button className="w-full bg-gradient-to-r from-amber-500 to-primary hover:opacity-90 transition-opacity text-white font-medium py-4 sm:py-5 rounded-lg">
                      Register as Peddler
                    </Button>
                  </Link>
                ) : (
                  <div className="mt-2 sm:mt-3">
                    <Button
                      onClick={handleClose}
                      className="w-full bg-gradient-to-r from-blue-500 to-primary hover:opacity-90 transition-opacity text-white font-medium py-4 sm:py-5 rounded-lg"
                    >
                      Start Exploring
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="px-6 pb-6 pt-3 sm:px-8 sm:pb-8 sm:pt-4 flex flex-row items-center justify-between sm:justify-between">
          {onboardingStep > 1 ? (
            <Button
              variant="outline"
              onClick={handlePrevStep}
              className="rounded-lg text-sm border-border hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Back
            </Button>
          ) : (
            <div></div>
          )}

          {onboardingStep < 3 && onboardingStep > 1 && (
            <Button
              onClick={handleNextStep}
              className="bg-primary hover:bg-primary/90 text-sm text-primary-foreground rounded-lg flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
