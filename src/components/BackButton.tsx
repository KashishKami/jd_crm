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
      const listPath = parts.length > 0 ? `/${parts[0]}` : '/';
      sessionStorage.setItem('coming_from_detail', listPath);
    }
    router.back();
  };

  return (
    <button onClick={handleBack} className={className}>
      {label}
    </button>
  );
}

