"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  MapPin,
  Star,
  Clock,
  ChevronRight,
  Navigation,
  MessageCircle,
  Route,
  Menu,
  Search,
  Bookmark,
  Filter,
  Heart,
  ChefHat,
  Coffee,
  Utensils,
  BadgeDollarSign,
  AlertCircle,
  Soup,
  Sun,
  Moon,
  Droplet,
  CupSoda,
  FlameKindling,
  UtensilsCrossed,
  Beef,
  UserRound,
  Bell,
  TrendingUp,
  Sparkles,
  MessageCircleQuestion,
  Users,
  Share2,
  Lightbulb,
} from "lucide-react";
import { MobileHeader } from "@/components/ui/mobile-header";
import { AppLayout } from "@/components/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGeolocation } from "@/hooks/use-geolocation";
import { FeatureBanner } from "@/components/feature-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FoodBeamBackground } from "@/components/kelink-food-beam";
import { AnimatedBeamDemo } from "@/components/kelink-beam";
import { BorderBeam } from "@/components/ui/border-beam";
import { TextAnimate } from "@/components/ui/text-animate";
import { OnboardingDialog } from "@/components/OnboardingDialog";

export default function Home() {
  const router = useRouter();
  const { location, loading, error, permissionState, requestPermission } =
    useGeolocation();
  const [locationText, setLocationText] = useState("Current Location");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<
    string | undefined
  >();
  const [selectedPeddlerId, setSelectedPeddlerId] = useState<
    string | undefined
  >();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [userType, setUserType] = useState<"customer" | "peddler" | null>(null);

  // Food categories
  const categories = [
    { id: "all", name: "All", icon: Utensils },
    { id: "bakso", name: "Meatballs", icon: Soup },
    { id: "gorengan", name: "Fried Snacks", icon: FlameKindling },
    { id: "sarapan", name: "Breakfast", icon: Sun },
    { id: "minuman", name: "Drinks", icon: CupSoda },
    { id: "manis", name: "Sweet Treats", icon: Coffee },
    { id: "pedas", name: "Spicy", icon: Beef },
    { id: "malam", name: "Night Street Food", icon: Moon },
  ];

  // Popular searches
  const popularSearches = [
    "Siomay",
    "Es Cendol",
    "Bakso",
    "Sate",
    "Batagor",
    "Martabak",
    "Cilok",
    "Pecel",
  ];

  // Dynamic animated search texts
  const searchPhrases = [
    "to search for street peddlers",
    "to find trending food",
    "to discover local favorites",
    "for the best street snacks",
  ];
  const [searchPhraseIndex, setSearchPhraseIndex] = useState(0);

  useEffect(() => {
    if (location) {
      setLocationText(
        `Location Updated (${location.lat.toFixed(4)}, ${location.lng.toFixed(
          4
        )})`
      );
    }
  }, [location]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSearchPhraseIndex((prev) => (prev + 1) % searchPhrases.length);
    }, 3000); // 3 seconds
    return () => clearInterval(interval);
  }, []);

  // Onboarding dialog effect
  useEffect(() => {
    const hasVisited = localStorage.getItem("hasVisitedKeliLinkHome");
    if (!hasVisited) {
      setIsOnboardingOpen(true);
    }
  }, []);

  const handleCloseOnboarding = () => {
    setIsOnboardingOpen(false);
    localStorage.setItem("hasVisitedKeliLinkHome", "true");

    // Reset onboarding state for next time
    setOnboardingStep(1);
    setUserType(null);
  };

  const handleNextStep = () => {
    setOnboardingStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setOnboardingStep((prev) => Math.max(1, prev - 1));
  };

  const handleUserTypeSelect = (type: "customer" | "peddler") => {
    setUserType(type);
    handleNextStep();
  };

  const handleNavigateToFind = () => {
    setIsLoading(true);
    router.push("/find");
  };

  const handleRequestLocation = async () => {
    if (permissionState !== "granted") {
      const granted = await requestPermission();
      if (!granted) {
        alert("Please enable location services to get nearby peddlers");
      }
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <AppLayout
      header={
        <MobileHeader
          title=""
          leftAction={
            <div className="flex items-center text-primary font-bold text-xl pl-4 font-title">
              <Image
                src="/kelilink-logo.png"
                alt="KeliLink Logo"
                width={32}
                height={32}
                className="mr-2"
              />
              KeliLink
            </div>
          }
          rightAction={
            <Button
              variant="ghost"
              size="icon"
              className="border border-gray-300 rounded-full w-10 h-10 p-0 flex items-center justify-center hover:bg-gray-100"
              aria-label="Questions"
              onClick={() => setIsOnboardingOpen(true)}
            >
              ?
            </Button>
          }
        />
      }
    >
      <motion.div
        className="flex flex-col pb-20 bg-gray-50/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Hero Banner with KeliLink Brand Colors */}
        <motion.div
          className="relative bg-gradient-to-br from-white to-gray-50 pt-6 pb-10 px-4 mb-6 overflow-hidden rounded-b-3xl shadow-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Container for AnimatedBeamDemo and blur effects - explicitly set z-index */}
          <div className="absolute top-[-20px] left-0 right-0 w-full z-0">
            <AnimatedBeamDemo />
            <div className="absolute top-8 right-4 w-32 h-32 rounded-full bg-primary/5 blur-xl" />
            <div className="absolute bottom-4 left-8 w-24 h-24 rounded-full bg-primary/5 blur-lg" />
            <div className="absolute top-20 left-12 w-16 h-16 rounded-full bg-primary/5 blur-md" />
          </div>
          {/* Gradient Overlay - increased z-index and opacity */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white/75 z-5"></div>

          <div className="relative z-10">
            <div className="h-30"></div>

            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 font-jakarta tracking-tight">
                Find Street Food
              </h1>
              <p className="text-sm text-gray-600 leading-relaxed">
                Discover authentic Indonesian street food nearby
              </p>
            </div>

            <div className="relative rounded-lg">
              <BorderBeam
                size={80}
                colorFrom="#facc15"
                colorTo="#a21caf"
                style={{ borderRadius: "0.5rem" }}
              />
              <Button
                onClick={handleNavigateToFind}
                className="relative overflow-hidden w-full py-3 bg-white hover:bg-gray-50 text-gray-900 justify-between font-medium border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all"
                disabled={isLoading}
              >
                <div className="flex items-center">
                  <Search className="h-4 w-4 mr-2 text-primary" />
                  <span className="text-sm flex items-center gap-1">
                    Ask me{" "}
                    <TextAnimate
                      animation="blurInUp"
                      by="character"
                      className="inline-block"
                      key={searchPhraseIndex}
                      duration={0.5}
                      startOnView={false}
                      delay={0.1}
                    >
                      {searchPhrases[searchPhraseIndex]}
                    </TextAnimate>
                  </span>
                </div>
                <ArrowRight className="h-3 w-3 text-primary" />
                <BorderBeam
                  size={40}
                  initialOffset={20}
                  className="from-transparent via-yellow-500 to-transparent"
                  transition={{
                    type: "spring",
                    stiffness: 60,
                    damping: 20,
                  }}
                />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Trending Banner */}
        <motion.div
          className="px-4 mb-6"
          variants={itemVariants}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-md bg-gradient-to-r from-amber-50 to-amber-100 overflow-hidden rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-amber-200 flex-shrink-0 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-base font-jakarta text-gray-900">
                      Trending Now
                    </h3>
                    <Sparkles className="h-4 w-4 text-amber-500" />
                  </div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Siomay Mang Ujang</span> is
                    trending in your area!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Categories Section */}
        <motion.div
          className="px-4 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold font-jakarta text-gray-900">
              Categories
            </h2>
            <Link
              href="/categories"
              className="text-primary text-sm font-medium"
            >
              View All
            </Link>
          </div>

          <div className="px-1">
            <div className="grid grid-cols-4 gap-3 pb-1">
              {categories.slice(0, 8).map((category) => {
                const isSelected = selectedCategory === category.id;
                const CategoryIcon = category.icon;

                return (
                  <motion.div
                    key={category.id}
                    variants={itemVariants}
                    whileTap={{ scale: 0.95 }}
                    className="aspect-square"
                  >
                    <button
                      onClick={() =>
                        setSelectedCategory(isSelected ? null : category.id)
                      }
                      className={cn(
                        "flex flex-col items-center justify-center py-2 px-2 rounded-xl transition-all w-full h-full shadow-sm",
                        isSelected
                          ? "bg-primary text-white"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <div
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center mb-1",
                          isSelected ? "bg-white/20" : "bg-gray-100"
                        )}
                      >
                        <CategoryIcon
                          className={cn(
                            "h-5 w-5",
                            isSelected ? "text-white" : "text-gray-700"
                          )}
                        />
                      </div>
                      <span className="text-xs font-medium text-center">
                        {category.name}
                      </span>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Feature Banner */}
        <motion.div
          className="px-4 mb-8"
          variants={itemVariants}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.3 }}
        >
          <FeatureBanner
            className="w-full rounded-xl overflow-hidden shadow-md"
            onButtonClick={handleNavigateToFind}
          />
        </motion.div>

        {/* Popular Searches */}
        <motion.div
          className="px-4 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <div className="mb-4">
            <h2 className="text-lg font-semibold font-jakarta text-gray-900">
              Popular Searches
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((item) => (
              <motion.div
                key={item}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href={`/find?query=${item}`}>
                  <Badge
                    variant="outline"
                    className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-800 border-gray-200 cursor-pointer shadow-sm rounded-full"
                  >
                    {item}
                  </Badge>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Nearby Peddlers */}
        <motion.div
          className="px-4 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold font-jakarta text-gray-900">
              Peddlers Nearby
            </h2>
            <Link href="/find" className="text-primary text-sm font-medium">
              View All
            </Link>
          </div>

          <div className="space-y-4">
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="border-0 shadow-md overflow-hidden rounded-xl bg-white hover:shadow-lg transition-all">
                <CardContent className="p-0">
                  <Link
                    href="/find?peddler=siomay-mang-ujang"
                    className="block"
                  >
                    <div className="flex">
                      <div className="relative w-32 h-32">
                        <Image
                          src="vendor/siomay.png"
                          alt="Siomay Mang Ujang Peddler"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm">
                          <div className="flex items-center">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs font-semibold ml-0.5">
                              4.8
                            </span>
                          </div>
                        </div>
                        <button
                          className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite("siomay-mang-ujang");
                          }}
                        >
                          <Heart
                            className={cn(
                              "h-3.5 w-3.5",
                              favorites.includes("siomay-mang-ujang")
                                ? "text-red-500 fill-red-500"
                                : "text-gray-400"
                            )}
                          />
                        </button>
                      </div>
                      <div className="p-4 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-base font-jakarta text-gray-900">
                            Siomay Mang Ujang
                          </h3>
                          <Badge className="bg-green-100 text-green-700 border-0">
                            Active
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <MapPin className="h-3.5 w-3.5 text-primary/80" />
                          <p className="text-xs text-gray-700">
                            500m away • 5 min walk
                          </p>
                        </div>
                        <div className="flex items-center gap-1 mt-1.5">
                          <Clock className="h-3.5 w-3.5 text-gray-500" />
                          <p className="text-xs text-gray-600">
                            Last seen: 5 min ago
                          </p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <Badge className="bg-primary/10 text-primary border-0 px-2 py-0.5 text-xs">
                            Siomay
                          </Badge>
                          <Badge className="bg-gray-100 text-gray-700 border-0 px-2 py-0.5 text-xs">
                            Seafood
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="border-0 shadow-md overflow-hidden rounded-xl bg-white hover:shadow-lg transition-all">
                <CardContent className="p-0">
                  <Link
                    href="/find?peddler=bakso-bang-gondrong"
                    className="block"
                  >
                    <div className="flex">
                      <div className="relative w-32 h-32">
                        <Image
                          src="vendor/bakso.png"
                          alt="Bakso Bang Gondrong Peddler"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm">
                          <div className="flex items-center">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs font-semibold ml-0.5">
                              4.7
                            </span>
                          </div>
                        </div>
                        <button
                          className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite("bakso-bang-gondrong");
                          }}
                        >
                          <Heart
                            className={cn(
                              "h-3.5 w-3.5",
                              favorites.includes("bakso-bang-gondrong")
                                ? "text-red-500 fill-red-500"
                                : "text-gray-400"
                            )}
                          />
                        </button>
                      </div>
                      <div className="p-4 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-base font-jakarta text-gray-900">
                            Bakso Si Gondrong
                          </h3>
                          <Badge className="bg-green-100 text-green-700 border-0">
                            Active
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <MapPin className="h-3.5 w-3.5 text-primary/80" />
                          <p className="text-xs text-gray-700">
                            420m away • 4 min walk
                          </p>
                        </div>
                        <div className="flex items-center gap-1 mt-1.5">
                          <Clock className="h-3.5 w-3.5 text-gray-500" />
                          <p className="text-xs text-gray-600">
                            Last seen: 3 min ago
                          </p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <Badge className="bg-primary/10 text-primary border-0 px-2 py-0.5 text-xs">
                            Bakso
                          </Badge>
                          <Badge className="bg-gray-100 text-gray-700 border-0 px-2 py-0.5 text-xs">
                            Meatballs
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Quick Services */}
        <motion.div
          className="px-4 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <div className="mb-4">
            <h2 className="text-lg font-semibold font-jakarta text-gray-900">
              Quick Services
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
            >
              <Link href="/find" className="block h-full">
                <Card className="border-0 shadow-md overflow-hidden h-full rounded-xl bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardContent className="p-4">
                    <div className="flex flex-col h-full">
                      <div className="h-12 w-12 rounded-full bg-blue-200/50 flex items-center justify-center mb-3">
                        <MessageCircle className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="font-medium text-sm mb-1 font-jakarta text-blue-900">
                        AI Chat Assistant
                      </h3>
                      <p className="text-xs text-blue-700/70">
                        Ask naturally to find street food nearby
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
            >
              <Link href="/find?tracking=true" className="block h-full">
                <Card className="border-0 shadow-md overflow-hidden h-full rounded-xl bg-gradient-to-br from-green-50 to-green-100">
                  <CardContent className="p-4">
                    <div className="flex flex-col h-full">
                      <div className="h-12 w-12 rounded-full bg-green-200/50 flex items-center justify-center mb-3">
                        <Navigation className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="font-medium text-sm mb-1 font-jakarta text-green-900">
                        Live Tracking
                      </h3>
                      <p className="text-xs text-green-700/70">
                        Find street food peddlers in real-time
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Peddler Call to Action */}
        <motion.div
          className="px-4 mb-8"
          variants={itemVariants}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center">
                  <Route className="h-9 w-9 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1 font-jakarta text-gray-900">
                    Are you a street food peddler?
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Join our platform and get AI-powered route advice to
                    optimize your sales
                  </p>
                  <div className="flex gap-2">
                    <Link href="/peddler/register">
                      <Button
                        size="sm"
                        className="rounded-full px-5 py-2 bg-primary hover:bg-primary/90"
                      >
                        Register Now
                      </Button>
                    </Link>
                    <Link href="/peddler/login">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full px-5 py-2 text-primary border-primary/30 hover:bg-primary/5"
                      >
                        Login
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <OnboardingDialog
        open={isOnboardingOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseOnboarding();
          } else {
            setIsOnboardingOpen(true);
          }
        }}
      />
    </AppLayout>
  );
}
