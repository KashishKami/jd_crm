import React from 'react';
import { formatDateTimeDDMMYYYY } from '../lib/date';

interface SaleHistoryEntry {
  id: number;
  orderId: number;
  oldValue: string | null;
  newValue: string;
  changedById: number;
  changedByName: string;
  changedAt: string | Date;
}

interface SaleStatusTimelineProps {
  history: SaleHistoryEntry[];
}

export default function SaleStatusTimeline({ history }: SaleStatusTimelineProps) {
  const getSaleStatusLabel = (code: string) => {
    switch (code) {
      case '1': return 'Sold';
      case '2': return 'Refunded';
      case '3': return 'Chargebacked';
      case '4': return 'Partial Refund';
      default: return 'Unknown';
    }
  };

  const getStatusBadgeStyle = (code: string) => {
    switch (code) {
      case '1':
        return { backgroundColor: '#e2fbe8', color: '#15803d', border: '1px solid #bbf7d0' };
      case '2':
        return { backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' };
      case '3':
        return { backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5' };
      case '4':
        return { backgroundColor: '#faf2eb', color: '#a47c5c', border: '1px solid #ffedd5' };
      default:
        return { backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' };
    }
  };

  if (!history || history.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
        No sale status changes recorded.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px' }}>
      {history.map((entry, idx) => (
        <div 
          key={entry.id} 
          style={{ 
            display: 'flex', 
            gap: '16px', 
            position: 'relative',
            paddingBottom: idx !== history.length - 1 ? '16px' : '0'
          }}
        >
          {/* Timeline Connector Line */}
          {idx !== history.length - 1 && (
            <div 
              style={{
                position: 'absolute',
                left: '20px',
                top: '40px',
                bottom: '0',
                width: '2px',
                borderLeft: '2px dashed #cbd5e1',
                zIndex: 0
              }}
            />
          )}

          {/* Timeline Node Icon */}
          <div 
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              zIndex: 1,
              flexShrink: 0,
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          >
            {entry.changedByName ? entry.changedByName[0].toUpperCase() : 'A'}
          </div>

          {/* Content Card (Glassmorphism design) */}
          <div 
            className="form-card" 
            style={{ 
              flex: 1, 
              padding: '16px', 
              margin: 0, 
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
              {entry.oldValue && (
                <>
                  <span 
                    style={{ 
                      padding: '2px 8px', 
                      borderRadius: '6px', 
                      fontSize: '0.8rem', 
                      fontWeight: '600',
                      ...getStatusBadgeStyle(entry.oldValue)
                    }}
                  >
                    {getSaleStatusLabel(entry.oldValue)}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '0.9rem' }}>→</span>
                </>
              )}
              <span 
                style={{ 
                  padding: '2px 8px', 
                  borderRadius: '6px', 
                  fontSize: '0.8rem', 
                  fontWeight: '600',
                  ...getStatusBadgeStyle(entry.newValue)
                }}
              >
                {getSaleStatusLabel(entry.newValue)}
              </span>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Changed by <strong style={{ color: '#1e293b' }}>{entry.changedByName}</strong> on {formatDateTimeDDMMYYYY(entry.changedAt)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
