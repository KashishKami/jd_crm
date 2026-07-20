'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { fadeInPage } from '../lib/animations';
import { useLenis } from './LenisProvider';
import GlobalFollowUpNotifications from './GlobalFollowUpNotifications';

interface LayoutShellProps {
  children: React.ReactNode;
}

export default function LayoutShell({ children }: LayoutShellProps) {
  const pathname = usePathname();
  const { lenis } = useLenis();
  const mainRef = useRef<HTMLElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Animate page fade-in and reset scroll on path changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const comingFromDetail = sessionStorage.getItem('coming_from_detail');
    const parts = (pathname || '').split('/').filter(Boolean);
    const currentBaseListPath = parts.length > 0 ? `/${parts[0]}` : '/';
    const isExactListPage = parts.length === 1;
    const isBackFromDetail = Boolean(comingFromDetail && comingFromDetail === currentBaseListPath && isExactListPage);

    if (mainRef.current) {
      if (isBackFromDetail) {
        mainRef.current.style.opacity = '1';
      } else {
        fadeInPage(mainRef.current);
      }
    }
    if (lenis) {
      if (!isBackFromDetail) {
        lenis.scrollTo(0, { immediate: true });
      }
      lenis.resize();
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSidebarOpen(false); // Close sidebar on route changes
  }, [pathname, lenis]);



  const isPublicRoute = pathname === '/login' || pathname === '/access-denied';

  const pathParts = pathname.split('/');
  const isSpecialMarginPage = 
    pathname === '/orders/new' ||
    pathname === '/follow-ups/new' ||
    (pathParts.length === 4 && (pathParts[1] === 'orders' || pathParts[1] === 'follow-ups') && pathParts[3] === 'edit') ||
    (pathParts.length === 3 && (pathParts[1] === 'orders' || pathParts[1] === 'follow-ups') && pathParts[2] !== 'new');

  const mainClassName = `main-content${isSpecialMarginPage ? ' special-margin-page' : ''}`;

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className={`app-container ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar ref={sidebarRef} onToggle={() => setSidebarOpen(false)} />
      
      {sidebarOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setSidebarOpen(false)}
          style={{ display: 'block' }}
        />
      )}

      <main ref={mainRef} className={mainClassName} style={{ position: 'relative' }}>
        {children}
      </main>
      {pathname !== '/follow-ups' && <GlobalFollowUpNotifications />}
    </div>
  );
}
