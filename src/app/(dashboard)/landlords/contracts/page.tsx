"use client";

import React, { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { useGetAuthUserQuery } from "@/state/api";
import Image from "next/image";
import { FileText, CheckCircle, Clock, XCircle, Download, User, Calendar } from "lucide-react";
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
  landlordId?: string;
  duration: '6_months' | '1_year' | 'custom';
  status: "draft" | "pending_signatures" | "active" | "expired" | "terminated";
  createdAt: string;
  contractDocumentUrl?: string;
  signedContractDocumentUrl?: string;
  tenantSigned: boolean;
  monthlyRent?: number;
  currency?: string;
}

// --- Helper Functions ---
const formatDuration = (duration: string): string => {
  if (duration === '6_months') return '6 Months';
  if (duration === '1_year') return '1 Year';
  if (duration === 'custom') return 'Custom Duration';
  return duration;
};

const calculateEndDate = (createdAt: string, duration: string): Date => {
  const startDate = new Date(createdAt);
  if (duration === '6_months') {
    startDate.setMonth(startDate.getMonth() + 6);
  } else if (duration === '1_year') {
    startDate.setFullYear(startDate.getFullYear() + 1);
  }
  return startDate;
};

// --- Main Component ---
const LandlordContractsPage = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const landlordCognitoId = authUser?.cognitoInfo.userId;

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "pending_signatures" | "active">("all");

  const fetchContracts = async () => {
    if (!landlordCognitoId) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/contracts?landlordId=${landlordCognitoId}`);
      if (!response.ok) throw new Error("Failed to fetch contracts");
      const data = await response.json();
      setContracts((data.data || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [landlordCognitoId]);

  const filteredContracts = useMemo(() => {
    if (filterStatus === "all") return contracts;
    return contracts.filter(contract => contract.status === filterStatus);
  }, [contracts, filterStatus]);

  const handleMarkAsRented = async (contract: Contract) => {
    if (!contract.tenantSigned) {
      toast.error('Tenant must sign the contract first');
      return;
    }

    const confirm = window.confirm(
      `Are you sure you want to mark this property as rented? This action will:\n\n` +
      `• Activate the contract\n` +
      `• Update property status to "Rented"\n` +
      `• Remove the property from marketplace\n` +
      `• Notify the tenant`
    );

    if (!confirm) return;

    try {
      const response = await fetch(`/api/contracts/${contract._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_as_rented',
          role: 'landlord',
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to mark property as rented');
      }

      toast.success('Property marked as rented successfully!');
      fetchContracts();
      setSelectedContract(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const renderContent = () => {
    if (isLoading) return <Loading />;
    if (error) return <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
    if (contracts.length === 0) {
      return (
        <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-xl font-semibold text-gray-900">No Contracts Found</h3>
          <p className="mt-1 text-gray-500">Rental contracts will appear here once you create them.</p>
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
            onMarkAsRented={() => handleMarkAsRented(contract)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="dashboard-container bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <Header title="Property Contracts" subtitle="Manage rental contracts for your properties." />
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex flex-wrap gap-2">
          <FilterButton status="all" current={filterStatus} setCount={contracts.length} onClick={setFilterStatus} />
          <FilterButton status="draft" current={filterStatus} setCount={contracts.filter(c => c.status === 'draft').length} onClick={setFilterStatus} />
          <FilterButton status="pending_signatures" current={filterStatus} setCount={contracts.filter(c => c.status === 'pending_signatures').length} onClick={setFilterStatus} label="Pending" />
          <FilterButton status="active" current={filterStatus} setCount={contracts.filter(c => c.status === 'active').length} onClick={setFilterStatus} />
        </div>
        {renderContent()}
      </div>
      {selectedContract && (
        <ContractDetailsModal
          contract={selectedContract}
          onClose={() => setSelectedContract(null)}
          onMarkAsRented={() => handleMarkAsRented(selectedContract)}
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
  );
};

const ContractCard = ({
  contract,
  onViewDetails,
  onMarkAsRented,
}: {
  contract: Contract;
  onViewDetails: () => void;
  onMarkAsRented: () => void;
}) => {
  const { propertyId, status, createdAt, duration, tenantSigned, signedContractDocumentUrl } = contract;
  const endDate = calculateEndDate(createdAt, duration);

  const getStatusInfo = (s: string) => {
    switch (s) {
      case "draft": return { icon: <FileText className="text-blue-500" />, text: "Awaiting Tenant", color: "text-blue-700 bg-blue-100" };
      case "pending_signatures": return { icon: <Clock className="text-orange-500" />, text: "Tenant Signed", color: "text-orange-700 bg-orange-100" };
      case "active": return { icon: <CheckCircle className="text-green-500" />, text: "Active", color: "text-green-700 bg-green-100" };
      case "expired": return { icon: <Clock className="text-yellow-500" />, text: "Expired", color: "text-yellow-700 bg-yellow-100" };
      case "terminated": return { icon: <XCircle className="text-red-500" />, text: "Terminated", color: "text-red-700 bg-red-100" };
      default: return { icon: <Clock className="text-gray-500" />, text: "Unknown", color: "text-gray-700 bg-gray-100" };
    }
  };
  const statusInfo = getStatusInfo(status);

  const canMarkAsRented = status === 'pending_signatures' && tenantSigned && signedContractDocumentUrl;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition hover:shadow-lg">
      <div className="p-5 flex flex-col md:flex-row gap-5 items-start">
        <Image
          src={propertyId?.photoUrls?.[0] || "/house.png"}
          alt={propertyId?.name || "Property"}
          width={160}
          height={120}
          className="w-full md:w-40 h-32 object-cover rounded-md border"
        />
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full inline-block mb-1">
                Rental Contract
              </span>
              <h3 className="text-lg font-bold text-gray-900">{propertyId?.name || "Unknown Property"}</h3>
            </div>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 ${statusInfo.color}`}>
              {statusInfo.icon}
              {statusInfo.text}
            </span>
          </div>
          <div className="border-t my-3"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User size={16} />
              <span>Tenant: {tenantSigned ? '✓ Signed' : 'Not Signed'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>Expires: {endDate.toLocaleDateString()}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Created: {new Date(createdAt).toLocaleDateString()}</p>
        </div>
        <div className="w-full md:w-auto flex flex-col gap-2 self-stretch justify-center">
          <button
            onClick={onViewDetails}
            className="w-full text-center px-4 py-2 text-sm font-medium bg-gray-700 text-white rounded-md hover:bg-gray-800 transition"
          >
            View Details
          </button>
          {canMarkAsRented && (
            <button
              onClick={onMarkAsRented}
              className="w-full text-center px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <CheckCircle size={16} />
              Mark as Rented
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ContractDetailsModal = ({
  contract,
  onClose,
  onMarkAsRented,
}: {
  contract: Contract;
  onClose: () => void;
  onMarkAsRented: () => void;
}) => {
  const startDate = new Date(contract.createdAt);
  const endDate = calculateEndDate(contract.createdAt, contract.duration);
  const canMarkAsRented = contract.status === 'pending_signatures' && contract.tenantSigned && contract.signedContractDocumentUrl;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 sticky top-0 bg-white border-b z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Contract Details</h2>
              <p className="text-gray-500">For property: {contract.propertyId.name}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Contract Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Contract Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <InfoItem label="Status" value={contract.status.charAt(0).toUpperCase() + contract.status.slice(1).replace('_', ' ')} />
              <InfoItem label="Duration" value={formatDuration(contract.duration)} />
              <InfoItem label="Start Date" value={startDate.toLocaleDateString()} />
              <InfoItem label="End Date" value={endDate.toLocaleDateString()} />
              {contract.monthlyRent && (
                <InfoItem label="Monthly Rent" value={`${contract.currency || 'EUR'} ${contract.monthlyRent}`} />
              )}
              <InfoItem
                label="Tenant Signature"
                value={contract.tenantSigned ? '✓ Signed' : '✗ Not Signed'}
              />
            </div>
          </div>

          {/* Documents */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Documents</h3>
            <div className="space-y-3">
              {contract.contractDocumentUrl && (
                <a
                  href={contract.contractDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition w-fit"
                >
                  <Download size={16} />
                  Download Original Contract
                </a>
              )}
              {contract.signedContractDocumentUrl && (
                <a
                  href={contract.signedContractDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition w-fit"
                >
                  <Download size={16} />
                  Download Signed Contract
                </a>
              )}
            </div>
          </div>

          {/* Actions */}
          {canMarkAsRented && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">Ready to Complete</h3>
              <p className="text-sm text-yellow-700 mb-4">
                The tenant has signed the contract. Review the signed document and mark the property as rented to activate the contract and update the property status.
              </p>
              <button
                onClick={() => {
                  onMarkAsRented();
                  onClose();
                }}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition font-semibold"
              >
                <CheckCircle size={18} />
                Mark Property as Rented
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }: { label: string; value: string | undefined }) => (
  <div>
    <p className="text-xs text-gray-500 font-medium">{label}</p>
    <p className="text-gray-800 font-medium">{value || "Not provided"}</p>
  </div>
);

export default LandlordContractsPage;
