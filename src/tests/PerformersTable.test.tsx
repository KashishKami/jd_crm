// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import PerformersTable from '../components/dashboard/PerformersTable';
import { PerformerRow } from '../types/dashboard';

describe('PerformersTable Unit Tests', () => {
  afterEach(cleanup);

  const mockPerformers: PerformerRow[] = [
    {
      agentId: 10,
      agentName: 'John Sales',
      salesCount: 5,
      totalSales: 1500,
      leakage: 120,
    },
    {
      agentId: 11,
      agentName: 'Jane Sales',
      salesCount: 3,
      totalSales: 900,
      leakage: 0,
    },
  ];

  it('should render correct table headers', () => {
    render(
      <PerformersTable
        title="Top Performers"
        performers={mockPerformers}
        isTop={true}
        permissions="dashboard:top-performer"
        month={6}
        year={2026}
      />
    );

    expect(screen.getByText('Rank')).toBeDefined();
    expect(screen.getByText('Agent')).toBeDefined();
    expect(screen.getByText('Sales Count')).toBeDefined();
    expect(screen.getByText('Total Sales')).toBeDefined();
    expect(screen.getByText('Leakage')).toBeDefined();
  });

  it('should render cells as plain text when user lacks orders:view or orders:create permissions', () => {
    render(
      <PerformersTable
        title="Top Performers"
        performers={mockPerformers}
        isTop={true}
        permissions="dashboard:top-performer"
        month={6}
        year={2026}
      />
    );

    const agentCell = screen.getByText('John Sales');
    expect(agentCell.tagName).not.toBe('A');
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('should render cells as clickable anchor links when user has orders:view permission', () => {
    render(
      <PerformersTable
        title="Top Performers"
        performers={mockPerformers}
        isTop={true}
        permissions="orders:view,dashboard:top-performer"
        month={6}
        year={2026}
      />
    );

    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);

    const agentLink = links.find(l => l.getAttribute('href')?.includes('agentId=10') && !l.getAttribute('href')?.includes('saleStatus='));
    expect(agentLink).toBeDefined();
    expect(agentLink?.textContent).toBe('John Sales');

    const salesLink = links.find(l => l.getAttribute('href')?.includes('agentId=10') && l.getAttribute('href')?.includes('saleStatus=1,2,3,4'));
    expect(salesLink).toBeDefined();
    expect(salesLink?.textContent).toBe('5');

    const totalSalesLink = links.find(l => l.getAttribute('href')?.includes('agentId=10') && l.getAttribute('href')?.includes('saleStatus=1,4'));
    expect(totalSalesLink).toBeDefined();
    expect(totalSalesLink?.textContent).toBe('$1,500.00');

    const leakageLink = links.find(l => l.getAttribute('href')?.includes('agentId=10') && l.getAttribute('href')?.includes('saleStatus=2,3'));
    expect(leakageLink).toBeDefined();
    expect(leakageLink?.textContent).toBe('$120.00');
  });

  it('should apply correct color class to leakage count and format total sales as currency', () => {
    render(
      <PerformersTable
        title="Top Performers"
        performers={mockPerformers}
        isTop={true}
        permissions="dashboard:top-performer"
        month={6}
        year={2026}
      />
    );

    expect(screen.getByText('$1,500.00')).toBeDefined();
    expect(screen.getByText('$900.00')).toBeDefined();
    expect(screen.getByText('$120.00')).toBeDefined();
  });
});
