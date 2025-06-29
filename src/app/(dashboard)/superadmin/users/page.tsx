"use client";

import React, { useState, useMemo } from "react";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetAllUsersQuery,
  useUpdateUserStatusMutation,
} from "@/state/api";
import { Badge } from "@/components/ui/badge";
import { Eye, Check, X, ShieldCheck, Search } from "lucide-react";

// Interface for User data from the API
interface User {
  _id: string;
  cognitoId: string;
  name: string;
  email: string;
  role: "tenant" | "manager" | "landlord" | "buyer" | "superadmin";
  status?: "pending" | "approved" | "rejected";
  createdAt: string;
  [key: string]: any; // Allow other properties
}

// --- NEW --- Modal component to show detailed user information
const UserDetailsModal = ({
  user,
  isOpen,
  onClose,
}: {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white rounded-lg">
        <DialogHeader>
          <DialogTitle>User Details: {user.name}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-2 text-sm max-h-[70vh] overflow-y-auto pr-2">
          {Object.entries(user).map(([key, value]) => (
            <div key={key} className="grid grid-cols-3 gap-2 py-2 border-b">
              <span className="font-semibold capitalize text-gray-600 col-span-1">
                {key.replace(/([A-Z])/g, " $1")}
              </span>
              <span className="text-gray-800 col-span-2 break-words">
                {typeof value === "object" && value !== null
                  ? JSON.stringify(value, null, 2)
                  : String(value)}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- Main Page Component ---
const SuperadminUserManagement = () => {
  const {
    data: users = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAllUsersQuery();
  const [updateUserStatus, { isLoading: isUpdating }] =
    useUpdateUserStatusMutation();

  // --- NEW --- State for filtering and searching
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // --- NEW --- Memoized filtering logic
  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        // Search filter (name or email)
        if (searchQuery) {
          const lowerCaseQuery = searchQuery.toLowerCase();
          return (
            user.name.toLowerCase().includes(lowerCaseQuery) ||
            user.email.toLowerCase().includes(lowerCaseQuery)
          );
        }
        return true;
      })
      .filter((user) => {
        // Role filter
        if (roleFilter !== "all") {
          return user.role === roleFilter;
        }
        return true;
      })
      .filter((user) => {
        // Status filter
        if (statusFilter !== "all") {
          // Handle 'N/A' status (which is undefined)
          if (statusFilter === "na") {
            return !user.status;
          }
          return user.status === statusFilter;
        }
        return true;
      });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleUpdateStatus = async (
    cognitoId: string,
    role: string,
    status: "approved" | "rejected"
  ) => {
    if (!confirm(`Are you sure you want to set this user's status to ${status}?`))
      return;

    try {
      await updateUserStatus({ cognitoId, role, status }).unwrap();
      alert("User status updated successfully.");
      refetch();
    } catch (err: any) {
      alert(`Error: ${err.data?.message || err.message}`);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
  };

  if (isLoading) return <Loading />;
  if (isError)
    return (
      <div className="text-red-500 p-4">
        Error fetching users: {(error as any)?.data?.message}
      </div>
    );

  const getStatusBadgeVariant = (
    status?: "pending" | "approved" | "rejected"
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "approved": return "default";
      case "pending": return "secondary";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="dashboard-container">
      <Header
        title="User Management"
        subtitle="Approve, reject, and manage all users on the platform."
      />

      {/* --- NEW --- Filter and Search Controls */}
      <div className="flex flex-wrap gap-4 items-center mb-6 p-4 bg-white rounded-lg shadow-sm">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="landlord">Landlord</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="buyer">Buyer</SelectItem>
            <SelectItem value="tenant">Tenant</SelectItem>
            <SelectItem value="superadmin">Superadmin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="na">N/A</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(user.status)}>
                        {user.status || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedUser(user)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {(user.role === "landlord" || user.role === "manager") && (
                        <>
                          {user.status === "pending" && (
                            <>
                              <Button variant="ghost" size="icon" className="text-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => handleUpdateStatus(user.cognitoId, user.role, "approved")} disabled={isUpdating} title="Approve">
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => handleUpdateStatus(user.cognitoId, user.role, "rejected")} disabled={isUpdating} title="Reject">
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          
                          {(user.status === "rejected" || !user.status) && (
                            <Button variant="outline" size="sm" className="text-green-600 border-green-500 hover:bg-green-100 hover:text-green-700" onClick={() => handleUpdateStatus(user.cognitoId, user.role, "approved")} disabled={isUpdating} title="Verify User">
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Verify
                            </Button>
                          )}

                          {user.status === 'approved' && (
                              <Button variant="outline" size="sm" className="text-red-600 border-red-500 hover:bg-red-100 hover:text-red-700" onClick={() => handleUpdateStatus(user.cognitoId, user.role, "rejected")} disabled={isUpdating} title="Revoke Approval">
                                  <X className="mr-2 h-4 w-4"/>
                                  Revoke
                              </Button>
                          )}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No users match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <UserDetailsModal
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
};

export default SuperadminUserManagement;