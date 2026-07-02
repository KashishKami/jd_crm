import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../api/auth/[...nextauth]/route';
import { hasPermission } from '../../../../service/permission.service';
import { prisma } from '../../../../lib/db';
import * as agentService from '../../../../service/agent.service';
import EditAgentForm from '../../../../components/EditAgentForm';

export const metadata = {
  title: 'Edit Agent Profile - JD CRM',
};

interface EditAgentPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function EditAgentPage({ params }: EditAgentPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  const resolvedParams = await params;
  const uid = Number(resolvedParams.id);
  if (isNaN(uid)) {
    notFound();
  }

  // Ensure user has edit rights OR is editing their own profile
  const isSelf = Number(session.user.id) === uid;
  const isPermitted = hasPermission(session.user.userPermissions, 'agents:edit') || isSelf;
  if (!isPermitted) {
    redirect('/access-denied');
  }

  // Fetch the agent with all sub-profiles
  const agent = await agentService.getAgentById(uid);
  if (!agent) {
    notFound();
  }

  // Fetch roles, teams, and designations in parallel for dropdown fields
  const [teams, roles, designations] = await Promise.all([
    prisma.crmTeams.findMany({
      select: {
        teamId: true,
        teamName: true,
      },
      orderBy: {
        teamName: 'asc',
      },
    }),
    prisma.crmRoles.findMany({
      select: {
        roleId: true,
        roleName: true,
      },
      orderBy: {
        roleName: 'asc',
      },
    }),
    prisma.crmDesignations.findMany({
      select: {
        designationId: true,
        designationName: true,
      },
      orderBy: {
        designationName: 'asc',
      },
    }),
  ]);

  return (
    <EditAgentForm
      agent={agent}
      teams={teams}
      roles={roles}
      designations={designations}
    />
  );
}
