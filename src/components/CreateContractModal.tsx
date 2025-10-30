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
  const [duration, setDuration] = useState<'6_months' | '1_year' | 'custom'>('1_year');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [currency, setCurrency] = useState<'EUR' | 'THB' | 'USD'>('EUR');
  const [paymentDay, setPaymentDay] = useState('1');
  const [terms, setTerms] = useState('Standard rental agreement terms and conditions apply.');
  const [specialConditions, setSpecialConditions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Commission fields for managers
  const [managerCommissionRate, setManagerCommissionRate] = useState('');
  const [managerCommissionType, setManagerCommissionType] = useState<'percentage' | 'fixed_monthly' | 'fixed_total'>('percentage');
  const [managerCommissionNotes, setManagerCommissionNotes] = useState('');
  const [contractPDF, setContractPDF] = useState<File | null>(null);
  const [uploadingPDF, setUploadingPDF] = useState(false);

  // Auto-calculate end date based on duration
  React.useEffect(() => {
    if (startDate && duration !== 'custom') {
      const start = new Date(startDate);
      const end = new Date(start);
      if (duration === '6_months') {
        end.setMonth(end.getMonth() + 6);
      } else if (duration === '1_year') {
        end.setFullYear(end.getFullYear() + 1);
      }
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [startDate, duration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let contractDocumentUrl = '';

      // Upload PDF if provided
      if (contractPDF) {
        setUploadingPDF(true);
        const pdfFormData = new FormData();
        pdfFormData.append('file', contractPDF);
        pdfFormData.append('uploadType', 'initial');

        const uploadResponse = await fetch('/api/contracts/upload', {
          method: 'POST',
          body: pdfFormData,
        });

        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadResult.message || 'Failed to upload PDF');
        }

        contractDocumentUrl = uploadResult.url;
        setUploadingPDF(false);
      }

      const contractData: any = {
        property: application.propertyId,
        tenantId: application.senderId,
        managerId: managerId,
        duration: duration,
        startDate,
        endDate,
        monthlyRent: parseFloat(monthlyRent),
        securityDeposit: parseFloat(securityDeposit),
        currency,
        paymentDay: parseInt(paymentDay),
        terms,
        specialConditions: specialConditions || undefined,
        status: 'draft',
        contractDocumentUrl: contractDocumentUrl || undefined,
      };

      // Add commission data if provided
      if (managerCommissionRate) {
        const commissionRateNum = parseFloat(managerCommissionRate);
        contractData.managerCommissionType = managerCommissionType;

        if (managerCommissionType === 'percentage') {
          contractData.managerCommissionRate = commissionRateNum;
          // Calculate commission amount based on monthly rent
          contractData.managerCommissionAmount = (parseFloat(monthlyRent) * commissionRateNum) / 100;
        } else {
          contractData.managerCommissionAmount = commissionRateNum;
        }

        if (managerCommissionNotes) {
          contractData.managerCommissionNotes = managerCommissionNotes;
        }
      }

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
      setUploadingPDF(false);
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
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
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
              <select id="duration" value={duration} onChange={(e) => setDuration(e.target.value as '6_months' | '1_year' | 'custom')}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required>
                <option value="6_months">6 Months</option>
                <option value="1_year">1 Year</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={duration !== 'custom'} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="monthlyRent" className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent</label>
                <input type="number" id="monthlyRent" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)}
                  placeholder="1000" min="0" step="0.01"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required />
              </div>
              <div>
                <label htmlFor="securityDeposit" className="block text-sm font-medium text-gray-700 mb-1">Security Deposit</label>
                <input type="number" id="securityDeposit" value={securityDeposit} onChange={(e) => setSecurityDeposit(e.target.value)}
                  placeholder="2000" min="0" step="0.01"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value as 'EUR' | 'THB' | 'USD')}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required>
                  <option value="EUR">EUR (€)</option>
                  <option value="THB">THB (฿)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
              <div>
                <label htmlFor="paymentDay" className="block text-sm font-medium text-gray-700 mb-1">Payment Day</label>
                <input type="number" id="paymentDay" value={paymentDay} onChange={(e) => setPaymentDay(e.target.value)}
                  min="1" max="31" placeholder="1"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required />
              </div>
            </div>

            {/* Manager Commission Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-md font-semibold text-gray-800 mb-3">Manager Commission (Optional)</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="managerCommissionType" className="block text-sm font-medium text-gray-700 mb-1">
                    Commission Type
                  </label>
                  <select
                    id="managerCommissionType"
                    value={managerCommissionType}
                    onChange={(e) => setManagerCommissionType(e.target.value as 'percentage' | 'fixed_monthly' | 'fixed_total')}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_monthly">Fixed Monthly</option>
                    <option value="fixed_total">Fixed Total</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="managerCommissionRate" className="block text-sm font-medium text-gray-700 mb-1">
                    {managerCommissionType === 'percentage' ? 'Rate (%)' : 'Amount'}
                  </label>
                  <input
                    type="number"
                    id="managerCommissionRate"
                    value={managerCommissionRate}
                    onChange={(e) => setManagerCommissionRate(e.target.value)}
                    placeholder={managerCommissionType === 'percentage' ? '5.0' : '100'}
                    min="0"
                    max={managerCommissionType === 'percentage' ? '100' : undefined}
                    step="0.01"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label htmlFor="managerCommissionNotes" className="block text-sm font-medium text-gray-700 mb-1">
                  Commission Notes (Optional)
                </label>
                <textarea
                  id="managerCommissionNotes"
                  value={managerCommissionNotes}
                  onChange={(e) => setManagerCommissionNotes(e.target.value)}
                  rows={2}
                  placeholder="Additional notes about commission payment schedule..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="terms" className="block text-sm font-medium text-gray-700 mb-1">Contract Terms</label>
              <textarea id="terms" value={terms} onChange={(e) => setTerms(e.target.value)} rows={3}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required />
            </div>

            <div>
              <label htmlFor="specialConditions" className="block text-sm font-medium text-gray-700 mb-1">Special Conditions (Optional)</label>
              <textarea id="specialConditions" value={specialConditions} onChange={(e) => setSpecialConditions(e.target.value)} rows={2}
                placeholder="Any special conditions or clauses..."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
            </div>

            {/* Contract PDF Upload */}
            <div className="border-t pt-4 mt-4">
              <label htmlFor="contractPDF" className="block text-sm font-medium text-gray-700 mb-1">
                Upload Contract PDF (Required)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Upload the signed contract document that the tenant will review and sign.
              </p>
              <input
                type="file"
                id="contractPDF"
                accept="application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.type !== 'application/pdf') {
                      setError('Only PDF files are allowed');
                      e.target.value = '';
                      return;
                    }
                    if (file.size > 10 * 1024 * 1024) { // 10MB limit
                      setError('File size must be less than 10MB');
                      e.target.value = '';
                      return;
                    }
                    setContractPDF(file);
                    setError(null);
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
              {contractPDF && (
                <p className="text-sm text-green-600 mt-2">✓ {contractPDF.name} selected</p>
              )}
              {uploadingPDF && (
                <p className="text-sm text-blue-600 mt-2">Uploading PDF...</p>
              )}
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