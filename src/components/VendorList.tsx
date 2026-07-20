'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { hasPermission } from '../service/permission.service';
import { VendorWithMetrics } from '../types/vendor';
import { fadeInStagger, fadeInPage } from '../lib/animations';
import { gsap } from 'gsap';
import VendorStatusBadge from './VendorStatusBadge';

function VendorListContent() {
  const { data: session } = useSession();
  const [vendors, setVendors] = useState<VendorWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    const param = new URLSearchParams(window.location.search).get('status');
    return param !== null ? parseInt(param, 10) : 1; // 1 = Active, 0 = Blacklisted
  });
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const isCachedRef = useRef(false);

  // Pagination states — lazy-initialized from URL so back-navigation restores
  // the correct page number before any effect runs (same pattern as filters).
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [page, setPage] = useState(() => {
    if (typeof window === 'undefined') return 1;
    const comingFromDetail = sessionStorage.getItem('coming_from_detail');
    const isVendorsDetailReturn = comingFromDetail === '/vendors' || Boolean(comingFromDetail && comingFromDetail.startsWith('/vendors'));
    if (isVendorsDetailReturn) {
      return parseInt(new URLSearchParams(window.location.search).get('page') || '1', 10) || 1;
    }
    return 1;
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 20;
  const [hasAnimated, setHasAnimated] = useState(() => {
    if (typeof window === 'undefined') return false;
    const comingFromDetail = sessionStorage.getItem('coming_from_detail');
    if (comingFromDetail === '/vendors' || Boolean(comingFromDetail && comingFromDetail.startsWith('/vendors'))) return true;
    const scrollKey = `scroll_position_${window.location.pathname}${window.location.search}`;
    const savedScroll = sessionStorage.getItem(scrollKey);
    return !!(savedScroll && parseInt(savedScroll, 10) > 0);
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const tableRowsRef = useRef<HTMLTableSectionElement>(null);
  const animCtxRef = useRef<gsap.Context | null>(null);
  const isRestoringRef = useRef(true);
  const isDetailReturnRef = useRef<boolean>(
    typeof window !== 'undefined' &&
    (sessionStorage.getItem('coming_from_detail') === '/vendors' ||
     Boolean(sessionStorage.getItem('coming_from_detail')?.startsWith('/vendors')))
  );



  // Synchronize on mount ONLY if coming from a vendor details page.
  useEffect(() => {
    const comingFromDetailPath = sessionStorage.getItem('coming_from_detail');
    const comingFromDetail = comingFromDetailPath === '/vendors' || Boolean(comingFromDetailPath && comingFromDetailPath.startsWith('/vendors'));

    if (comingFromDetailPath) {
      sessionStorage.removeItem('coming_from_detail');
    }

    if (comingFromDetail) {
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get('page');
      if (pageParam) setPage(parseInt(pageParam, 10) || 1);

      // Load cache
      const cacheKey = `cached_vendors_${window.location.pathname}${window.location.search}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          setVendors(parsedCache.data || parsedCache || []);
          setTotalPages(parsedCache.pages || 1);
          setTotalItems(parsedCache.total || 0);
          setLoading(false);
          isCachedRef.current = true;
        } catch (_) {}
      }

      // Check if a saved scroll position exists to skip stagger animations
      const scrollKey = `scroll_position_${window.location.pathname}${window.location.search}`;
      const savedScroll = sessionStorage.getItem(scrollKey);
      if (savedScroll && parseInt(savedScroll, 10) > 0) {
        setHasAnimated(true);
      }
    }
    const timer = setTimeout(() => {
      sessionStorage.removeItem('coming_from_detail');
    }, 1000);
    isRestoringRef.current = false;
    return () => clearTimeout(timer);
  }, []);



  const permissions = session?.user?.userPermissions || '';
  const canCreate = hasPermission(permissions, 'vendors:create');
  const canEdit = hasPermission(permissions, 'vendors:edit');

  // Synchronize URL search parameters with page state
  useEffect(() => {
    if (!searchParams) return;
    const pageParam = searchParams.get('page');
    const parsedPage = pageParam ? (parseInt(pageParam, 10) || 1) : 1;
    setPage(prev => parsedPage !== prev ? parsedPage : prev);
  }, [searchParams]);


  const prevFiltersRef = useRef({
    statusFilter,
  });

  // Sync all active filters + page into the URL whenever they change
  useEffect(() => {
    if (isRestoringRef.current) return;

    // Check if statusFilter actually changed
    const changed = prevFiltersRef.current.statusFilter !== statusFilter;

    // Update the ref
    prevFiltersRef.current = {
      statusFilter,
    };

    if (!changed) return;

    setPage(1);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('status', String(statusFilter));
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [statusFilter]);

  // Save scroll position to sessionStorage on scroll
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
  }, [page, statusFilter]);

  // Restore scroll position when loading completes ONLY IF coming from detail page.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = `scroll_position_${window.location.pathname}${window.location.search}`;
    if (!isDetailReturnRef.current) {
      sessionStorage.removeItem(key);
      return;
    }

    if (!loading && vendors.length > 0) {
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
  }, [loading, vendors]);


  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const params = new URLSearchParams(window.location.search);
      params.set('page', String(newPage));
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState(null, '', newUrl);
    }
  };


  useEffect(() => {
    let active = true;
    const fetchVendors = async () => {
      if (!isCachedRef.current) {
        setLoading(true);
      }
      setError(null);
      try {
        const res = await fetch(`/api/vendors?status=${statusFilter}&page=${page}&limit=${limit}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch vendors: ${res.statusText}`);
        }
        const data = await res.json();
        if (active) {
          if (data && data.data) {
            setVendors(data.data);
            setTotalPages(data.pages || 1);
            setTotalItems(data.total || 0);

            // Save to sessionStorage
            if (typeof window !== 'undefined') {
              const key = `cached_vendors_${window.location.pathname}${window.location.search}`;
              sessionStorage.setItem(key, JSON.stringify(data));
            }
          } else {
            setVendors(data || []);
            setTotalPages(1);
            setTotalItems(data ? data.length : 0);

            // Save to sessionStorage
            if (typeof window !== 'undefined') {
              const key = `cached_vendors_${window.location.pathname}${window.location.search}`;
              sessionStorage.setItem(key, JSON.stringify(data));
            }
          }
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'An error occurred while fetching vendors.';
        if (active) {
          setError(errMsg);
        }
      } finally {
        if (active) {
          setLoading(false);
          isCachedRef.current = false;
        }
      }
    };

    fetchVendors();

    return () => {
      active = false;
    };
  }, [statusFilter, refetchTrigger, page]);

  // Page entrance animation
  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      fadeInPage(containerRef.current!);
    });
    return () => ctx.revert();
  }, []);

  // Stagger animation on table rows — fires once per mount.
  useEffect(() => {
    if (tableRowsRef.current && vendors.length > 0 && !hasAnimated) {
      const rows = tableRowsRef.current.querySelectorAll('tr');
      animCtxRef.current = gsap.context(() => {
        fadeInStagger(rows, 0.05, () => {
          setHasAnimated(true);
        });
      });
    }
  }, [vendors, hasAnimated]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animCtxRef.current) {
        animCtxRef.current.revert();
      }
    };
  }, []);

  const handleToggleStatus = async (vendorId: number, currentStatus: number) => {
    const actionText = currentStatus === 1 ? 'blacklist' : 'restore';
    if (!confirm(`Are you sure you want to ${actionText} this vendor?`)) {
      return;
    }

    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      const res = await fetch(`/api/vendors/${vendorId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update vendor status');
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
          <h1 className="page-title">Vendor Directory</h1>
          <p className="page-subtitle">Manage auto parts suppliers, ratings, status, and purchase history</p>
        </div>
        {canCreate && (
          <Link href="/vendors/new" className="btn-primary-custom">
            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Create New Vendor
          </Link>
        )}
      </div>

      <div className="filter-bar">
        <div className="tab-group">
          <button
            onClick={() => setStatusFilter(1)}
            className={`tab-btn ${statusFilter === 1 ? 'active' : ''}`}
          >
            Active Vendors
          </button>
          <button
            onClick={() => setStatusFilter(0)}
            className={`tab-btn ${statusFilter === 0 ? 'active' : ''}`}
          >
            Blacklisted Suppliers
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
      ) : vendors.length === 0 ? (
        <div className="empty-box">
          <p>No vendors found matching this criteria.</p>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="custom-table table-responsive">
            <thead>
              <tr>
                <th>Vendor&apos;s Name</th>
                <th>Phone Number</th>
                <th>Email</th>
                <th>Contact Person</th>
                <th>Total Orders</th>
                <th>+ Orders</th>
                <th>- Orders</th>
                <th>Status</th>
                <th className="actions-cell">Action</th>
              </tr>
            </thead>
            <tbody ref={tableRowsRef}>
              {vendors.map((vendor) => (
                <tr key={vendor.vendorId} style={{ opacity: hasAnimated ? 1 : 0 }}>
                  <td>
                    <Link href={`/vendors/${vendor.vendorId}`} prefetch={false} className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                      {vendor.vendorName}
                    </Link>
                  </td>
                  <td><span className="font-mono text-slate-600">{vendor.vendorPhone}</span></td>
                  <td>{vendor.vendorEmail || <span className="text-slate-400">—</span>}</td>
                  <td>{vendor.vendorContactPerson}</td>
                  <td><span className="font-semibold text-slate-800">{vendor.totalOrders ?? 0}</span></td>
                  <td><span className="text-emerald-600 font-semibold">{vendor.positiveOrders ?? 0}</span></td>
                  <td><span className="text-rose-600 font-semibold">{vendor.negativeOrders ?? 0}</span></td>
                  <td>
                    <VendorStatusBadge status={vendor.vendorStatus} />
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <Link href={`/vendors/${vendor.vendorId}`} prefetch={false} className="action-link-btn view">
                        View
                      </Link>
                      {canEdit && (
                        <>
                          <Link href={`/vendors/${vendor.vendorId}/edit`} prefetch={false} className="action-link-btn edit">
                            Edit
                          </Link>
                          <button
                            onClick={() => handleToggleStatus(vendor.vendorId, vendor.vendorStatus)}
                            className={`action-btn-status ${vendor.vendorStatus === 1 ? 'deactivate' : 'activate'}`}
                          >
                            {vendor.vendorStatus === 1 ? 'Blacklist' : 'Restore'}
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
              onClick={() => handlePageChange(Math.max(page - 1, 1))} 
              disabled={page === 1}
              className="pagination-btn"
            >
              Previous
            </button>
            <span className="pagination-info">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> (Total: {totalItems})
            </span>
            <button 
              onClick={() => handlePageChange(Math.min(page + 1, totalPages))} 
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

export default function VendorList() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <VendorListContent />
    </Suspense>
  );
}
