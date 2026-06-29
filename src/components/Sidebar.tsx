'use client';

import React, { forwardRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { hasPermission } from '../service/permission.service';

interface SidebarProps {
  onToggle?: () => void;
}

const Sidebar = forwardRef<HTMLElement, SidebarProps>(function Sidebar({ onToggle }, ref) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === 'unauthenticated') {
    return null;
  }

  if (status === 'loading' || !session?.user) {
    return <aside ref={ref} className="sidebar" aria-label="Loading Navigation" />;
  }

  const permissions = session.user.userPermissions;

  // Helper to determine if link is active
  const isActive = (path: string) => pathname === path;

  const handleLinkClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768 && onToggle) {
      onToggle();
    }
  };

  return (
    <aside ref={ref} className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
      <nav className="sidebar-nav" style={{ padding: '24px 16px', flex: 1 }}>
        <div className="nav-section-title" style={{ color: '#ffffff', opacity: 0.6, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', paddingLeft: '12px', fontWeight: 600 }}>
          Menu
        </div>
        <ul className="nav-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', margin: 0, padding: 0 }}>
          {/* Dashboard is always available to logged-in users */}
          <li className="nav-item">
            <Link
              href="/"
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
              onClick={handleLinkClick}
              style={{ textDecoration: 'none', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
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
                onClick={handleLinkClick}
                style={{ textDecoration: 'none', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
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
                onClick={handleLinkClick}
                style={{ textDecoration: 'none', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
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
                onClick={handleLinkClick}
                style={{ textDecoration: 'none', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
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
                onClick={handleLinkClick}
                style={{ textDecoration: 'none', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M12 2v9m-4-6h8" />
                </svg>
                <span>Gateways</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
});

export default Sidebar;
