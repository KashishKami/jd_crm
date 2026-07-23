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
    const listBase = parts.length > 0 ? `/${parts[0]}` : '/';

    const existing = sessionStorage.getItem('coming_from_detail');

    // Only overwrite if there is no saved value, OR the saved value is just the
    // bare root path (no query params). If the list already stored a full URL like
    // /orders?page=3&status=..., we must NOT clobber it — BackButton reads this
    // value to navigate back to the exact filtered/paginated position.
    if (!existing || existing === listBase) {
      sessionStorage.setItem('coming_from_detail', listBase);
    }
  }, [pathname]);

  return null;
}

