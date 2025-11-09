import { NextRequest, NextResponse } from 'next/server';
import db from '@/utils/db';
import Landlord from '@/app/models/Landlord';
import Tenant from '@/app/models/Tenant';
import Manager from '@/app/models/Manager';
import Buyer from '@/app/models/Buyer';
import Property from '@/app/models/Property';
import SellerProperty from '@/app/models/SellerProperty';
import Contract from '@/app/models/Contract';
import Application from '@/app/models/Application';
import TokenPurchaseRequest from '@/app/models/TokenPurchaseRequest';
import PropertyToken from '@/app/models/PropertyToken';
import TokenInvestment from '@/app/models/TokenInvestment';
import MaintenanceRequest from '@/app/models/MaintenanceRequest';

export async function GET(request: NextRequest) {
  try {
    await db.connect();

    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');

    // Parse date or use today
    const targetDate = dateParam ? new Date(dateParam) : new Date();

    // Set time to start and end of day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const dateQuery = {
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    };

    // Fetch all activities in parallel
    const [
      newLandlords,
      newTenants,
      newManagers,
      newBuyers,
      newProperties,
      newSellerProperties,
      newContracts,
      newApplications,
      newTokenPurchases,
      newTokenOfferings,
      newTokenInvestments,
      newMaintenanceRequests,
    ] = await Promise.all([
      Landlord.find(dateQuery).select('name email phoneNumber createdAt').lean(),
      Tenant.find(dateQuery).select('name email phoneNumber createdAt').lean(),
      Manager.find(dateQuery).select('name email phoneNumber createdAt').lean(),
      Buyer.find(dateQuery).select('name email phoneNumber createdAt').lean(),
      Property.find(dateQuery).select('name pricePerMonth landlordCognitoId managerCognitoId createdAt').populate('landlordCognitoId', 'name email phoneNumber').populate('managerCognitoId', 'name email phoneNumber').lean(),
      SellerProperty.find(dateQuery).select('name salePrice sellerCognitoId isTokenized createdAt').populate('sellerCognitoId', 'name email phoneNumber').lean(),
      Contract.find(dateQuery).select('propertyId tenantId monthlyRent status createdAt').populate('tenantId', 'name email phoneNumber').populate('propertyId', 'name').lean(),
      Application.find(dateQuery).select('propertyId senderName senderEmail senderPhone applicationType status createdAt').populate('propertyId', 'name').lean(),
      TokenPurchaseRequest.find(dateQuery).select('buyerName buyerEmail tokensRequested totalAmount status createdAt propertyId').populate('propertyId', 'name').lean(),
      PropertyToken.find(dateQuery).select('tokenName totalTokens tokenPrice status createdAt propertyId').populate('propertyId', 'name').lean(),
      TokenInvestment.find(dateQuery).select('investorId tokensOwned totalInvestment createdAt propertyId').populate('investorId', 'name email phoneNumber').populate('propertyId', 'name').lean(),
      MaintenanceRequest.find(dateQuery).select('category description urgency status createdAt tenantId propertyId').populate('tenantId', 'name email phoneNumber').populate('propertyId', 'name').lean(),
    ]);

    // Format activities
    const activities: any[] = [];

    // New Landlords
    newLandlords.forEach((landlord: any) => {
      activities.push({
        type: 'landlord_registered',
        icon: '🏠',
        title: `New Landlord Registration`,
        description: `${landlord.name} registered as a landlord`,
        userName: landlord.name,
        userEmail: landlord.email,
        userPhone: landlord.phoneNumber,
        timestamp: landlord.createdAt,
        details: null,
      });
    });

    // New Tenants
    newTenants.forEach((tenant: any) => {
      activities.push({
        type: 'tenant_registered',
        icon: '👤',
        title: `New Tenant Registration`,
        description: `${tenant.name} registered as a tenant`,
        userName: tenant.name,
        userEmail: tenant.email,
        userPhone: tenant.phoneNumber,
        timestamp: tenant.createdAt,
        details: null,
      });
    });

    // New Managers
    newManagers.forEach((manager: any) => {
      activities.push({
        type: 'manager_registered',
        icon: '👔',
        title: `New Manager Registration`,
        description: `${manager.name} registered as a property manager`,
        userName: manager.name,
        userEmail: manager.email,
        userPhone: manager.phoneNumber,
        timestamp: manager.createdAt,
        details: null,
      });
    });

    // New Buyers
    newBuyers.forEach((buyer: any) => {
      activities.push({
        type: 'buyer_registered',
        icon: '💼',
        title: `New Buyer Registration`,
        description: `${buyer.name} registered as a buyer`,
        userName: buyer.name,
        userEmail: buyer.email,
        userPhone: buyer.phoneNumber,
        timestamp: buyer.createdAt,
        details: null,
      });
    });

    // New Properties
    newProperties.forEach((property: any) => {
      activities.push({
        type: 'property_created',
        icon: '🏘️',
        title: `New Property Listed`,
        description: `${property.landlordCognitoId?.name || 'Unknown'} listed "${property.name}"`,
        userName: property.landlordCognitoId?.name,
        userEmail: property.landlordCognitoId?.email,
        userPhone: property.landlordCognitoId?.phoneNumber,
        timestamp: property.createdAt,
        details: {
          propertyName: property.name,
          pricePerMonth: property.pricePerMonth,
          manager: property.managerCognitoId?.name,
        },
      });
    });

    // New Seller Properties
    newSellerProperties.forEach((property: any) => {
      activities.push({
        type: 'seller_property_created',
        icon: '🏡',
        title: `New Property for Sale`,
        description: `${property.sellerCognitoId?.name || 'Unknown'} listed "${property.name}" for sale${property.isTokenized ? ' (Tokenized)' : ''}`,
        userName: property.sellerCognitoId?.name,
        userEmail: property.sellerCognitoId?.email,
        userPhone: property.sellerCognitoId?.phoneNumber,
        timestamp: property.createdAt,
        details: {
          propertyName: property.name,
          salePrice: property.salePrice,
          isTokenized: property.isTokenized,
        },
      });
    });

    // New Contracts
    newContracts.forEach((contract: any) => {
      activities.push({
        type: 'contract_created',
        icon: '📝',
        title: `New Contract Created`,
        description: `Contract created for ${contract.tenantId?.name || 'Unknown'} - "${contract.propertyId?.name || 'Unknown Property'}"`,
        userName: contract.tenantId?.name,
        userEmail: contract.tenantId?.email,
        userPhone: contract.tenantId?.phoneNumber,
        timestamp: contract.createdAt,
        details: {
          propertyName: contract.propertyId?.name,
          monthlyRent: contract.monthlyRent,
          status: contract.status,
        },
      });
    });

    // New Applications
    newApplications.forEach((application: any) => {
      activities.push({
        type: 'application_submitted',
        icon: '📋',
        title: `New Application`,
        description: `${application.senderName} submitted a ${application.applicationType} for "${application.propertyId?.name || 'Unknown Property'}"`,
        userName: application.senderName,
        userEmail: application.senderEmail,
        userPhone: application.senderPhone,
        timestamp: application.createdAt,
        details: {
          propertyName: application.propertyId?.name,
          applicationType: application.applicationType,
          status: application.status,
        },
      });
    });

    // New Token Purchases
    newTokenPurchases.forEach((purchase: any) => {
      activities.push({
        type: 'token_purchase',
        icon: '🪙',
        title: `Token Purchase Request`,
        description: `${purchase.buyerName} requested ${purchase.tokensRequested} tokens`,
        userName: purchase.buyerName,
        userEmail: purchase.buyerEmail,
        userPhone: null,
        timestamp: purchase.createdAt,
        details: {
          propertyName: purchase.propertyId?.name,
          tokensRequested: purchase.tokensRequested,
          totalAmount: purchase.totalAmount,
          status: purchase.status,
        },
      });
    });

    // New Token Offerings
    newTokenOfferings.forEach((offering: any) => {
      activities.push({
        type: 'token_offering_created',
        icon: '🎯',
        title: `New Token Offering`,
        description: `${offering.tokenName} token offering created`,
        userName: null,
        userEmail: null,
        userPhone: null,
        timestamp: offering.createdAt,
        details: {
          propertyName: offering.propertyId?.name,
          tokenName: offering.tokenName,
          totalTokens: offering.totalTokens,
          tokenPrice: offering.tokenPrice,
          status: offering.status,
        },
      });
    });

    // New Token Investments
    newTokenInvestments.forEach((investment: any) => {
      activities.push({
        type: 'token_investment',
        icon: '💰',
        title: `Token Purchase Completed`,
        description: `${investment.investorId?.name || 'Unknown'} purchased ${investment.tokensOwned} tokens`,
        userName: investment.investorId?.name,
        userEmail: investment.investorId?.email,
        userPhone: investment.investorId?.phoneNumber,
        timestamp: investment.createdAt,
        details: {
          propertyName: investment.propertyId?.name,
          tokensOwned: investment.tokensOwned,
          totalInvestment: investment.totalInvestment,
        },
      });
    });

    // New Maintenance Requests
    newMaintenanceRequests.forEach((request: any) => {
      activities.push({
        type: 'maintenance_request',
        icon: '🔧',
        title: `Maintenance Request`,
        description: `${request.tenantId?.name || 'Unknown'} requested ${request.category} maintenance (${request.urgency} priority)`,
        userName: request.tenantId?.name,
        userEmail: request.tenantId?.email,
        userPhone: request.tenantId?.phoneNumber,
        timestamp: request.createdAt,
        details: {
          propertyName: request.propertyId?.name,
          category: request.category,
          urgency: request.urgency,
          status: request.status,
        },
      });
    });

    // Sort activities by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      date: targetDate.toISOString().split('T')[0],
      totalActivities: activities.length,
      activities,
    });

  } catch (error: any) {
    console.error('Error fetching activity log:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch activity log' },
      { status: 500 }
    );
  }
}
