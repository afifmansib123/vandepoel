import { cleanParams, createNewUserInDatabase, withToast } from "@/lib/utils";
import {
  Application,
  Lease,
  Manager,
  // Landlord, // Assuming you'll import this from prismaTypes eventually, or use the hardcoded one below
  Payment,
  Property,
  Tenant,
  // User, // Assuming you'll import this or use the hardcoded one below
} from "@/types/prismaTypes";
import SellerProperty from "@/app/models/SellerProperty";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { FiltersState } from ".";

// --- START Hardcoded Types (as requested for now) ---
interface Landlord {
  id: string | number;
  cognitoId: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface Buyer {
  id: string | number;
  cognitoId: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface SuperAdmin {
  id: string | number;
  cognitoId: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface CognitoUserInfo {
  // Basic structure for Cognito user info
  userId: string;
  username: string;
  // You might have more attributes from getCurrentUser().signInDetails or .attributes
}

interface User {
  // The structure returned by getAuthUser
  cognitoInfo: CognitoUserInfo; // Or more specific type from Amplify like `AuthUser`
  userInfo: Tenant | Manager | Landlord | Buyer | SuperAdmin |{ [key: string]: any }; // Using the hardcoded types for now
  userRole: string;
  favorites?: Number[];
}

// --- START Admin Panel Types ---
interface AdminUser {
  _id: string;
  cognitoId: string;
  name: string;
  email: string;
  role: 'tenant' | 'manager' | 'landlord' | 'buyer';
  status?: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface MaintenanceProvider {
  _id: string;
  companyName: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  servicesOffered: string[];
  serviceArea?: string;
  website?: string;
  status: 'active' | 'inactive';
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface BankingService {
  _id: string;
  bankName: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  servicesOffered: string[];
  website?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// --- START Token Types ---
interface PropertyToken {
  _id: string;
  propertyId: string;
  tokenName: string;
  tokenSymbol: string;
  totalTokens: number;
  tokenPrice: number;
  tokensSold: number;
  tokensAvailable: number;
  minPurchase: number;
  maxPurchase?: number;
  propertyValue: number;
  expectedReturn: string;
  dividendFrequency: 'Monthly' | 'Quarterly' | 'Bi-annually' | 'Annually';
  offeringStartDate: string | Date;
  offeringEndDate: string | Date;
  status: 'draft' | 'active' | 'funded' | 'closed' | 'cancelled';
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  propertyType: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface TokenInvestment {
  _id: string;
  investorId: string;
  propertyId: string;
  tokenId: string;
  tokensOwned: number;
  purchasePrice: number;
  totalInvestment: number;
  ownershipPercentage: number;
  transactionId: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'success' | 'failed';
  totalDividendsEarned: number;
  lastDividendDate?: Date;
  status: 'active' | 'sold' | 'transferred';
  purchaseDate: Date;
  investorEmail?: string;
  investorPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface InvestorPortfolio {
  investments: TokenInvestment[];
  investmentsByProperty: any[];
  statistics: {
    totalInvested: number;
    totalDividends: number;
    currentValue: number;
    totalProperties: number;
    totalTokens: number;
    averageReturn: string;
  };
}

interface TokenPurchaseRequest {
  _id: string;
  requestId: number;
  tokenOfferingId: string | PropertyToken;
  propertyId: string | Property;
  // Buyer info
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  buyerAddress?: string;
  // Seller info
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  // Token details
  tokensRequested: number;
  pricePerToken: number;
  totalAmount: number;
  currency: 'EUR' | 'THB';
  // Request details
  message?: string;
  proposedPaymentMethod: string;
  investmentPurpose?: string;
  // Status
  status: 'pending' | 'approved' | 'rejected' | 'payment_pending' | 'payment_confirmed' | 'tokens_assigned' | 'completed' | 'cancelled';
  // Tracking
  approvedAt?: Date;
  approvedBy?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  rejectionReason?: string;
  paymentProof?: string;
  paymentSubmittedAt?: Date;
  paymentConfirmedAt?: Date;
  paymentConfirmedBy?: string;
  sellerPaymentInstructions?: string;
  tokensAssigned: number;
  tokensAssignedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: string;
  // Agreement
  agreementDocumentUrl?: string;
  agreementSignedByBuyer: boolean;
  agreementSignedBySeller: boolean;
  agreementSignedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface TokenListing {
  _id: string;
  // Seller Info
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  // References
  tokenInvestmentId: string;
  propertyId: string | Property;
  tokenOfferingId: string | PropertyToken;
  // Listing Details
  tokensForSale: number;
  pricePerToken: number;
  totalPrice: number;
  currency: 'EUR' | 'THB';
  // Property & Token Info
  propertyName?: string;
  tokenName: string;
  tokenSymbol: string;
  propertyType?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  // Status
  status: 'active' | 'sold' | 'cancelled' | 'expired';
  // Timestamps
  listedAt: Date;
  expiresAt?: Date;
  soldAt?: Date;
  cancelledAt?: Date;
  // Buyer Info (when sold)
  buyerId?: string;
  buyerName?: string;
  buyerEmail?: string;
  // Additional
  description?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface TokenMarketplaceItem {
  _id: string;
  type: 'official' | 'p2p';
  tokenName: string;
  tokenSymbol: string;
  tokenPrice: number;
  tokensAvailable: number;
  currency: string;
  riskLevel?: 'low' | 'medium' | 'high';
  propertyType?: string;
  description?: string;
  property: any;
  expectedReturn?: string;
  dividendFrequency?: string;
  propertyValue?: number;
  // P2P specific fields
  listingId?: string;
  sellerName?: string;
  sellerId?: string;
  listedAt?: Date;
  tags?: string[];
  // Official specific fields
  totalTokens?: number;
  tokensSold?: number;
  minPurchase?: number;
  maxPurchase?: number;
  fundingProgress?: number;
  offeringStartDate?: Date;
  offeringEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
// --- END Token Types ---
// --- END Admin Panel Types ---
// --- END Hardcoded Types ---

export type AppTag =
  | "Managers"
  | "Tenants"
  | "Landlords"
  | "Buyers"
  | "Properties"
  | "PropertyDetails"
  | "Leases"
  | "Payments"
  | "Applications"
  | "AdminUsers"
  | "MaintenanceProviders"
  | "BankingServices"
  | "TokenOfferings"
  | "TokenInvestments"
  | "TokenPurchaseRequests"
  | "TokenListings"
  | "TokenMarketplace";

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    prepareHeaders: async (headers) => {
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken?.toString(); 
      if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
      }
      return headers;
    },
  }),
  reducerPath: "api",
  tagTypes: [
    // Ensure "Landlords" is actually in this array
    "Managers",
    "Tenants",
    "Landlords", // <<< --- FIX #1: Ensure "Landlords" is present
    "Buyers",
    "Properties",
    "PropertyDetails",
    "Leases",
    "Payments",
    "Applications",
    "AdminUsers",
    "MaintenanceProviders",
    "BankingServices",
    "TokenOfferings",
    "TokenInvestments",
    "TokenPurchaseRequests",
    "TokenListings",
    "TokenMarketplace",
    "Notifications",
  ] as AppTag[],
  endpoints: (build) => ({
    getAuthUser: build.query<User, void>({
      // Using the hardcoded User type
      queryFn: async (_, _queryApi, _extraoptions, fetchWithBQ) => {
        try {
          const session = await fetchAuthSession();
          const { idToken } = session.tokens ?? {};
          // Get the user object from Amplify. It has userId, username, etc.
          const amplifyUser = await getCurrentUser();
          const userRole = idToken?.payload["custom:role"] as string;

          let endpoint = "";
          if (userRole === "manager") {
            endpoint = `/managers/${amplifyUser.userId}`;
          } else if (userRole === "tenant") {
            endpoint = `/tenants/${amplifyUser.userId}`;
          } else if (userRole === "landlord") {
            endpoint = `/landlords/${amplifyUser.userId}`;
          } else if (userRole === "buyer") {
            endpoint = `/buyers/${amplifyUser.userId}`;
          }else if (userRole === "superadmin") {
            endpoint = `/superadmin/${amplifyUser.userId}`;
          } 
          else {
            return {
              error:
                "Unknown user role or role not supported for details fetching.",
            };
          }

          let userDetailsResponse = await fetchWithBQ(endpoint);

          if (
            userDetailsResponse.error &&
            userDetailsResponse.error.status === 404
          ) {
            userDetailsResponse = await createNewUserInDatabase(
              amplifyUser, // Pass the amplifyUser object
             idToken as any,
              userRole,
              fetchWithBQ
            );
          }

          // Construct the cognitoInfo part from the amplifyUser object
          const cognitoInfoForApp: CognitoUserInfo = {
            userId: amplifyUser.userId,
            username: amplifyUser.username,
            // Map other necessary cognito details if needed
          };

          return {
            data: {
              cognitoInfo: cognitoInfoForApp, // Use the constructed cognito info
              userInfo: userDetailsResponse.data as Tenant | Manager | Landlord | Buyer | SuperAdmin , // <<< --- FIX #2: Add Landlord
              userRole,
            },
          };
        } catch (error: any) {
          return { error: error.message || "Could not fetch user data" };
        }
      },
    }),

    // ... (rest of your existing endpoints: getProperties, getProperty, tenant endpoints, manager endpoints) ...

    // property related endpoints (no changes needed here based on last diff)
    getProperties: build.query<
      Property[],
      Partial<FiltersState> & { favoriteIds?: number[] }
    >({
      query: (filters) => {
        const params = cleanParams({
          location: filters.location,
          priceMin: filters.priceRange?.[0],
          priceMax: filters.priceRange?.[1],
          beds: filters.beds,
          baths: filters.baths,
          propertyType: filters.propertyType,
          squareFeetMin: filters.squareFeet?.[0],
          squareFeetMax: filters.squareFeet?.[1],
          amenities: filters.amenities?.join(","),
          availableFrom: filters.availableFrom,
          favoriteIds: filters.favoriteIds?.join(","),
          latitude: filters.coordinates?.[1],
          longitude: filters.coordinates?.[0],
        });

        return { url: "properties", params };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Properties" as AppTag, id })), // Using AppTag for consistency
              { type: "Properties" as AppTag, id: "LIST" },
            ]
          : [{ type: "Properties" as AppTag, id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch properties.",
        });
      },
    }),

    getProperty: build.query<Property, number>({
      query: (id) => `properties/${id}`,
      providesTags: (result, error, id) => [
        { type: "PropertyDetails" as AppTag, id },
      ], // Using AppTag
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to load property details.",
        });
      },
    }),

    // tenant related endpoints (no changes needed here based on last diff)
    getTenant: build.query<Tenant, string>({
      query: (cognitoId) => `tenants/${cognitoId}`,
      providesTags: (result) =>
        result ? [{ type: "Tenants" as AppTag, id: result.id }] : [], // Using AppTag
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to load tenant profile.",
        });
      },
    }),

    getBuyer: build.query<Buyer, string>({
      query: (cognitoId) => `buyers/${cognitoId}`,
      providesTags: (result) =>
        result ? [{ type: "Buyers" as AppTag, id: result.id }] : [], // Using AppTag
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to load tenant profile.",
        });
      },
    }),

    getCurrentResidences: build.query<Property[], string>({
      query: (cognitoId) => `tenants/${cognitoId}/current-residences`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Properties" as AppTag, id })),
              { type: "Properties" as AppTag, id: "LIST" },
            ]
          : [{ type: "Properties" as AppTag, id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch current residences.",
        });
      },
    }),

    getCurrentResidencesbuyer: build.query<Property[], string>({
      query: (cognitoId) => `buyers/${cognitoId}/current-residences`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Properties" as AppTag, id })),
              { type: "Properties" as AppTag, id: "LIST" },
            ]
          : [{ type: "Properties" as AppTag, id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch current residences.",
        });
      },
    }),

    updateTenantSettings: build.mutation<
      Tenant,
      { cognitoId: string } & Partial<Tenant>
    >({
      query: ({ cognitoId, ...updatedTenant }) => ({
        url: `tenants/${cognitoId}`,
        method: "PUT",
        body: updatedTenant,
      }),
      invalidatesTags: (result) =>
        result ? [{ type: "Tenants" as AppTag, id: result.id }] : [], // Using AppTag
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Settings updated successfully!",
          error: "Failed to update settings.",
        });
      },
    }),

    updateBuyerSettings: build.mutation<
      Buyer,
      { cognitoId: string } & Partial<Buyer>
    >({
      query: ({ cognitoId, ...updatedBuyer }) => ({
        url: `buyers/${cognitoId}`,
        method: "PUT",
        body: updatedBuyer,
      }),
      invalidatesTags: (result) =>
        result ? [{ type: "Buyers" as AppTag, id: result.id }] : [], // Using AppTag
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Settings updated successfully!",
          error: "Failed to update settings.",
        });
      },
    }),

    addFavoriteProperty: build.mutation<
      Tenant | Buyer, // The mutation can return either a Tenant or a Buyer object
      { cognitoId: string; propertyId: number; userRole: "tenant" | "buyer" } // Added userRole to args
    >({
      query: ({ cognitoId, propertyId, userRole }) => ({
        // Dynamically construct the URL based on userRole
        url: `${userRole}s/${cognitoId}/favorites/${propertyId}`, // e.g., "tenants/..." or "buyers/..."
        method: "POST",
      }),
      invalidatesTags: (result, error, { userRole }) => {
        // result is the Tenant or Buyer object returned by the API after adding the favorite
        // { userRole } is destructured from the arguments passed to the mutation
        if (result && result.id) {
          const userSpecificTagType =
            userRole === "tenant" ? "Tenants" : "Buyers";
          return [
            { type: userSpecificTagType as AppTag, id: result.id }, // Invalidate specific tenant or buyer cache
            { type: "Properties" as AppTag, id: "LIST" }, // May still be useful if favorite lists affect property list views
          ];
        }
        return [{ type: "Properties" as AppTag, id: "LIST" }]; // Fallback
      },
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Added to favorites!", // Unified success message
          error: "Failed to add to favorites",
        });
      },
    }),

    removeFavoriteProperty: build.mutation<
      Tenant | Buyer, // The mutation can return either a Tenant or a Buyer object
      { cognitoId: string; propertyId: number; userRole: "tenant" | "buyer" } // Added userRole to args
    >({
      query: ({ cognitoId, propertyId, userRole }) => ({
        // Dynamically construct the URL based on userRole
        url: `${userRole}s/${cognitoId}/favorites/${propertyId}`, // e.g., "tenants/..." or "buyers/..."
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { userRole }) => {
        if (result && result.id) {
          const userSpecificTagType =
            userRole === "tenant" ? "Tenants" : "Buyers";
          return [
            { type: userSpecificTagType as AppTag, id: result.id }, // Invalidate specific tenant or buyer cache
            { type: "Properties" as AppTag, id: "LIST" },
          ];
        }
        return [{ type: "Properties" as AppTag, id: "LIST" }]; // Fallback
      },
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Removed from favorites!", // Unified success message
          error: "Failed to remove from favorites.",
        });
      },
    }),
    // manager related endpoints (no changes needed here based on last diff)
    getManagerProperties: build.query<Property[], string>({
      query: (cognitoId) => `managers/${cognitoId}/properties`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Properties" as AppTag, id })),
              { type: "Properties" as AppTag, id: "LIST" },
            ]
          : [{ type: "Properties" as AppTag, id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to load manager profile.",
        });
      },
    }),

    updateManagerSettings: build.mutation<
      Manager,
      { cognitoId: string } & Partial<Manager>
    >({
      query: ({ cognitoId, ...updatedManager }) => ({
        url: `managers/${cognitoId}`,
        method: "PUT",
        body: updatedManager,
      }),
      invalidatesTags: (result) =>
        result ? [{ type: "Managers" as AppTag, id: result.id }] : [], // Using AppTag
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Settings updated successfully!",
          error: "Failed to update settings.",
        });
      },
    }),

    createProperty: build.mutation<Property, FormData>({
      query: (newProperty) => ({
        url: `properties`,
        method: "POST",
        body: newProperty,
      }),
      invalidatesTags: (result) => {
        const tags: AppTag[] = ["Properties" as AppTag]; // Initialize with base tag
        if (result?.manager?.id) {
          // Check if manager info is in result
          // This needs a type for result.manager.id, assuming string or number
          tags.push({
            type: "Managers" as AppTag,
            id: result.manager.id,
          } as any); // `as any` if id type mismatch, better to align types
        }
        // Add similar for landlord if result can contain landlord info
        // if (result?.landlord?.id) {
        //   tags.push({ type: "Landlords" as AppTag, id: result.landlord.id } as any);
        // }
        return tags;
      },
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Property created successfully!",
          error: "Failed to create property.",
        });
      },
    }),

    // lease related enpoints (no changes needed here based on last diff)
    getLeases: build.query<Lease[], void>({
      // Changed number to void as query() takes no arg
      query: () => "leases",
      providesTags: [{ type: "Leases" as AppTag, id: "LIST" }], // Provide a general list tag
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch leases.",
        });
      },
    }),

    getPropertyLeases: build.query<Lease[], number>({
      query: (propertyId) => `properties/${propertyId}/leases`,
      providesTags: (result, error, propertyId) =>
        result
          ? [
              ...result.map((lease) => ({
                type: "Leases" as AppTag,
                id: lease.id,
              })),
              { type: "Leases" as AppTag, id: "LIST" }, // Also invalidate/provide general list
            ]
          : [{ type: "Leases" as AppTag, id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch property leases.",
        });
      },
    }),

    getPayments: build.query<Payment[], number>({
      query: (leaseId) => `leases/${leaseId}/payments`,
      providesTags: (result, error, leaseId) =>
        result
          ? [
              ...result.map((payment) => ({
                type: "Payments" as AppTag,
                id: payment.id,
              })),
              { type: "Payments" as AppTag, id: "LIST" },
            ]
          : [{ type: "Payments" as AppTag, id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch payment info.",
        });
      },
    }),

    // application related endpoints (no changes needed here based on last diff)
    getApplications: build.query<
      Application[],
      { userId?: string; userType?: string }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.userId) {
          queryParams.append("userId", params.userId.toString());
        }
        if (params.userType) {
          queryParams.append("userType", params.userType);
        }

        return `applications?${queryParams.toString()}`;
      },
      providesTags: [{ type: "Applications" as AppTag, id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch applications.",
        });
      },
    }),

    updateApplicationStatus: build.mutation<
      Application & { lease?: Lease },
      { id: number; status: string }
    >({
      query: ({ id, status }) => ({
        url: `applications/${id}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: [
        { type: "Applications" as AppTag, id: "LIST" },
        { type: "Leases" as AppTag, id: "LIST" },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Application status updated successfully!",
          error: "Failed to update application settings.",
        });
      },
    }),

    createApplication: build.mutation<Application, Partial<Application>>({
      query: (body) => ({
        url: `applications`,
        method: "POST",
        body: body,
      }),
      invalidatesTags: [{ type: "Applications" as AppTag, id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Application created successfully!",
          error: "Failed to create applications.",
        });
      },
    }),

    // --- START Landlord and new manager Endpoints (already added from previous step) ---
    getLandlordProperties: build.query<Property[], void>({
      query: () => `seller-properties`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Properties" as AppTag, id })),
              { type: "Properties" as AppTag, id: "LIST" },
            ]
          : [{ type: "Properties" as AppTag, id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to load landlord properties.",
        });
      },
    }),

        getmanagerProperties: build.query<Property[], void>({
      query: () => `seller-properties`,

      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Properties" as AppTag, id })),
              { type: "Properties" as AppTag, id: "LIST" },
            ]
          : [{ type: "Properties" as AppTag, id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to load manager properties.",
        });
      },
    }),

    updateLandlordSettings: build.mutation<
      Landlord,
      { cognitoId: string } & Partial<Landlord>
    >({
      query: ({ cognitoId, ...updatedLandlord }) => ({
        url: `landlords/${cognitoId}`,
        method: "PUT",
        body: updatedLandlord,
      }),
      invalidatesTags: (result) =>
        result ? [{ type: "Landlords" as AppTag, id: result.id }] : [],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Landlord settings updated successfully!",
          error: "Failed to update landlord settings.",
        });
      },
    }),
        // --- START Admin Endpoints ---

    // Admin: User Management
    getAllUsers: build.query<AdminUser[], void>({
      query: () => `superadmin/resources?resource=users`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: "AdminUsers" as AppTag, id: _id })),
              { type: "AdminUsers" as AppTag, id: "LIST" },
            ]
          : [{ type: "AdminUsers" as AppTag, id: "LIST" }],
    }),

    updateUserStatus: build.mutation<void, { cognitoId: string; role: string; status: 'approved' | 'rejected' }>({
      query: ({ cognitoId, role, status }) => ({
        url: `${role}s/${cognitoId}`, // e.g., landlords/cognito-id-123
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: [{ type: "AdminUsers", id: "LIST" }],
       async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "User status updated!",
          error: "Failed to update user status.",
        });
      },
    }),

    // Admin: Property & Application Management (using existing endpoints, but could be specific)
    getAllPropertiesAdmin: build.query<typeof SellerProperty[], void>({
        query: () => `seller-properties`,
        providesTags: ["Properties"]
    }),
    getAllApplicationsAdmin: build.query<Application[], void>({
        query: () => `applications`,
        providesTags: ["Applications"]
    }),

    // Admin: Maintenance Providers
    getMaintenanceProviders: build.query<MaintenanceProvider[], void>({
        query: () => 'superadmin/resources?resource=maintenance',
        providesTags: ['MaintenanceProviders'],
    }),
    createMaintenanceProvider: build.mutation<MaintenanceProvider, Partial<MaintenanceProvider>>({
        query: (body) => ({
            url: 'superadmin/maintenance',
            method: 'POST',
            body,
        }),
        invalidatesTags: ['MaintenanceProviders'],
    }),
    updateMaintenanceProvider: build.mutation<MaintenanceProvider, Partial<MaintenanceProvider> & { _id: string }>({
        query: ({ _id, ...body }) => ({
            url: `superadmin/maintenance/${_id}`,
            method: 'PUT',
            body,
        }),
        invalidatesTags: (result, error, { _id }) => [{ type: 'MaintenanceProviders', id: _id }],
    }),
    deleteMaintenanceProvider: build.mutation<void, { id: string }>({
        query: ({ id }) => ({
            url: `superadmin/maintenance/${id}`,
            method: 'DELETE',
        }),
        invalidatesTags: ['MaintenanceProviders'],
    }),

    // Admin: Banking Services
    getBankingServices: build.query<BankingService[], void>({
        query: () => 'superadmin/banking',
        providesTags: ['BankingServices'],
    }),
    createBankingService: build.mutation<BankingService, Partial<BankingService>>({
        query: (body) => ({
            url: 'superadmin/banking',
            method: 'POST',
            body,
        }),
        invalidatesTags: ['BankingServices'],
    }),
    updateBankingService: build.mutation<BankingService, Partial<BankingService> & { _id: string }>({
        query: ({ _id, ...body }) => ({
            url: `superadmin/banking/${_id}`,
            method: 'PUT',
            body,
        }),
        invalidatesTags: (result, error, { _id }) => [{ type: 'BankingServices', id: _id }],
    }),
    deleteBankingService: build.mutation<void, { id: string }>({
        query: ({ id }) => ({
            url: `superadmin/banking/${id}`,
            method: 'DELETE',
        }),
        invalidatesTags: ['BankingServices'],
    }),

    // --- END Admin Endpoints ---

    // --- START Token Endpoints ---

    // Get all token offerings (marketplace)
    getTokenOfferings: build.query<{ success: boolean; data: PropertyToken[]; pagination: any }, { page?: number; limit?: number; propertyType?: string; riskLevel?: string }>({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.propertyType) queryParams.append('propertyType', params.propertyType);
        if (params.riskLevel) queryParams.append('riskLevel', params.riskLevel);
        return `tokens/offerings?${queryParams.toString()}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: "TokenOfferings" as AppTag, id: _id })),
              { type: "TokenOfferings" as AppTag, id: "LIST" },
            ]
          : [{ type: "TokenOfferings" as AppTag, id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch token offerings.",
        });
      },
    }),

    // Get specific token offering
    getTokenOffering: build.query<{ success: boolean; data: PropertyToken }, string>({
      query: (tokenId) => `tokens/offerings/${tokenId}`,
      providesTags: (result, error, tokenId) => [
        { type: "TokenOfferings" as AppTag, id: tokenId },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to load token offering details.",
        });
      },
    }),

    // Create token offering (landlords only)
    createTokenOffering: build.mutation<{ success: boolean; data: PropertyToken }, any>({
      query: (body) => ({
        url: 'tokens/offerings',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: "TokenOfferings" as AppTag, id: "LIST" },
        { type: "Properties" as AppTag, id: "LIST" },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Token offering created successfully!",
          error: "Failed to create token offering.",
        });
      },
    }),

    // Update token offering status (draft -> active, etc.)
    updateTokenOffering: build.mutation<{ success: boolean; data: PropertyToken }, { tokenId: string; status: string }>({
      query: ({ tokenId, status }) => ({
        url: `tokens/offerings/${tokenId}`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: (result, error, { tokenId }) => [
        { type: "TokenOfferings" as AppTag, id: tokenId },
        { type: "TokenOfferings" as AppTag, id: "LIST" },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Token offering updated!",
          error: "Failed to update token offering.",
        });
      },
    }),

    // Purchase tokens (buyers only)
    purchaseTokens: build.mutation<{ success: boolean; data: TokenInvestment }, any>({
      query: (body) => ({
        url: 'tokens/purchase',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { tokenId }) => [
        { type: "TokenOfferings" as AppTag, id: tokenId },
        { type: "TokenOfferings" as AppTag, id: "LIST" },
        { type: "TokenInvestments" as AppTag, id: "LIST" },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Tokens purchased successfully!",
          error: "Failed to purchase tokens.",
        });
      },
    }),

    // Get investor's portfolio
    getInvestorPortfolio: build.query<{ success: boolean; data: InvestorPortfolio }, string>({
      query: (investorId) => `tokens/my-portfolio?investorId=${investorId}`,
      providesTags: [{ type: "TokenInvestments" as AppTag, id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to load portfolio.",
        });
      },
    }),

    // --- START Token Purchase Request Endpoints ---

    // Get purchase requests (buyer or seller view)
    getTokenPurchaseRequests: build.query<{ success: boolean; data: TokenPurchaseRequest[]; pagination: any }, { page?: number; limit?: number; status?: string; role?: 'buyer' | 'seller' }>({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.status) queryParams.append('status', params.status);
        if (params.role) queryParams.append('role', params.role);
        return `tokens/purchase-requests?${queryParams.toString()}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: "TokenPurchaseRequests" as AppTag, id: _id })),
              { type: "TokenPurchaseRequests" as AppTag, id: "LIST" },
            ]
          : [{ type: "TokenPurchaseRequests" as AppTag, id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch purchase requests.",
        });
      },
    }),

    // Get specific purchase request
    getTokenPurchaseRequest: build.query<{ success: boolean; data: TokenPurchaseRequest }, string>({
      query: (requestId) => `tokens/purchase-requests/${requestId}`,
      providesTags: (result, error, requestId) => [
        { type: "TokenPurchaseRequests" as AppTag, id: requestId },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to load purchase request details.",
        });
      },
    }),

    // Submit purchase request
    submitTokenPurchaseRequest: build.mutation<{ success: boolean; data: TokenPurchaseRequest }, any>({
      query: (body) => ({
        url: 'tokens/purchase-requests',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: "TokenPurchaseRequests" as AppTag, id: "LIST" },
        { type: "TokenOfferings" as AppTag, id: "LIST" },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Purchase request submitted successfully!",
          error: "Failed to submit purchase request.",
        });
      },
    }),

    // Update purchase request (approve, reject, confirm payment, etc.)
    updateTokenPurchaseRequest: build.mutation<{ success: boolean; data: TokenPurchaseRequest }, { requestId: string; action: string; [key: string]: any }>({
      query: ({ requestId, ...body }) => ({
        url: `tokens/purchase-requests/${requestId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { requestId }) => [
        { type: "TokenPurchaseRequests" as AppTag, id: requestId },
        { type: "TokenPurchaseRequests" as AppTag, id: "LIST" },
        { type: "TokenOfferings" as AppTag, id: "LIST" },
        { type: "TokenInvestments" as AppTag, id: "LIST" },
      ],
      async onQueryStarted({ action }, { queryFulfilled }) {
        const successMessages: { [key: string]: string } = {
          approve: "Purchase request approved!",
          reject: "Purchase request rejected.",
          uploadPaymentProof: "Payment proof uploaded successfully!",
          confirmPayment: "Payment confirmed!",
          assignTokens: "Tokens assigned successfully!",
          complete: "Purchase request completed!",
          cancel: "Purchase request cancelled.",
        };

        await withToast(queryFulfilled, {
          success: successMessages[action] || "Request updated successfully!",
          error: "Failed to update purchase request.",
        });
      },
    }),

    // --- END Token Purchase Request Endpoints ---

    // --- START P2P Token Marketplace Endpoints ---

    // Get combined marketplace (official + P2P listings)
    getTokenMarketplace: build.query<{ success: boolean; data: TokenMarketplaceItem[]; pagination: any }, { page?: number; limit?: number; propertyType?: string; riskLevel?: string; source?: 'official' | 'p2p' | 'all'; sortBy?: 'newest' | 'price-low' | 'price-high' }>({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.propertyType) queryParams.append('propertyType', params.propertyType);
        if (params.riskLevel) queryParams.append('riskLevel', params.riskLevel);
        if (params.source) queryParams.append('source', params.source);
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        return `tokens/marketplace?${queryParams.toString()}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: "TokenMarketplace" as AppTag, id: _id })),
              { type: "TokenMarketplace" as AppTag, id: "LIST" },
            ]
          : [{ type: "TokenMarketplace" as AppTag, id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch token marketplace.",
        });
      },
    }),

    // Get token listings (for seller's management view)
    getTokenListings: build.query<{ success: boolean; data: TokenListing[]; pagination: any }, { myListings?: boolean; status?: string; page?: number; limit?: number }>({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.myListings) queryParams.append('myListings', 'true');
        if (params.status) queryParams.append('status', params.status);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        return `tokens/listings?${queryParams.toString()}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: "TokenListings" as AppTag, id: _id })),
              { type: "TokenListings" as AppTag, id: "LIST" },
            ]
          : [{ type: "TokenListings" as AppTag, id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch token listings.",
        });
      },
    }),

    // Get specific token listing
    getTokenListing: build.query<{ success: boolean; data: TokenListing }, string>({
      query: (listingId) => `tokens/listings/${listingId}`,
      providesTags: (result, error, listingId) => [
        { type: "TokenListings" as AppTag, id: listingId },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to load listing details.",
        });
      },
    }),

    // Create a P2P token listing
    createTokenListing: build.mutation<{ success: boolean; data: TokenListing }, any>({
      query: (body) => ({
        url: 'tokens/listings',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: "TokenListings" as AppTag, id: "LIST" },
        { type: "TokenMarketplace" as AppTag, id: "LIST" },
        { type: "TokenInvestments" as AppTag, id: "LIST" },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Token listing created successfully!",
          error: "Failed to create token listing.",
        });
      },
    }),

    // Update token listing (price, description)
    updateTokenListing: build.mutation<{ success: boolean; data: TokenListing }, { listingId: string; pricePerToken?: number; description?: string }>({
      query: ({ listingId, ...body }) => ({
        url: `tokens/listings/${listingId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { listingId }) => [
        { type: "TokenListings" as AppTag, id: listingId },
        { type: "TokenListings" as AppTag, id: "LIST" },
        { type: "TokenMarketplace" as AppTag, id: "LIST" },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Listing updated successfully!",
          error: "Failed to update listing.",
        });
      },
    }),

    // Cancel token listing
    cancelTokenListing: build.mutation<{ success: boolean; data: TokenListing }, string>({
      query: (listingId) => ({
        url: `tokens/listings/${listingId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, listingId) => [
        { type: "TokenListings" as AppTag, id: listingId },
        { type: "TokenListings" as AppTag, id: "LIST" },
        { type: "TokenMarketplace" as AppTag, id: "LIST" },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Listing cancelled successfully!",
          error: "Failed to cancel listing.",
        });
      },
    }),

    // Purchase tokens from P2P listing
    purchaseFromListing: build.mutation<{ success: boolean; data: any }, { listingId: string; tokensToPurchase?: number; paymentMethod?: string }>({
      query: ({ listingId, ...body }) => ({
        url: `tokens/listings/${listingId}/purchase`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { listingId }) => [
        { type: "TokenListings" as AppTag, id: listingId },
        { type: "TokenListings" as AppTag, id: "LIST" },
        { type: "TokenMarketplace" as AppTag, id: "LIST" },
        { type: "TokenInvestments" as AppTag, id: "LIST" },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Tokens purchased successfully!",
          error: "Failed to purchase tokens.",
        });
      },
    }),

    // --- END P2P Token Marketplace Endpoints ---

    // --- END Token Endpoints ---

    // --- Notification Endpoints ---

    getNotifications: build.query<
      {
        success: boolean;
        data: {
          notifications: Array<{
            _id: string;
            userId: string;
            type: string;
            title: string;
            message: string;
            relatedId?: string;
            relatedUrl?: string;
            isRead: boolean;
            priority: string;
            createdAt: string;
            updatedAt: string;
          }>;
          unreadCount: number;
          hasMore: boolean;
        };
      },
      { type?: string; isRead?: boolean; limit?: number; skip?: number } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.type) queryParams.append('type', params.type);
        if (params?.isRead !== undefined) queryParams.append('isRead', String(params.isRead));
        if (params?.limit) queryParams.append('limit', String(params.limit));
        if (params?.skip) queryParams.append('skip', String(params.skip));
        return `notifications?${queryParams.toString()}`;
      },
      providesTags: ['Notifications'],
    }),

    markNotificationAsRead: build.mutation<
      { success: boolean; data: any },
      string
    >({
      query: (notificationId) => ({
        url: `notifications/${notificationId}`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notifications'],
    }),

    deleteNotification: build.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (notificationId) => ({
        url: `notifications/${notificationId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notifications'],
    }),

    deleteAllReadNotifications: build.mutation<
      { success: boolean; data: { deletedCount: number } },
      void
    >({
      query: () => ({
        url: 'notifications',
        method: 'DELETE',
      }),
      invalidatesTags: ['Notifications'],
    }),

    // --- END Notification Endpoints ---
  }),
});

export const {
  useGetAuthUserQuery,
  useUpdateTenantSettingsMutation,
  useUpdateBuyerSettingsMutation,
  useUpdateManagerSettingsMutation,
  useUpdateLandlordSettingsMutation, // <<< --- FIX #3: Add this export
  useGetPropertiesQuery,
  useGetPropertyQuery,
  useGetCurrentResidencesQuery,
  useGetCurrentResidencesbuyerQuery,
  useGetManagerPropertiesQuery,
  useGetLandlordPropertiesQuery, // <<< --- FIX #3: Add this export
  useCreatePropertyMutation,
  useGetTenantQuery,
  useAddFavoritePropertyMutation,
  useRemoveFavoritePropertyMutation,
  useGetLeasesQuery,
  useGetPropertyLeasesQuery,
  useGetPaymentsQuery,
  useGetApplicationsQuery,
  useUpdateApplicationStatusMutation,
  useCreateApplicationMutation,
  useGetBuyerQuery,
  useGetmanagerPropertiesQuery,
  useGetAllUsersQuery,
  useUpdateUserStatusMutation,
  useGetAllPropertiesAdminQuery,
  useGetAllApplicationsAdminQuery,
  useGetMaintenanceProvidersQuery,
  useCreateMaintenanceProviderMutation,
  useUpdateMaintenanceProviderMutation,
  useDeleteMaintenanceProviderMutation,
  useGetBankingServicesQuery,
  useCreateBankingServiceMutation,
  useUpdateBankingServiceMutation,
  useDeleteBankingServiceMutation,
  // Token hooks
  useGetTokenOfferingsQuery,
  useGetTokenOfferingQuery,
  useCreateTokenOfferingMutation,
  useUpdateTokenOfferingMutation,
  usePurchaseTokensMutation,
  useGetInvestorPortfolioQuery,
  // Token purchase request hooks
  useGetTokenPurchaseRequestsQuery,
  useGetTokenPurchaseRequestQuery,
  useSubmitTokenPurchaseRequestMutation,
  useUpdateTokenPurchaseRequestMutation,
  // P2P Token marketplace hooks
  useGetTokenMarketplaceQuery,
  useGetTokenListingsQuery,
  useGetTokenListingQuery,
  useCreateTokenListingMutation,
  useUpdateTokenListingMutation,
  useCancelTokenListingMutation,
  usePurchaseFromListingMutation,
  // Notification hooks
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllReadNotificationsMutation,
} = api;
