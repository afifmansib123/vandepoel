"use client";

import SettingsForm from "@/components/SettingsForm";
import Loading from "@/components/Loading";
import {
  useGetAuthUserQuery,
  useUpdateLandlordSettingsMutation,
} from "@/state/api";
import React from "react";
import { toast } from "sonner";

const LandlordSettings = () => {
  const { data: authUser, isLoading, isError } = useGetAuthUserQuery();
  const [updateLandlord, { isLoading: isUpdating }] = useUpdateLandlordSettingsMutation();

  if (isLoading) return <Loading />;

  if (isError || !authUser || !authUser.userInfo || !authUser.cognitoInfo) {
    console.error("Error fetching user data or user data is incomplete.");
    return <>Error loading user data. Please try refreshing.</>;
  }

  const initialData = {
    name: authUser.userInfo.name || "",
    email: authUser.userInfo.email || "",
    phone: authUser.userInfo.phoneNumber || "",
  };

  const handleSubmit = async (data: typeof initialData) => {
    if (!authUser.cognitoInfo.userId) {
      console.error("Cannot update settings: User Cognito ID is missing.");
      toast.error("An error occurred. User ID is missing.");
      return;
    }

    try {
      await updateLandlord({
        cognitoId: authUser.cognitoInfo.userId,
        ...data,
      }).unwrap();

      toast.success("Settings updated successfully!");
    } catch (error) {
      console.error("Failed to update landlord settings:", error);
      toast.error("Failed to update settings. Please try again.");
    }
  };

  return (
    <SettingsForm
      initialData={initialData}
      onSubmit={handleSubmit}
      userType="landlord"
      isSubmitting={isUpdating}
    />
  );
};

export default LandlordSettings;