import React from 'react';
import FollowUpListContainer from '../../components/FollowUpListContainer';
import { prisma } from '../../lib/db';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Follow Up Callbacks - JD CRM',
  description: 'Manage callback lists, schedules, states, and callback notifications',
};

export default async function FollowUpsPage() {
  const [agents, teams] = await Promise.all([
    prisma.users.findMany({
      select: {
        uid: true,
        name: true,
        nickname: true,
        designation: true,
        status: true,
        teamId: true,
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

  return <FollowUpListContainer initialAgents={agents} initialTeams={teams} />;
}
