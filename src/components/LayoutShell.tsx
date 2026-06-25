'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import { fadeInPage } from '../lib/animations';
import { useLenis } from './LenisProvider';

interface LayoutShellProps {
  children: React.ReactNode;
}

export default function LayoutShell({ children }: LayoutShellProps) {
  const pathname = usePathname();
  const { lenis } = useLenis();
  const mainRef = useRef<HTMLElement>(null);

  // Animate page fade-in and reset scroll on path changes
  useEffect(() => {
    if (mainRef.current) {
      fadeInPage(mainRef.current);
    }
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
      lenis.resize();
    }
  }, [pathname, lenis]);

  const isPublicRoute = pathname === '/login' || pathname === '/access-denied';

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="app-container">
      <Navbar />
      <main ref={mainRef} className="main-content" style={{ position: 'relative' }}>
        {children}
      </main>
    </div>
  );
}
