'use client';

import React from 'react';
import Link from 'next/link';
import { OrgTotalSummary } from '../../types/report';

interface ReportSummaryCardsProps {
  orgTotal: OrgTotalSummary;
  globalStartDate?: string;
  globalEndDate?: string;
  rangeLabel?: string;
  teamIds?: number[];
}

function formatCurrency(num: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num || 0);
}

export default function ReportSummaryCards({
  orgTotal,
  globalStartDate,
  globalEndDate,
  rangeLabel,
  teamIds = [],
}: ReportSummaryCardsProps) {
  const { grandTotal } = orgTotal;

  const buildSummaryDrillDownUrl = (saleStatus?: string) => {
    const params = new URLSearchParams();
    if (globalStartDate) params.set('dateFrom', globalStartDate);
    if (globalEndDate) params.set('dateTo', globalEndDate);
    if (teamIds.length > 0) params.set('teamId', teamIds.join(','));
    if (saleStatus) params.set('saleStatus', saleStatus);
    return `/orders?${params.toString()}`;
  };

  const cards = [
    {
      title: 'Total Sales',
      amount: grandTotal.salesAmount,
      count: grandTotal.salesCount,
      countLabel: grandTotal.salesCount === 1 ? 'Order' : 'Orders',
      subtext: 'Gross billed volume',
      icon: '$',
      iconColor: '#4f7bb0',
      iconBg: '#eef4fa',
      cardBg: '#ffffff',
      borderColor: '#e2e8f0',
      href: buildSummaryDrillDownUrl('1,4,2,3'),
    },
    {
      title: 'Total Refunds',
      amount: grandTotal.refundsAmount,
      count: grandTotal.refundsCount,
      countLabel: grandTotal.refundsCount === 1 ? 'Refund' : 'Refunds',
      subtext: 'Processed refunds',
      icon: '↺',
      iconColor: '#d35252',
      iconBg: '#fdf0f0',
      cardBg: '#ffffff',
      borderColor: '#e2e8f0',
      href: buildSummaryDrillDownUrl('2'),
    },
    {
      title: 'Total Chargebacks',
      amount: grandTotal.chargebacksAmount,
      count: grandTotal.chargebacksCount,
      countLabel: grandTotal.chargebacksCount === 1 ? 'Chargeback' : 'Chargebacks',
      subtext: 'Payment reversals',
      icon: '▤',
      iconColor: '#d59648',
      iconBg: '#fff8e7',
      cardBg: '#ffffff',
      borderColor: '#e2e8f0',
      href: buildSummaryDrillDownUrl('3'),
    },
    {
      title: 'Net Sales',
      amount: grandTotal.netSales,
      count: grandTotal.netSalesCount,
      countLabel: grandTotal.netSalesCount === 1 ? 'Order' : 'Orders',
      subtext: 'After refunds & chargebacks',
      icon: '↗',
      iconColor: '#1e8e69',
      iconBg: '#eafaf1',
      cardBg: '#f2fbf6',
      borderColor: '#a7f3d0',
      isPrimary: true,
      href: buildSummaryDrillDownUrl('1,4'),
    },
  ];

  return (
    <div className="reports-summary-cards-grid">
      {cards.map((card, idx) => (
        <Link
          key={idx}
          href={card.href}
          onClick={() => {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('REPORT_SCROLL_POS', String(window.scrollY));
            }
          }}
          className={`reports-summary-card ${card.isPrimary ? 'primary-net-card' : ''}`}
          style={{
            backgroundColor: card.cardBg,
            borderColor: card.borderColor,
            textDecoration: 'none',
          }}
        >
          <div
            className="reports-card-icon-box"
            style={{
              backgroundColor: card.iconBg,
              color: card.iconColor,
            }}
          >
            {card.icon}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="reports-card-title" style={{ color: card.isPrimary ? '#1e8e69' : '#64748b' }}>
              {card.title}
            </div>
            <div
              className="reports-card-amount"
              style={{ color: card.isPrimary ? '#047857' : '#0f172a' }}
            >
              {formatCurrency(card.amount)}
            </div>
            <div className="reports-card-meta">
              <span className="reports-card-count" style={{ color: card.isPrimary ? '#059669' : '#64748b' }}>
                ({card.count.toLocaleString()} {card.countLabel})
              </span>
              <span className="reports-card-subtext" style={{ color: card.isPrimary ? '#10b981' : '#94a3b8' }}>
                {card.subtext}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
