'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { hasPermission } from '../service/permission.service';
import FollowUpList from './FollowUpList';
import GlobalFollowUpNotifications from './GlobalFollowUpNotifications';

const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'];

const STATUS_OPTIONS = [
  'Interested',
  'Call Back Later',
  'No Answer',
  'Busy',
  'Voicemail',
  'Waiting for Paycheck',
  'Sale Closed',
  'Not Interested',
  'Price Too High',
  'Purchased Elsewhere',
  'Wrong Number',
  'Spanish',
];

interface FollowUpListContainerProps {
  initialAgents?: any[];
  initialTeams?: any[];
}

function FollowUpListContainerContent({ initialAgents, initialTeams }: FollowUpListContainerProps) {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Teams & Agents for admin filters
  const [teams, setTeams] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);

  // Filters state (lazy-initialized from URL params to prevent spurious resets)
  const [priorityFilter, setPriorityFilter] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('priority') || '';
  });
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('status') || '';
  });
  const [dateFrom, setDateFrom] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('followUpDateFrom') || '';
  });
  const [dateTo, setDateTo] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('followUpDateTo') || '';
  });
  const [teamFilter, setTeamFilter] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('teamId') || '';
  });
  const [agentFilter, setAgentFilter] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('agentId') || '';
  });

  // Search states
  const [searchVal, setSearchVal] = useState(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('search') || '';
  });
  const [debouncedSearch, setDebouncedSearch] = useState(searchVal);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchVal);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchVal]);

  // Pagination
  const [page, setPage] = useState(() => {
    if (typeof window === 'undefined') return 1;
    return parseInt(new URLSearchParams(window.location.search).get('page') || '1', 10) || 1;
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 20;

  const isRestoringRef = useRef(true);
  const isCachedRef = useRef(false);
  const isDetailReturnRef = useRef<boolean>(
    typeof window !== 'undefined' &&
    (sessionStorage.getItem('coming_from_detail') === '/follow-ups' ||
     Boolean(sessionStorage.getItem('coming_from_detail')?.startsWith('/follow-ups')))
  );


  const permissions = session?.user?.userPermissions || '';
  const canViewAll = hasPermission(permissions, 'follow-ups:view');
  const canCreate = hasPermission(permissions, 'follow-ups:create');

  // Sync pagination page with URL search params
  useEffect(() => {
    if (!searchParams) return;
    const pageParam = searchParams.get('page');
    if (pageParam !== null) {
      const parsedPage = parseInt(pageParam, 10) || 1;
      setPage((prev) => (parsedPage !== prev ? parsedPage : prev));
    }
  }, [searchParams]);

  // Restore cache and scroll position on mount ONLY if coming from detail view
  useEffect(() => {
    const comingFromDetail = sessionStorage.getItem('coming_from_detail') === 'true';
    sessionStorage.removeItem('coming_from_detail');

    if (comingFromDetail) {
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get('page');
      if (pageParam) setPage(parseInt(pageParam, 10) || 1);

      const cacheKey = `cached_followups_${window.location.pathname}${window.location.search}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          setFollowUps(parsedCache.followUps || []);
          setTotalPages(Math.ceil((parsedCache.total || 0) / limit) || 1);
          setTotalItems(parsedCache.total || 0);
          setLoading(false);
          isCachedRef.current = true;
        } catch (_) {}
      }
    }
    const timer = setTimeout(() => {
      sessionStorage.removeItem('coming_from_detail');
    }, 1000);
    isRestoringRef.current = false;
    return () => clearTimeout(timer);
  }, []);



  const prevFiltersRef = useRef({
    priorityFilter,
    statusFilter,
    dateFrom,
    dateTo,
    teamFilter,
    agentFilter,
    search: debouncedSearch,
  });

  // URL synchronizer: writes active filters into search params, sets page = 1 on filter change
  useEffect(() => {
    if (isRestoringRef.current) return;

    const changed =
      prevFiltersRef.current.priorityFilter !== priorityFilter ||
      prevFiltersRef.current.statusFilter !== statusFilter ||
      prevFiltersRef.current.dateFrom !== dateFrom ||
      prevFiltersRef.current.dateTo !== dateTo ||
      prevFiltersRef.current.teamFilter !== teamFilter ||
      prevFiltersRef.current.agentFilter !== agentFilter ||
      prevFiltersRef.current.search !== debouncedSearch;

    prevFiltersRef.current = {
      priorityFilter,
      statusFilter,
      dateFrom,
      dateTo,
      teamFilter,
      agentFilter,
      search: debouncedSearch,
    };

    if (!changed) return;

    setPage(1);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams();
      params.set('page', '1');
      if (priorityFilter) params.set('priority', priorityFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (dateFrom) params.set('followUpDateFrom', dateFrom);
      if (dateTo) params.set('followUpDateTo', dateTo);
      if (teamFilter) params.set('teamId', teamFilter);
      if (agentFilter) params.set('agentId', agentFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [priorityFilter, statusFilter, dateFrom, dateTo, teamFilter, agentFilter, debouncedSearch]);

  // Save scroll position on scroll
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => {
      if (window.scrollY > 0) {
        const key = `scroll_position_${window.location.pathname}${window.location.search}`;
        sessionStorage.setItem(key, String(window.scrollY));
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page, priorityFilter, statusFilter, dateFrom, dateTo, teamFilter, agentFilter]);

  // Restore scroll position ONLY IF coming from detail page.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = `scroll_position_${window.location.pathname}${window.location.search}`;
    if (!isDetailReturnRef.current) {
      sessionStorage.removeItem(key);
      return;
    }

    if (!loading && followUps.length > 0) {
      const savedScroll = sessionStorage.getItem(key);
      if (savedScroll) {
        const scrollY = parseInt(savedScroll, 10);
        let raf1: number, raf2: number;
        raf1 = requestAnimationFrame(() => {
          raf2 = requestAnimationFrame(() => {
            window.scrollTo(0, scrollY);
          });
        });
        return () => {
          cancelAnimationFrame(raf1);
          cancelAnimationFrame(raf2);
        };
      }
    }
  }, [loading, followUps]);


  // Sync parameters from URL on back navigation
  useEffect(() => {
    if (!searchParams) return;
    const priorityParam = searchParams.get('priority');
    const statusParam = searchParams.get('status');
    const fromParam = searchParams.get('followUpDateFrom');
    const toParam = searchParams.get('followUpDateTo');
    const teamParam = searchParams.get('teamId');
    const agentParam = searchParams.get('agentId');
    const searchParam = searchParams.get('search');

    if (priorityParam !== null) setPriorityFilter(priorityParam);
    if (statusParam !== null) setStatusFilter(statusParam);
    if (fromParam !== null) setDateFrom(fromParam);
    if (toParam !== null) setDateTo(toParam);
    if (teamParam !== null) setTeamFilter(teamParam);
    if (agentParam !== null) setAgentFilter(agentParam);
    if (searchParam !== null) setSearchVal(searchParam);
  }, [searchParams]);

  // Clear team/agent selection if view all is lacking
  useEffect(() => {
    if (status === 'authenticated' && !canViewAll) {
      setAgentFilter('');
      setTeamFilter('');
    }
  }, [status, canViewAll]);

  // Fetch admin dropdowns (teams + agents)
  useEffect(() => {
    if (status !== 'authenticated' || !canViewAll) return;

    const fetchDropdowns = async () => {
      try {
        const [teamsRes, agentsRes] = await Promise.all([
          fetch('/api/teams'),
          fetch('/api/agents'),
        ]);
        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          setTeams(teamsData);
        }
        if (agentsRes.ok) {
          const agentsData = await agentsRes.json();
          setAgents(agentsData);
        }
      } catch (err) {
        console.error('Error fetching filters:', err);
      }
    };

    fetchDropdowns();
  }, [status, canViewAll]);

  // Clear agent filter if team selection changes and existing agent doesn't belong to new team
  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setTeamFilter(val);
    setAgentFilter('');
  };

  // Main fetch hook
  const fetchFollowUps = async () => {
    if (status !== 'authenticated') return;
    if (isCachedRef.current) {
      isCachedRef.current = false;
      return;
    }

    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    queryParams.set('page', String(page));
    queryParams.set('limit', String(limit));
    if (priorityFilter) queryParams.set('priority', priorityFilter);
    if (statusFilter) queryParams.set('status', statusFilter);
    if (dateFrom) queryParams.set('followUpDateFrom', dateFrom);
    if (dateTo) queryParams.set('followUpDateTo', dateTo);
    if (debouncedSearch) queryParams.set('search', debouncedSearch);
    if (canViewAll) {
      if (teamFilter) queryParams.set('teamId', teamFilter);
      if (agentFilter) queryParams.set('agentId', agentFilter);
    }

    try {
      const res = await fetch(`/api/follow-ups?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch follow-ups.');
      }
      const data = await res.json();
      setFollowUps(data.followUps || []);
      setTotalPages(Math.ceil((data.total || 0) / limit) || 1);
      setTotalItems(data.total || 0);

      // Write results to cache
      const cacheKey = `cached_followups_${window.location.pathname}?${queryParams.toString()}`;
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page, priorityFilter, statusFilter, dateFrom, dateTo, teamFilter, agentFilter, debouncedSearch]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('page', String(newPage));
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState(null, '', newUrl);
    }
  };

  const handleDeleteFollowUp = async (id: number) => {
    const res = await fetch(`/api/follow-ups/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('Delete failed.');
    }
    // Remove deleted record from local state and update counts
    setFollowUps((prev) => prev.filter((f) => f.followUpId !== id));
    setTotalItems((prev) => Math.max(0, prev - 1));
    // Clear all sessionStorage cache since list was altered
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('cached_followups_')) {
        sessionStorage.removeItem(key);
      }
    }
  };

  // Cascade filter agents in dropdown by selected team
  const filteredAgentsForDropdown = teamFilter
    ? agents.filter((a) => Number(a.teamId) === Number(teamFilter))
    : agents;

  return (
    <div className="agents-page-container">

      {/* Header and Add button */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Follow Ups</h1>
          <p className="page-subtitle">
            Manage scheduled prospects, follow-up timezones, and options.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="text"
            placeholder="Search by customer name or phone..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="filter-select-custom"
            style={{ width: '260px', height: '38px', padding: '0 12px' }}
          />
          {canCreate && (
            <Link href="/follow-ups/new" className="btn-primary-custom">
              Add Follow-ups
            </Link>
          )}
        </div>
      </div>

      {/* Advanced Filters Block */}
      <div className="filters-container">
        <div className="filters-row">
          {/* Admin filters */}
          {canViewAll && (
            <>
              <div className="filter-select-wrapper">
                <label htmlFor="teamFilter" className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.78rem' }}>
                  Team
                </label>
                <select
                  id="teamFilter"
                  value={teamFilter}
                  onChange={handleTeamChange}
                  className="filter-select-custom"
                >
                  <option value="">All Teams</option>
                  {teams.map((t) => (
                    <option key={t.teamId} value={t.teamId}>
                      {t.teamName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-select-wrapper">
                <label htmlFor="agentFilter" className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.78rem' }}>
                  Agent
                </label>
                <select
                  id="agentFilter"
                  value={agentFilter}
                  onChange={(e) => setAgentFilter(e.target.value)}
                  className="filter-select-custom"
                >
                  <option value="">All Agents</option>
                  {filteredAgentsForDropdown.map((a) => (
                    <option key={a.uid} value={a.uid}>
                      {a.nickname || a.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="filter-select-wrapper">
            <label htmlFor="priorityFilter" className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.78rem' }}>
              Priority
            </label>
            <select
              id="priorityFilter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="filter-select-custom"
            >
              <option value="">All Priorities</option>
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-select-wrapper">
            <label htmlFor="statusFilter" className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.78rem' }}>
              Status
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select-custom"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-select-wrapper">
            <label htmlFor="dateFrom" className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.78rem' }}>
              Date From
            </label>
            <input
              type="date"
              id="dateFrom"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="filter-select-custom"
            />
          </div>

          <div className="filter-select-wrapper">
            <label htmlFor="dateTo" className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.78rem' }}>
              Date To
            </label>
            <input
              type="date"
              id="dateTo"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="filter-select-custom"
            />
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      {error && (
        <div className="error-box" style={{ padding: '16px', borderRadius: '8px', border: '1px solid #fee2e2', marginBottom: '16px' }}>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center p-8">
          <p className="text-slate-400">Loading follow-ups...</p>
        </div>
      ) : (
        <>
          <FollowUpList
            followUps={followUps}
            canViewAll={canViewAll}
            onDelete={handleDeleteFollowUp}
          />

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="pagination-bar">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              <div className="pagination-info" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Page <strong>{page}</strong> of <strong>{totalPages}</strong> (Total: {totalItems} follow-ups)
              </div>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
      <GlobalFollowUpNotifications />
    </div>
  );
}

export default function FollowUpListContainer({ initialAgents, initialTeams }: FollowUpListContainerProps) {
  return (
    <Suspense fallback={
      <div className="text-center p-8">
        <p className="text-slate-400">Loading follow-ups container...</p>
      </div>
    }>
      <FollowUpListContainerContent initialAgents={initialAgents} initialTeams={initialTeams} />
    </Suspense>
  );
}
