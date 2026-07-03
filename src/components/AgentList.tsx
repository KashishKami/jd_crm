'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { hasPermission } from '../service/permission.service';
import { Agent } from '../types/agent';
import { staggerEntrance, fadeInPage } from '../lib/animations';
import { gsap } from 'gsap';

export default function AgentList() {
  const { data: session } = useSession();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [designationFilter, setDesignationFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('1'); // Default to "1" (Active)

  // Pagination States
  const [page, setPage] = useState(1);
  const limit = 20;

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
        // Fetch all agents (omitting status parameter lets backend return all records)
        const res = await fetch(`/api/agents`);
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
  }, [refetchTrigger]);

  // Page fade-in effect on initial load
  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      fadeInPage(containerRef.current!);
    });
    return () => ctx.revert();
  }, []);

  // Dynamic filter options derived from agent list
  const designations = Array.from(new Set(agents.map(a => a.designation).filter(Boolean))).sort() as string[];
  const teams = Array.from(new Set(agents.map(a => a.team?.teamName).filter(Boolean))).sort() as string[];
  const roles = Array.from(new Set(agents.map(a => a.role?.roleName).filter(Boolean))).sort() as string[];

  // Reset page when any filter changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, designationFilter, teamFilter, roleFilter, statusFilter]);

  // Client-side filtering logic
  const filteredAgents = agents.filter(agent => {
    // 1. Text Search query: Matches Name or Nickname (case-insensitive)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      const nameMatch = agent.name.toLowerCase().includes(lowerSearch);
      const nicknameMatch = agent.nickname ? agent.nickname.toLowerCase().includes(lowerSearch) : false;
      if (!nameMatch && !nicknameMatch) return false;
    }

    // 2. Designation Filter
    if (designationFilter !== 'all' && agent.designation !== designationFilter) {
      return false;
    }

    // 3. Team Filter
    if (teamFilter !== 'all' && agent.team?.teamName !== teamFilter) {
      return false;
    }

    // 4. Role Filter
    if (roleFilter !== 'all' && agent.role?.roleName !== roleFilter) {
      return false;
    }

    // 5. Status Filter
    if (statusFilter !== 'all') {
      const targetStatus = Number(statusFilter);
      if (agent.status !== targetStatus) {
        return false;
      }
    }

    return true;
  });

  // Pagination computations
  const totalItems = filteredAgents.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedAgents = filteredAgents.slice(startIndex, startIndex + limit);

  // Stagger entrance on table rows whenever the paginated agents list changes
  useEffect(() => {
    if (tableRowsRef.current && paginatedAgents.length > 0) {
      const rows = tableRowsRef.current.querySelectorAll('tr');
      const ctx = gsap.context(() => {
        staggerEntrance(rows);
      });
      return () => ctx.revert();
    }
  }, [paginatedAgents]);

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
    <div ref={containerRef} className="agents-page-container" style={{ opacity: 0 }}>
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

      {/* Advanced Filters Block */}
      <div className="filters-container">
        <div className="filters-row">
          
          {/* Search Term text input */}
          <div className="search-input-wrapper">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name or alias..."
              className="filter-search-input"
            />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px', position: 'absolute', left: '12px', top: '11px', color: '#64748b' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.603 10.603z" />
            </svg>
          </div>

          {/* Designation Dropdown Select */}
          <div className="filter-select-wrapper">
            <select
              data-testid="designation-select"
              aria-label="Designation"
              value={designationFilter}
              onChange={(e) => setDesignationFilter(e.target.value)}
              className="filter-select-custom"
            >
              <option value="all">All Designations</option>
              {designations.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Team Dropdown Select */}
          <div className="filter-select-wrapper">
            <select
              data-testid="team-select"
              aria-label="Team"
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="filter-select-custom"
            >
              <option value="all">All Teams</option>
              {teams.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Role Dropdown Select */}
          {hasPermission(permissions, 'agents:view-roles') && (
            <div className="filter-select-wrapper">
              <select
                data-testid="role-select"
                aria-label="Role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="filter-select-custom"
              >
                <option value="all">All Roles</option>
                {roles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status Dropdown Select */}
          <div className="filter-select-wrapper">
            <select
              data-testid="status-select"
              aria-label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select-custom"
            >
              <option value="all">All Statuses</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>

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
      ) : filteredAgents.length === 0 ? (
        <div className="empty-box">
          <p>No agents found matching this criteria.</p>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="custom-table table-responsive">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Designation</th>
                <th>Team</th>
                {hasPermission(permissions, 'agents:view-roles') && <th>Role</th>}
                <th>Status</th>
                <th className="actions-cell">Actions</th>
              </tr>
            </thead>
            <tbody ref={tableRowsRef}>
              {paginatedAgents.map((agent) => (
                <tr key={agent.uid} style={{ opacity: 0 }}>
                  <td>
                    <div className="name-cell">
                      <div className="avatar-circle">{(agent.nickname || agent.name)[0]?.toUpperCase()}</div>
                      <div>
                        {agent.nickname ? (
                          <div className="font-medium text-slate-800">{agent.nickname}</div>
                        ) : (
                          <div className="font-medium text-slate-800">{agent.name}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{agent.email || <span className="text-slate-400">—</span>}</td>
                  <td>{agent.designation || <span className="text-slate-400">—</span>}</td>
                  <td>
                    <span className="badge-team">
                      {agent.team?.teamName || 'Unassigned'}
                    </span>
                  </td>
                  {hasPermission(permissions, 'agents:view-roles') && (
                    <td>
                      <span className="badge-role">
                        {agent.role?.roleName || 'No Role'}
                      </span>
                    </td>
                  )}
                  <td>
                    <span className={`status-dot-badge ${agent.status === 1 ? 'status-active' : 'status-inactive'}`}>
                      {agent.status === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <Link href={`/agents/${agent.uid}`} prefetch={false} className="action-link-btn view">
                        View Profile
                      </Link>
                      {canEdit && (
                        <>
                          <Link href={`/agents/${agent.uid}/edit`} prefetch={false} className="action-link-btn edit">
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
        {totalPages > 1 && (
          <div className="pagination-bar">
            <button 
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))} 
              disabled={page === 1}
              className="pagination-btn"
            >
              Previous
            </button>
            <span className="pagination-info">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> (Total: {totalItems})
            </span>
            <button 
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))} 
              disabled={page === totalPages}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        )}
      </>
    )}
  </div>
  );
}
