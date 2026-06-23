'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { hasPermission } from '../service/permission.service';
import { Agent } from '../types/agent';
import { staggerEntrance, fadeInPage } from '../lib/animations';

export default function AgentList() {
  const { data: session } = useSession();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<number>(1); // 1 = Active, 0 = Inactive
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const tableRowsRef = useRef<HTMLTableSectionElement>(null);

  const permissions = session?.user?.userPermissions || '';
  const canCreate = hasPermission(permissions, 'agents:create');
  const canEdit = hasPermission(permissions, 'agents:edit');

  useEffect(() => {
    let active = true;
    const fetchAgents = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/agents?status=${statusFilter}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch agents: ${res.statusText}`);
        }
        const data = await res.json();
        if (active) {
          setAgents(data);
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'An error occurred while fetching agents.';
        if (active) {
          setError(errMsg);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchAgents();

    return () => {
      active = false;
    };
  }, [statusFilter, refetchTrigger]);

  // Page fade-in effect on initial load
  useEffect(() => {
    if (containerRef.current) {
      fadeInPage(containerRef.current);
    }
  }, []);

  // Stagger entrance on table rows whenever the agents data changes
  useEffect(() => {
    if (tableRowsRef.current && agents.length > 0) {
      const rows = tableRowsRef.current.querySelectorAll('tr');
      staggerEntrance(rows);
    }
  }, [agents]);

  const handleToggleStatus = async (uid: number, currentStatus: number) => {
    if (!confirm(`Are you sure you want to ${currentStatus === 1 ? 'deactivate' : 'activate'} this agent?`)) {
      return;
    }

    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      const res = await fetch(`/api/agents/${uid}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update agent status');
      }

      setRefetchTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Error updating status';
      alert(errMsg);
    }
  };

  return (
    <div ref={containerRef} className="agents-page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Agent Directory</h1>
          <p className="page-subtitle">Manage CRM staff, roles, teams, and profiles</p>
        </div>
        {canCreate && (
          <Link href="/agents/new" className="btn-primary-custom">
            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Agent
          </Link>
        )}
      </div>

      <div className="filter-bar">
        <div className="tab-group">
          <button
            onClick={() => setStatusFilter(1)}
            className={`tab-btn ${statusFilter === 1 ? 'active' : ''}`}
          >
            Active Agents
          </button>
          <button
            onClick={() => setStatusFilter(0)}
            className={`tab-btn ${statusFilter === 0 ? 'active' : ''}`}
          >
            Inactive Staff
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loader-box">
          <div className="spinner"></div>
          <p>Loading directory...</p>
        </div>
      ) : error ? (
        <div className="error-box">
          <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{error}</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="empty-box">
          <p>No agents found matching this criteria.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Designation</th>
                <th>Team</th>
                <th>Role</th>
                <th>Status</th>
                <th className="actions-cell">Actions</th>
              </tr>
            </thead>
            <tbody ref={tableRowsRef}>
              {agents.map((agent) => (
                <tr key={agent.uid}>
                  <td>
                    <div className="name-cell">
                      <div className="avatar-circle">{agent.name[0]?.toUpperCase()}</div>
                      <div>
                        <div className="font-medium text-slate-800">{agent.name}</div>
                        {agent.nickname && <div className="nickname text-slate-400">&quot;{agent.nickname}&quot;</div>}
                      </div>
                    </div>
                  </td>
                  <td><code className="username-code">{agent.username}</code></td>
                  <td>{agent.email || <span className="text-slate-400">—</span>}</td>
                  <td>{agent.designation || <span className="text-slate-400">—</span>}</td>
                  <td>
                    <span className="badge-team">
                      {agent.team?.teamName || 'Unassigned'}
                    </span>
                  </td>
                  <td>
                    <span className="badge-role">
                      {agent.role?.roleName || 'No Role'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-dot-badge ${agent.status === 1 ? 'status-active' : 'status-inactive'}`}>
                      {agent.status === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <Link href={`/agents/${agent.uid}`} className="action-link-btn view">
                        View Profile
                      </Link>
                      {canEdit && (
                        <>
                          <Link href={`/agents/${agent.uid}/edit`} className="action-link-btn edit">
                            Edit
                          </Link>
                          <button
                            onClick={() => handleToggleStatus(agent.uid, agent.status ?? 0)}
                            className={`action-btn-status ${agent.status === 1 ? 'deactivate' : 'activate'}`}
                          >
                            {agent.status === 1 ? 'Deactivate' : 'Activate'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
