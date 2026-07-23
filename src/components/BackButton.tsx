'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface BackButtonProps {
  label?: string;
  className?: string;
}

export default function BackButton({ label = 'Back', className = 'btn-secondary-custom' }: BackButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      const parts = (pathname || '').split('/').filter(Boolean);
      const listBase = parts.length > 0 ? `/${parts[0]}` : '/';

      // Use the full saved list URL (including page + filter query params) if available.
      // coming_from_detail is set by the list component when the user clicks through to
      // this detail page, and stores the complete URL (e.g. /orders?page=3&status=...).
      const savedReturnUrl = sessionStorage.getItem('coming_from_detail');

      if (savedReturnUrl && savedReturnUrl.startsWith(listBase)) {
        // Navigate directly to the exact list URL — restores page, filters, and scroll.
        router.push(savedReturnUrl);
      } else {
        // Fallback: no saved state (e.g. user opened detail via direct URL).
        // Just go to the list root; coming_from_detail is still set so the list
        // will attempt cache/scroll restoration if any saved state exists.
        sessionStorage.setItem('coming_from_detail', listBase);
        router.push(listBase);
      }
    }
  };

  return (
    <button onClick={handleBack} className={className}>
      {label}
    </button>
  );
}

