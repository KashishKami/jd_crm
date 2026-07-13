import React from 'react';
import AgentList from '../../components/AgentList';
import { prisma } from '../../lib/db';

export const metadata = {
  title: 'Agent Directory - JD CRM',
  description: 'Manage employees, staff permissions, teams and profiles',
};

export default async function AgentsPage() {
  const [designations, agents] = await Promise.all([
    prisma.crmDesignations.findMany({
      select: {
        designationId: true,
        designationName: true,
      },
      orderBy: {
        designationName: 'asc',
      },
    }),
    prisma.users.findMany({
      select: {
        uid: true,
        name: true,
        nickname: true,
        designation: true,
        status: true,
        teamId: true,
        roleId: true,
        agentId: true,
        role: {
          select: {
            roleName: true,
          },
        },
        team: {
          select: {
            teamName: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    }),
  ]);

  return <AgentList designations={designations} initialAgents={agents as any} />;
}
