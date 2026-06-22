'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import Sidebar from './Sidebar';

interface LayoutShellProps {
  children: React.ReactNode;
}

export default function LayoutShell({ children }: LayoutShellProps) {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
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
          <span>Loading JD CRM...</span>
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return (
      <div className="app-container">
        <Sidebar />
        <main className="main-content">{children}</main>
      </div>
    );
  }

  // Render standalone for unauthenticated views (e.g. login page)
  return <>{children}</>;
}
