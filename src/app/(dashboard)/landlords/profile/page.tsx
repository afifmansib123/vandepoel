"use client";

import Header from "@/components/Header";
import Loading from "@/components/Loading";
import {
  useGetAuthUserQuery,
  useUpdateLandlordSettingsMutation,
} from "@/state/api";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import TutorialModal from "@/components/TutorialModal";

// Interface for Landlord data structure
interface LandlordProfile {
  _id: string;
  cognitoId: string;
  name?: string;
  email?: string;
  companyName?: string;
  phoneNumber?: string;
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
  // Use the single source of truth for auth and profile data
  const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery();
  const [updateProfile, { isLoading: isUpdating }] =
    useUpdateLandlordSettingsMutation();

  // State for UI control
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<EditableLandlordProfile>({});
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [businessLicenseFile, setBusinessLicenseFile] = useState<File | null>(null);

  // Directly access the landlord's data from the auth hook result
  const landlordData = authUser?.userInfo as LandlordProfile | undefined;

  // (Replace 'buyer' with 'tenant', 'landlord', or 'manager' as appropriate)
const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);

useEffect(() => {
    if (authUser?.userRole === 'landlord') {
      try {
        const tutorialSeen = localStorage.getItem(`tutorial_seen_buyer`);
        if (!tutorialSeen) {
            setIsTutorialModalOpen(true);
        }
      } catch (error) {
        console.error("Could not access local storage:", error);
      }
    }
}, [authUser]);

  // These variables provide immediate visual feedback for selected images
  const displayedProfileImage = profileImageFile
    ? URL.createObjectURL(profileImageFile)
    : landlordData?.profileImage || "/placeholder.jpg";

  const displayedLicenseImage = businessLicenseFile
    ? URL.createObjectURL(businessLicenseFile)
    : landlordData?.businessLicense || "/lisence.jpg";

  // Populate form when data is loaded from the auth hook
  useEffect(() => {
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
  }, [landlordData]);

  // --- Handlers ---
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!authUser?.cognitoInfo.userId) return;

    try {
      const finalFormData = { ...formData };

      if (profileImageFile) {
        finalFormData.profileImage = await toBase64(profileImageFile);
      }
      if (businessLicenseFile) {
        finalFormData.businessLicense = await toBase64(businessLicenseFile);
      }

      const updatePayload = {
        ...finalFormData,
        cognitoId: authUser.cognitoInfo.userId,
        status: "pending" as const,
      };

      await updateProfile(updatePayload).unwrap();

      setProfileImageFile(null);
      setBusinessLicenseFile(null);
      setIsEditing(false);
      alert("Profile updated successfully! Your account is now pending re-approval.");
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("An error occurred while updating your profile.");
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
    setProfileImageFile(null);
    setBusinessLicenseFile(null);
    setIsEditing(false);
  };

  // --- Render Logic ---
  if (authLoading) return <Loading />;

  if (!landlordData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">Error Loading Profile</h2>
          <p className="text-gray-700">Could not find landlord information. Please try again.</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="dashboard-container bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <Header
        title="My Profile"
        subtitle="Manage your landlord profile and business information"
      />
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-gray-100 to-purple-100 h-32"></div>
          <div className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-16 mb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
                  <Image src={displayedProfileImage} alt="Profile" width={128} height={128} className="w-full h-full object-cover" />
                </div>
                <div className={`absolute -bottom-2 -right-2 text-xs px-2 py-1 rounded-full font-semibold ${getStatusBadge(landlordData.status)}`}>
                  {landlordData.status.toUpperCase()}
                </div>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-6 flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{landlordData.name || "Landlord Name"}</h1>
                <p className="text-lg text-gray-600 font-medium">{landlordData.companyName || "Company Name Not Set"}</p>
                <p className="text-gray-500">{landlordData.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
              {isEditing ? <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full p-2 border rounded-md" /> : <p className="text-gray-900">{landlordData.name || "Not provided"}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email (Read-only)</label>
              <p className="text-gray-900 bg-gray-100 p-2 rounded-md">{landlordData.email || "Not provided"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
              {isEditing ? <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className="w-full p-2 border rounded-md" /> : <p className="text-gray-900">{landlordData.phoneNumber || "Not provided"}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
              {isEditing ? <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full p-2 border rounded-md" /> : <p className="text-gray-900">{landlordData.address || "Not provided"}</p>}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Business Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Company Name</label>
              {isEditing ? <input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} className="w-full p-2 border rounded-md" /> : <p className="text-gray-900">{landlordData.companyName || "Not provided"}</p>}
            </div>
            <div><label className="block text-sm font-medium text-gray-500 mb-1">Member Since</label><p className="text-gray-900">{formatDate(landlordData.createdAt)}</p></div>
            <div><label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label><p className="text-gray-900">{formatDate(landlordData.updatedAt)}</p></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">About Our Business</h2>
          {isEditing ? <textarea name="description" value={formData.description} onChange={handleInputChange} rows={5} className="w-full p-2 border rounded-md" /> : <p className="text-gray-700 leading-relaxed">{landlordData.description || "No description provided."}</p>}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Documents & Images</h2>
          {isEditing ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Profile Image</label>
                <div className="flex items-center gap-4">
                  <Image src={displayedProfileImage} alt="Profile Preview" width={64} height={64} className="w-16 h-16 rounded-full object-cover bg-gray-200" />
                  <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <span>Change Picture</span>
                    <input type="file" className="sr-only" accept="image/png, image/jpeg, image/webp" onChange={(e) => setProfileImageFile(e.target.files ? e.target.files[0] : null)} />
                  </label>
                  {profileImageFile && <span className="text-sm text-gray-600">{profileImageFile.name}</span>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Business License</label>
                <div className="flex items-center gap-4">
                  <Image src={displayedLicenseImage} alt="License Preview" width={96} height={64} className="w-24 h-16 rounded-lg object-cover bg-gray-200 border" />
                  <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <span>Change License</span>
                    <input type="file" className="sr-only" accept="image/png, image/jpeg, image/webp, application/pdf" onChange={(e) => setBusinessLicenseFile(e.target.files ? e.target.files[0] : null)} />
                  </label>
                  {businessLicenseFile && <span className="text-sm text-gray-600">{businessLicenseFile.name}</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-shrink-0">
                <Image src={landlordData.businessLicense || "/lisence.jpg"} alt="Business License" width={300} height={200} className="w-64 h-40 border rounded-lg object-cover bg-gray-100" />
              </div>
              <p className="text-gray-700 mt-2 sm:mt-0">This is the currently uploaded business license.</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {isEditing ? (
            <div className="flex flex-col sm:flex-row gap-4">
              <button type="submit" disabled={isUpdating} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition disabled:bg-gray-400">{isUpdating ? "Saving..." : "Save & Submit for Review"}</button>
              <button type="button" onClick={handleCancelEdit} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition">Cancel</button>
            </div>
          ) : (
            <button type="button" onClick={() => setIsEditing(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition">Edit Profile</button>
          )}
        </div>
      </form>
      {authUser && (
    <TutorialModal 
        isOpen={isTutorialModalOpen}
        onClose={() => setIsTutorialModalOpen(false)}
        userRole={authUser.userRole}
    />
)}
    </div>
  );
};

export default LandlordProfile;