import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { hasPermission } from '../../../service/permission.service';
import { prisma } from '../../../lib/db';
import NewAgentForm from '../../../components/NewAgentForm';
import '../agents.css';

export const metadata = {
  title: 'Register New Agent - JD CRM',
};

export default async function NewAgentPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  // Double check that the user has agent creation permissions
  const isPermitted = hasPermission(session.user.userPermissions, 'agents:create');
  if (!isPermitted) {
    redirect('/access-denied');
  }

  // Fetch roles, teams, and designations in parallel
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
    <NewAgentForm
      teams={teams}
      roles={roles}
      designations={designations}
    />
  );
}
