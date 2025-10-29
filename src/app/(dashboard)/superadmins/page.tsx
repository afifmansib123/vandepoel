"use client";

import React, { useEffect, useState } from "react";
import { useGetAuthUserQuery } from "@/state/api";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface DashboardData {
  overview: {
    users: {
      total: number;
      buyers: number;
      tenants: number;
      landlords: number;
      managers: number;
      newUsers: {
        buyers: number;
        tenants: number;
        landlords: number;
        managers: number;
      };
    };
    properties: {
      total: number;
      forSale: number;
      sold: number;
      forRent: number;
      rented: number;
      tokenized: number;
    };
    financial: {
      totalPropertyValue: number;
      contractRevenue: number;
      tokenTransactionVolume: number;
      estimatedCommissions: {
        tokenTransactions: number;
        contracts: number;
        total: number;
      };
    };
    applications: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    };
    tokens: {
      total: number;
      completed: number;
      pending: number;
      totalVolume: number;
    };
    maintenance: {
      total: number;
      pending: number;
      inProgress: number;
      completed: number;
    };
  };
  recentActivity: {
    contracts: any[];
    applications: any[];
    tokenRequests: any[];
    maintenance: any[];
  };
  contactDirectory: {
    buyers: any[];
    tenants: any[];
    landlords: any[];
    managers: any[];
  };
}

const SuperAdminDashboard = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!authUser?.cognitoInfo?.userId) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/superadmin/dashboard?period=${period}`);
        const result = await response.json();

        if (result.success) {
          setDashboardData(result.data);
        } else {
          toast.error('Failed to load dashboard');
        }
      } catch (error) {
        console.error('Error fetching dashboard:', error);
        toast.error('Error loading dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    if (authUser?.userRole === 'superadmin') {
      fetchDashboard();
    } else if (authUser && authUser.userRole !== 'superadmin') {
      toast.error('Unauthorized access');
      setIsLoading(false);
    }
  }, [authUser, period]);

  if (isLoading) return <Loading />;

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-700">Failed to load dashboard data.</p>
        </div>
      </div>
    );
  }

  const { overview, recentActivity } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <Header
        title="Master Admin Dashboard"
        subtitle="Complete oversight of all platform operations"
      />

      {/* Period Selector */}
      <div className="mb-6 flex justify-end">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Financial Overview */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Financial Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow-lg text-white">
            <h3 className="text-sm font-semibold mb-2 opacity-90">Total Property Value</h3>
            <p className="text-3xl font-bold">${overview.financial.totalPropertyValue.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow-lg text-white">
            <h3 className="text-sm font-semibold mb-2 opacity-90">Token Transaction Volume</h3>
            <p className="text-3xl font-bold">${overview.financial.tokenTransactionVolume.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow-lg text-white">
            <h3 className="text-sm font-semibold mb-2 opacity-90">Annual Contract Revenue</h3>
            <p className="text-3xl font-bold">${overview.financial.contractRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-lg shadow-lg text-white">
            <h3 className="text-sm font-semibold mb-2 opacity-90">Estimated Commissions</h3>
            <p className="text-3xl font-bold">${overview.financial.estimatedCommissions.total.toLocaleString()}</p>
            <p className="text-xs mt-1 opacity-80">2.5% commission rate</p>
          </div>
        </div>
      </div>

      {/* Users Overview */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Users Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-gray-800">{overview.users.total}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Buyers</h3>
            <p className="text-3xl font-bold text-gray-800">{overview.users.buyers}</p>
            <p className="text-xs text-green-600 mt-1">+{overview.users.newUsers.buyers} new</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Tenants</h3>
            <p className="text-3xl font-bold text-gray-800">{overview.users.tenants}</p>
            <p className="text-xs text-purple-600 mt-1">+{overview.users.newUsers.tenants} new</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Landlords</h3>
            <p className="text-3xl font-bold text-gray-800">{overview.users.landlords}</p>
            <p className="text-xs text-yellow-600 mt-1">+{overview.users.newUsers.landlords} new</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Managers</h3>
            <p className="text-3xl font-bold text-gray-800">{overview.users.managers}</p>
            <p className="text-xs text-red-600 mt-1">+{overview.users.newUsers.managers} new</p>
          </div>
        </div>
      </div>

      {/* Properties Overview */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Properties Overview
          <Link href="/superadmins/properties" className="text-sm ml-4 text-blue-600 hover:underline">
            View All
          </Link>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total', value: overview.properties.total, color: 'blue' },
            { label: 'For Sale', value: overview.properties.forSale, color: 'green' },
            { label: 'Sold', value: overview.properties.sold, color: 'gray' },
            { label: 'For Rent', value: overview.properties.forRent, color: 'purple' },
            { label: 'Rented', value: overview.properties.rented, color: 'indigo' },
            { label: 'Tokenized', value: overview.properties.tokenized, color: 'yellow' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-4 rounded-lg shadow-md text-center">
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Metrics */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Activity Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Applications */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Applications</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total</span>
                <span className="font-bold">{overview.applications.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-600">Pending</span>
                <span className="font-bold text-yellow-600">{overview.applications.pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Approved</span>
                <span className="font-bold text-green-600">{overview.applications.approved}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">Rejected</span>
                <span className="font-bold text-red-600">{overview.applications.rejected}</span>
              </div>
            </div>
          </div>

          {/* Token Transactions */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Token Transactions
              <Link href="/superadmins/token-approvals" className="text-sm ml-2 text-blue-600 hover:underline">
                View
              </Link>
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Requests</span>
                <span className="font-bold">{overview.tokens.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-600">Pending</span>
                <span className="font-bold text-yellow-600">{overview.tokens.pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Completed</span>
                <span className="font-bold text-green-600">{overview.tokens.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">Volume</span>
                <span className="font-bold text-blue-600">${overview.tokens.totalVolume.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Maintenance */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Maintenance Requests
              <Link href="/superadmins/allmaintenence" className="text-sm ml-2 text-blue-600 hover:underline">
                View
              </Link>
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total</span>
                <span className="font-bold">{overview.maintenance.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-600">Pending</span>
                <span className="font-bold text-yellow-600">{overview.maintenance.pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">In Progress</span>
                <span className="font-bold text-blue-600">{overview.maintenance.inProgress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Completed</span>
                <span className="font-bold text-green-600">{overview.maintenance.completed}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Recent Activity</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Contracts */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Contracts</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentActivity.contracts.map((contract: any) => (
                <div key={contract._id} className="border-l-4 border-blue-500 pl-3 py-2">
                  <p className="font-medium text-gray-800">
                    {contract.propertyId?.name || 'Property'}
                  </p>
                  <p className="text-sm text-gray-600">
                    ${contract.monthlyRent}/month - {contract.status}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(contract.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Token Requests */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Token Requests</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentActivity.tokenRequests.map((request: any) => (
                <div key={request._id} className="border-l-4 border-green-500 pl-3 py-2">
                  <p className="font-medium text-gray-800">
                    {request.propertyId?.name || 'Property'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {request.tokensRequested} tokens - ${request.totalAmount}
                  </p>
                  <p className="text-xs text-gray-500">
                    {request.buyerName} - {request.status}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Applications */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Applications</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentActivity.applications.map((app: any) => (
                <div key={app._id} className="border-l-4 border-purple-500 pl-3 py-2">
                  <p className="font-medium text-gray-800">
                    {app.propertyId?.name || 'Property'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {app.applicationType} - {app.status}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Maintenance */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Maintenance</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentActivity.maintenance.map((req: any) => (
                <div key={req._id} className="border-l-4 border-red-500 pl-3 py-2">
                  <p className="font-medium text-gray-800">
                    {req.propertyId?.name || 'Property'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {req.category} - {req.urgency}
                  </p>
                  <p className="text-xs text-gray-500">
                    {req.status}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/superadmins/properties"
          className="bg-blue-500 text-white p-6 rounded-lg shadow-md hover:bg-blue-600 transition text-center"
        >
          <h3 className="font-bold text-lg">View All Properties</h3>
        </Link>
        <Link
          href="/superadmins/token-approvals"
          className="bg-green-500 text-white p-6 rounded-lg shadow-md hover:bg-green-600 transition text-center"
        >
          <h3 className="font-bold text-lg">Token Approvals</h3>
        </Link>
        <Link
          href="/superadmins/allmaintenence"
          className="bg-red-500 text-white p-6 rounded-lg shadow-md hover:bg-red-600 transition text-center"
        >
          <h3 className="font-bold text-lg">Maintenance</h3>
        </Link>
        <Link
          href="/superadmins/maintenance"
          className="bg-purple-500 text-white p-6 rounded-lg shadow-md hover:bg-purple-600 transition text-center"
        >
          <h3 className="font-bold text-lg">Providers</h3>
        </Link>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
