'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { CallDispositionRecord, DISPOSITION_OPTIONS } from '../types/callDisposition';
import CallDispositionList from './CallDispositionList';
import AddDispositionModal from './AddDispositionModal';
import EditDispositionModal from './EditDispositionModal';

export default function CallDispositionListContainer() {
  const { data: session, status } = useSession();

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // List & pagination states
  const [dispositions, setDispositions] = useState<CallDispositionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Filter states
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dispositionFilter, setDispositionFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');

  // Dropdown list states (Admin only)
  const [teams, setTeams] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);

  // Permissions helpers
  const permissions = session?.user?.userPermissions || '';
  const hasViewAll = permissions.includes('call-dispositions:view');
  const hasCreate = permissions.includes('call-dispositions:create');

  const fetchDropdowns = useCallback(async () => {
    try {
      const [teamsRes, agentsRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/agents'),
      ]);
      if (teamsRes.ok) setTeams(await teamsRes.json());
      if (agentsRes.ok) setAgents(await agentsRes.json());
    } catch (err) {
      console.error('Failed to fetch filter dropdowns:', err);
    }
  }, []);

  const fetchDispositions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      query.set('page', String(page));
      query.set('limit', String(limit));
      if (dateFrom)          query.set('dateFrom', dateFrom);
      if (dateTo)            query.set('dateTo', dateTo);
      if (dispositionFilter) query.set('disposition', dispositionFilter);
      if (hasViewAll) {
        if (teamFilter)  query.set('teamId', teamFilter);
        if (agentFilter) query.set('agentId', agentFilter);
      }

      const res = await fetch(`/api/call-dispositions?${query.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to load call dispositions. Try logging out and back in to refresh your session permissions.');
      }
      const data = await res.json();
      setDispositions(data.dispositions || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || 'Error occurred while loading data.');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, dateFrom, dateTo, dispositionFilter, hasViewAll, teamFilter, agentFilter]);

  useEffect(() => {
    if (status === 'authenticated') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDispositions();
    }
  }, [status, fetchDispositions]);

  useEffect(() => {
    if (status === 'authenticated' && hasViewAll) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDropdowns();
    }
  }, [status, hasViewAll, fetchDropdowns]);

  const handleEditClick = (id: number) => {
    setEditingId(id);
    setIsEditOpen(true);
  };

  const handleDeleteClick = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this disposition record?')) return;

    try {
      const res = await fetch(`/api/call-dispositions/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete record');
      }
      fetchDispositions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportClick = async () => {
    try {
      const query = new URLSearchParams();
      if (dateFrom)          query.set('dateFrom', dateFrom);
      if (dateTo)            query.set('dateTo', dateTo);
      if (dispositionFilter) query.set('disposition', dispositionFilter);
      if (teamFilter)        query.set('teamId', teamFilter);
      if (agentFilter)       query.set('agentId', agentFilter);

      window.open(`/api/call-dispositions/export?${query.toString()}`, '_blank');
    } catch (err) {
      console.error(err);
    }
  };

  if (status === 'loading') {
    return <div className="p-8 text-center text-slate-400">Verifying session...</div>;
  }

  if (status === 'unauthenticated' || (!hasViewAll && !hasCreate)) {
    return (
      <div className="alert alert-danger p-6 m-6" style={{ margin: '24px' }}>
        Access Denied: You do not have permissions to view this page. Try logging out and back in.
      </div>
    );
  }

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="agents-page-container">
      {/* Header and Add button */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Call Dispositions</h1>
          <p className="page-subtitle text-slate-400">
            Record and review inbound call outcomes.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {hasViewAll && (
            <button
              onClick={handleExportClick}
              className="btn-secondary-custom"
              style={{ height: '38px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              Export Excel
            </button>
          )}
          {hasCreate && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="btn-primary-custom"
              style={{ height: '38px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              Log Inbound Call
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Block */}
      <div className="filters-container" style={{ marginBottom: '24px' }}>
        <div className="filters-row">
          {hasViewAll && (
            <>
              <div className="filter-select-wrapper">
                <label className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.78rem' }}>
                  Center/Team
                </label>
                <select
                  value={teamFilter}
                  onChange={(e) => {
                    setTeamFilter(e.target.value);
                    setAgentFilter('');
                    setPage(1);
                  }}
                  className="filter-select-custom"
                  style={{ height: '38px' }}
                >
                  <option value="">All Centers</option>
                  {teams.map((t) => (
                    <option key={t.teamId} value={t.teamId}>
                      {t.teamName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-select-wrapper">
                <label className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.78rem' }}>
                  Agent
                </label>
                <select
                  value={agentFilter}
                  onChange={(e) => {
                    setAgentFilter(e.target.value);
                    setPage(1);
                  }}
                  className="filter-select-custom"
                  style={{ height: '38px' }}
                >
                  <option value="">All Agents</option>
                  {agents
                    .filter((a) => !teamFilter || a.teamId === Number(teamFilter))
                    .map((a) => (
                      <option key={a.uid} value={a.uid}>
                        {a.nickname || a.name}
                      </option>
                    ))}
                </select>
              </div>
            </>
          )}

          <div className="filter-select-wrapper">
            <label className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.78rem' }}>
              Disposition
            </label>
            <select
              value={dispositionFilter}
              onChange={(e) => {
                setDispositionFilter(e.target.value);
                setPage(1);
              }}
              className="filter-select-custom"
              style={{ height: '38px' }}
            >
              <option value="">All Dispositions</option>
              {DISPOSITION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-select-wrapper">
            <label className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.78rem' }}>
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="filter-select-custom"
              style={{ height: '38px', padding: '0 12px' }}
            />
          </div>

          <div className="filter-select-wrapper">
            <label className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.78rem' }}>
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="filter-select-custom"
              style={{ height: '38px', padding: '0 12px' }}
            />
          </div>
        </div>
      </div>

      {/* Main List */}
      {error && (
        <div 
          className="alert alert-danger" 
          style={{ 
            backgroundColor: '#fef2f2', 
            color: '#dc2626', 
            border: '1px solid #fee2e2', 
            borderRadius: '6px', 
            padding: '12px 16px', 
            marginBottom: '20px',
            fontSize: '0.9rem' 
          }}
        >
          {error}
        </div>
      )}

      <div className="table-wrapper card-with-accent">
        <div className="card-table-container" style={{ padding: 0 }}>
          <CallDispositionList
            dispositions={dispositions}
            isLoading={isLoading}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
            isAdmin={hasViewAll}
          />
        </div>

        {/* Pagination Panel */}
        {totalPages > 1 && (
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'between', 
              alignItems: 'center', 
              padding: '16px 24px', 
              borderTop: '1px solid var(--border-color, #e2e8f0)',
              backgroundColor: 'rgba(248, 250, 252, 0.5)'
            }}
          >
            <span className="text-slate-400 text-sm">
              Showing {dispositions.length} of {total} records
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-secondary-custom"
                style={{ padding: '4px 12px', fontSize: '0.85rem' }}
              >
                Previous
              </button>
              <span className="text-slate-600 text-sm flex items-center px-2">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-secondary-custom"
                style={{ padding: '4px 12px', fontSize: '0.85rem' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddDispositionModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={fetchDispositions}
      />

      <EditDispositionModal
        isOpen={isEditOpen}
        dispositionId={editingId}
        onClose={() => {
          setIsEditOpen(false);
          setEditingId(null);
        }}
        onSuccess={fetchDispositions}
      />
    </div>
  );
}
