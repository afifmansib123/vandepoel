"use client";

import React, { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { useGetAuthUserQuery } from "@/state/api";
import Image from "next/image";
import { FileSignature, FileText, CheckCircle, Clock, XCircle, User, Calendar, Shield } from "lucide-react";

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
  managerId:string;
  duration: '6_months' | '1_year'; // Matches the model
  status: "active" | "expired" | "terminated";
  createdAt: string; // This will be our start date
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
        // Correctly adds 6 months to the date
        startDate.setMonth(startDate.getMonth() + 6);
    } else if (duration === '1_year') {
        // Correctly adds 1 year to the date
        startDate.setFullYear(startDate.getFullYear() + 1);
    }
    return startDate; // The date object is now the end date
};


// --- Main Component for Manager's Contracts ---
const ManagerContractsPage = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const currentUserCognitoId = authUser?.cognitoInfo.userId;

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "expired">("all");

  useEffect(() => {
    if (currentUserCognitoId) {
      const fetchContracts = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/contracts?managerId=${currentUserCognitoId}`);
          if (!response.ok) {
            throw new Error("Failed to fetch your managed contracts.");
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

  const renderContent = () => {
    if (isLoading) return <Loading />;
    if (error) return <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
    if (contracts.length === 0) {
      return (
        <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md">
          <FileSignature className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-xl font-semibold text-gray-900">No Contracts Created</h3>
          <p className="mt-1 text-gray-500">When you create a rental contract for a tenant, it will appear here.</p>
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
          />
        ))}
      </div>
    );
  };

  return (
    <div className="dashboard-container bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <Header title="Managed Contracts" subtitle="Oversee all rental agreements you have created." />
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex flex-wrap gap-2">
            <FilterButton status="all" current={filterStatus} setCount={contracts.length} onClick={setFilterStatus} />
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
    </div>
  );
};

// --- Sub-Components ---

const FilterButton = ({ status, current, setCount, onClick }: { status: string, current: string, setCount: number, onClick: (s: any) => void }) => {
    const isActive = status === current;
    const baseClasses = "px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-2";
    const activeClasses = "bg-blue-600 text-white shadow";
    const inactiveClasses = "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200";
    return (
        <button onClick={() => onClick(status)} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
            <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-blue-500' : 'bg-gray-200 text-gray-600'}`}>{setCount}</span>
        </button>
    )
};

const ContractCard = ({ contract, onViewDetails }: { contract: Contract; onViewDetails: () => void }) => {
  const { propertyId, status, createdAt, duration, tenantId } = contract;
  
  const endDate = calculateEndDate(createdAt, duration);

  const getStatusInfo = (s: string) => {
    switch (s) {
      case "active": return { icon: <CheckCircle className="text-green-500" />, text: "Active", color: "text-green-700 bg-green-100" };
      case "expired": return { icon: <Clock className="text-yellow-500" />, text: "Expired", color: "text-yellow-700 bg-yellow-100" };
      case "terminated": return { icon: <XCircle className="text-red-500" />, text: "Terminated", color: "text-red-700 bg-red-100" };
      default: return { icon: <Clock className="text-gray-500" />, text: "Unknown", color: "text-gray-700 bg-gray-100" };
    }
  };
  const statusInfo = getStatusInfo(status);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition hover:shadow-lg">
      <div className="p-5 flex flex-col md:flex-row gap-5 items-start">
        <Image src={propertyId.photoUrls?.[0] || "/placeholder-property.jpg"} alt={propertyId.name} width={160} height={120} className="w-full md:w-40 h-32 object-cover rounded-md border" />
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
            <div className="flex items-center gap-2" title={tenantId}>
                <User size={16} />
                <span>Tenant: ...{tenantId.slice(-8)}</span>
            </div>
            <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>Expires: {endDate.toLocaleDateString()}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Created on: {new Date(createdAt).toLocaleDateString()}</p>
        </div>
        <div className="w-full md:w-auto flex flex-col gap-2 self-stretch justify-center">
          <button onClick={onViewDetails} className="w-full text-center px-4 py-2 text-sm font-medium bg-gray-700 text-white rounded-md hover:bg-gray-800 transition">View Details</button>
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
              <InfoItem label="Lease Start Date (Created)" value={startDate.toLocaleDateString()} />
              <InfoItem label="Lease End Date (Calculated)" value={endDate.toLocaleDateString()} />
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Parties Involved</h3>
            <div className="space-y-3">
              <InfoItem label="Tenant (User ID)" value={contract.tenantId} icon={<User size={16} className="text-gray-500"/>} />
              <InfoItem label="Manager (Your ID)" value={contract.managerId} icon={<Shield size={16} className="text-gray-500"/>} />
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

export default ManagerContractsPage;