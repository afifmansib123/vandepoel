"use client";

import React from "react";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { useGetAllUsersQuery, useUpdateUserStatusMutation } from "@/state/api"

interface User {
  _id: string;
  cognitoId: string;
  name: string;
  email: string;
  role: 'tenant' | 'manager' | 'landlord' | 'buyer' | 'superadmin';
  status?: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const SuperadminUserManagement = () => {
  // Special cognito ID that allows all operations
  const SPECIAL_COGNITO_ID = "c9aa65bc-8091-706f-b6fe-ed7238d07cd4";

  // Use RTK Query hooks instead of manual fetch
  const { data: users = [], isLoading, error, refetch } = useGetAllUsersQuery();
  const [updateUserStatus] = useUpdateUserStatusMutation();

  const handleUpdateStatus = async (cognitoId: string, role: string, status: 'approved' | 'rejected') => {
    if (!confirm(`Are you sure you want to set this user's status to ${status}?`)) return;
    
    // Allow all operations if cognitoId matches the special one
    if (cognitoId !== SPECIAL_COGNITO_ID && (role === 'tenant' || role === 'buyer' || role === 'superadmin')) {
        alert("This user role does not require status approval.");
        return;
    }

    try {
        await updateUserStatus({ cognitoId, role, status }).unwrap();
        // The mutation will automatically invalidate the cache and refetch data
        // No need to manually refetch
    } catch (err: any) {
        alert(`Error: ${err.message || 'Failed to update status'}`);
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <div className="text-red-500 p-4">Error: {error.toString()}</div>;

  return (
    <div className="dashboard-container">
      <Header
        title="User Management"
        subtitle="Approve, reject, and manage all users on the platform."
      />
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{user.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === 'approved' ? 'bg-green-100 text-green-800' :
                        user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        user.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                        {user.status || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {/* Show buttons for landlord/manager with pending status, OR for the special cognito ID */}
                    {((user.role === 'landlord' || user.role === 'manager') && user.status === 'pending') || 
                     user.cognitoId === SPECIAL_COGNITO_ID ? (
                        <>
                            <button onClick={() => handleUpdateStatus(user.cognitoId, user.role, 'approved')} className="text-indigo-600 hover:text-indigo-900 mr-3">Approve</button>
                            <button onClick={() => handleUpdateStatus(user.cognitoId, user.role, 'rejected')} className="text-red-600 hover:text-red-900">Reject</button>
                        </>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperadminUserManagement;