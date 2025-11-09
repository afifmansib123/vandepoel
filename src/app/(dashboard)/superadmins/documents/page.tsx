"use client";

import React, { useState, useEffect } from "react";
import { useGetAuthUserQuery } from "@/state/api";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { toast } from "react-hot-toast";

const DocumentManagement = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const [isLoading, setIsLoading] = useState(false);
  const [termsFile, setTermsFile] = useState<File | null>(null);
  const [privacyFile, setPrivacyFile] = useState<File | null>(null);
  const [uploadingTerms, setUploadingTerms] = useState(false);
  const [uploadingPrivacy, setUploadingPrivacy] = useState(false);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "terms" | "privacy"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }
      if (type === "terms") {
        setTermsFile(file);
      } else {
        setPrivacyFile(file);
      }
    }
  };

  const handleUpload = async (type: "terms" | "privacy") => {
    const file = type === "terms" ? termsFile : privacyFile;
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    const setUploading = type === "terms" ? setUploadingTerms : setUploadingPrivacy;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await fetch("/api/superadmin/documents", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`${type === "terms" ? "Terms" : "Privacy"} document uploaded successfully!`);
        if (type === "terms") {
          setTermsFile(null);
        } else {
          setPrivacyFile(null);
        }
        // Reset file input
        const fileInput = document.getElementById(`${type}-file`) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        toast.error(result.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  if (!authUser || authUser.userRole !== "superadmin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">
            Unauthorized Access
          </h2>
          <p className="text-gray-700">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <Header
        title="Document Management"
        subtitle="Upload and manage legal documents (Terms & Privacy)"
      />

      <div className="max-w-4xl mx-auto mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Terms Document Upload */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Terms of Service
            </h2>
            <p className="text-gray-600 mb-6">
              Upload the Terms of Service PDF document. This will be available
              for download in the footer.
            </p>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="terms-file"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Select PDF File
                </label>
                <input
                  id="terms-file"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, "terms")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {termsFile && (
                <div className="text-sm text-gray-600">
                  Selected: {termsFile.name} ({(termsFile.size / 1024).toFixed(2)} KB)
                </div>
              )}

              <button
                onClick={() => handleUpload("terms")}
                disabled={!termsFile || uploadingTerms}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {uploadingTerms ? "Uploading..." : "Upload Terms Document"}
              </button>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <a
                  href="/documents/terms.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View Current Terms Document →
                </a>
              </div>
            </div>
          </div>

          {/* Privacy Document Upload */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h2>
            <p className="text-gray-600 mb-6">
              Upload the Privacy Policy PDF document. This will be available
              for download in the footer.
            </p>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="privacy-file"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Select PDF File
                </label>
                <input
                  id="privacy-file"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, "privacy")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {privacyFile && (
                <div className="text-sm text-gray-600">
                  Selected: {privacyFile.name} ({(privacyFile.size / 1024).toFixed(2)} KB)
                </div>
              )}

              <button
                onClick={() => handleUpload("privacy")}
                disabled={!privacyFile || uploadingPrivacy}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {uploadingPrivacy ? "Uploading..." : "Upload Privacy Document"}
              </button>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <a
                  href="/documents/privacy.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View Current Privacy Document →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Information Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            📄 Important Information
          </h3>
          <ul className="text-blue-800 text-sm space-y-2">
            <li>• Only PDF files are accepted</li>
            <li>• The uploaded documents will replace the existing ones</li>
            <li>• Documents will be immediately available for download in the footer</li>
            <li>• Make sure to review the documents before uploading</li>
            <li>• Keep backups of important documents</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DocumentManagement;
