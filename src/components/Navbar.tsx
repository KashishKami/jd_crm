'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { hasPermission } from '../service/permission.service';
import GlobalSearchBar from './GlobalSearchBar';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (status === 'unauthenticated') {
    return null;
  }

  if (status === 'loading' || !session?.user) {
    return (
      <header className="top-navbar">
        <div className="navbar-logo">
          <span className="logo-icon">JD</span>
          <span className="logo-text">CRM</span>
        </div>
      </header>
    );
  }

  const permissions = session.user.userPermissions;
  const username = session.user.name || 'User';

  const isActive = (path: string) => {
    const currentPath = pathname || '/';
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  return (
    <header className="top-navbar">
      <div className="navbar-left-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 101 }}>
        {/* Mobile Hamburger menu toggle button */}
        <button 
          onClick={onToggleSidebar} 
          className="hamburger-btn" 
          aria-label="Open Navigation Drawer"
          data-testid="hamburger-btn"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '20px', height: '20px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link href="/" prefetch={false} className="navbar-logo">
          <span className="logo-icon">JD</span>
          <span className="logo-text">CRM</span>
        </Link>
      </div>

      {/* Mobile-only search bar rendered inline between logo and avatar */}
      <div className="mobile-search-wrapper" style={{ zIndex: 101 }}>
        <GlobalSearchBar />
      </div>

      <div className="navbar-aligned-content">
        {/* Navigation pills aligned directly above page heading */}
        <nav className="navbar-middle swipable-nav" style={{ margin: 0 }}>
          <ul className="nav-pills" style={{ margin: 0, padding: 0 }}>
            <li className="nav-item">
              <Link
                href="/"
                prefetch={false}
                onClick={() => sessionStorage.removeItem('coming_from_detail')}
                className={`nav-pill-btn ${isActive('/') ? 'active' : ''}`}
              >
                Dashboard
              </Link>
            </li>

            {(hasPermission(permissions, 'orders:view') || hasPermission(permissions, 'orders:create')) && (
              <li className="nav-item">
                <Link
                  href="/orders"
                  prefetch={false}
                  onClick={() => sessionStorage.removeItem('coming_from_detail')}
                  className={`nav-pill-btn ${isActive('/orders') ? 'active' : ''}`}
                >
                  Orders
                </Link>
              </li>
            )}

            {(hasPermission(permissions, 'follow-ups:view') || hasPermission(permissions, 'follow-ups:create')) && (
              <li className="nav-item">
                <Link
                  href="/follow-ups"
                  prefetch={false}
                  onClick={() => sessionStorage.removeItem('coming_from_detail')}
                  className={`nav-pill-btn ${isActive('/follow-ups') ? 'active' : ''}`}
                >
                  Follow Ups
                </Link>
              </li>
            )}

            {(hasPermission(permissions, 'call-dispositions:view') || hasPermission(permissions, 'call-dispositions:create')) && (
              <li className="nav-item">
                <Link
                  href="/call-dispositions"
                  prefetch={false}
                  onClick={() => sessionStorage.removeItem('coming_from_detail')}
                  className={`nav-pill-btn ${isActive('/call-dispositions') ? 'active' : ''}`}
                >
                  Call Dispositions
                </Link>
              </li>
            )}

            {hasPermission(permissions, 'vendors:view') && (
              <li className="nav-item">
                <Link
                  href="/vendors"
                  prefetch={false}
                  onClick={() => sessionStorage.removeItem('coming_from_detail')}
                  className={`nav-pill-btn ${isActive('/vendors') ? 'active' : ''}`}
                >
                  Vendors
                </Link>
              </li>
            )}

            {hasPermission(permissions, 'agents:view') && (
              <li className="nav-item">
                <Link
                  href="/agents"
                  prefetch={false}
                  onClick={() => sessionStorage.removeItem('coming_from_detail')}
                  className={`nav-pill-btn ${isActive('/agents') ? 'active' : ''}`}
                >
                  Agents
                </Link>
              </li>
            )}

            {hasPermission(permissions, 'gateways:view') && (
              <li className="nav-item">
                <Link
                  href="/gateways"
                  prefetch={false}
                  onClick={() => sessionStorage.removeItem('coming_from_detail')}
                  className={`nav-pill-btn ${isActive('/gateways') ? 'active' : ''}`}
                >
                  Gateways
                </Link>
              </li>
            )}
          </ul>

        </nav>

        {/* Desktop-only search bar aligned on the other end of the content grid */}
        <div className="desktop-search-wrapper">
          <GlobalSearchBar />
        </div>
      </div>

      <div className="navbar-right" ref={dropdownRef} style={{ zIndex: 101 }}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="user-profile-btn"
          aria-label="User Profile"
          aria-expanded={dropdownOpen}
          data-testid="user-profile-btn"
        >
          <span className="user-avatar-small">{username[0]?.toUpperCase()}</span>
        </button>

        {dropdownOpen && (
          <div className="profile-dropdown-menu" data-testid="profile-dropdown-menu">
            <Link
              href={`/agents/${session.user.id}`}
              prefetch={false}
              className="dropdown-user-info dropdown-user-info-link"
              onClick={() => setDropdownOpen(false)}
              style={{ textDecoration: 'none', color: 'inherit', display: 'flex', width: '100%' }}
            >
              <span className="dropdown-avatar">{username[0]?.toUpperCase()}</span>
              <div className="dropdown-details">
                <span className="dropdown-name">{username}</span>
                <span className="dropdown-email">{session.user.email || 'Staff Member'}</span>
              </div>
            </Link>
            <div className="dropdown-divider"></div>
            
            <Link
              href={`/agents/${session.user.id}`}
              prefetch={false}
              className="dropdown-item-btn"
              data-testid="profile-btn"
              onClick={() => setDropdownOpen(false)}
            >
              <svg className="dropdown-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Profile
            </Link>

            {hasPermission(permissions, 'settings:manage-permissions') && (
              <Link
                href="/settings/roles"
                prefetch={false}
                className="dropdown-item-btn"
                data-testid="settings-btn"
                onClick={() => setDropdownOpen(false)}
              >
                <svg className="dropdown-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Roles and Permissions
              </Link>
            )}
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="dropdown-item-btn logout-action"
              data-testid="logout-btn"
            >
              <svg className="dropdown-item-icon logout-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
