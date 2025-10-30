"use client";

import React, { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { useGetAuthUserQuery } from "@/state/api";
import Image from "next/image";
import { FileSignature, FileText, CheckCircle, Clock, XCircle, User, Calendar, Shield, Home, Upload, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// --- Type Definitions ---
interface PopulatedProperty {
  _id: string;
  name: string;
  photoUrls: string[];
}

interface Contract {
  _id: string;
  propertyId: PopulatedProperty;
  tenantId: string;
  managerId: string;
  duration: '6_months' | '1_year'; // Matches the model
  status: "draft" | "pending_signatures" | "active" | "expired" | "terminated";
  createdAt: string; // This will be our start date
  contractDocumentUrl?: string; // Initial contract PDF from landlord/manager
  signedContractDocumentUrl?: string; // Signed contract PDF from tenant
  tenantSigned: boolean;
}

// --- Helper Functions ---

/**
 * Formats the duration enum into a user-friendly string.
 * @param duration The duration enum from the contract model.
 * @returns A readable string like "6 Months" or "1 Year".
 */
const formatDuration = (duration: '6_months' | '1_year'): string => {
    if (duration === '6_months') return '6 Months';
    if (duration === '1_year') return '1 Year';
    return duration; // Fallback
};

/**
 * Calculates the end date of a contract based on its start date and duration.
 * @param createdAt The start date of the contract (from timestamps).
 * @param duration The duration enum from the contract model.
 * @returns A Date object representing the end date.
 */
const calculateEndDate = (createdAt: string, duration: '6_months' | '1_year'): Date => {
    const startDate = new Date(createdAt);
    if (duration === '6_months') {
        startDate.setMonth(startDate.getMonth() + 6);
    } else if (duration === '1_year') {
        startDate.setFullYear(startDate.getFullYear() + 1);
    }
    return startDate;
};


// --- Main Component for Tenant's Contracts ---
const TenantContractsPage = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const currentUserCognitoId = authUser?.cognitoInfo.userId;

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "pending_signatures" | "active" | "expired">("all");
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [contractToSign, setContractToSign] = useState<Contract | null>(null);

  useEffect(() => {
    if (currentUserCognitoId) {
      const fetchContracts = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/contracts?tenantId=${currentUserCognitoId}`);
          if (!response.ok) {
            throw new Error("Failed to fetch your contracts.");
          }
          const data = await response.json();
          setContracts((data.data || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (err) {
          setError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
          setIsLoading(false);
        }
      };
      fetchContracts();
    }
  }, [currentUserCognitoId]);

  const filteredContracts = useMemo(() => {
    if (filterStatus === "all") return contracts;
    return contracts.filter(contract => contract.status === filterStatus);
  }, [contracts, filterStatus]);

  const handleSignContract = (contract: Contract) => {
    setContractToSign(contract);
    setIsSignModalOpen(true);
  };

  const handleSignSuccess = () => {
    setIsSignModalOpen(false);
    setContractToSign(null);
    // Refetch contracts
    if (currentUserCognitoId) {
      const fetchContracts = async () => {
        try {
          const response = await fetch(`/api/contracts?tenantId=${currentUserCognitoId}`);
          if (!response.ok) throw new Error("Failed to fetch contracts");
          const data = await response.json();
          setContracts((data.data || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (err) {
          console.error(err);
        }
      };
      fetchContracts();
    }
  };

  const renderContent = () => {
    if (isLoading) return <Loading />;
    if (error) return <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
    if (contracts.length === 0) {
      return (
        <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md">
          <FileSignature className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-xl font-semibold text-gray-900">No Contracts Found</h3>
          <p className="mt-1 text-gray-500">When you sign a rental contract, it will appear here.</p>
        </div>
      );
    }
    if (filteredContracts.length === 0) {
        return (
            <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-xl font-semibold text-gray-900">No contracts in this category</h3>
                <p className="mt-1 text-gray-500">Try selecting a different filter.</p>
            </div>
        );
    }
    return (
      <div className="space-y-4">
        {filteredContracts.map(contract => (
          <ContractCard
            key={contract._id}
            contract={contract}
            onViewDetails={() => setSelectedContract(contract)}
            onSignContract={handleSignContract}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="dashboard-container bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <Header title="My Rental Contracts" subtitle="View and manage your rental agreements." />
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex flex-wrap gap-2">
            <FilterButton status="all" current={filterStatus} setCount={contracts.length} onClick={setFilterStatus} />
            <FilterButton status="draft" current={filterStatus} setCount={contracts.filter(c => c.status === 'draft').length} onClick={setFilterStatus} />
            <FilterButton status="pending_signatures" current={filterStatus} setCount={contracts.filter(c => c.status === 'pending_signatures').length} onClick={setFilterStatus} label="Pending" />
            <FilterButton status="active" current={filterStatus} setCount={contracts.filter(c => c.status === 'active').length} onClick={setFilterStatus} />
            <FilterButton status="expired" current={filterStatus} setCount={contracts.filter(c => c.status === 'expired').length} onClick={setFilterStatus} />
        </div>
        {renderContent()}
      </div>
      {selectedContract && (
        <ContractDetailsModal
          contract={selectedContract}
          onClose={() => setSelectedContract(null)}
        />
      )}
      {isSignModalOpen && contractToSign && (
        <SignContractModal
          contract={contractToSign}
          onClose={() => setIsSignModalOpen(false)}
          onSuccess={handleSignSuccess}
        />
      )}
    </div>
  );
};

// --- Sub-Components ---

const FilterButton = ({ status, current, setCount, onClick, label }: { status: string, current: string, setCount: number, onClick: (s: any) => void, label?: string }) => {
    const isActive = status === current;
    const baseClasses = "px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-2";
    const activeClasses = "bg-blue-600 text-white shadow";
    const inactiveClasses = "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200";
    const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
    return (
        <button onClick={() => onClick(status)} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
            {displayLabel}
            <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-blue-500' : 'bg-gray-200 text-gray-600'}`}>{setCount}</span>
        </button>
    )
};

const ContractCard = ({ contract, onViewDetails, onSignContract }: { contract: Contract; onViewDetails: () => void; onSignContract: (contract: Contract) => void }) => {
  const { propertyId, status, createdAt, duration, contractDocumentUrl, tenantSigned } = contract;
  
  const endDate = calculateEndDate(createdAt, duration);

  const getStatusInfo = (s: string) => {
    switch (s) {
      case "draft": return { icon: <FileText className="text-blue-500" />, text: "Awaiting Signature", color: "text-blue-700 bg-blue-100" };
      case "pending_signatures": return { icon: <Clock className="text-orange-500" />, text: "Pending", color: "text-orange-700 bg-orange-100" };
      case "active": return { icon: <CheckCircle className="text-green-500" />, text: "Active", color: "text-green-700 bg-green-100" };
      case "expired": return { icon: <Clock className="text-yellow-500" />, text: "Expired", color: "text-yellow-700 bg-yellow-100" };
      case "terminated": return { icon: <XCircle className="text-red-500" />, text: "Terminated", color: "text-red-700 bg-red-100" };
      default: return { icon: <Clock className="text-gray-500" />, text: "Unknown", color: "text-gray-700 bg-gray-100" };
    }
  };
  const statusInfo = getStatusInfo(status);

  const needsSignature = status === 'draft' && !tenantSigned && contractDocumentUrl;

  const router = useRouter()

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition hover:shadow-lg">
      <div className="p-5 flex flex-col md:flex-row gap-5 items-start">
        <Image src="/house.png" alt="property" width={160} height={120} className="w-full md:w-40 h-32 object-cover rounded-md border" />
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full inline-block mb-1">Rental Contract</span>
              <h3 className="text-lg font-bold text-gray-900">{propertyId.name}</h3>
            </div>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 ${statusInfo.color}`}>{statusInfo.icon}{statusInfo.text}</span>
          </div>
          <div className="border-t my-3"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-2"><User size={16} /><span>Tenant (You)</span></div>
            <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>Expires: {endDate.toLocaleDateString()}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Signed on: {new Date(createdAt).toLocaleDateString()}</p>
        </div>
        <div className="w-full md:w-auto flex flex-col gap-2 self-stretch justify-center">
          <button onClick={onViewDetails} className="w-full text-center px-4 py-2 text-sm font-medium bg-gray-700 text-white rounded-md hover:bg-gray-800 transition">View Details</button>
          {needsSignature && (
            <button
              onClick={() => onSignContract(contract)}
              className="w-full text-center px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <FileSignature size={16} />
              Sign Contract
            </button>
          )}
          {status === 'active' && (
            <button
              onClick={() => { router.push(`/tenants/properties/${propertyId}`); }}
              className="w-full text-center px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <Home size={16} />
              View Property
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ContractDetailsModal = ({ contract, onClose }: { contract: Contract; onClose: () => void }) => {
  // Calculate dates for the modal display
  const startDate = new Date(contract.createdAt);
  const endDate = calculateEndDate(contract.createdAt, contract.duration);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 sticky top-0 bg-white border-b z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Contract Details</h2>
              <p className="text-gray-500">For property: {contract.propertyId.name}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle size={24} /></button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Agreement Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <InfoItem label="Property Name" value={contract.propertyId.name} />
              <InfoItem label="Status" value={contract.status.charAt(0).toUpperCase() + contract.status.slice(1)} />
              <InfoItem label="Contract Duration" value={formatDuration(contract.duration)} />
              <InfoItem label="Lease Start Date (Signed)" value={startDate.toLocaleDateString()} />
              <InfoItem label="Lease End Date (Calculated)" value={endDate.toLocaleDateString()} />
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Parties Involved</h3>
            <div className="space-y-3">
              <InfoItem label="Tenant (Your ID)" value={contract.tenantId} icon={<User size={16} className="text-gray-500"/>} />
              <InfoItem label="Property Manager ID" value={contract.managerId} icon={<Shield size={16} className="text-gray-500"/>} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value, icon }: { label: string; value: string | undefined; icon?: React.ReactNode }) => (
    <div>
        <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">{icon}{label}</p>
        <p className="text-gray-800">{value || "Not provided"}</p>
    </div>
);

// Sign Contract Modal Component
const SignContractModal = ({
  contract,
  onClose,
  onSuccess,
}: {
  contract: Contract;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [signedPDF, setSignedPDF] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signedPDF) {
      setError('Please select a signed PDF file');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Upload the signed PDF
      const formData = new FormData();
      formData.append('file', signedPDF);
      formData.append('uploadType', 'signed');

      const uploadResponse = await fetch('/api/contracts/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok) {
        throw new Error(uploadResult.message || 'Failed to upload signed PDF');
      }

      // Update the contract with the signed PDF URL
      const updateResponse = await fetch(`/api/contracts/${contract._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sign_with_pdf',
          role: 'tenant',
          signedContractDocumentUrl: uploadResult.url,
        }),
      });

      const updateResult = await updateResponse.json();
      if (!updateResponse.ok) {
        throw new Error(updateResult.message || 'Failed to sign contract');
      }

      toast.success('Contract signed successfully! The landlord/manager will be notified.');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileSignature className="text-blue-600" />
              Sign Contract
            </h2>
            <p className="text-gray-500 mt-1">For property: {contract.propertyId.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* Download Original Contract */}
            {contract.contractDocumentUrl && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Download size={18} />
                  Step 1: Download Original Contract
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  Download the contract, review it carefully, sign it, and save as a PDF.
                </p>
                <a
                  href={contract.contractDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  <Download size={16} />
                  Download Contract PDF
                </a>
              </div>
            )}

            {/* Upload Signed Contract */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <Upload size={18} />
                Step 2: Upload Signed Contract
              </h3>
              <p className="text-sm text-green-700 mb-3">
                After signing the contract, upload the signed PDF file here.
              </p>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.type !== 'application/pdf') {
                      setError('Only PDF files are allowed');
                      e.target.value = '';
                      return;
                    }
                    if (file.size > 10 * 1024 * 1024) {
                      setError('File size must be less than 10MB');
                      e.target.value = '';
                      return;
                    }
                    setSignedPDF(file);
                    setError(null);
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
              {signedPDF && (
                <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                  <CheckCircle size={16} />
                  {signedPDF.name} selected
                </p>
              )}
            </div>

            {/* Important Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-1">Important Notice</h3>
              <p className="text-sm text-yellow-700">
                By uploading the signed contract, you agree to all terms and conditions stated in the document.
                The landlord/manager will review your signed contract and mark the property as rented.
              </p>
            </div>

            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
          </div>

          <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !signedPDF}
              className="px-6 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Clock className="animate-spin" size={16} />
                  Uploading...
                </>
              ) : (
                <>
                  <FileSignature size={16} />
                  Submit Signed Contract
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantContractsPage;