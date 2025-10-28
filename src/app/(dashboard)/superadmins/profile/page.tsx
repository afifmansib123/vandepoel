"use client";

import React, { useState, useMemo } from "react";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
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
// Enhanced UserDetailsModal component - replace the existing one
// Helper functions - add these before the UserDetailsModal component
const isUrl = (value: any): boolean => {
  if (typeof value !== 'string') return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const isBase64Image = (value: any): boolean => {
  if (typeof value !== 'string') return false;
  return value.startsWith('data:image/');
};

const truncateUrl = (url: string, maxLength: number = 40) => {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + '...';
};

// Complete UserDetailsModal component - replace the existing one entirely
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

  // Group fields for better organization
  const basicFields = ['name', 'email', 'role', 'status', 'createdAt', 'updatedAt'];
  const businessFields = ['companyName', 'businessAddress', 'cityName', 'postalCode', 'country', 'vatId', 'website'];
  const contactFields = ['phoneNumber', 'address'];
  const imageFields = ['profileImage', 'businessLicense'];
  const systemFields = ['_id', 'cognitoId', '__v', 'id'];

// Replace the renderFieldValue function with this fixed version:

const renderFieldValue = (field: string, value: any) => {
  if (!value) return 'Not provided';

  // Handle dates
  if (field === 'createdAt' || field === 'updatedAt') {
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // Handle website URLs
  if (field === 'website' && isUrl(value)) {
    return (
      <a 
        href={value} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-blue-600 hover:underline"
        title={value}
      >
        {truncateUrl(value)}
      </a>
    );
  }

  // Handle base64 images
  if (isBase64Image(value)) {
    return (
      <div className="flex items-center space-x-2">
        <img 
          src={value} 
          alt={field} 
          className="w-12 h-12 rounded object-cover border"
        />
        <span className="text-sm text-gray-500">Image uploaded</span>
      </div>
    );
  }

  // Handle regular URLs (like S3 image URLs)
  if (isUrl(value)) {
    // Check if it's likely an image URL
    if (value.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return (
        <div className="flex items-center space-x-2">
          <img 
            src={value} 
            alt={field} 
            className="w-12 h-12 rounded object-cover border"
            onError={(e) => {
              // If image fails to load, hide the image and show the link
              const img = e.currentTarget;
              const link = img.parentElement?.querySelector('a');
              if (img && link) {
                img.style.display = 'none';
                link.style.display = 'inline';
              }
            }}
          />
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 hover:underline text-sm hidden"
            title={value}
          >
            {truncateUrl(value)}
          </a>
        </div>
      );
    } else {
      // Non-image URL
      return (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 hover:underline"
          title={value}
        >
          {truncateUrl(value)}
        </a>
      );
    }
  }

  return String(value);
};

  const renderFieldGroup = (title: string, fields: string[]) => {
    const groupFields = fields.filter(field => user[field] !== undefined && user[field] !== null && user[field] !== '');
    
    if (groupFields.length === 0) return null;

    return (
      <div className="mb-4">
        <h3 className="font-semibold text-gray-700 mb-2 text-base">{title}</h3>
        <div className="space-y-2">
          {groupFields.map(field => (
            <div key={field} className="grid grid-cols-3 gap-2 py-1">
              <span className="font-medium text-gray-600 col-span-1 text-sm">
                {field.replace(/([A-Z])/g, " $1").replace(/^\w/, c => c.toUpperCase())}
              </span>
              <span className="text-gray-800 col-span-2 break-words text-sm">
                {renderFieldValue(field, user[field])}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Get any other fields not in the predefined groups
  const otherFields = Object.keys(user).filter(
    key => !basicFields.includes(key) && 
           !businessFields.includes(key) && 
           !contactFields.includes(key) && 
           !imageFields.includes(key) &&
           !systemFields.includes(key) &&
           user[key] !== undefined && 
           user[key] !== null && 
           user[key] !== ''
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">User Details: {user.name}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 max-h-[70vh] overflow-y-auto pr-2">
          {renderFieldGroup("Basic Information", basicFields)}
          {renderFieldGroup("Contact Information", contactFields)}
          {(user.role === 'manager' || user.role === 'landlord') && renderFieldGroup("Business Information", businessFields)}
          {renderFieldGroup("Documents & Images", imageFields)}
          
          {/* System fields - collapsed by default */}
          {systemFields.some(field => user[field] !== undefined) && (
            <details className="mb-4">
              <summary className="font-semibold text-gray-700 cursor-pointer text-base mb-2">
                System Information
              </summary>
              <div className="space-y-2 ml-4">
                {systemFields.filter(field => user[field] !== undefined).map(field => (
                  <div key={field} className="grid grid-cols-3 gap-2 py-1">
                    <span className="font-medium text-gray-600 col-span-1 text-sm">
                      {field.replace(/([A-Z])/g, " $1").replace(/^\w/, c => c.toUpperCase())}
                    </span>
                    <span className="text-gray-800 col-span-2 break-words text-sm font-mono">
                      {String(user[field])}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Any other fields */}
          {otherFields.length > 0 && renderFieldGroup("Other Information", otherFields)}
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
      toast.success("User status updated successfully!");
      refetch();
    } catch (err: any) {
      toast.error(`Error: ${err.data?.message || err.message}`);
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