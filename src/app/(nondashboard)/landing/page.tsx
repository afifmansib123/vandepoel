"use client";

import React, { useState, useEffect } from "react";
import HeroSection from "./HeroSection";
import TutorialSection from "./TutorialSection";
import FeaturesSection from "./FeaturesSection";
import DiscoverSection from "./DiscoverSection";
import CallToActionSection from "./CallToActionSection";
import FooterSection from "./FooterSection";
import AssetXTokenTutorialModal from "@/components/AssetXTokenTutorialModal";

const Landing = () => {
  const [showTutorialModal, setShowTutorialModal] = useState(false);

  useEffect(() => {
    // Check if user has seen the tutorial before
    const hasSeenTutorial = localStorage.getItem('assetxtoken_tutorial_seen');

    if (!hasSeenTutorial) {
      // Show modal after a short delay for better UX
      const timer = setTimeout(() => {
        setShowTutorialModal(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div>
      <HeroSection />
      <TutorialSection />
      <FeaturesSection />
      <DiscoverSection />
      <CallToActionSection />
      <FooterSection />

      {/* Tutorial modal for first-time visitors */}
      <AssetXTokenTutorialModal
        isOpen={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
      />
    </div>
  );
};

export default Landing;
