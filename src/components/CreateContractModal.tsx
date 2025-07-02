"use client";

import React, { useState } from 'react';
import { XCircle, FileText, User, Home, Calendar } from 'lucide-react';

// A simple loading spinner component
const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// Updated interface to reflect that the object may contain more details
interface PopulatedProperty {
  _id: string; // The mongodb _id
  name: string;
  // This object likely contains more details (e.g., photoUrls, address)
  // all of which will now be sent with the contract.
  [key: string]: any;
}

interface Application {
  propertyId: PopulatedProperty;
  senderId: string;
  formData: {
    name: string;
    [key: string]: any;
  };
}

interface CreateContractModalProps {
  application: Application;
  managerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateContractModal: React.FC<CreateContractModalProps> = ({ application, managerId, onClose, onSuccess }) => {
  const [duration, setDuration] = useState<'6_months' | '1_year'>('1_year');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // --- MODIFICATION START ---
    // Instead of sending just the property's ID, we now send the entire property object.
    // The key is changed from 'propertyId' to 'property' to be more descriptive.
    // Your backend API at `POST /api/contracts` should be updated to expect this
    // 'property' object. From there, it can extract the `_id` for database references
    // and/or store the other details as a snapshot within the contract document.
    const contractData = {
      property: application.propertyId, // This now sends the full property object
      tenantId: application.senderId,
      managerId: managerId,
      duration: duration,
    };
    // --- MODIFICATION END ---

    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to create contract.');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><FileText size={22} /> Create New Contract</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle size={24} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            <div className="p-4 bg-gray-50 rounded-lg border space-y-1">
                <p className="text-xs font-semibold text-gray-500 flex items-center gap-2"><Home size={14} /> Property</p>
                <p className="text-lg text-gray-900 font-medium">{application.propertyId.name}</p>
            </div>
             <div className="p-4 bg-gray-50 rounded-lg border space-y-1">
                <p className="text-xs font-semibold text-gray-500 flex items-center gap-2"><User size={14} /> Tenant</p>
                <p className="text-lg text-gray-900 font-medium">{application.formData.name}</p>
            </div>
            
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Calendar size={16} /> Contract Duration
              </label>
              <select id="duration" value={duration} onChange={(e) => setDuration(e.target.value as '6_months' | '1_year')}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required>
                <option value="6_months">6 Months</option>
                <option value="1_year">1 Year</option>
              </select>
            </div>
            {error && <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm">{error}</div>}
          </div>
          <div className="p-5 bg-gray-50 border-t flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100">Cancel</button>
            <button type="submit" disabled={isLoading} className="px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center">
              {isLoading && <LoadingSpinner />}
              {isLoading ? 'Creating...' : 'Create Contract'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateContractModal;