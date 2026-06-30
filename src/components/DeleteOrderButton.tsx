'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

interface DeleteOrderButtonProps {
  orderId: number;
}

export default function DeleteOrderButton({ orderId }: DeleteOrderButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete order.');
      }
      
      setShowModal(false);
      router.push('/orders');
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsDeleting(false);
    }
  };

  const modalMarkup = showModal && (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={() => {
        if (!isDeleting) setShowModal(false);
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '480px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          border: '1px solid #e2e8f0',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#0f172a',
              margin: 0,
            }}
          >
            Delete Order #{orderId} Permanently?
          </h3>
          <p
            style={{
              fontSize: '0.9rem',
              lineHeight: 1.6,
              color: '#64748b',
              margin: 0,
            }}
          >
            This will permanently delete this order and <strong>ALL</strong> related data, including comments, status history, and view logs.
          </p>
        </div>

        <div
          style={{
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '0.85rem',
            color: '#be123c',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg style={{ width: '20px', height: '20px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          This action is permanent and cannot be undone.
        </div>

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '0.85rem',
              color: '#b91c1c',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={() => setShowModal(false)}
            disabled={isDeleting}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #e2e8f0',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              background: '#e11d48',
              color: 'white',
              border: 'none',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 6px -1px rgba(225, 29, 72, 0.2)',
              transition: 'background 0.2s',
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => {
          setError(null);
          setShowModal(true);
        }}
        style={{
          background: '#be123c',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '0.875rem',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 6px -1px rgba(190, 18, 60, 0.1)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#9f1239')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#be123c')}
      >
        Delete Order
      </button>

      {typeof document !== 'undefined' && createPortal(modalMarkup, document.body)}
    </>
  );
}
