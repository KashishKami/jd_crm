'use client';

import React, { forwardRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { hasPermission } from '../service/permission.service';

const Sidebar = forwardRef<HTMLElement, {}>(function Sidebar(props, ref) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status !== 'authenticated' || !session?.user) {
    return null;
  }

  const permissions = session.user.userPermissions;
  const username = session.user.name || 'User';
  const email = session.user.email || '';
  const nickname = session.user.nickname ? `(${session.user.nickname})` : '';

  // Helper to determine if link is active
  const isActive = (path: string) => pathname === path;

  return (
    <aside ref={ref} className="sidebar">
      <div className="sidebar-header">
        <div className="logo-area">
          <span className="logo-icon">JD</span>
          <span className="logo-text">CRM Monolith</span>
        </div>
        <div className="user-profile">
          <div className="user-avatar">{username[0]?.toUpperCase()}</div>
          <div className="user-info">
            <h4 className="user-name">{username} {nickname}</h4>
            <p className="user-email">{email}</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Navigation</div>
        <ul className="nav-list">
          {/* Dashboard is always available to logged-in users */}
          <li className="nav-item">
            <Link
              href="/"
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
              <span>Dashboard</span>
            </Link>
          </li>

          {/* Conditional Orders Navigation */}
          {hasPermission(permissions, 'orders:view') && (
            <li className="nav-item">
              <Link
                href="/orders"
                className={`nav-link ${isActive('/orders') ? 'active' : ''}`}
              >
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Orders</span>
              </Link>
            </li>
          )}

          {/* Conditional Vendors Navigation */}
          {hasPermission(permissions, 'vendors:view') && (
            <li className="nav-item">
              <Link
                href="/vendors"
                className={`nav-link ${isActive('/vendors') ? 'active' : ''}`}
              >
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Vendors</span>
              </Link>
            </li>
          )}

          {/* Conditional Agents Navigation */}
          {hasPermission(permissions, 'agents:view') && (
            <li className="nav-item">
              <Link
                href="/agents"
                className={`nav-link ${isActive('/agents') ? 'active' : ''}`}
              >
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Agents</span>
              </Link>
            </li>
          )}

          {/* Conditional Gateways Navigation */}
          {hasPermission(permissions, 'gateways:view') && (
            <li className="nav-item">
              <Link
                href="/gateways"
                className={`nav-link ${isActive('/gateways') ? 'active' : ''}`}
              >
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M12 2v9m-4-6h8" />
                </svg>
                <span>Gateways</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="logout-btn"
        >
          <svg className="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
});

export default Sidebar;
