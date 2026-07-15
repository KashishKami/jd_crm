'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
  label?: string;
  className?: string;
}

export default function BackButton({ label = 'Back', className = 'btn-secondary-custom' }: BackButtonProps) {
  const router = useRouter();

  useEffect(() => {
    sessionStorage.setItem('coming_from_detail', 'true');
  }, []);

  return (
    <button onClick={() => router.back()} className={className}>
      {label}
    </button>
  );
}
