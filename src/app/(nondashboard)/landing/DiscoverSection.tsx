"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";
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
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const DiscoverSection = () => {
  const t = useTranslations();

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: useIsMobile() ? 0.1 : 0.8 }}
      variants={containerVariants}
      className="py-12 bg-white mb-16"
    >
      <div className="max-w-6xl xl:max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
        <motion.div variants={itemVariants} className="my-12 text-center">
          <h2 className="text-3xl font-semibold leading-tight text-gray-800">
            {t('landing.discover.title')}
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            {t('landing.discover.subtitle')}
          </p>
          <p className="mt-2 text-gray-500 max-w-3xl mx-auto">
            {t('landing.discover.description')}
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 xl:gap-16 text-center">
          {[
            {
              imageSrc: "/landing-icon-wand.png",
              stepKey: "step1"
            },
            {
              imageSrc: "/landing-icon-calendar.png",
              stepKey: "step2"
            },
            {
              imageSrc: "/landing-icon-heart.png",
              stepKey: "step3"
            },
          ].map((card, index) => (
            <motion.div key={index} variants={itemVariants}>
              <DiscoverCard
                imageSrc={card.imageSrc}
                title={t(`landing.discover.${card.stepKey}.title`)}
                description={t(`landing.discover.${card.stepKey}.description`)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const DiscoverCard = ({
  imageSrc,
  title,
  description,
}: {
  imageSrc: string;
  title: string;
  description: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Truncate description to first 120 characters
  const truncatedDescription = description.length > 120
    ? description.substring(0, 120) + "..."
    : description;

  return (
    <div className="px-4 py-8 shadow-lg rounded-lg bg-primary-50 hover:bg-slate-100 flex flex-col h-full">
      <div className="bg-primary-700 p-[0.6rem] rounded-full mb-4 h-10 w-10 mx-auto hover:bg-secondary-500">
        <Image
          src={imageSrc}
          width={30}
          height={30}
          className="w-full h-full"
          alt={title}
        />
      </div>
      <h3 className="mt-4 text-xl font-medium text-gray-800">{title}</h3>
      <p className="mt-2 text-base text-gray-500 flex-grow">{truncatedDescription}</p>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button className="text-primary-600 hover:text-primary-700 font-medium mt-4">
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
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiscoverSection;
