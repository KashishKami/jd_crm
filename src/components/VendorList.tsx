'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { hasPermission } from '../service/permission.service';
import { VendorWithMetrics } from '../types/vendor';
import { staggerEntrance, fadeInPage } from '../lib/animations';
import { gsap } from 'gsap';
import VendorStatusBadge from './VendorStatusBadge';

export default function VendorList() {
  const { data: session } = useSession();
  const [vendors, setVendors] = useState<VendorWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<number>(1); // 1 = Active, 0 = Blacklisted
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 20;

  const containerRef = useRef<HTMLDivElement>(null);
  const tableRowsRef = useRef<HTMLTableSectionElement>(null);

  const permissions = session?.user?.userPermissions || '';
  const canCreate = hasPermission(permissions, 'vendors:create');
  const canEdit = hasPermission(permissions, 'vendors:edit');

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    let active = true;
    const fetchVendors = async () => {
      setLoading(true);
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
          } else {
            setVendors(data || []);
            setTotalPages(1);
            setTotalItems(data ? data.length : 0);
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

  // Stagger animation on table rows
  useEffect(() => {
    if (tableRowsRef.current && vendors.length > 0) {
      const rows = tableRowsRef.current.querySelectorAll('tr');
      const ctx = gsap.context(() => {
        staggerEntrance(rows);
      });
      return () => ctx.revert();
    }
  }, [vendors]);

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
                <tr key={vendor.vendorId} style={{ opacity: 0 }}>
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
