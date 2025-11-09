"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import FooterSection from "../landing/FooterSection";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";

const FAQPage = () => {
  const t = useTranslations();
  const [openQuestion, setOpenQuestion] = useState<number | null>(0);

  const toggleQuestion = (index: number) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  const features = [
    {
      title: t("faq.features.feature1"),
      description: t("faq.features.feature1Desc"),
    },
    {
      title: t("faq.features.feature2"),
      description: t("faq.features.feature2Desc"),
    },
    {
      title: t("faq.features.feature3"),
      description: t("faq.features.feature3Desc"),
    },
    {
      title: t("faq.features.feature4"),
      description: t("faq.features.feature4Desc"),
    },
    {
      title: t("faq.features.feature5"),
      description: t("faq.features.feature5Desc"),
    },
    {
      title: t("faq.features.feature6"),
      description: t("faq.features.feature6Desc"),
    },
    {
      title: t("faq.features.feature7"),
      description: t("faq.features.feature7Desc"),
    },
    {
      title: t("faq.features.feature8"),
      description: t("faq.features.feature8Desc"),
    },
    {
      title: t("faq.features.feature9"),
      description: t("faq.features.feature9Desc"),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 sm:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t("faq.title")}
          </h1>
          <p className="text-xl text-gray-600">{t("faq.subtitle")}</p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {/* Question 1 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <button
              onClick={() => toggleQuestion(0)}
              className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition"
            >
              <span className="text-lg font-semibold text-gray-900">
                {t("faq.q1.question")}
              </span>
              <FontAwesomeIcon
                icon={openQuestion === 0 ? faChevronUp : faChevronDown}
                className="text-gray-500"
              />
            </button>
            {openQuestion === 0 && (
              <div className="px-6 pb-4">
                <p className="text-gray-700 mb-4">{t("faq.q1.answer")}</p>

                {/* Features List */}
                <div className="mt-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    {t("faq.features.title")}
                  </h3>
                  <ol className="space-y-3">
                    {features.map((feature, index) => (
                      <li key={index} className="flex">
                        <span className="font-bold text-blue-600 mr-2">
                          {index + 1}.
                        </span>
                        <div>
                          <span className="font-semibold text-gray-900">
                            {feature.title}
                          </span>
                          <p className="text-gray-600 text-sm mt-1">
                            {feature.description}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </div>

          {/* Question 2 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <button
              onClick={() => toggleQuestion(1)}
              className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition"
            >
              <span className="text-lg font-semibold text-gray-900">
                {t("faq.q2.question")}
              </span>
              <FontAwesomeIcon
                icon={openQuestion === 1 ? faChevronUp : faChevronDown}
                className="text-gray-500"
              />
            </button>
            {openQuestion === 1 && (
              <div className="px-6 pb-4">
                <p className="text-gray-700">{t("faq.q2.answer")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Help Section */}
        <div className="mt-12 bg-blue-50 p-8 rounded-lg text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Still have questions?
          </h2>
          <p className="text-gray-700 mb-6">
            Can't find the answer you're looking for? Please get in touch with
            our team.
          </p>
          <a
            href="/contact"
            className="inline-block bg-blue-600 text-white py-3 px-8 rounded-md hover:bg-blue-700 transition font-semibold"
          >
            Contact Us
          </a>
        </div>
      </div>

      <FooterSection />
    </div>
  );
};

export default FAQPage;
