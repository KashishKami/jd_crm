'use client';

import React, { useEffect, useRef } from 'react';
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

  if (status === 'loading' && !isPublicRoute) {
    return (
      <div className="app-container">
        <Sidebar ref={sidebarRef} />
        <main className="main-content">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              backgroundColor: '#f8fafc',
              fontFamily: 'sans-serif',
            }}
          >
            <div
              style={{
                fontSize: '1.1rem',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              {/* Subtle micro-animation loading dot */}
              <div
                className="loading-dot"
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '50%',
                }}
              />
              <span>Loading...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (status === 'authenticated') {
    return (
      <div className="app-container">
        <Sidebar ref={sidebarRef} />
        <main ref={mainRef} className="main-content">{children}</main>
      </div>
    );
  }

  // Render standalone for unauthenticated views (e.g. login page)
  return <>{children}</>;
}
