import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { hasPermission } from '../../../service/permission.service';
import * as agentService from '../../../service/agent.service';
import AgentProfileView from '../../../components/AgentProfileView';

export const metadata = {
  title: 'Agent Profile - JD CRM',
};

interface AgentPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function AgentDetailPage({ params }: AgentPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  // Ensure user has access to view agents
  const isPermitted = hasPermission(session.user.userPermissions, 'agents:view');
  if (!isPermitted) {
    redirect('/access-denied');
  }

  const resolvedParams = await params;
  const uid = Number(resolvedParams.id);
  if (isNaN(uid)) {
    notFound();
  }

  const agent = await agentService.getAgentById(uid);
  if (!agent) {
    notFound();
  }

  return <AgentProfileView agent={agent} />;
}
