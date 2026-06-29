'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { fadeInPage } from '../lib/animations';
import { useLenis } from './LenisProvider';

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
    if (mainRef.current) {
      fadeInPage(mainRef.current);
    }
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
      lenis.resize();
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSidebarOpen(false); // Close sidebar on route changes
  }, [pathname, lenis]);

  const isPublicRoute = pathname === '/login' || pathname === '/access-denied';

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

      <main ref={mainRef} className="main-content" style={{ position: 'relative' }}>
        {children}
      </main>
    </div>
  );
}
