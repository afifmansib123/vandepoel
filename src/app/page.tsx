"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Landing from "./(nondashboard)/landing/page";
import TokenLoadingAnimation from "@/components/TokenLoadingAnimation";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading (checking auth, fetching initial data, etc.)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500); // Show loading for 2.5 seconds

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <TokenLoadingAnimation />;
  }

  return (
    <div className="h-full w-full">
      <Navbar />
      <main className={`h-full flex w-full flex-col`}>
        <Landing />
      </main>
    </div>
  );
}
