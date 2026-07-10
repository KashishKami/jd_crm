import React from 'react';
import AgentList from '../../components/AgentList';
import { prisma } from '../../lib/db';

export const metadata = {
  title: 'Agent Directory - JD CRM',
  description: 'Manage employees, staff permissions, teams and profiles',
};

export default async function AgentsPage() {
  const designations = await prisma.crmDesignations.findMany({
    select: {
      designationId: true,
      designationName: true,
    },
    orderBy: {
      designationName: 'asc',
    },
  });

  return <AgentList designations={designations} />;
}
