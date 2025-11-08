"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const FeaturesSection = () => {
  const t = useTranslations();

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={containerVariants}
      className="py-24 px-6 sm:px-8 lg:px-12 xl:px-16 bg-white"
    >
      <div className="max-w-4xl xl:max-w-6xl mx-auto">
        <motion.h2
          variants={itemVariants}
          className="text-3xl font-bold text-center mb-12 w-full sm:w-2/3 mx-auto"
        >
          {t('landing.features.title')}
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 xl:gap-16">
          {[
            {
              key: 'listProperty',
              imageSrc: '/landing-search3.png',
              linkHref: '/marketplace'
            },
            {
              key: 'findProperty',
              imageSrc: '/landing-search2.png',
              linkHref: '/marketplace'
            },
            {
              key: 'growBusiness',
              imageSrc: '/landing-search1.png',
              linkHref: '/marketplace'
            }
          ].map((feature, index) => (
            <motion.div key={index} variants={itemVariants}>
              <FeatureCard
                imageSrc={feature.imageSrc}
                title={t(`landing.features.${feature.key}.title`)}
                description={t(`landing.features.${feature.key}.description`)}
                linkText={t(`landing.features.${feature.key}.button`)}
                linkHref={feature.linkHref}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const FeatureCard = ({
  imageSrc,
  title,
  description,
  linkText,
  linkHref,
}: {
  imageSrc: string;
  title: string;
  description: string;
  linkText: string;
  linkHref: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Truncate description to first 150 characters
  const truncatedDescription = description.length > 150
    ? description.substring(0, 150) + "..."
    : description;

  return (
    <div className="text-center h-full flex flex-col">
      <div className="p-4 rounded-lg mb-4 flex items-center justify-center h-48">
        <Image
          src={imageSrc}
          width={400}
          height={400}
          className="w-full h-full object-contain"
          alt={title}
        />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="mb-4 whitespace-pre-line">{truncatedDescription}</p>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button className="text-primary-600 hover:text-primary-700 font-medium mb-4">
            Read more
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{title}</DialogTitle>
          </DialogHeader>
          <DialogDescription asChild>
            <div className="space-y-4">
              <p className="whitespace-pre-line text-base text-gray-700">{description}</p>
              <div className="pt-4">
                <Link
                  href={linkHref}
                  className="inline-block bg-primary-600 text-white rounded px-6 py-3 hover:bg-primary-700 transition-colors"
                  scroll={false}
                  onClick={() => setIsOpen(false)}
                >
                  {linkText}
                </Link>
              </div>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeaturesSection;
