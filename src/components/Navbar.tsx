'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { hasPermission } from '../service/permission.service';

export default function Navbar() {
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
      <div className="navbar-left">
        <Link href="/" className="navbar-logo">
          <span className="logo-icon">JD</span>
          <span className="logo-text">CRM</span>
        </Link>
      </div>

      <nav className="navbar-middle swipable-nav">
        <ul className="nav-pills">
          <li className="nav-item">
            <Link
              href="/"
              className={`nav-pill-btn ${isActive('/') ? 'active' : ''}`}
            >
              Dashboard
            </Link>
          </li>

          {hasPermission(permissions, 'orders:view') && (
            <li className="nav-item">
              <Link
                href="/orders"
                className={`nav-pill-btn ${isActive('/orders') ? 'active' : ''}`}
              >
                Orders
              </Link>
            </li>
          )}

          {hasPermission(permissions, 'vendors:view') && (
            <li className="nav-item">
              <Link
                href="/vendors"
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
                className={`nav-pill-btn ${isActive('/gateways') ? 'active' : ''}`}
              >
                Gateways
              </Link>
            </li>
          )}
        </ul>
      </nav>

      <div className="navbar-right" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="user-profile-btn"
          aria-label="User Profile"
          aria-expanded={dropdownOpen}
          data-testid="user-profile-btn"
        >
          <span className="user-avatar-small">{username[0]?.toUpperCase()}</span>
          <span className="user-name-small">{username}</span>
        </button>

        {dropdownOpen && (
          <div className="profile-dropdown-menu" data-testid="profile-dropdown-menu">
            <div className="dropdown-user-info">
              <span className="dropdown-avatar">{username[0]?.toUpperCase()}</span>
              <div className="dropdown-details">
                <span className="dropdown-name">{username}</span>
                <span className="dropdown-email">{session.user.email || 'Staff Member'}</span>
              </div>
            </div>
            <div className="dropdown-divider"></div>
            <button
              disabled
              className="dropdown-item-btn settings-placeholder"
              data-testid="settings-btn"
            >
              <svg className="dropdown-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings <span className="settings-coming-soon">(Soon)</span>
            </button>
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
