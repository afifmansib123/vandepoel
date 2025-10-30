"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetAuthUserQuery } from "@/state/api";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, FileText } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

const CreateContractPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: authUser } = useGetAuthUserQuery();

  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    propertyId: searchParams?.get('propertyId') || '',
    tenantId: searchParams?.get('tenantId') || '',
    landlordId: '',
    startDate: '',
    endDate: '',
    duration: '1_year' as '6_months' | '1_year' | 'custom',
    monthlyRent: '',
    securityDeposit: '',
    currency: 'EUR' as 'EUR' | 'THB' | 'USD',
    paymentDay: '1',
    terms: '',
    specialConditions: '',
    contractDocumentUrl: '',
  });

  useEffect(() => {
    // Fetch properties and approved tenants
    const fetchData = async () => {
      if (!authUser?.cognitoInfo?.userId) return;

      try {
        // Fetch manager's properties
        const propResponse = await fetch(`/api/seller-properties?managerId=${authUser.cognitoInfo.userId}`);
        if (propResponse.ok) {
          const propData = await propResponse.json();
          setProperties(propData.data || []);
        }

        // Fetch approved rental applications to get tenant list
        const appResponse = await fetch(`/api/applications?receiverId=${authUser.cognitoInfo.userId}&applicationType=RentRequest&status=approved`);
        if (appResponse.ok) {
          const appData = await appResponse.json();
          // Extract unique tenants
          const uniqueTenants = appData.data?.reduce((acc: any[], app: any) => {
            if (!acc.find(t => t.senderId === app.senderId)) {
              acc.push({
                senderId: app.senderId,
                senderName: app.senderName || 'Unknown Tenant',
                senderEmail: app.senderEmail,
              });
            }
            return acc;
          }, []) || [];
          setTenants(uniqueTenants);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [authUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          managerId: authUser?.cognitoInfo?.userId,
          monthlyRent: parseFloat(formData.monthlyRent),
          securityDeposit: parseFloat(formData.securityDeposit),
          paymentDay: parseInt(formData.paymentDay),
          status: formData.contractDocumentUrl ? 'pending_signatures' : 'draft',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create contract');
      }

      toast.success('Contract created successfully!');
      router.push('/managers/contracts');
    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error('Failed to create contract');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Here you would upload to S3 or your file storage
    // For now, we'll just set a placeholder URL
    toast.info('File upload would happen here. For demo, using placeholder.');
    setFormData(prev => ({ ...prev, contractDocumentUrl: `https://example.com/contracts/${file.name}` }));
  };

  return (
    <div className="dashboard-container bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <Header
        title="Create New Contract"
        subtitle="Create a rental contract for your tenant"
      />

      <Link
        href="/managers/contracts"
        className="inline-flex items-center mb-6 text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Contracts
      </Link>

      <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Property *
            </label>
            <select
              required
              value={formData.propertyId}
              onChange={(e) => setFormData(prev => ({ ...prev, propertyId: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a property</option>
              {properties.map(prop => (
                <option key={prop._id} value={prop._id}>
                  {prop.name} - {prop.location?.address || 'No address'}
                </option>
              ))}
            </select>
          </div>

          {/* Tenant Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tenant *
            </label>
            <select
              required
              value={formData.tenantId}
              onChange={(e) => setFormData(prev => ({ ...prev, tenantId: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a tenant</option>
              {tenants.map(tenant => (
                <option key={tenant.senderId} value={tenant.senderId}>
                  {tenant.senderName} ({tenant.senderEmail})
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Financial Terms */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Monthly Rent *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.monthlyRent}
                onChange={(e) => setFormData(prev => ({ ...prev, monthlyRent: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Security Deposit *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.securityDeposit}
                onChange={(e) => setFormData(prev => ({ ...prev, securityDeposit: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Currency *
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value as any }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="EUR">EUR (€)</option>
                <option value="THB">THB (฿)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>

          {/* Terms */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contract Terms & Conditions *
            </label>
            <textarea
              required
              rows={6}
              value={formData.terms}
              onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
              placeholder="Enter the main terms and conditions of the rental agreement..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Special Conditions */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Special Conditions (Optional)
            </label>
            <textarea
              rows={3}
              value={formData.specialConditions}
              onChange={(e) => setFormData(prev => ({ ...prev, specialConditions: e.target.value }))}
              placeholder="Any special clauses or conditions..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Contract Document Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Upload Contract Document (PDF)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-3">
                Upload a PDF contract document
              </p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="contract-upload"
              />
              <label
                htmlFor="contract-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FileText className="w-4 h-4 mr-2" />
                Choose File
              </label>
              {formData.contractDocumentUrl && (
                <p className="text-sm text-green-600 mt-3">
                  File uploaded successfully!
                </p>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/managers/contracts')}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Creating...' : 'Create Contract'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateContractPage;
