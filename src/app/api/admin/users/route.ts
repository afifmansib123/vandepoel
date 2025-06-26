import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import { authenticateAndAuthorize } from '@/lib/authUtils';

// Import all necessary models
import Tenant from '@/app/models/Tenant';
import Manager from '@/app/models/Manager';
import Landlord from '@/app/models/Landlord';
import Buyer from '@/app/models/Buyer';
import SellerProperty from '@/app/models/SellerProperty';
import Application from '@/app/models/Application';
import MaintenanceProvider from '@/app/models/MaintenanceProvider';
import BankingService from '@/app/models/BankingService';
import SuperAdmin from '@/app/models/SuperAdmin';

export async function GET(request: NextRequest) {
  const authResult = await authenticateAndAuthorize(request, ['superadmin']);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  await dbConnect();

  // Get the 'resource' query parameter from the URL
  // e.g., /api/admin/users?resource=properties
  const resource = request.nextUrl.searchParams.get('resource');

  try {
    // Use a switch statement to determine which data to fetch
    switch (resource) {
      case 'properties':
        const properties = await SellerProperty.find({}).populate('locationId').lean();
        return NextResponse.json(properties, { status: 200 });

      case 'applications':
        const applications = await Application.find({})
          .populate({
            path: 'propertyId',
            model: SellerProperty, // Explicitly tell populate which model to use
            select: 'name photoUrls' // Select only the fields you need
          })
          .sort({ createdAt: -1 })
          .lean();
        return NextResponse.json(applications, { status: 200 });

      case 'maintenance':
        const maintenanceProviders = await MaintenanceProvider.find({}).lean();
        return NextResponse.json(maintenanceProviders, { status: 200 });
      
      case 'banking':
        const bankingServices = await BankingService.find({}).lean();
        return NextResponse.json(bankingServices, { status: 200 });

      case 'users':
      default:
        // This is the original logic, which now becomes the default
        const tenants = await Tenant.find({}).lean();
        const managers = await Manager.find({}).lean();
        const landlords = await Landlord.find({}).lean();
        const buyers = await Buyer.find({}).lean();
        const admins = await SuperAdmin.find({}).lean();

        const allUsers = [
          ...tenants.map(user => ({ ...user, role: 'tenant' })),
          ...managers.map(user => ({ ...user, role: 'manager' })),
          ...landlords.map(user => ({ ...user, role: 'landlord' })),
          ...buyers.map(user => ({ ...user, role: 'buyer' })),
          ...admins.map(user => ({...user, role: 'superadmin'}))
        ];
        return NextResponse.json(allUsers, { status: 200 });
    }
  } catch (error) {
    console.error(`Error fetching admin resource '${resource || 'users'}':`, error);
    const message = error instanceof Error ? error.message : 'An unknown server error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}