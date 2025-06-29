"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import Loading from "@/components/Loading";

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
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/superadmin/resources?resource=users");
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  
  const handleUpdateStatus = async (cognitoId: string, role: string, status: 'approved' | 'rejected') => {
    if (!confirm(`Are you sure you want to set this user's status to ${status}?`)) return;
    if (role === 'tenant' || role === 'buyer' || role === 'superadmin') {
        alert("This user role does not require status approval.");
        return;
    }

    try {
        const response = await fetch(`/api/${role}s/${cognitoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        if (!response.ok) throw new Error('Failed to update status.');
        
        // Refetch users to get the latest state
        await fetchUsers();
        alert('User status updated successfully.');
    } catch (err: any) {
        alert(`Error: ${err.message}`);
    }
  };


  if (isLoading) return <Loading />;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

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
                    {(user.role === 'landlord' || user.role === 'manager') && user.status === 'pending' && (
                        <>
                            <button onClick={() => handleUpdateStatus(user.cognitoId, user.role, 'approved')} className="text-indigo-600 hover:text-indigo-900 mr-3">Approve</button>
                            <button onClick={() => handleUpdateStatus(user.cognitoId, user.role, 'rejected')} className="text-red-600 hover:text-red-900">Reject</button>
                        </>
                    )}
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