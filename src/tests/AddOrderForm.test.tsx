// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { useSession } from 'next-auth/react';
import AddOrderForm from '../components/AddOrderForm';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

describe('AddOrderForm Unit Tests', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    } as any);
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
    expect(screen.getByLabelText(/^part \*/i)).toBeDefined();
    expect(screen.getByLabelText(/total price pitched/i)).toBeDefined();
    expect(screen.getByLabelText(/vendor buying price/i)).toBeDefined();
    expect(screen.getAllByRole('button', { name: /create order/i })[0]).toBeDefined();
  });

  it('should auto-populate Sales Agent dropdown with currently logged-in user if they exist in agents list', async () => {
    const mockAgents = [
      { uid: 3, name: 'Agent Smith', nickname: 'Smithy', designation: 'Sales Specialist', status: 1 },
      { uid: 4, name: 'Agent Neo', nickname: 'Neo', designation: 'Sales Specialist', status: 1 }
    ];

    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: '4', name: 'Agent Neo' }
      },
      status: 'authenticated',
    } as any);

    render(<AddOrderForm vendors={[]} gateways={[]} agents={mockAgents} />);

    const salesAgentSelect = screen.getByLabelText(/Sales Agent/i) as HTMLSelectElement;
    expect(salesAgentSelect.value).toBe('4');
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
    fireEvent.change(screen.getByLabelText(/^part \*/i), { target: { value: 'Transmission' } });
    fireEvent.change(screen.getByLabelText(/total price pitched/i), { target: { value: '800' } });
    fireEvent.change(screen.getByLabelText(/vendor buying price/i), { target: { value: '500' } });

    const submitBtn = screen.getAllByRole('button', { name: /create order/i })[0];
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
      fireEvent.change(screen.getByLabelText(/^part \*/i), { target: { value: 'Transmission' } });
      fireEvent.change(screen.getByLabelText(/total price pitched/i), { target: { value: '800' } });
      fireEvent.change(screen.getByLabelText(/vendor buying price/i), { target: { value: '500' } });
      
      // Input into the new merged field
      const makeModelInput = document.getElementById('orderMakeModel') as HTMLInputElement;
      fireEvent.change(makeModelInput, { target: { value: '2022 Honda Civic' } });

      const submitBtn = screen.getAllByRole('button', { name: /create order/i })[0];
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
      fireEvent.change(screen.getByLabelText(/^part \*/i), { target: { value: 'Transmission' } });
      fireEvent.change(screen.getByLabelText(/total price pitched/i), { target: { value: '800' } });
      fireEvent.change(screen.getByLabelText(/vendor buying price/i), { target: { value: '500' } });

      const submitBtn = screen.getAllByRole('button', { name: /create order/i })[0];
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
        { uid: 3, name: 'Agent Smith', nickname: 'Smithy', designation: 'Sales Specialist', status: 1 },
        { uid: 5, name: 'Verifier Bob', nickname: 'Bobby', designation: 'Sales Specialist', status: 1 },
        { uid: 6, name: 'Exec Carol', nickname: 'Carol', designation: 'Backend Specialist', status: 1 },
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
      fireEvent.change(screen.getByLabelText(/^part \*/i), { target: { value: 'Transmission' } });
      fireEvent.change(screen.getByLabelText(/total price pitched/i), { target: { value: '800' } });
      fireEvent.change(screen.getByLabelText(/vendor buying price/i), { target: { value: '500' } });

      // Select values
      fireEvent.change(document.getElementById('orderSalesAgentId')!, { target: { value: '3' } });
      fireEvent.change(document.getElementById('orderSalesVerifierId')!, { target: { value: '5' } });
      fireEvent.change(document.getElementById('orderBackendExecutiveId')!, { target: { value: '6' } });

      const submitBtn = screen.getAllByRole('button', { name: /create order/i })[0];
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

  describe('Phase 24: Alternate Phones, Multi-Card, Image Upload, and Label Renames', () => {
    it('should render Alternate Number input and not Alternate Phone 2', () => {
      render(<AddOrderForm vendors={[]} gateways={[]} agents={[]} />);
      expect(screen.getByLabelText(/alternate number/i)).toBeDefined();
      expect(screen.queryByLabelText(/alternate phone 2/i)).toBeNull();
    });

    it('should support adding and removing multiple card blocks and show amountToCharge when multiple cards exist', () => {
      render(<AddOrderForm vendors={[]} gateways={[]} agents={[]} />);
      
      // Initially, one card block exists, and amountToCharge input is not visible
      expect(screen.queryByLabelText(/amount to charge/i)).toBeNull();
      
      // Click Add Another Card
      const addBtn = screen.getByText(/\+ add another card/i);
      fireEvent.click(addBtn);

      // Now amountToCharge inputs are rendered for the cards
      const amountInputs = screen.getAllByLabelText(/amount to charge/i);
      expect(amountInputs.length).toBe(2);

      // Remove the second card
      const removeBtns = screen.getAllByTitle(/remove card/i);
      expect(removeBtns.length).toBe(1);
      fireEvent.click(removeBtns[0]);

      // amountToCharge should disappear as only 1 card remains
      expect(screen.queryByLabelText(/amount to charge/i)).toBeNull();
    });

    it('should rename Card Copy Verified & Photo ID Checked labels to Card copy received and Photo ID received', () => {
      render(<AddOrderForm vendors={[]} gateways={[]} agents={[]} />);
      expect(screen.getByText('Card copy received')).toBeDefined();
      expect(screen.getByText('Photo ID received')).toBeDefined();
      expect(screen.queryByText('Card Copy Verified')).toBeNull();
      expect(screen.queryByText('Photo ID Checked')).toBeNull();
    });

    it('should rename Checklist label to Checklist by backend', () => {
      render(<AddOrderForm vendors={[]} gateways={[]} agents={[]} />);
      expect(screen.getByText('Checklist by backend')).toBeDefined();
      expect(screen.queryByText(/^checklist$/i)).toBeNull();
    });
  });

  describe('W-2501: Part Found By & Liftgate Needed', () => {
    it('should render Part Found By select dropdown and Liftgate Needed checkbox', () => {
      render(<AddOrderForm vendors={[]} gateways={[]} agents={[]} />);
      expect(document.getElementById('orderPartFoundById')).not.toBeNull();
      expect(document.getElementById('orderLiftgateNeeded')).not.toBeNull();
    });

    it('should submit form with orderPartFoundById and orderLiftgateNeeded', async () => {
      const mockVendors = [{ vendorId: 1, vendorName: 'Test Vendor' }];
      const mockAgents = [{ uid: 3, name: 'Agent Smith', nickname: 'Smithy', designation: 'Sales Associate', status: 1 }];
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ orderId: 10, customerId: 20, cardId: 30 }),
      } as Response);

      render(<AddOrderForm vendors={mockVendors} gateways={[]} agents={mockAgents} />);

      // Fill out required fields
      fireEvent.change(screen.getByLabelText(/customer name/i), { target: { value: 'Alice Smith' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@example.com' } });
      fireEvent.change(screen.getByLabelText(/name on card/i), { target: { value: 'Alice Smith' } });
      fireEvent.change(screen.getByLabelText(/card number/i), { target: { value: '4111222233334444' } });
      fireEvent.change(screen.getByLabelText(/expiry date/i), { target: { value: '09/29' } });
      fireEvent.change(screen.getByLabelText(/^part \*/i), { target: { value: 'Transmission' } });
      fireEvent.change(screen.getByLabelText(/total price pitched/i), { target: { value: '800' } });
      fireEvent.change(screen.getByLabelText(/vendor buying price/i), { target: { value: '500' } });

      // Select agent and toggle liftgate
      const pfbSelect = document.getElementById('orderPartFoundById') as HTMLSelectElement;
      fireEvent.change(pfbSelect, { target: { value: '3' } });

      const liftgateCheckbox = document.getElementById('orderLiftgateNeeded') as HTMLInputElement;
      fireEvent.click(liftgateCheckbox);

      const submitBtn = screen.getAllByRole('button', { name: /create order/i })[0];
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      const [, fetchOptions] = vi.mocked(fetch).mock.calls[0];
      const bodyStr = fetchOptions?.body as string;
      const sentBody = JSON.parse(bodyStr);

      expect(sentBody).toHaveProperty('orderPartFoundById', 3);
      expect(sentBody).toHaveProperty('orderLiftgateNeeded', 'Yes');
    });

    describe('W-2602: Multi-Part Form Behaviors', () => {
      it('should render Add Another Part button and add/remove part cards dynamically', async () => {
        render(<AddOrderForm vendors={[]} gateways={[]} agents={[]} />);
        
        const addPartBtn = screen.getByRole('button', { name: /add another part/i });
        expect(addPartBtn).toBeDefined();

        // Initially we have 1 part card. Let's count by label or test id.
        // The first card should have a field "Part"
        const partInputs = screen.getAllByLabelText(/^part \*/i);
        expect(partInputs.length).toBe(1);

        // Click Add Another Part
        fireEvent.click(addPartBtn);
        
        // Now there should be 2 part cards
        const partInputs2 = screen.getAllByLabelText(/^part \*/i);
        expect(partInputs2.length).toBe(2);

        // Check if there is a "Remove Part" button for the second card
        const removePartBtns = screen.getAllByRole('button', { name: /remove part/i });
        expect(removePartBtns.length).toBe(1); // 1 remove button since card 0 cannot be removed

        // Click Remove Part
        fireEvent.click(removePartBtns[0]);

        // Should return to 1 part card
        const partInputs3 = screen.getAllByLabelText(/^part \*/i);
        expect(partInputs3.length).toBe(1);
      });

      it('should auto-fill shared fields from the first part card when adding a subsequent part', async () => {
        const mockGateways = [{ gatewayId: 2, gatewayName: 'Test Gateway' }];
        const mockAgents = [{ uid: 3, name: 'Agent Smith', nickname: 'Smithy' }];
        render(<AddOrderForm vendors={[]} gateways={mockGateways} agents={mockAgents} />);

        // Fill out shared fields on Card 1
        const vinInput = screen.getByLabelText(/vin/i);
        fireEvent.change(vinInput, { target: { value: 'VIN123456789' } });

        const makeModelInput = screen.getByLabelText(/year, make & model/i);
        fireEvent.change(makeModelInput, { target: { value: '2026 Tesla Model S' } });

        const gatewaySelect = screen.getByLabelText(/payment gateway/i) as HTMLSelectElement;
        fireEvent.change(gatewaySelect, { target: { value: '2' } });

        const agentSelect = screen.getByLabelText(/sales agent/i) as HTMLSelectElement;
        fireEvent.change(agentSelect, { target: { value: '3' } });

        const liftgateCheckbox = document.getElementById('orderLiftgateNeeded') as HTMLInputElement;
        fireEvent.click(liftgateCheckbox);

        // Add Part 2
        const addPartBtn = screen.getByRole('button', { name: /add another part/i });
        fireEvent.click(addPartBtn);

        // Verify Part 2 does not copy Year, Make & Model or VIN (they should be empty)
        const vins = screen.getAllByLabelText(/vin/i) as HTMLInputElement[];
        expect(vins[1].value).toBe('');

        const makeModels = screen.getAllByLabelText(/year, make & model/i) as HTMLInputElement[];
        expect(makeModels[1].value).toBe('');
      });

      it('should calculate combined deal summary Margins and Pitched', async () => {
        render(<AddOrderForm vendors={[]} gateways={[]} agents={[]} />);
        
        // Set global total pitched to 1500
        fireEvent.change(screen.getByLabelText(/total price pitched/i), { target: { value: '1500' } });
        fireEvent.change(screen.getByLabelText(/vendor buying price/i), { target: { value: '400' } });

        // Add Part 2
        const addPartBtn = screen.getByRole('button', { name: /add another part/i });
        fireEvent.click(addPartBtn);

        // Part 2 Vendor 200
        const vendorInputs = screen.getAllByLabelText(/vendor buying price/i);
        fireEvent.change(vendorInputs[1], { target: { value: '200' } });

        // Combined: Total Pitched: 1500, Combined Margin: 900
        const combinedPitched = screen.getByTestId('combined-pitched-display');
        const combinedMargin = screen.getByTestId('combined-margin-display');

        expect(combinedPitched.textContent).toContain('1500');
        expect(combinedMargin.textContent).toContain('900');
      });

      it('should submit payload with parts array and primaryPartIndex', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({ orderId: 10, customerId: 20, cardId: 30, partOrderIds: [10, 11] }),
        } as Response);

        render(<AddOrderForm vendors={[]} gateways={[]} agents={[]} />);

        // Fill customer info
        fireEvent.change(screen.getByLabelText(/customer name/i), { target: { value: 'Bob Smith' } });
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'bob@example.com' } });
        fireEvent.change(screen.getByLabelText(/name on card/i), { target: { value: 'Bob Smith' } });
        fireEvent.change(screen.getByLabelText(/card number/i), { target: { value: '4111222233334444' } });
        fireEvent.change(screen.getByLabelText(/expiry date/i), { target: { value: '09/29' } });

        // Part 1
        fireEvent.change(screen.getByLabelText(/^part \*/i), { target: { value: 'Engine' } });
        fireEvent.change(screen.getByLabelText(/total price pitched/i), { target: { value: '1200' } });
        fireEvent.change(screen.getByLabelText(/vendor buying price/i), { target: { value: '600' } });

        // Add Part 2
        fireEvent.click(screen.getByRole('button', { name: /add another part/i }));
        const partDescriptions = screen.getAllByLabelText(/^part \*/i);
        const vendorInputs = screen.getAllByLabelText(/vendor buying price/i);

        fireEvent.change(partDescriptions[1], { target: { value: 'Brake Pads' } });
        fireEvent.change(vendorInputs[1], { target: { value: '100' } });

        // Select Part 2 as primary via radio button
        const primaryRadios = screen.getAllByLabelText(/primary/i) as HTMLInputElement[];
        fireEvent.click(primaryRadios[1]);

        // Submit
        fireEvent.click(screen.getAllByRole('button', { name: /create order/i })[0]);

        await waitFor(() => {
          expect(fetch).toHaveBeenCalled();
        });

        const [, fetchOptions] = vi.mocked(fetch).mock.calls[0];
        const body = JSON.parse(fetchOptions?.body as string);

        expect(body).toHaveProperty('parts');
        expect(body.parts.length).toBe(2);
        // Note: submit logic will reorder parts so primary part is index 0.
        expect(body.parts[0].orderPart).toBe('Brake Pads');
        expect(body.parts[1].orderPart).toBe('Engine');
      });
    });

    describe('Phase 26.6 Form Layout & Section 06 Redesign', () => {
      it('should render exactly five distinct section headings', () => {
        render(<AddOrderForm vendors={[]} gateways={[]} agents={[]} />);
        const sectionTitles = Array.from(document.querySelectorAll('.form-section-title')).map(el => el.textContent?.trim());
        expect(sectionTitles).toContain('Customer Information');
        expect(sectionTitles).toContain('Payment Card Details');
        expect(sectionTitles).toContain('Part Information');
        expect(sectionTitles).toContain('Pricing and Status');
        expect(sectionTitles).toContain('Team allocation and other details');
      });

      it('should render global saleStatus dropdown', () => {
        render(<AddOrderForm vendors={[]} gateways={[]} agents={[]} />);
        const saleStatusSelect = document.getElementById('saleStatus') as HTMLSelectElement;
        expect(saleStatusSelect).not.toBeNull();
      });

      it('should collapse existing part cards and toggle accordion style when multiple parts exist', () => {
        render(<AddOrderForm vendors={[]} gateways={[]} agents={[]} />);
        
        // Add second part
        fireEvent.click(screen.getByRole('button', { name: /add another part/i }));
        
        // Both part card headers should be visible
        const partHeaders = screen.getAllByText(/Part #\d+/i);
        expect(partHeaders.length).toBe(2);
      });
    });

    describe('W-1904: AddOrderForm Card Number, Expiry, and Phone Masks', () => {
      it('should automatically format phone numbers as XXX-XXX-XXXX', () => {
        render(<AddOrderForm vendors={[]} gateways={[]} agents={[]} />);
        const phoneInput = screen.getByLabelText(/Phone Number/i) as HTMLInputElement;
        
        fireEvent.change(phoneInput, { target: { value: '2567175003' } });
        expect(phoneInput.value).toBe('256-717-5003');
      });

      it('should automatically format alternate phone numbers as XXX-XXX-XXXX', () => {
        render(<AddOrderForm vendors={[]} gateways={[]} agents={[]} />);
        const altPhoneInput = screen.getByLabelText(/Alternate Number/i) as HTMLInputElement;
        
        fireEvent.change(altPhoneInput, { target: { value: '2567175003' } });
        expect(altPhoneInput.value).toBe('256-717-5003');
      });

      it('should automatically format card numbers with space groupings of 4', () => {
        render(<AddOrderForm vendors={[]} gateways={[]} agents={[]} />);
        const cardInput = screen.getByLabelText(/Card Number/i) as HTMLInputElement;
        
        fireEvent.change(cardInput, { target: { value: '4111222233334444' } });
        expect(cardInput.value).toBe('4111 2222 3333 4444');
      });

      it('should format Amex card numbers as xxxx xxxxxx xxxxx (4-6-5)', () => {
        render(<AddOrderForm vendors={[]} gateways={[]} agents={[]} />);
        const cardInput = screen.getByLabelText(/Card Number/i) as HTMLInputElement;
        
        fireEvent.change(cardInput, { target: { value: '371234567890123' } });
        expect(cardInput.value).toBe('3712 345678 90123');
      });

      it('should automatically format expiry date as MM/YY', () => {
        render(<AddOrderForm vendors={[]} gateways={[]} agents={[]} />);
        const expInput = screen.getByLabelText(/Expiry Date/i) as HTMLInputElement;
        
        fireEvent.change(expInput, { target: { value: '1229' } });
        expect(expInput.value).toBe('12/29');
      });
    });

    describe('W-1906: AddOrderForm Blacklisted Vendor warning', () => {
      it('should prepend [BLACKLISTED] 🚩 and style option red for blacklisted vendors', () => {
        const mockVendors = [
          { vendorId: 1, vendorName: 'Active Vendor', vendorStatus: 1 },
          { vendorId: 2, vendorName: 'Blacklisted Vendor', vendorStatus: 0 },
        ];
        render(<AddOrderForm vendors={mockVendors} gateways={[]} agents={[]} />);
        
        const vendorSelect = document.getElementById('orderVendorId') as HTMLSelectElement;
        expect(vendorSelect).not.toBeNull();
        
        const activeOption = Array.from(vendorSelect.options).find(o => o.value === '1');
        const blacklistedOption = Array.from(vendorSelect.options).find(o => o.value === '2');
        
        expect(activeOption).toBeDefined();
        expect(activeOption?.text).toBe('Active Vendor');
        expect(activeOption?.style.color).not.toBe('red');
        
        expect(blacklistedOption).toBeDefined();
        expect(blacklistedOption?.text).toBe('[BLACKLISTED] 🚩 Blacklisted Vendor');
        expect(blacklistedOption?.style.color).toBe('red');
      });
    });

    describe('W-2501: AddOrderForm Part Found By designation filter', () => {
      it('should filter Part Found By options to show only designated agents (7 designations)', () => {
        const mockAgents = [
          { uid: 1, name: 'Alice Agent', nickname: 'Alice', designation: 'Sales Associate', status: 1 },
          { uid: 2, name: 'Bob Executive', nickname: 'Bob', designation: 'Backend Specialist', status: 1 },
          { uid: 3, name: 'Nainika HR', nickname: 'Nainika', designation: 'HR', status: 1 },
          { uid: 4, name: 'Charlie Associate', nickname: 'Charlie', designation: 'Backend Associate', status: 1 },
          { uid: 5, name: 'Danny Boss', nickname: 'Danny', designation: 'Director', status: 1 },
        ];
        render(<AddOrderForm vendors={[]} gateways={[]} agents={mockAgents} />);

        const pfbSelect = document.getElementById('orderPartFoundById') as HTMLSelectElement;
        expect(pfbSelect).not.toBeNull();

        const options = Array.from(pfbSelect.options).map(opt => opt.text);

        // Alice, Bob, and Charlie should be present
        expect(options).toContain('Alice');
        expect(options).toContain('Bob');
        expect(options).toContain('Charlie');

        // Nainika and Danny should NOT be present
        expect(options).not.toContain('Nainika');
        expect(options).not.toContain('Danny');
      });
    });
  });
});
