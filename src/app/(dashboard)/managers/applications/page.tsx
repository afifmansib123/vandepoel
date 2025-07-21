"use client";

import React, { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { useGetAuthUserQuery } from "@/state/api";
import Image from "next/image";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  User,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
// --- BLOCK 1: ADD THIS IMPORT ---
import CreateContractModal from "@/components/CreateContractModal";

// --- Type Definitions are the same ---
interface PopulatedProperty {
  _id: string;
  id: string;
  name: string;
  photoUrls: string[];
}

interface Application {
  _id: string;
  propertyId: PopulatedProperty;
  senderId: string;
  receiverId: string;
  applicationType: string;
  formData: {
    name: string;
    email: string;
    phone?: string;
    [key: string]: any;
  };
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

// --- Helper Function is the same ---
const formatApplicationType = (type: string) => {
  if (!type) return "General Inquiry";
  return type.replace(/([A-Z])/g, " $1").trim();
};

// --- Main Component for the Manager ---
const ManagerApplicationsPage = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const managerCognitoId = authUser?.cognitoInfo.userId;

  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

  // --- BLOCK 2: ADD THIS CODE (STATE AND HANDLERS) ---
  const [isCreateContractModalOpen, setCreateContractModalOpen] =
    useState(false);
  const [contractInitialData, setContractInitialData] =
    useState<Application | null>(null);

  const handleOpenCreateContract = (application: Application) => {
    // This function is called when the "Create Contract" button is clicked.
    // It saves the application data and opens the new modal.
    setContractInitialData(application);
    setCreateContractModalOpen(true);
    setSelectedApplication(null); // Close the details modal for a better UX
  };

  const handleContractCreated = () => {
    // This function is called after the contract is successfully created via the API.
    alert("Contract created successfully!");
    setCreateContractModalOpen(false);
    setContractInitialData(null);
  };

  // --- MODIFIED: Fetch both incoming and outgoing applications ---
  // --- BLOCK 3: REPLACE YOUR ENTIRE useEffect WITH THIS ---
  useEffect(() => {
    if (managerCognitoId) {
      const fetchAllApplications = async () => {
        setIsLoading(true);
        setError(null);
        try {
          // 1. Fire off both fetch requests in parallel
          const responses = await Promise.all([
            fetch(`/api/applications?receiverId=${managerCognitoId}`),
            fetch(`/api/applications?senderId=${managerCognitoId}`),
          ]);

          // 2. Check if any response failed
          for (const res of responses) {
            if (!res.ok) {
              const errorBody = await res.json().catch(() => null);
              throw new Error(
                errorBody?.message || `Failed to fetch: ${res.statusText}`
              );
            }
          }

          // 3. Parse JSON bodies of all successful responses in parallel
          const [incomingData, outgoingData] = await Promise.all(
            responses.map((res) => res.json())
          );

          const combinedApplications = [
            ...(incomingData.data || []),
            ...(outgoingData.data || []),
          ];

          const uniqueApplications = Array.from(
            new Map(combinedApplications.map((app) => [app._id, app])).values()
          );

          setApplications(
            uniqueApplications.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
          );
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "An unknown error occurred"
          );
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchAllApplications();
    }
  }, [managerCognitoId]);

  // This function is for updating the status of INCOMING applications.
  // It will only be callable on cards where the manager is the receiver.
  const handleUpdateStatus = async (
    applicationId: string,
    newStatus: "approved" | "rejected"
  ) => {
    setApplications((prev) =>
      prev.map((app) =>
        app._id === applicationId ? { ...app, status: newStatus } : app
      )
    );

    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update application status.");
      }
      alert(`Application status successfully updated to ${newStatus}.`);
    } catch (err) {
      console.error(err);
      alert(
        `Error: ${
          err instanceof Error ? err.message : "Could not update status"
        }`
      );
      // Revert UI on failure
      const originalApps = await fetch(
        `/api/applications?receiverId=${managerCognitoId}`
      ).then((res) => res.json()); // Simple refetch on error
      setApplications(originalApps.data || []);
    }
  };

  const filteredApplications = useMemo(() => {
    if (filterStatus === "all") return applications;
    return applications.filter((app) => app.status === filterStatus);
  }, [applications, filterStatus]);

  const renderContent = () => {
    if (isLoading) return <Loading />;
    if (error)
      return (
        <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">
          {error}
        </div>
      );
    if (applications.length === 0)
      return (
        <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-xl font-semibold text-gray-900">
            No Applications Found
          </h3>
          <p className="mt-1 text-gray-500">
            You have no incoming or outgoing applications.
          </p>
        </div>
      );
    if (filteredApplications.length === 0)
      return (
        <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-xl font-semibold text-gray-900">
            No applications in this category
          </h3>
          <p className="mt-1 text-gray-500">
            Try selecting a different filter.
          </p>
        </div>
      );
    return (
      <div className="space-y-4">
        {filteredApplications.map((app) => (
          <ApplicationCard
            key={app._id}
            application={app}
            currentUserId={managerCognitoId!} // Pass current user ID
            onViewDetails={() => setSelectedApplication(app)}
            onUpdateStatus={handleUpdateStatus}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="dashboard-container bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <Header
        title="My Applications"
        subtitle="Review incoming requests and track your outgoing applications."
      />
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex flex-wrap gap-2">
          <FilterButton
            status="all"
            current={filterStatus}
            setCount={applications.length}
            onClick={setFilterStatus}
          />
          <FilterButton
            status="pending"
            current={filterStatus}
            setCount={applications.filter((a) => a.status === "pending").length}
            onClick={setFilterStatus}
          />
          <FilterButton
            status="approved"
            current={filterStatus}
            setCount={
              applications.filter((a) => a.status === "approved").length
            }
            onClick={setFilterStatus}
          />
          <FilterButton
            status="rejected"
            current={filterStatus}
            setCount={
              applications.filter((a) => a.status === "rejected").length
            }
            onClick={setFilterStatus}
          />
        </div>
        {renderContent()}
      </div>
      {selectedApplication && (
        <ApplicationDetailsModal
          application={selectedApplication}
          currentUserId={managerCognitoId!}
          onClose={() => setSelectedApplication(null)}
          onUpdateStatus={handleUpdateStatus}
          onOpenCreateContract={handleOpenCreateContract} // Add this line
        />
      )}

      {isCreateContractModalOpen && contractInitialData && (
        <CreateContractModal
          application={contractInitialData}
          managerId={managerCognitoId!}
          onClose={() => setCreateContractModalOpen(false)}
          onSuccess={handleContractCreated}
        />
      )}
    </div>
  );
};

// FilterButton remains the same
const FilterButton = ({
  status,
  current,
  setCount,
  onClick,
}: {
  status: "all" | "pending" | "approved" | "rejected";
  current: string;
  setCount: number;
  onClick: (s: any) => void;
}) => {
  const isActive = status === current;
  const baseClasses =
    "px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-2";
  const activeClasses = "bg-blue-600 text-white shadow";
  const inactiveClasses =
    "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200";
  return (
    <button
      onClick={() => onClick(status)}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
      <span
        className={`text-xs px-2 py-0.5 rounded-full ${
          isActive ? "bg-blue-500" : "bg-gray-200 text-gray-600"
        }`}
      >
        {setCount}
      </span>
    </button>
  );
};

// --- MODIFIED: ApplicationCard to distinguish between incoming/outgoing ---
const ApplicationCard = ({
  application,
  currentUserId,
  onViewDetails,
  onUpdateStatus,
}: {
  application: Application;
  currentUserId: string;
  onViewDetails: () => void;
  onUpdateStatus: (id: string, status: "approved" | "rejected") => void;
}) => {
  const {
    _id,
    propertyId,
    formData,
    status,
    createdAt,
    applicationType,
    receiverId,
  } = application;
  const isIncoming = receiverId === currentUserId;

  const getStatusInfo = (s: string) => {
    switch (s) {
      case "approved":
        return {
          icon: <CheckCircle className="text-green-500" />,
          text: "Approved",
          color: "text-green-700 bg-green-100",
        };
      case "rejected":
        return {
          icon: <XCircle className="text-red-500" />,
          text: "Rejected",
          color: "text-red-700 bg-red-100",
        };
      default:
        return {
          icon: <Clock className="text-yellow-500" />,
          text: "Pending",
          color: "text-yellow-700 bg-yellow-100",
        };
    }
  };
  const statusInfo = getStatusInfo(status);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition hover:shadow-lg">
      <div className="p-5 flex flex-col md:flex-row gap-5 items-start">
<Image
    src={propertyId?.photoUrls?.[0] || "/placeholder-property.jpg"}
    alt={propertyId?.name || "Property"}
    width={160}
    height={120}
    className="w-full md:w-40 h-32 object-cover rounded-md border"
/>
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                    isIncoming
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {isIncoming ? (
                    <ArrowLeft size={12} />
                  ) : (
                    <ArrowRight size={12} />
                  )}
                  {isIncoming ? "Incoming" : "Outgoing"}
                </span>
                <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full inline-block">
                  {formatApplicationType(applicationType)}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{propertyId?.name || "Unknown Property"}</h3>
            </div>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 ${statusInfo.color}`}
            >
              {statusInfo.icon}
              {statusInfo.text}
            </span>
          </div>
          <div className="border-t my-3"></div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User size={16} />
              <span>{formData.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={16} />
              <span>{formData.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={16} />
              <span>{formData.phone || "N/A"}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Received on: {new Date(createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="w-full md:w-auto flex flex-col gap-2 self-stretch justify-center">
          <button
            onClick={onViewDetails}
            className="w-full text-center px-4 py-2 text-sm font-medium bg-gray-700 text-white rounded-md hover:bg-gray-800 transition"
          >
            View Details
          </button>
          {/* Action buttons only show for PENDING and INCOMING applications */}
          {status === "pending" && isIncoming && (
            <>
              <button
                onClick={() => onUpdateStatus(_id, "approved")}
                className="w-full text-center px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              >
                Approve
              </button>
              <button
                onClick={() => onUpdateStatus(_id, "rejected")}
                className="w-full text-center px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// --- MODIFIED: ApplicationDetailsModal to also check if it's an incoming request ---
// --- BLOCK 4: REPLACE YOUR ENTIRE ApplicationDetailsModal WITH THIS ---
const ApplicationDetailsModal = ({
  application,
  currentUserId,
  onClose,
  onUpdateStatus,
  onOpenCreateContract,
}: {
  application: Application;
  currentUserId: string;
  onClose: () => void;
  onUpdateStatus: (id: string, status: "approved" | "rejected") => void;
  onOpenCreateContract: (application: Application) => void; // Prop for the new handler
}) => {
  const isIncoming = application.receiverId === currentUserId;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header and Body remain the same */}
        <div className="p-6 sticky top-0 bg-white border-b z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {formatApplicationType(application.applicationType)} Details
              </h2>
              <p className="text-gray-500">For property: {application.propertyId?.name || "Unknown Property"}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle size={24} />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">
              Applicant Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <InfoItem label="Full Name" value={application.formData.name} />
              <InfoItem
                label="Email Address"
                value={application.formData.email}
              />
              <InfoItem
                label="Phone Number"
                value={application.formData?.phone}
              />
              <InfoItem
                label="Application Date"
                value={new Date(application.createdAt).toLocaleString()}
              />
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">
              Submitted Information
            </h3>
            <div className="space-y-3">
              {Object.entries(application.formData)
                .filter(([key]) => !["name", "email", "phone"].includes(key))
                .map(([key, value]) => (
                  <InfoItem
                    key={key}
                    label={key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                    value={String(value)}
                  />
                ))}
            </div>
          </div>
        </div>

        {/* --- MODIFIED FOOTER SECTION --- */}
        <div className="p-6 sticky bottom-0 bg-white border-t flex flex-wrap justify-end gap-4">
          {/* Action buttons for PENDING applications */}
          {application.status === "pending" && isIncoming && (
            <>
              <button
                onClick={() => {
                  onUpdateStatus(application._id, "approved");
                  onClose();
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition"
              >
                Approve Application
              </button>
              <button
                onClick={() => {
                  onUpdateStatus(application._id, "rejected");
                  onClose();
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition"
              >
                Reject Application
              </button>
            </>
          )}

          {/* NEW BUTTON for APPROVED rent applications */}
          {application.status === "approved" &&
            isIncoming && (
              <button
                onClick={() => onOpenCreateContract(application)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                Create Contract 
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

// InfoItem remains the same
const InfoItem = ({
  label,
  value,
}: {
  label: string;
  value: string | undefined;
}) => (
  <div>
    <p className="text-xs text-gray-500 font-medium">{label}</p>
    <p className="text-gray-800">{value || "Not provided"}</p>
  </div>
);

export default ManagerApplicationsPage;
