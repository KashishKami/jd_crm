import React from 'react';
import AgentList from '../../components/AgentList';
import './agents.css';

export const metadata = {
  title: 'Agent Directory - JD CRM',
  description: 'Manage employees, staff permissions, teams and profiles',
};

export default function AgentsPage() {
  return <AgentList />;
}
