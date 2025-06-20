"use client";

import Header from "@/components/Header";
import Loading from "@/components/Loading";
import {
  useGetAuthUserQuery,
  useUpdateTenantSettingsMutation,// You'll need to create this mutation hook
} from "@/state/api";
import React, { useState, useEffect } from "react";
import Image from "next/image";

// Interface for Buyer data structure
interface BuyerProfile {
  _id: string;
  id?: number;
  cognitoId: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  properties?: number[];
  favorites?: number[];
  createdAt?: string;
  updatedAt?: string;
}

// Type for the form's state
type EditableBuyerProfile = Partial<
  Omit<
    BuyerProfile,
    "_id" | "id" | "cognitoId" | "email" | "createdAt" | "updatedAt" | "properties" | "favorites"
  >
>;

const BuyerProfile = () => {
  const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery();

  // You'll need to create this mutation hook in your API state
  const [updateProfile, { isLoading: isUpdating }] =
    useUpdateTenantSettingsMutation();

  const [buyerData, setBuyerData] = useState<BuyerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // State for managing edit mode and form data
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<EditableBuyerProfile>({});

  // Data fetching logic
  useEffect(() => {
    const fetchBuyerProfile = async () => {
      if (!authUser?.cognitoInfo.userId) return;

      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/buyers/${authUser.cognitoInfo.userId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch buyer profile");
        }

        const data: BuyerProfile = await response.json();
        setBuyerData(data);

        // Pre-populate the form state with the fetched data
        setFormData({
          name: data.name || "",
          phoneNumber: data.phoneNumber || "",
        });
      } catch (error) {
        console.error("Error fetching buyer profile:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (authUser) {
      fetchBuyerProfile();
    }
  }, [authUser]);

  // Handler for form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler for form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!authUser?.cognitoInfo.userId || !buyerData) {
      alert("Error: Cannot update profile. User or profile data is missing.");
      return;
    }

    try {
      const updatePayload = {
        ...formData,
        cognitoId: authUser.cognitoInfo.userId,
      };

      // Use your RTK Query mutation hook
      await updateProfile(updatePayload).unwrap();

      const newProfileState: BuyerProfile = {
        ...buyerData,
        ...formData,
        updatedAt: new Date().toISOString(),
      };

      setBuyerData(newProfileState);

      alert("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
      const message =
        error instanceof Error ? error.message : "An unknown error occurred.";
      alert(message);
    }
  };

  const handleCancelEdit = () => {
    if (buyerData) {
      setFormData({
        name: buyerData.name || "",
        phoneNumber: buyerData.phoneNumber || "",
      });
    }
    setIsEditing(false);
  };

  if (authLoading || isLoading) return <Loading />;

  if (isError || !buyerData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">
            Error Loading Profile
          </h2>
          <p className="text-gray-700">
            We couldn't fetch your profile. Please try refreshing the page or
            contact support.
          </p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="dashboard-container bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <Header
        title="My Profile"
        subtitle="Manage your buyer profile and personal information"
      />

      {/* The form tag wraps all editable content */}
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
        {/* --- Profile Header --- */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-100 to-green-100 h-32"></div>
          <div className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-16 mb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                  {/* Default avatar for buyers */}
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">
                      {buyerData.name?.charAt(0)?.toUpperCase() || "B"}
                    </span>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">
                  BUYER
                </div>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-6 flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {buyerData.name || "Buyer Name"}
                </h1>
                <p className="text-lg text-gray-600 font-medium">
                  Property Buyer
                </p>
                <p className="text-gray-500">{buyerData.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- Personal Information --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Personal Information
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              ) : (
                <p className="text-gray-900">
                  {buyerData.name || "Not provided"}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Email Address (Read-only)
              </label>
              <p className="text-gray-900 bg-gray-100 p-2 rounded-md">
                {buyerData.email || "Not provided"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              ) : (
                <p className="text-gray-900">
                  {buyerData.phoneNumber || "Not provided"}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Account Information
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Member Since
              </label>
              <p className="text-gray-900">
                {formatDate(buyerData.createdAt)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Last Updated
              </label>
              <p className="text-gray-900">
                {formatDate(buyerData.updatedAt)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Favorite Properties
              </label>
              <p className="text-gray-900">
                {buyerData.favorites?.length || 0} properties saved
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Properties Owned
              </label>
              <p className="text-gray-900">
                {buyerData.properties?.length || 0} properties
              </p>
            </div>
          </div>
        </div>

        {/* --- Quick Stats --- */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Activity Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {buyerData.favorites?.length || 0}
              </div>
              <div className="text-sm text-blue-700">Favorite Properties</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {buyerData.properties?.length || 0}
              </div>
              <div className="text-sm text-green-700">Properties Owned</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatDate(buyerData.createdAt)?.split(' ')[2] || 'N/A'}
              </div>
              <div className="text-sm text-purple-700">Year Joined</div>
            </div>
          </div>
        </div>

        {/* --- Action Buttons --- */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {isEditing ? (
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={isUpdating}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition disabled:bg-gray-400"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition flex items-center justify-center"
            >
              Edit Profile
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default BuyerProfile;