import React from 'react';

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
      case '5': return 'Void';
      case '6': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const formatTimelineDate = (dateVal: string | Date) => {
    const d = new Date(dateVal);
    const day = d.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'America/New_York' });
    const month = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'America/New_York' });
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York'
    }).toLowerCase();
    return `${day} ${month}, ${timeStr}`;
  };

  const statesList: Array<{ state: string; changedBy: string; changedAt: string | Date | null }> = [];
  if (history && history.length > 0) {
    if (history[0].oldValue) {
      statesList.push({
        state: history[0].oldValue,
        changedBy: 'System',
        changedAt: null,
      });
    }
    history.forEach((entry) => {
      statesList.push({
        state: entry.newValue,
        changedBy: entry.changedByName,
        changedAt: entry.changedAt,
      });
    });
  } else {
    statesList.push({
      state: '1',
      changedBy: 'System',
      changedAt: null,
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 0' }}>
      {statesList.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
          {/* Vertical line and node */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
            {/* Top segment of line */}
            <div style={{
              width: '2px',
              backgroundColor: '#e2e8f0',
              flex: 1,
              visibility: idx === 0 ? 'hidden' : 'visible'
            }} />
            
            {/* Dot */}
            <div style={{
              width: idx === statesList.length - 1 ? '16px' : '10px',
              height: idx === statesList.length - 1 ? '16px' : '10px',
              borderRadius: '50%',
              backgroundColor: idx === statesList.length - 1 ? '#15803d' : '#e2e8f0',
              border: idx === statesList.length - 1 ? '3px solid #ffffff' : 'none',
              boxShadow: idx === statesList.length - 1 ? '0 0 0 2px #15803d' : 'none',
              zIndex: 2,
              marginTop: idx === statesList.length - 1 ? '-8px' : '-5px',
              marginBottom: idx === statesList.length - 1 ? '-8px' : '-5px',
            }} />
            
            {/* Bottom segment of line */}
            <div style={{
              width: '2px',
              backgroundColor: '#e2e8f0',
              flex: 1,
              visibility: idx === statesList.length - 1 ? 'hidden' : 'visible'
            }} />
          </div>

          {/* Details */}
          <div style={{ paddingBottom: '20px', flex: 1 }}>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e293b', lineHeight: '1.2' }}>
              {getSaleStatusLabel(item.state)}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              By <span>{item.changedBy}</span> {item.changedAt ? `at ${formatTimelineDate(item.changedAt)}` : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
