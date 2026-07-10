'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import CommentTimeline from './CommentTimeline';
import { Comment } from '../types/comment';

interface OrderCommentsPopupProps {
  orderId: number;
  onClose: () => void;
}

export default function OrderCommentsPopup({ orderId, onClose }: OrderCommentsPopupProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/comments`);
      if (!res.ok) {
        throw new Error('Failed to load comments');
      }
      const data = await res.json();
      setComments(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching comments');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchComments();
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchComments]);

  if (!mounted) return null;

  return createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '1000px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f8fafc',
          }}
        >
          <h3 
            style={{
              margin: 0,
              fontSize: '1.1rem',
              fontWeight: 700,
              color: '#0f172a',
              fontFamily: 'Georgia, serif',
            }}
          >
            Order Comments #{orderId}
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              fontWeight: 500,
              color: '#64748b',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px',
            }}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', minHeight: '220px' }}>
          {error && (
            <div style={{ padding: '12px', backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fee2e2', borderRadius: '8px', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '150px' }}>
              <div 
                style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid #3b82f6',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}
              ></div>
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}} />
            </div>
          ) : (
            <CommentTimeline comments={comments} />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
