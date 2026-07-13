import React from 'react';
import OrderListContainer from '../../components/OrderListContainer';
import { prisma } from '../../lib/db';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Orders Pipeline - JD CRM',
  description: 'Manage sales intake, bookings, margins, and status queues',
};

export default async function OrdersPage() {
  const [agents, teams] = await Promise.all([
    prisma.users.findMany({
      select: {
        uid: true,
        name: true,
        nickname: true,
        designation: true,
        status: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),
    prisma.crmTeams.findMany({
      select: {
        teamId: true,
        teamName: true,
      },
      orderBy: {
        teamName: 'asc',
      },
    }),
  ]);

  return <OrderListContainer initialAgents={agents} initialTeams={teams} />;
}
