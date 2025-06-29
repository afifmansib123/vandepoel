import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import { authenticateAndAuthorize } from '@/lib/authUtils';

// Import all necessary models
import Tenant from '@/app/models/Tenant';
import Manager from '@/app/models/Manager';
import Landlord from '@/app/models/Landlord';
import Buyer from '@/app/models/Buyer';
import SuperAdmin from '@/app/models/SuperAdmin';
import MaintenanceProvider from '@/app/models/MaintenanceProvider';
import BankingService from '@/app/models/BankingService';

export async function GET(request: NextRequest) {
  
  await dbConnect();

  // Get the 'resource' query parameter from the URL
  // e.g., /api/superadmin/resources?resource=users
  const resource = request.nextUrl.searchParams.get('resource');

  try {
    switch (resource) {
      case 'maintenance':
        const maintenanceProviders = await MaintenanceProvider.find({}).lean();
        return NextResponse.json(maintenanceProviders, { status: 200 });
      
      case 'banking':
        const bankingServices = await BankingService.find({}).lean();
        return NextResponse.json(bankingServices, { status: 200 });

      case 'users':
      default:
        // Default to fetching all users
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
    console.error(`Error fetching superadmin resource '${resource || 'users'}':`, error);
    const message = error instanceof Error ? error.message : 'An unknown server error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}