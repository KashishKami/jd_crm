import React from 'react';
import FollowUpListContainer from '../../components/FollowUpListContainer';
import { prisma } from '../../lib/db';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Follow Ups - JD CRM',
  description: 'Manage follow-up lists, schedules, states, and follow-up notifications',
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
