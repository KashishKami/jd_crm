'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { slideInSidebar, fadeInPage } from '../lib/animations';

interface LayoutShellProps {
  children: React.ReactNode;
}

export default function LayoutShell({ children }: LayoutShellProps) {
  const { status } = useSession();
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load sidebar preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-open');
    if (saved !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSidebarOpen(saved === 'true');
    }
  }, []);

  const handleToggleSidebar = (open: boolean) => {
    setSidebarOpen(open);
    localStorage.setItem('sidebar-open', String(open));
  };

  // Animate sidebar when authenticated status is reached
  useEffect(() => {
    if (status === 'authenticated' && sidebarRef.current) {
      const hasAnimated = sessionStorage.getItem('sidebar-animated');
      if (!hasAnimated) {
        slideInSidebar(sidebarRef.current);
        sessionStorage.setItem('sidebar-animated', 'true');
      }
    }
  }, [status]);

  // Animate page fade-in on path changes
  useEffect(() => {
    if (mainRef.current) {
      fadeInPage(mainRef.current);
    }
  }, [pathname]);

  const isPublicRoute = pathname === '/login' || pathname === '/access-denied';

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className={`app-container ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
      <Sidebar ref={sidebarRef} onToggle={() => handleToggleSidebar(false)} />
      <main ref={mainRef} className="main-content" style={{ position: 'relative' }}>
        {!sidebarOpen && (
          <button
            onClick={() => handleToggleSidebar(true)}
            className="floating-sidebar-trigger"
            title="Open Navigation"
            aria-label="Open Navigation"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '20px', height: '20px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        {children}
      </main>
    </div>
  );
}
