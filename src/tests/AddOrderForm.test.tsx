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

    expect(screen.getByLabelText(/customer name/i)).toBeDefined();
    expect(screen.queryByLabelText(/first name/i)).toBeNull();
    expect(screen.queryByLabelText(/last name/i)).toBeNull();
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

    fireEvent.change(screen.getByLabelText(/customer name/i), { target: { value: 'Alice Smith' } });
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

  describe('W-1502: Year and Make & Model Field Merger', () => {
    it('should not contain orderYear input but should contain orderMakeModel with correct label and value', async () => {
      render(<AddOrderForm vendors={[]} gateways={[]} agents={[]} />);
      
      // Assert orderYear input does not exist
      expect(screen.queryByLabelText(/^year$/i)).toBeNull();
      expect(document.getElementById('orderYear')).toBeNull();

      // Assert orderMakeModel input exists with label "Year, Make & Model"
      const makeModelInput = document.getElementById('orderMakeModel') as HTMLInputElement;
      expect(makeModelInput).not.toBeNull();
      const label = screen.getByText('Year, Make & Model');
      expect(label).toBeDefined();
    });

    it('should submit form with orderMakeModel and not include orderYear', async () => {
      const mockVendors = [{ vendorId: 1, vendorName: 'Test Vendor' }];
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ orderId: 10, customerId: 20, cardId: 30 }),
      } as Response);

      render(<AddOrderForm vendors={mockVendors} gateways={[]} agents={[]} />);

      // Fill out required fields
      fireEvent.change(screen.getByLabelText(/customer name/i), { target: { value: 'Alice Smith' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@example.com' } });
      fireEvent.change(screen.getByLabelText(/name on card/i), { target: { value: 'Alice Smith' } });
      fireEvent.change(screen.getByLabelText(/card number/i), { target: { value: '4111222233334444' } });
      fireEvent.change(screen.getByLabelText(/expiry date/i), { target: { value: '09/29' } });
      fireEvent.change(screen.getByLabelText(/part/i), { target: { value: 'Transmission' } });
      fireEvent.change(screen.getByLabelText(/total price pitched/i), { target: { value: '800' } });
      fireEvent.change(screen.getByLabelText(/vendor buying price/i), { target: { value: '500' } });
      
      // Input into the new merged field
      const makeModelInput = document.getElementById('orderMakeModel') as HTMLInputElement;
      fireEvent.change(makeModelInput, { target: { value: '2022 Honda Civic' } });

      const submitBtn = screen.getByRole('button', { name: /create order/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      const [, fetchOptions] = vi.mocked(fetch).mock.calls[0];
      const bodyStr = fetchOptions?.body as string;
      const sentBody = JSON.parse(bodyStr);

      expect(sentBody).toHaveProperty('orderMakeModel', '2022 Honda Civic');
      expect(sentBody).not.toHaveProperty('orderYear');
    });
  });

  describe('W-1504: Quick UI Wins', () => {
    it('should expose orderDate input pre-filled with today\'s date and send it in payload', async () => {
      const mockVendors = [{ vendorId: 1, vendorName: 'Test Vendor' }];
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ orderId: 10, customerId: 20, cardId: 30 }),
      } as Response);

      render(<AddOrderForm vendors={mockVendors} gateways={[]} agents={[]} />);

      // Assert orderDate input exists
      const dateInput = document.getElementById('orderDate') as HTMLInputElement;
      expect(dateInput).not.toBeNull();
      expect(dateInput.type).toBe('date');

      // Assert default value is today's date
      const todayStr = new Date().toISOString().split('T')[0];
      expect(dateInput.value).toBe(todayStr);

      // Change date
      fireEvent.change(dateInput, { target: { value: '2025-06-15' } });

      // Fill out required fields
      fireEvent.change(screen.getByLabelText(/customer name/i), { target: { value: 'Alice Smith' } });
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
        expect(fetch).toHaveBeenCalled();
      });

      const [, fetchOptions] = vi.mocked(fetch).mock.calls[0];
      const sentBody = JSON.parse(fetchOptions?.body as string);
      expect(sentBody).toHaveProperty('orderDate', '2025-06-15');
    });

    it('should render mileage fields with labels "Quoted Miles and Warranty" and "Vendor Miles and Warranty"', () => {
      render(<AddOrderForm agents={[]} gateways={[]} vendors={[]} />);
      expect(screen.getByText('Quoted Miles and Warranty')).toBeDefined();
      expect(screen.getByText('Vendor Miles and Warranty')).toBeDefined();
      expect(screen.queryByText('Quoted Mileage')).toBeNull();
      expect(screen.queryByText('Vendor Mileage')).toBeNull();
    });
  });

  describe('W-1601: Add Sales Verifier and Backend Executive fields', () => {
    it('should render Sales Verifier and Backend Executive select dropdowns in correct sequence', () => {
      render(<AddOrderForm vendors={[]} gateways={[]} agents={[]} />);

      const salesAgentSelect = document.getElementById('orderSalesAgentId');
      const salesVerifierSelect = document.getElementById('orderSalesVerifierId');
      const backendExecutiveSelect = document.getElementById('orderBackendExecutiveId');
      const verifierSelect = document.getElementById('orderVerifierId');

      expect(salesAgentSelect).not.toBeNull();
      expect(salesVerifierSelect).not.toBeNull();
      expect(backendExecutiveSelect).not.toBeNull();
      expect(verifierSelect).not.toBeNull();

      // Check sequence order by their position in DOM tree or parent element children index
      const selects = Array.from(document.querySelectorAll('select'));
      const indices = [
        selects.indexOf(salesAgentSelect as HTMLSelectElement),
        selects.indexOf(salesVerifierSelect as HTMLSelectElement),
        selects.indexOf(backendExecutiveSelect as HTMLSelectElement),
        selects.indexOf(verifierSelect as HTMLSelectElement),
      ];

      expect(indices[0]).toBeLessThan(indices[1]);
      expect(indices[1]).toBeLessThan(indices[2]);
      expect(indices[2]).toBeLessThan(indices[3]);
    });

    it('should submit form with numeric salesVerifierId and backendExecutiveId', async () => {
      const mockVendors = [{ vendorId: 1, vendorName: 'Test Vendor' }];
      const mockGateways = [{ gatewayId: 2, gatewayName: 'Test Gateway' }];
      const mockAgents = [
        { uid: 3, name: 'Agent Smith', nickname: 'Smithy' },
        { uid: 5, name: 'Verifier Bob', nickname: 'Bobby' },
        { uid: 6, name: 'Exec Carol', nickname: 'Carol' },
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ orderId: 10, customerId: 20, cardId: 30 }),
      } as Response);

      render(<AddOrderForm vendors={mockVendors} gateways={mockGateways} agents={mockAgents} />);

      // Fill out required fields
      fireEvent.change(screen.getByLabelText(/customer name/i), { target: { value: 'Alice Smith' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@example.com' } });
      fireEvent.change(screen.getByLabelText(/name on card/i), { target: { value: 'Alice Smith' } });
      fireEvent.change(screen.getByLabelText(/card number/i), { target: { value: '4111222233334444' } });
      fireEvent.change(screen.getByLabelText(/expiry date/i), { target: { value: '09/29' } });
      fireEvent.change(screen.getByLabelText(/part/i), { target: { value: 'Transmission' } });
      fireEvent.change(screen.getByLabelText(/total price pitched/i), { target: { value: '800' } });
      fireEvent.change(screen.getByLabelText(/vendor buying price/i), { target: { value: '500' } });

      // Select values
      fireEvent.change(document.getElementById('orderSalesAgentId')!, { target: { value: '3' } });
      fireEvent.change(document.getElementById('orderSalesVerifierId')!, { target: { value: '5' } });
      fireEvent.change(document.getElementById('orderBackendExecutiveId')!, { target: { value: '6' } });

      const submitBtn = screen.getByRole('button', { name: /create order/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      const [, fetchOptions] = vi.mocked(fetch).mock.calls[0];
      const sentBody = JSON.parse(fetchOptions?.body as string);
      expect(sentBody).toHaveProperty('orderSalesAgentId', 3);
      expect(sentBody).toHaveProperty('orderSalesVerifierId', 5);
      expect(sentBody).toHaveProperty('orderBackendExecutiveId', 6);
    });
  });

  describe('W-2202: AddOrderForm Sale Status Expansion (Void & Cancel Order)', () => {
    it('[RED] should render exactly 6 options in Sale Status select dropdown', () => {
      render(<AddOrderForm vendors={[]} gateways={[]} agents={[]} />);
      const saleStatusSelect = document.getElementById('saleStatus') as HTMLSelectElement;
      expect(saleStatusSelect).not.toBeNull();
      const options = Array.from(saleStatusSelect.options);
      expect(options.length).toBe(6);
      expect(options.map(o => o.value)).toEqual(['1', '2', '3', '4', '5', '6']);
      expect(options.map(o => o.text)).toEqual([
        'Sold',
        'Refunded',
        'Chargebacked',
        'Partial Refund',
        'Void',
        'Cancelled'
      ]);
    });

    it('[RED] should auto-update orderCurrentStatus to Returned Orders when saleStatus is set to 5 (Void) and Cancelled Orders on 6', async () => {
      render(<AddOrderForm vendors={[]} gateways={[]} agents={[]} />);
      const saleStatusSelect = document.getElementById('saleStatus') as HTMLSelectElement;
      const orderCurrentStatusSelect = document.getElementById('orderCurrentStatus') as HTMLSelectElement;

      // 1. Initial status should be Pending Booking
      expect(orderCurrentStatusSelect.value).toBe('Pending Booking');

      // 2. Select Void (5)
      fireEvent.change(saleStatusSelect, { target: { value: '5' } });
      expect(orderCurrentStatusSelect.value).toBe('Returned Orders');

      // 3. Select Cancelled (6)
      fireEvent.change(saleStatusSelect, { target: { value: '6' } });
      expect(orderCurrentStatusSelect.value).toBe('Cancelled Orders');
    });
  });

  describe('W-1903: AddOrderForm Shipping Type Dropdown (Residential and Commercial Only)', () => {
    it('should contain only Residential and Commercial options in Shipping Type dropdown', () => {
      render(<AddOrderForm vendors={[]} gateways={[]} agents={[]} />);
      const shippingTypeSelect = document.getElementById('orderShippingType') as HTMLSelectElement;
      expect(shippingTypeSelect).not.toBeNull();
      const options = Array.from(shippingTypeSelect.options);
      expect(options.length).toBe(2);
      expect(options.map(o => o.value)).toEqual(['Residential', 'Commercial']);
      expect(options.map(o => o.text)).toEqual(['Residential', 'Commercial']);
    });
  });
});
