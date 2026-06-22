import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { hasPermission } from '../../../service/permission.service';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isPermitted = hasPermission(session.user.userPermissions, 'vendors:view');
  if (!isPermitted) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient Permissions' },
      { status: 403 }
    );
  }

  // Seeded mock data to verify successful retrieval
  const mockVendors = [
    {
      vendorId: 1,
      vendorName: 'IT Solutions Inc',
      vendorPhone: '123-456-7890',
      vendorContactPerson: 'John Doe',
      vendorStatus: 1,
    },
    {
      vendorId: 2,
      vendorName: 'Database Pros LLC',
      vendorPhone: '987-654-3210',
      vendorContactPerson: 'Jane Smith',
      vendorStatus: 1,
    },
  ];

  return NextResponse.json(mockVendors);
}
