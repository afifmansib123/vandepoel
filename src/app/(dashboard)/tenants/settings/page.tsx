"use client";

import SettingsForm from "@/components/SettingsForm";
import Loading from "@/components/Loading";
import {
  useGetAuthUserQuery,
  useUpdateTenantSettingsMutation,
} from "@/state/api";
import React from "react";
import { toast } from "sonner";

const TenantSettings = () => {
  const { data: authUser, isLoading } = useGetAuthUserQuery();
  const [updateTenant, { isLoading: isUpdating }] = useUpdateTenantSettingsMutation();

  if (isLoading) return <Loading />;

  if (!authUser || !authUser.userInfo || !authUser.cognitoInfo) {
    return <>Error loading user data. Please try refreshing.</>;
  }

  const initialData = {
    name: authUser.userInfo.name || "",
    email: authUser.userInfo.email || "",
    phoneNumber: authUser.userInfo.phoneNumber || "",
  };

  const handleSubmit = async (data: typeof initialData) => {
    if (!authUser.cognitoInfo.userId) {
      toast.error("An error occurred. User ID is missing.");
      return;
    }

    try {
      await updateTenant({
        cognitoId: authUser.cognitoInfo.userId,
        ...data,
      }).unwrap();

      toast.success("Settings updated successfully!");
    } catch (error) {
      console.error("Failed to update tenant settings:", error);
      toast.error("Failed to update settings. Please try again.");
    }
  };

  return (
    <SettingsForm
      initialData={initialData}
      onSubmit={handleSubmit}
      userType="tenant"
      isSubmitting={isUpdating}
    />
  );
};

export default TenantSettings;
