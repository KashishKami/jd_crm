import React from 'react';
import Link from 'next/link';

export default function AccessDenied() {
  return (
    <div className="denied-container">
      <div className="denied-card">
        <div className="denied-icon">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="denied-title">Access Denied</h2>
        <p className="denied-message">
          You do not have the required permissions to view this resource. Please contact your system administrator if you believe this is an error.
        </p>
        <Link href="/" className="btn-primary">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
