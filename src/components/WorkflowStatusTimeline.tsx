import React from 'react';

interface WorkflowHistoryEntry {
  id: number;
  orderId: number;
  oldValue: string | null;
  newValue: string;
  changedById: number;
  changedByName: string;
  changedAt: string | Date;
}

interface PartInfo {
  crmOrderId: number;
  orderPart: string | null;
  orderCurrentStatus: string | null;
}

interface WorkflowStatusTimelineProps {
  history: WorkflowHistoryEntry[];
  partsList?: PartInfo[];
}

export default function WorkflowStatusTimeline({ history, partsList }: WorkflowStatusTimelineProps) {
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

  const activePartsList = partsList || Array.from(new Set(history.map(h => h.orderId))).map(orderId => {
    const lastEntry = [...history].reverse().find(h => h.orderId === orderId);
    return {
      crmOrderId: orderId,
      orderPart: `Part (ID: ${orderId})`,
      orderCurrentStatus: lastEntry ? lastEntry.newValue : 'Pending Booking'
    };
  });

  if (activePartsList.length === 0) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontStyle: 'italic', fontSize: '0.85rem' }}>
        No workflow status changes recorded.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {activePartsList.map((part) => {
        const partHistory = history.filter(h => h.orderId === part.crmOrderId);
        
        const statesList: Array<{ state: string; changedBy: string; changedAt: string | Date | null }> = [];
        if (partHistory.length > 0) {
          if (partHistory[0].oldValue) {
            statesList.push({
              state: partHistory[0].oldValue,
              changedBy: 'System',
              changedAt: null,
            });
          }
          partHistory.forEach((entry) => {
            statesList.push({
              state: entry.newValue,
              changedBy: entry.changedByName,
              changedAt: entry.changedAt,
            });
          });
        } else {
          statesList.push({
            state: part.orderCurrentStatus || 'Pending Booking',
            changedBy: 'System',
            changedAt: null,
          });
        }

        return (
          <div key={part.crmOrderId} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '12px', borderLeft: '3px solid #cbd5e1', paddingLeft: '8px' }}>
              {part.orderPart || 'Unassigned Part'}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '4px' }}>
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
                      {item.state}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                      By <span>{item.changedBy}</span> {item.changedAt ? `at ${formatTimelineDate(item.changedAt)}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
