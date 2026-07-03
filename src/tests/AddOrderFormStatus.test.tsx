// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { useSession } from 'next-auth/react';
import AddOrderForm from '../components/AddOrderForm';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

describe('AddOrderForm Status Upgrade Unit Tests', () => {
  beforeEach(() => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    } as any);
  });

  const mockVendors = [{ vendorId: 1, vendorName: 'Vendor A' }];
  const mockGateways = [{ gatewayId: 1, gatewayName: 'Gateway A' }];
  const mockAgents = [{ uid: 1, name: 'Agent A', nickname: 'AgentNickname' }];

  it('should render Workflow Queue and Sale Status dropdowns with Partial Refund option', () => {
    render(
      <AddOrderForm
        vendors={mockVendors}
        gateways={mockGateways}
        agents={mockAgents}
      />
    );

    // Verify Workflow Queue dropdown exists
    expect(screen.getByLabelText(/Workflow Queue/i)).toBeDefined();

    // Verify Sale Status dropdown exists and contains Partial Refund
    const saleStatusSelect = screen.getByLabelText(/Sale Status/i) as HTMLSelectElement;
    expect(saleStatusSelect).toBeDefined();

    const options = Array.from(saleStatusSelect.options).map((opt) => opt.value);
    expect(options).toContain('1'); // Sold
    expect(options).toContain('2'); // Refunded
    expect(options).toContain('3'); // Chargebacked
    expect(options).toContain('4'); // Partial Refund
  });

  it('should open the refund date modal when Partial Refund is selected', async () => {
    render(
      <AddOrderForm
        vendors={mockVendors}
        gateways={mockGateways}
        agents={mockAgents}
      />
    );

    const saleStatusSelect = screen.getByLabelText(/Sale Status/i) as HTMLSelectElement;
    fireEvent.change(saleStatusSelect, { target: { value: '4' } });

    // Expect the modal to show up
    await waitFor(() => {
      expect(screen.getByText(/Record Partial Refund Details/i)).toBeDefined();
      expect(screen.getByLabelText(/Refund Amount \*/i)).toBeDefined();
    });
  });
});
