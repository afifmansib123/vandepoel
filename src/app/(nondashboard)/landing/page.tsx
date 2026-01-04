"use client";

import React, { useState, useEffect } from "react";
import HeroSection from "./HeroSection";
import SplitSection from "./SplitSection";
import FeaturesSection from "./FeaturesSection";
import FooterSection from "./FooterSection";
import CallToActionSection from "./CallToActionSection";
import TokenizedFeaturesWelcomeModal from "@/components/TokenizedFeaturesWelcomeModal";

const Landing = () => {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome modal before
    const hasSeenWelcome = localStorage.getItem('assetxtoken_welcome_seen');

    if (!hasSeenWelcome) {
      // Show modal after a short delay for better UX
      const timer = setTimeout(() => {
        setShowWelcomeModal(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
    // Mark as seen so it doesn't show again
    localStorage.setItem('assetxtoken_welcome_seen', 'true');
  };

  return (
    <div>
      <HeroSection />
      <SplitSection />
      <FeaturesSection />
      <CallToActionSection/>
      <FooterSection />

      {/* Welcome modal for first-time visitors explaining tokenized features */}
      <TokenizedFeaturesWelcomeModal
        isOpen={showWelcomeModal}
        onClose={handleCloseWelcomeModal}
      />
    </div>
  );
};

export default Landing;
