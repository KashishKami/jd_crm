// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import AddOrderForm from '../components/AddOrderForm';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
});

describe('AddOrderForm Unit Tests', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render all form sections', () => {
    render(<AddOrderForm vendors={[]} gateways={[]} agents={[]} />);

    expect(screen.getByLabelText(/first name/i)).toBeDefined();
    expect(screen.getByLabelText(/last name/i)).toBeDefined();
    expect(screen.getByLabelText(/email/i)).toBeDefined();
    expect(screen.getByLabelText(/name on card/i)).toBeDefined();
    expect(screen.getByLabelText(/card number/i)).toBeDefined();
    expect(screen.getByLabelText(/part/i)).toBeDefined();
    expect(screen.getByLabelText(/total price pitched/i)).toBeDefined();
    expect(screen.getByLabelText(/vendor buying price/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /create order/i })).toBeDefined();
  });

  it('should dynamically calculate markup as total pitched and vendor price change', async () => {
    render(<AddOrderForm vendors={[]} gateways={[]} agents={[]} />);

    const totalPitchedInput = screen.getByLabelText(/total price pitched/i);
    const vendorPriceInput = screen.getByLabelText(/vendor buying price/i);

    fireEvent.change(totalPitchedInput, { target: { value: '1500' } });
    fireEvent.change(vendorPriceInput, { target: { value: '1000' } });

    // Markup is 1500 - 1000 = 500
    // Check if the markup value "500" is displayed in the form
    const markupDisplay = screen.getByTestId('markup-display');
    expect(markupDisplay.textContent).toContain('500');
  });

  it('should call fetch API to submit data on successful validation', async () => {
    const mockVendors = [{ vendorId: 1, vendorName: 'Test Vendor' }];
    const mockGateways = [{ gatewayId: 2, gatewayName: 'Test Gateway' }];
    const mockAgents = [{ uid: 3, name: 'Agent Smith', nickname: 'Smithy' }];

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ orderId: 10, customerId: 20, cardId: 30 }),
    } as Response);

    render(<AddOrderForm vendors={mockVendors} gateways={mockGateways} agents={mockAgents} />);

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Smith' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@example.com' } });
    fireEvent.change(screen.getByLabelText(/name on card/i), { target: { value: 'Alice Smith' } });
    fireEvent.change(screen.getByLabelText(/card number/i), { target: { value: '4111222233334444' } });
    fireEvent.change(screen.getByLabelText(/expiry date/i), { target: { value: '09/29' } });
    fireEvent.change(screen.getByLabelText(/part/i), { target: { value: 'Transmission' } });
    fireEvent.change(screen.getByLabelText(/total price pitched/i), { target: { value: '800' } });
    fireEvent.change(screen.getByLabelText(/vendor buying price/i), { target: { value: '500' } });

    const submitBtn = screen.getByRole('button', { name: /create order/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/orders', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }));
    });
  });
});
