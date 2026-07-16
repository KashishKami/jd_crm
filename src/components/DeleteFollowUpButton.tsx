'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeleteFollowUpButtonProps {
  followUpId: number;
}

export default function DeleteFollowUpButton({ followUpId }: DeleteFollowUpButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this follow-up?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/follow-ups/${followUpId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete follow-up.');
      }

      router.push('/follow-ups');
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'An error occurred.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="btn-danger-custom"
    >
      {isDeleting ? 'Deleting...' : 'Delete Follow-Up'}
    </button>
  );
}
