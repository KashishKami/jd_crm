'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Invisible component that sets a sessionStorage flag when a detail page mounts.
 * List pages read this flag to know if they are being restored from their own detail page.
 */
export default function DetailPageMarker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const parts = (pathname || '').split('/').filter(Boolean);
    const listPath = parts.length > 0 ? `/${parts[0]}` : '/';
    sessionStorage.setItem('coming_from_detail', listPath);
  }, [pathname]);

  return null;
}

