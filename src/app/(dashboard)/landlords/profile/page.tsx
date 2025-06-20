"use client";

import Header from "@/components/Header";
import Loading from "@/components/Loading";
import {
  useGetAuthUserQuery,
  useUpdateLandlordSettingsMutation, // RE-USED from your settings page
} from "@/state/api";
import React, { useState, useEffect } from "react";
import Image from "next/image";

// Interface for Landlord data structure
interface LandlordProfile {
  _id: string;
  cognitoId: string;
  name?: string;
  email?: string;
  companyName?: string;
  phoneNumber?: string; // Corrected to phoneNumber to match your model
  address?: string;
  description?: string;
  businessLicense?: string;
  profileImage?: string;
  status: "approved" | "pending" | "rejected";
  createdAt?: string;
  updatedAt?: string;
}

// Type for the form's state
type EditableLandlordProfile = Partial<
  Omit<
    LandlordProfile,
    "_id" | "cognitoId" | "email" | "createdAt" | "updatedAt" | "status"
  >
>;

const LandlordProfile = () => {
  const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery();

  // RE-USED: This mutation hook is from your LandlordSettings component.
  // We'll use it to update the full profile.
  const [updateProfile, { isLoading: isUpdating }] =
    useUpdateLandlordSettingsMutation();

  const [landlordData, setLandlordData] = useState<LandlordProfile | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Add this state hook inside the LandlordProfile component
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);

  // State for managing edit mode and form data
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<EditableLandlordProfile>({});

  // Data fetching logic is kept from your original code, but without dummy data.
  useEffect(() => {
    const fetchLandlordProfile = async () => {
      if (!authUser?.cognitoInfo.userId) return;

      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/landlords/${authUser.cognitoInfo.userId}`
        );

        if (!response.ok) {
          // If a 404 occurs, it might mean the profile isn't created.
          // You could handle this by showing a "Create Profile" view.
          // For now, we'll show a generic error.
          throw new Error("Failed to fetch landlord profile");
        }

        const data: LandlordProfile = await response.json();
        setLandlordData(data);

        // Pre-populate the form state with the fetched data
        setFormData({
          name: data.name || "",
          companyName: data.companyName || "",
          phoneNumber: data.phoneNumber || "",
          address: data.address || "",
          description: data.description || "",
          profileImage: data.profileImage || "",
          businessLicense: data.businessLicense || "",
        });
      } catch (error) {
        console.error("Error fetching landlord profile:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (authUser) {
      fetchLandlordProfile();
    }
  }, [authUser]); // Re-fetch if authUser changes

  // Handler for form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler for form submission

  // Add this helper function inside the LandlordProfile component
  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  // REPLACE your existing handleSubmit and handleCancelEdit functions with these

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!authUser?.cognitoInfo.userId || !landlordData) {
      alert("Error: Cannot update profile. User or profile data is missing.");
      return;
    }

    try {
      // Create a mutable copy of the form data to work with
      const finalFormData = { ...formData };

      // If a new file was selected, convert it to a Base64 string
      if (profileImageFile) {
        const base64ImageString = await toBase64(profileImageFile);
        finalFormData.profileImage = base64ImageString;
      }

      // Now, finalFormData.profileImage is a string (either the old URL or the new Base64 string)
      const updatePayload = {
        ...finalFormData,
        cognitoId: authUser.cognitoInfo.userId,
        status: "pending" as const,
      };

      // Your existing RTK Query hook works perfectly because we are sending pure JSON
      await updateProfile(updatePayload).unwrap();

      const newProfileState: LandlordProfile = {
        ...landlordData,
        ...finalFormData,
        status: "pending",
        updatedAt: new Date().toISOString(),
      };

      setLandlordData(newProfileState);
      setProfileImageFile(null); // Clear the selected file state

      alert(
        "Profile updated successfully! Your account is now pending re-approval."
      );
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
      const message =
        error instanceof Error ? error.message : "An unknown error occurred.";
      alert(message);
    }
  };

  const handleCancelEdit = () => {
    if (landlordData) {
      setFormData({
        name: landlordData.name || "",
        companyName: landlordData.companyName || "",
        phoneNumber: landlordData.phoneNumber || "",
        address: landlordData.address || "",
        description: landlordData.description || "",
        profileImage: landlordData.profileImage || "",
        businessLicense: landlordData.businessLicense || "",
      });
    }
    setProfileImageFile(null); // Also clear the selected file on cancel
    setIsEditing(false);
  };
  // Handler for cancelling the edit
  if (authLoading || isLoading) return <Loading />;

  if (isError || !landlordData) {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="dashboard-container bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <Header
        title="My Profile"
        subtitle="Manage your landlord profile and business information"
      />

      {/* The form tag wraps all editable content */}
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
        {/* --- Non-Editable Header --- */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-gray-100 to-purple-100 h-32"></div>
          <div className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-16 mb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
                  <Image
                    src={landlordData.profileImage || "/placeholder.jpg"}
                    alt="Profile"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  className={`absolute -bottom-2 -right-2 text-white text-xs px-2 py-1 rounded-full font-semibold ${getStatusBadge(
                    landlordData.status
                  )}`}
                >
                  {landlordData.status.toUpperCase()}
                </div>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-6 flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {landlordData.name || "Landlord Name"}
                </h1>
                <p className="text-lg text-gray-600 font-medium">
                  {landlordData.companyName || "Company Name Not Set"}
                </p>
                <p className="text-gray-500">{landlordData.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- Conditionally Rendered Form Fields --- */}
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
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              ) : (
                <p className="text-gray-900">
                  {landlordData.name || "Not provided"}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Email Address (Read-only)
              </label>
              <p className="text-gray-900 bg-gray-100 p-2 rounded-md">
                {landlordData.email || "Not provided"}
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
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              ) : (
                <p className="text-gray-900">
                  {landlordData.phoneNumber || "Not provided"}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Address
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              ) : (
                <p className="text-gray-900">
                  {landlordData.address || "Not provided"}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Business Information
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Company Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              ) : (
                <p className="text-gray-900">
                  {landlordData.companyName || "Not provided"}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Member Since
              </label>
              <p className="text-gray-900">
                {formatDate(landlordData.createdAt)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Last Updated
              </label>
              <p className="text-gray-900">
                {formatDate(landlordData.updatedAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            About Our Business
          </h2>
          {isEditing ? (
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={5}
              className="w-full p-2 border rounded-md"
            />
          ) : (
            <p className="text-gray-700 leading-relaxed">
              {landlordData.description || "No description provided."}
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Documents & Images
          </h2>
          {isEditing ? (
            <div className="space-y-6">
              {/* Profile Image Uploader */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Profile Image
                </label>
                <div className="flex items-center gap-4">
                  <Image
                    // Create a temporary local URL for previewing the selected file
                    src={
                      profileImageFile
                        ? URL.createObjectURL(profileImageFile)
                        : formData.profileImage || "/placeholder.jpg"
                    }
                    alt="Profile Preview"
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover bg-gray-200"
                  />
                  <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50">
                    <span>Change Picture</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={(e) =>
                        setProfileImageFile(
                          e.target.files ? e.target.files[0] : null
                        )
                      }
                    />
                  </label>
                  {profileImageFile && (
                    <span className="text-sm text-gray-600">
                      {profileImageFile.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Business License Input */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Business License URL
                </label>
                <input
                  type="text"
                  name="businessLicense"
                  value={formData.businessLicense}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="e.g., https://example.com/license.pdf"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-shrink-0">
                <Image
                  src={landlordData.businessLicense || "/lisence.jpg"}
                  alt="Business License"
                  width={300}
                  height={200}
                  className="w-64 h-40 border rounded-lg object-cover bg-gray-100"
                />
              </div>
              <p className="text-gray-700 mt-2 sm:mt-0">
                This is the currently uploaded business license.
              </p>
            </div>
          )}
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
                {isUpdating ? "Saving..." : "Save & Submit for Review"}
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

export default LandlordProfile;
