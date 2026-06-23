import React from 'react';

interface VendorStatusBadgeProps {
  status: number;
}

export default function VendorStatusBadge({ status }: VendorStatusBadgeProps) {
  if (status === 1) {
    return (
      <span className="status-dot-badge status-active">
        Active
      </span>
    );
  }
  
  return (
    <span className="status-dot-badge status-inactive">
      Blacklisted
    </span>
  );
}
