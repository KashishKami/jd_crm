'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface FollowUpNotesPopupProps {
  customerName: string;
  notes: string | null;
  onClose: () => void;
}

export default function FollowUpNotesPopup({ customerName, notes, onClose }: FollowUpNotesPopupProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => {
      clearTimeout(timer);
      setMounted(false);
    };
  }, []);

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
          maxWidth: '600px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
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
            Follow-up Notes: {customerName}
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
        <div style={{ padding: '24px', overflowY: 'auto', minHeight: '120px' }}>
          {notes ? (
            <p 
              style={{ 
                margin: 0, 
                whiteSpace: 'pre-line', 
                fontSize: '0.9rem', 
                color: 'var(--text-main)', 
                lineHeight: '1.6',
                fontFamily: 'Georgia, serif' 
              }}
            >
              {notes}
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
              No notes recorded for this follow-up.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
