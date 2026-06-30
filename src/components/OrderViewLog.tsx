import React from 'react';
import { OrderViewEntry } from '../types/orderView';
import { formatDateTimeDDMMYYYY } from '../lib/date';

interface OrderViewLogProps {
  entries: OrderViewEntry[];
}

export default function OrderViewLog({ entries }: OrderViewLogProps) {
  // Sort descending by viewedAt (recent first)
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
  );

  return (
    <div className="profile-main" style={{ padding: '24px' }}>
      <h3 className="form-section-title" style={{ marginBottom: '20px' }}>
        Access History — Who Has Viewed This Order
      </h3>

      {sortedEntries.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
          No view history available.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', color: '#334155' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '10px 8px', fontWeight: '600', color: '#475569' }}>Agent</th>
                <th style={{ padding: '10px 8px', fontWeight: '600', color: '#475569' }}>Opened At</th>
              </tr>
            </thead>
            <tbody>
              {sortedEntries.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 8px', fontWeight: '500', color: '#1e293b' }}>
                    {entry.viewerName}
                  </td>
                  <td style={{ padding: '10px 8px', color: '#64748b' }}>
                    {formatDateTimeDDMMYYYY(entry.viewedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
