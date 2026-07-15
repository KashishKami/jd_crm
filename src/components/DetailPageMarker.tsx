'use client';

import { useEffect } from 'react';

/**
 * Invisible component that sets a sessionStorage flag when a detail page mounts.
 * List pages read this flag to know they should restore pagination + scroll position.
 */
export default function DetailPageMarker() {
  useEffect(() => {
    sessionStorage.setItem('coming_from_detail', 'true');
  }, []);
  return null;
}
