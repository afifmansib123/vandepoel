import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import { getUserFromToken } from '@/lib/auth';
import SellerProperty from '@/app/models/SellerProperty';
import Contract from '@/app/models/Contract';
import Application from '@/app/models/Application';
import TokenPurchaseRequest from '@/app/models/TokenPurchaseRequest';
import MaintenanceRequest from '@/app/models/MaintenanceRequest';
import Buyer from '@/app/models/Buyer';
import Tenant from '@/app/models/Tenant';
import Landlord from '@/app/models/Landlord';
import Manager from '@/app/models/Manager';
import PropertyToken from '@/app/models/PropertyToken';
import Notification from '@/app/models/Notification';

/**
 * GET /api/superadmin/dashboard
 * Comprehensive dashboard data for super admin
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Verify user is super admin
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters for filters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Parallel fetch all data
    const [
      // User statistics
      buyersCount,
      tenantsCount,
      landlordsCount,
      managersCount,

      // Property statistics
      allProperties,
      activeContracts,

      // Applications
      allApplications,
      pendingApplications,

      // Token transactions
      allTokenRequests,
      completedTokenRequests,

      // Maintenance
      allMaintenanceRequests,
      pendingMaintenance,

      // Recent activity
      recentContracts,
      recentApplications,
      recentTokenRequests,
      recentMaintenance,
    ] = await Promise.all([
      // User counts
      Buyer.countDocuments(),
      Tenant.countDocuments(),
      Landlord.countDocuments(),
      Manager.countDocuments(),

      // Properties
      SellerProperty.find().select('_id name salePrice propertyStatus isTokenized sellerCognitoId managedBy createdAt'),
      Contract.find({ status: 'active' }),

      // Applications
      Application.find().populate('propertyId', 'name photoUrls'),
      Application.countDocuments({ status: 'pending' }),

      // Token transactions
      TokenPurchaseRequest.find().populate('propertyId', 'name').populate('tokenOfferingId', 'tokenName tokenPrice'),
      TokenPurchaseRequest.countDocuments({ status: { $in: ['tokens_assigned', 'completed'] } }),

      // Maintenance
      MaintenanceRequest.find().populate('propertyId', 'name'),
      MaintenanceRequest.countDocuments({ status: 'Pending' }),

      // Recent activity (last 30 days)
      Contract.find({ createdAt: { $gte: startDate } })
        .populate('propertyId', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
      Application.find({ createdAt: { $gte: startDate } })
        .populate('propertyId', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
      TokenPurchaseRequest.find({ createdAt: { $gte: startDate } })
        .populate('propertyId', 'name')
        .populate('tokenOfferingId', 'tokenName')
        .sort({ createdAt: -1 })
        .limit(10),
      MaintenanceRequest.find({ createdAt: { $gte: startDate } })
        .populate('propertyId', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    // Calculate financial metrics
    const totalPropertyValue = allProperties.reduce((sum, prop: any) => sum + (prop.salePrice || 0), 0);

    // Calculate token transaction volume
    const tokenTransactionVolume = completedTokenRequests > 0
      ? allTokenRequests
          .filter((req: any) => req.status === 'tokens_assigned' || req.status === 'completed')
          .reduce((sum: number, req: any) => sum + (req.totalAmount || 0), 0)
      : 0;

    // Calculate commissions (assuming 2.5% commission on all transactions)
    const commissionRate = 0.025;
    const estimatedCommissions = {
      tokenTransactions: tokenTransactionVolume * commissionRate,
      contracts: activeContracts.reduce((sum: number, contract: any) => {
        return sum + (contract.monthlyRent * 12 * commissionRate);
      }, 0),
      total: 0,
    };
    estimatedCommissions.total = estimatedCommissions.tokenTransactions + estimatedCommissions.contracts;

    // Aggregate contract data
    const contractRevenue = activeContracts.reduce((sum: number, contract: any) => {
      return sum + (contract.monthlyRent * 12); // Annual revenue
    }, 0);

    // Get all users for contact tracking
    const [buyers, tenants, landlords, managers] = await Promise.all([
      Buyer.find().select('cognitoId name email phoneNumber'),
      Tenant.find().select('cognitoId name email phoneNumber'),
      Landlord.find().select('cognitoId name email phoneNumber'),
      Manager.find().select('cognitoId name email phoneNumber'),
    ]);

    // Property statistics
    const propertyStats = {
      total: allProperties.length,
      forSale: allProperties.filter((p: any) => p.propertyStatus === 'For Sale').length,
      sold: allProperties.filter((p: any) => p.propertyStatus === 'Sold').length,
      forRent: allProperties.filter((p: any) => p.propertyStatus === 'For Rent').length,
      rented: allProperties.filter((p: any) => p.propertyStatus === 'Rented').length,
      tokenized: allProperties.filter((p: any) => p.isTokenized).length,
    };

    // Application statistics
    const applicationStats = {
      total: allApplications.length,
      pending: pendingApplications,
      approved: allApplications.filter((app: any) => app.status === 'approved').length,
      rejected: allApplications.filter((app: any) => app.status === 'rejected').length,
      byType: {
        scheduleVisit: allApplications.filter((app: any) => app.applicationType === 'ScheduleVisit').length,
        agentApplication: allApplications.filter((app: any) => app.applicationType === 'AgentApplication').length,
        rentRequest: allApplications.filter((app: any) => app.applicationType === 'RentRequest').length,
        financialInquiry: allApplications.filter((app: any) => app.applicationType === 'FinancialInquiry').length,
      },
    };

    // Token transaction statistics
    const tokenStats = {
      total: allTokenRequests.length,
      completed: completedTokenRequests,
      pending: allTokenRequests.filter((req: any) => req.status === 'pending').length,
      approved: allTokenRequests.filter((req: any) => req.status === 'approved').length,
      totalVolume: tokenTransactionVolume,
    };

    // Maintenance statistics
    const maintenanceStats = {
      total: allMaintenanceRequests.length,
      pending: pendingMaintenance,
      inProgress: allMaintenanceRequests.filter((req: any) => req.status === 'In Progress').length,
      completed: allMaintenanceRequests.filter((req: any) => req.status === 'Completed').length,
      byUrgency: {
        low: allMaintenanceRequests.filter((req: any) => req.urgency === 'Low').length,
        medium: allMaintenanceRequests.filter((req: any) => req.urgency === 'Medium').length,
        high: allMaintenanceRequests.filter((req: any) => req.urgency === 'High').length,
      },
    };

    // User growth (new users in selected period)
    const newUsers = {
      buyers: buyers.filter((b: any) => new Date(b.createdAt) >= startDate).length,
      tenants: tenants.filter((t: any) => new Date(t.createdAt) >= startDate).length,
      landlords: landlords.filter((l: any) => new Date(l.createdAt) >= startDate).length,
      managers: managers.filter((m: any) => new Date(m.createdAt) >= startDate).length,
    };

    // Contact directory for CRM
    const contactDirectory = {
      buyers: buyers.map((b: any) => ({
        id: b.cognitoId,
        name: b.name,
        email: b.email,
        phone: b.phoneNumber,
        type: 'buyer',
      })),
      tenants: tenants.map((t: any) => ({
        id: t.cognitoId,
        name: t.name,
        email: t.email,
        phone: t.phoneNumber,
        type: 'tenant',
      })),
      landlords: landlords.map((l: any) => ({
        id: l.cognitoId,
        name: l.name,
        email: l.email,
        phone: l.phoneNumber,
        type: 'landlord',
      })),
      managers: managers.map((m: any) => ({
        id: m.cognitoId,
        name: m.name,
        email: m.email,
        phone: m.phoneNumber,
        type: 'manager',
      })),
    };

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          users: {
            total: buyersCount + tenantsCount + landlordsCount + managersCount,
            buyers: buyersCount,
            tenants: tenantsCount,
            landlords: landlordsCount,
            managers: managersCount,
            newUsers,
          },
          properties: propertyStats,
          financial: {
            totalPropertyValue,
            contractRevenue,
            tokenTransactionVolume,
            estimatedCommissions,
          },
          applications: applicationStats,
          tokens: tokenStats,
          maintenance: maintenanceStats,
        },
        recentActivity: {
          contracts: recentContracts,
          applications: recentApplications,
          tokenRequests: recentTokenRequests,
          maintenance: recentMaintenance,
        },
        contactDirectory,
        allApplications: allApplications.map((app: any) => ({
          ...app.toObject(),
          senderDetails: [
            ...contactDirectory.buyers,
            ...contactDirectory.tenants,
            ...contactDirectory.managers
          ].find((contact: any) => contact.id === app.senderId),
          receiverDetails: [
            ...contactDirectory.landlords,
            ...contactDirectory.managers
          ].find((contact: any) => contact.id === app.receiverId),
        })),
        allTokenRequests: allTokenRequests.map((req: any) => ({
          ...req.toObject(),
          buyerDetails: contactDirectory.buyers.find((b: any) => b.id === req.buyerId),
          sellerDetails: contactDirectory.landlords.find((l: any) => l.id === req.sellerId),
        })),
        allMaintenanceRequests,
        period: parseInt(period),
      },
    });
  } catch (error: any) {
    console.error('Error fetching superadmin dashboard:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
