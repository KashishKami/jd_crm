'use client';

import React from 'react';
import Link from 'next/link';

interface EditDetailLinkProps {
  href: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * Drop-in replacement for <Link> on detail pages' Edit buttons.
 * Before navigating to the edit form, saves the current detail page URL
 * into sessionStorage under `edit_return_to`. The edit form reads this key
 * on save/cancel to navigate back to the correct page (detail or list).
 */
export default function EditDetailLink({ href, className, style, children }: EditDetailLinkProps) {
  const handleClick = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('edit_return_to', window.location.pathname + window.location.search);
    }
  };

  return (
    <Link href={href} className={className} style={style} onClick={handleClick}>
      {children}
    </Link>
  );
}
