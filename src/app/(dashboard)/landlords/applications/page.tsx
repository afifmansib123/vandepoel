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
} from "lucide-react";
import CreateContractModal from "@/components/CreateContractModal";

// --- Type Definitions (Updated) ---
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
  applicationType: string; // e.g., "ScheduleVisit", "RentalApplication"
  formData: {
    name: string;
    email: string;
    phone?: string;
    [key: string]: any; // Allows for other dynamic fields
  };
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

// --- Helper Function ---
const formatApplicationType = (type: string) => {
  if (!type) return "General Inquiry";
  // "ScheduleVisit" -> "Schedule Visit"
  return type.replace(/([A-Z])/g, " $1").trim();
};

// --- Main Component ---
const LandlordApplicationsPage = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const landlordCognitoId = authUser?.cognitoInfo.userId;

  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [isCreateContractModalOpen, setCreateContractModalOpen] =
    useState(false);
  const [contractInitialData, setContractInitialData] =
    useState<Application | null>(null);

  useEffect(() => {
    if (landlordCognitoId) {
      const fetchApplications = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(
            `/api/applications?receiverId=${landlordCognitoId}`
          );
          if (!response.ok) throw new Error("Failed to fetch applications");
          const data = await response.json();
          setApplications(data.data || []);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "An unknown error occurred"
          );
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchApplications();
    }
  }, [landlordCognitoId]);

  // in LandlordApplicationsPage.tsx

  const handleUpdateStatus = async (
    application: Application,
    newStatus: "approved" | "rejected"
  ) => {
    setApplications((prev) =>
      prev.map((app) =>
        app._id === application._id ? { ...app, status: newStatus } : app
      )
    );

    try {
      // Step 1: Update the application status (this remains the same)
      const appUpdateResponse = await fetch(
        `/api/applications/${application._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!appUpdateResponse.ok) {
        throw new Error(`Failed to update application status.`);
      }

      // --- NEW LOGIC: If an agent application is approved, assign them to the property ---
      if (
        application.applicationType === "AgentApplication" &&
        newStatus === "approved"
      ) {
        console.log(
          `Assigning manager ${application.senderId} to property ${application.propertyId.id}`
        );

        const propertyUpdateResponse = await fetch(
          `/api/seller-properties/${application.propertyId._id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ managedBy: application.senderId }), // senderId is the manager's cognitoId
          }
        );

        if (!propertyUpdateResponse.ok) {
          const errorResult = await propertyUpdateResponse.json();
          throw new Error(
            `CRITICAL: Application was approved, but failed to assign agent. Reason: ${
              errorResult.message || "Unknown error"
            }`
          );
        }

        toast.error(
          `Successfully approved application and assigned ${application.formData.name} as the new agent.`
        );
      }
      // --- END NEW LOGIC ---
    } catch (err) {
      console.error(err);
      toast.error(
        `Error: ${
          err instanceof Error
            ? err.message
            : "Could not complete the update process."
        }`
      );
      // Revert UI on failure by refetching all applications
      const originalApps = await fetch(
        `/api/applications?receiverId=${landlordCognitoId}`
      ).then((res) => res.json());
      setApplications(originalApps.data || []);
    }
  };

  const handleOpenCreateContract = (application: Application) => {
    setContractInitialData(application);
    setCreateContractModalOpen(true);
    setSelectedApplication(null);
  };

  const handleContractCreated = () => {
    toast.success("Contract created successfully!");
    setCreateContractModalOpen(false);
    setContractInitialData(null);
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
            No Applications Yet
          </h3>
          <p className="mt-1 text-gray-500">
            When someone applies, you&apos;ll see it here.
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
        title="Received Applications"
        subtitle="Review and manage applications for your properties."
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
          onClose={() => setSelectedApplication(null)}
          onUpdateStatus={handleUpdateStatus}
          onOpenCreateContract={handleOpenCreateContract}
        />
      )}
      {isCreateContractModalOpen && contractInitialData && (
        <CreateContractModal
          application={contractInitialData}
          managerId={landlordCognitoId!} // Use landlordCognitoId instead
          onClose={() => setCreateContractModalOpen(false)}
          onSuccess={handleContractCreated}
        />
      )}
    </div>
  );
};

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

// --- Sub-Components (Updated) ---

const ApplicationCard = ({
  application,
  onViewDetails,
  onUpdateStatus,
}: {
  application: Application;
  onViewDetails: () => void;
  onUpdateStatus: (
    application: Application,
    status: "approved" | "rejected"
  ) => void;
}) => {
  const { _id, propertyId, formData, status, createdAt, applicationType } =
    application;

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
              <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full inline-block mb-1">
                {formatApplicationType(applicationType)}
              </span>
              <h3 className="text-lg font-bold text-gray-900">
                {propertyId?.name || "Unknown Property"}
              </h3>
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
          {status === "pending" && (
            <>
              <button
                onClick={() => onUpdateStatus(application, "approved")}
                className="w-full text-center px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              >
                Approve
              </button>
              <button
                onClick={() => onUpdateStatus(application, "rejected")}
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

const ApplicationDetailsModal = ({
  application,
  onClose,
  onUpdateStatus,
  onOpenCreateContract,
}: {
  application: Application;
  onClose: () => void;
  // --- MODIFIED: Change the type from string to Application ---
  onUpdateStatus: (
    application: Application,
    status: "approved" | "rejected"
  ) => void;
  onOpenCreateContract: (application: Application) => void;
}) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sticky top-0 bg-white border-b z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {formatApplicationType(application.applicationType)} Details
              </h2>
              <p className="text-gray-500">
                For property: {application.propertyId.name}
              </p>
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
        {application.status === "pending" && (
          <div className="p-6 sticky bottom-0 bg-white border-t flex gap-4">
            {/* --- MODIFIED: Pass the whole 'application' object, not just its ID --- */}
            <button
              onClick={() => {
                onUpdateStatus(application, "approved");
                onClose();
              }}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition"
            >
              Approve Application
            </button>
            <button
              onClick={() => {
                onUpdateStatus(application, "rejected");
                onClose();
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition"
            >
              Reject Application
            </button>
          </div>
        )}
        {application.status === "approved" && (
          <button
            onClick={() => onOpenCreateContract(application)}
            className="flex-1 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-10 mb-5 rounded-lg transition"
          >
            Create Contract
          </button>
        )}
      </div>
    </div>
  );
};

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

export default LandlordApplicationsPage;
