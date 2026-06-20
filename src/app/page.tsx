"use client";

import { useAppStore } from "@/lib/store";
import { MobileFrame } from "@/components/mobile-frame";
import { LoginScreen } from "@/components/screens/LoginScreen";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { ScanScreen } from "@/components/screens/ScanScreen";
import { ProcessingScreen } from "@/components/screens/ProcessingScreen";
import { ReviewScreen } from "@/components/screens/ReviewScreen";
import { DetailScreen } from "@/components/screens/DetailScreen";

export default function Home() {
  const { isAuthenticated, currentScreen } = useAppStore();

  if (!isAuthenticated) {
    return (
      <MobileFrame>
        <LoginScreen />
      </MobileFrame>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "home":
        return <HomeScreen />;
      case "scan":
        return <ScanScreen />;
      case "processing":
        return <ProcessingScreen />;
      case "review":
        return <ReviewScreen />;
      case "detail":
        return <DetailScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return <MobileFrame>{renderScreen()}</MobileFrame>;
}
