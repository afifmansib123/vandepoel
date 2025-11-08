"use client";

import React, { useEffect, useState } from "react";
import { useGetAuthUserQuery } from "@/state/api";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import PropertyCard, { Property } from "@/components/properyCard";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";

interface TokenInvestment {
  _id: string;
  propertyId: string;
  tokensOwned: number;
  totalInvestment: number;
  ownershipPercentage: number;
  purchaseDate: string;
  property?: Property;
}

const BuyerProperties = () => {
  const t = useTranslations();
  const { data: authUser } = useGetAuthUserQuery();
  const [properties, setProperties] = useState<Property[]>([]);
  const [investments, setInvestments] = useState<TokenInvestment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchBuyerProperties = async () => {
      if (!authUser?.cognitoInfo?.userId) return;

      try {
        setIsLoading(true);

        // Fetch completed token purchase requests
        const response = await fetch(`/api/tokens/purchase-requests?role=buyer`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }

        const result = await response.json();

        if (result.success) {
          // Filter for completed purchases and extract properties
          const completedPurchases = result.data.filter(
            (req: any) => req.status === 'tokens_assigned' || req.status === 'completed'
          );

          // Create investment data
          const investmentData = completedPurchases.map((req: any) => ({
            _id: req._id,
            propertyId: req.propertyId?._id || req.propertyId,
            tokensOwned: req.tokensRequested,
            totalInvestment: req.totalAmount,
            ownershipPercentage: (req.tokensRequested / req.tokenOfferingId?.totalTokens) * 100,
            purchaseDate: req.createdAt,
            property: req.propertyId,
          }));

          setInvestments(investmentData);

          // Extract unique properties
          const uniqueProperties = completedPurchases
            .map((req: any) => req.propertyId)
            .filter((prop: any, index: number, self: any[]) =>
              prop && self.findIndex((p) => p._id === prop._id) === index
            );

          setProperties(uniqueProperties);
        }
      } catch (error) {
        console.error('Error fetching buyer properties:', error);
        setIsError(true);
        toast.error('Failed to load your properties');
      } finally {
        setIsLoading(false);
      }
    };

    if (authUser?.userRole === 'buyer') {
      fetchBuyerProperties();
    } else if (authUser && authUser.userRole !== 'buyer') {
      toast.error('You are not authorized to view this page. Please log in as a buyer.');
      setIsLoading(false);
    }
  }, [authUser]);

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">
            {t('pages.buyerProperties.errorLoading')}
          </h2>
          <p className="text-gray-700">
            {t('pages.buyerProperties.errorDescription')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <Header
        title={t('pages.buyerProperties.title')}
        subtitle={t('pages.buyerProperties.subtitle')}
      />

      {properties && properties.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-8">
            {properties.map((property) => {
              const investment = investments.find(inv =>
                inv.propertyId === property._id || inv.propertyId === property.id
              );

              return (
                <div key={property.id || property._id} className="relative">
                  <PropertyCard
                    property={property}
                    propertyLink={`/marketplace/${property.id}`}
                  />
                  {investment && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-semibold text-blue-900">
                        {t('pages.buyerProperties.yourInvestment')}
                      </p>
                      <p className="text-xs text-blue-700">
                        {t('pages.buyerProperties.tokens')}: {investment.tokensOwned}
                      </p>
                      <p className="text-xs text-blue-700">
                        {t('pages.buyerProperties.ownership')}: {investment.ownershipPercentage.toFixed(2)}%
                      </p>
                      <p className="text-xs text-blue-700">
                        {t('pages.buyerProperties.investment')}: ${investment.totalInvestment.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Investment Summary */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">{t('pages.buyerProperties.investmentSummary')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">{t('pages.buyerProperties.totalProperties')}</p>
                <p className="text-2xl font-bold text-green-600">{properties.length}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">{t('pages.buyerProperties.totalTokens')}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {investments.reduce((sum, inv) => sum + inv.tokensOwned, 0)}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">{t('pages.buyerProperties.totalInvestment')}</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${investments.reduce((sum, inv) => sum + inv.totalInvestment, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {t('pages.buyerProperties.noPropertiesYet')}
          </h3>
          <p className="text-gray-500 mb-6">
            {t('pages.buyerProperties.noPropertiesDescription', {
              marketplace: <Link href="/marketplace" className="text-blue-500 underline">
                {t('pages.buyerProperties.marketplace')}
              </Link>
            })}
          </p>
        </div>
      )}
    </div>
  );
};

export default BuyerProperties;
