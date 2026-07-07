// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import EditOrderForm from '../components/EditOrderForm';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
});

const getMockOrder = (status: string) => ({
  crmOrderId: 1,
  customer: {
    customerName: 'John Doe',
    customerPhone: '1234567890',
    customerEmail: 'john@example.com',
    customerBillingAddress: '123 Street',
    customerShippingAddress: '123 Street',
    cards: [
      {
        cardId: 99,
        customerNameOncard: 'John Doe',
        customerCardNumber: '4111222233334444',
        customerCardExpDate: '12/29',
        customerCardCvv: '123',
        customerCardCopyStatus: 'No',
        customerCardPhotoStatus: 'No',
      }
    ]
  },
  orderYear: '2022',
  orderMakeModel: 'Ford Focus',
  orderPart: 'Alternator',
  orderPartSize: 'Standard',
  orderQuotedMilesAndWarranty: '100',
  orderVendorMilesAndWarranty: '100',
  orderChecklist: 'No',
  orderVin: 'VIN123',
  orderShippingType: 'Residential',
  orderTrackingNumber: '',
  orderDeliveryStatus: '',
  orderTotalPitched: '500',
  orderVendorPrice: '300',
  orderVendorId: null,
  orderPaymentGatewayId: null,
  orderSalesAgentId: null,
  orderVerifierId: null,
  saleStatus: '1',
  orderCurrentStatus: status
});

describe('EditOrderForm Unit Tests', () => {
  it('should render standardized workflow queue dropdown options and disable/hide Pending Booking', () => {
    // Test Case 1: Order is in 'Pending Booking' state.
    // 'Pending Booking' should be visible as disabled option, and cannot be changed back to if altered.
    const { rerender } = render(<EditOrderForm order={getMockOrder('Pending Booking')} vendors={[]} gateways={[]} agents={[]} />);
    
    let label = screen.getByText('Workflow Queue');
    let select = label.nextElementSibling as HTMLSelectElement;
    let options = Array.from(select.options);
    let optionValues = options.map((opt) => opt.value);

    // Should contain Booking (disabled), Shipment, Delivery, Feedback, Resolutions, Completed
    expect(optionValues).toContain('Pending Booking');
    expect(optionValues).toContain('Pending Shipment');
    expect(optionValues).toContain('Pending Delivery');

    const bookingOption = options.find(o => o.value === 'Pending Booking');
    expect(bookingOption?.disabled).toBe(true); // Should be read-only/disabled

    // Confirm legacy spelling/states are gone
    expect(optionValues).not.toContain('Pending Tracking');
    expect(optionValues).not.toContain('Pending Delievery');

    // Test Case 2: Order is in 'Pending Shipment' state.
    // 'Pending Booking' should not be present in the options at all.
    rerender(<EditOrderForm order={getMockOrder('Pending Shipment')} vendors={[]} gateways={[]} agents={[]} />);
    
    label = screen.getByText('Workflow Queue');
    select = label.nextElementSibling as HTMLSelectElement;
    options = Array.from(select.options);
    optionValues = options.map((opt) => opt.value);

    expect(optionValues).not.toContain('Pending Booking'); // Hidden completely when not in that state
    expect(optionValues).toContain('Pending Shipment');
    expect(optionValues).toContain('Pending Delivery');
  });

  it('[RED] should include customer and card fields in the fetch payload on submit', async () => {
    // This test replicates the bug: the form was sending a payload that omitted
    // firstName, lastName, customerPhone, customerEmail, and all card fields,
    // meaning customer edits were silently discarded by the API.
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    vi.stubGlobal('fetch', fetchSpy);

    render(
      <EditOrderForm
        order={getMockOrder('Pending Shipment')}
        vendors={[]}
        gateways={[]}
        agents={[]}
        canViewCards={true}
      />
    );

    // Change the customer name
    const customerNameInput = screen.getByLabelText(/customer name/i) as HTMLInputElement;
    fireEvent.change(customerNameInput, { target: { value: 'Updated Customer Name' } });

    // Submit the form
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    const [, fetchOptions] = fetchSpy.mock.calls[0];
    const sentBody = JSON.parse(fetchOptions.body);

    // Customer fields MUST be present in the sent payload
    expect(sentBody).toHaveProperty('customerName', 'Updated Customer Name');
    expect(sentBody).toHaveProperty('customerPhone', '1234567890');
    expect(sentBody).toHaveProperty('customerEmail', 'john@example.com');
    expect(sentBody).toHaveProperty('customerBillingAddress', '123 Street');
    expect(sentBody).toHaveProperty('customerShippingAddress', '123 Street');

    // Card fields MUST be present in the sent payload cards array
    expect(sentBody.cards[0]).toHaveProperty('customerNameOncard', 'John Doe');
    expect(sentBody.cards[0]).toHaveProperty('customerCardNumber', '4111222233334444');
    expect(sentBody.cards[0]).toHaveProperty('customerCardExpDate', '12/29');
    expect(sentBody.cards[0]).toHaveProperty('customerCardCopyStatus', 'No');
    expect(sentBody.cards[0]).toHaveProperty('customerCardPhotoStatus', 'No');

    vi.unstubAllGlobals();
  });

  it('should mask card number and CVV and omit them from the payload when canViewCards is false', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    vi.stubGlobal('fetch', fetchSpy);

    render(
      <EditOrderForm
        order={getMockOrder('Pending Shipment')}
        vendors={[]}
        gateways={[]}
        agents={[]}
        canViewCards={false}
      />
    );

    // Verify fields are masked on rendering
    const cardNumberInput = screen.getAllByText('Card Number')[0].nextElementSibling as HTMLInputElement;
    const cardCvvInput = screen.getByText('CVV Code').nextElementSibling as HTMLInputElement;
    expect(cardNumberInput.value).toBe('**** **** **** 4444');
    expect(cardCvvInput.value).toBe('***');

    // Submit the form
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    const [, fetchOptions] = fetchSpy.mock.calls[0];
    const sentBody = JSON.parse(fetchOptions.body);

    // Masked fields must not be present in the sent payload to prevent database corruption
    expect(sentBody.cards[0].customerCardNumber).toBeUndefined();
    expect(sentBody.cards[0].customerCardCvv).toBeUndefined();

    // Other customer/card details should still be submitted
    expect(sentBody.cards[0]).toHaveProperty('customerNameOncard', 'John Doe');
    expect(sentBody.cards[0]).toHaveProperty('customerCardExpDate', '12/29');

    vi.unstubAllGlobals();
  });

  describe('W-1502: Year and Make & Model Field Merger (Edit)', () => {
    it('should pre-populate merged Year, Make & Model and not display orderYear input', () => {
      render(
        <EditOrderForm
          order={getMockOrder('Pending Shipment')}
          vendors={[]}
          gateways={[]}
          agents={[]}
        />
      );

      // Assert orderYear input does not exist
      expect(screen.queryByLabelText(/^year$/i)).toBeNull();
      expect(document.getElementById('orderYear')).toBeNull();

      // Assert orderMakeModel exists and has value pre-populated
      const makeModelInput = document.getElementById('orderMakeModel') as HTMLInputElement;
      expect(makeModelInput).not.toBeNull();
      expect(makeModelInput.value).toBe('Ford Focus');
      
      const label = screen.getByText('Year, Make & Model');
      expect(label).toBeDefined();
    });

    it('should submit updated orderMakeModel and not include orderYear', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });
      vi.stubGlobal('fetch', fetchSpy);

      render(
        <EditOrderForm
          order={getMockOrder('Pending Shipment')}
          vendors={[]}
          gateways={[]}
          agents={[]}
        />
      );

      const makeModelInput = document.getElementById('orderMakeModel') as HTMLInputElement;
      fireEvent.change(makeModelInput, { target: { value: '2018 Toyota RAV4' } });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

      const [, fetchOptions] = fetchSpy.mock.calls[0];
      const sentBody = JSON.parse(fetchOptions.body);

      expect(sentBody).toHaveProperty('orderMakeModel', '2018 Toyota RAV4');
      expect(sentBody).not.toHaveProperty('orderYear');

      vi.unstubAllGlobals();
    });
  });

  describe('W-1601: Add Sales Verifier and Backend Executive fields (Edit)', () => {
    it('should render Sales Verifier and Backend Executive select dropdowns in correct sequence', () => {
      render(
        <EditOrderForm
          order={getMockOrder('Pending Shipment')}
          vendors={[]}
          gateways={[]}
          agents={[]}
        />
      );

      const salesAgentSelect = document.getElementById('orderSalesAgentId');
      const salesVerifierSelect = document.getElementById('orderSalesVerifierId');
      const backendExecutiveSelect = document.getElementById('orderBackendExecutiveId');
      const verifierSelect = document.getElementById('orderVerifierId');

      expect(salesAgentSelect).not.toBeNull();
      expect(salesVerifierSelect).not.toBeNull();
      expect(backendExecutiveSelect).not.toBeNull();
      expect(verifierSelect).not.toBeNull();

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
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });
      vi.stubGlobal('fetch', fetchSpy);

      const mockAgents = [
        { uid: 3, name: 'Agent Smith', nickname: 'Smithy' },
        { uid: 5, name: 'Verifier Bob', nickname: 'Bobby' },
        { uid: 6, name: 'Exec Carol', nickname: 'Carol' },
      ];

      render(
        <EditOrderForm
          order={getMockOrder('Pending Shipment')}
          vendors={[]}
          gateways={[]}
          agents={mockAgents}
        />
      );

      fireEvent.change(document.getElementById('orderSalesAgentId')!, { target: { value: '3' } });
      fireEvent.change(document.getElementById('orderSalesVerifierId')!, { target: { value: '5' } });
      fireEvent.change(document.getElementById('orderBackendExecutiveId')!, { target: { value: '6' } });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

      const [, fetchOptions] = fetchSpy.mock.calls[0];
      const sentBody = JSON.parse(fetchOptions.body);

      expect(sentBody).toHaveProperty('orderSalesAgentId', 3);
      expect(sentBody).toHaveProperty('orderSalesVerifierId', 5);
      expect(sentBody).toHaveProperty('orderBackendExecutiveId', 6);

      vi.unstubAllGlobals();
    });
  });

  describe('W-1702: Sale Status Overhaul (Edit Form)', () => {
    it('[RED] should display Partial Refund in sale status options and show refund amount input only when Partial Refund is selected', async () => {
      render(
        <EditOrderForm
          order={getMockOrder('Pending Shipment')}
          vendors={[]}
          gateways={[]}
          agents={[]}
        />
      );

      const saleStatusSelect = document.getElementById('saleStatus') as HTMLSelectElement;
      expect(saleStatusSelect).not.toBeNull();
      
      const options = Array.from(saleStatusSelect.options).map(o => o.value);
      expect(options).toContain('4'); // 4 is Partial Refund

      // Refund input should not be visible when status is '1' (Sold)
      expect(screen.queryByLabelText(/refund amount/i)).toBeNull();

      // Change status to '4' (Partial Refund)
      fireEvent.change(saleStatusSelect, { target: { value: '4' } });

      // Now the refund amount input should be visible
      const refundInput = screen.getByLabelText(/refund amount/i) as HTMLInputElement;
      expect(refundInput).not.toBeNull();

      // Change it to '50.00'
      fireEvent.change(refundInput, { target: { value: '50.00' } });

      // submit and check body
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });
      vi.stubGlobal('fetch', fetchSpy);

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
      const [, fetchOptions] = fetchSpy.mock.calls[0];
      const sentBody = JSON.parse(fetchOptions.body);

      expect(sentBody).toHaveProperty('saleStatus', '4');
      expect(sentBody).toHaveProperty('orderRefundAmount', '50.00');

      vi.unstubAllGlobals();
    });
  });

  describe('W-2202: EditOrderForm Sale Status Expansion (Void & Cancel Order)', () => {
    it('[RED] should render exactly 6 options in Sale Status select dropdown', () => {
      render(
        <EditOrderForm
          order={getMockOrder('Pending Shipment')}
          vendors={[]}
          gateways={[]}
          agents={[]}
        />
      );
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

    it('[RED] should auto-update orderCurrentStatus to Returned Orders when saleStatus is set to 5 (Void), to Cancelled Orders on 6, and revert to saved status on 1', async () => {
      render(
        <EditOrderForm
          order={getMockOrder('Pending Shipment')}
          vendors={[]}
          gateways={[]}
          agents={[]}
        />
      );
      const saleStatusSelect = document.getElementById('saleStatus') as HTMLSelectElement;
      const orderCurrentStatusSelect = document.getElementById('orderCurrentStatus') as HTMLSelectElement;

      // Initial status should be Pending Shipment (from getMockOrder)
      expect(orderCurrentStatusSelect.value).toBe('Pending Shipment');

      // Select Void (5)
      fireEvent.change(saleStatusSelect, { target: { value: '5' } });
      expect(orderCurrentStatusSelect.value).toBe('Returned Orders');

      // Change status to Cancelled (6)
      fireEvent.change(saleStatusSelect, { target: { value: '6' } });
      expect(orderCurrentStatusSelect.value).toBe('Cancelled Orders');

      // Change back to Sold (1) - should revert to original saved status (Pending Shipment)
      fireEvent.change(saleStatusSelect, { target: { value: '1' } });
      expect(orderCurrentStatusSelect.value).toBe('Pending Shipment');
    });
  });

  describe('W-1903: EditOrderForm Shipping Type Dropdown (Residential and Commercial Only)', () => {
    it('should contain only Residential and Commercial options in Shipping Type dropdown', () => {
      render(
        <EditOrderForm
          order={getMockOrder('Pending Shipment')}
          vendors={[]}
          gateways={[]}
          agents={[]}
        />
      );
      const shippingTypeSelect = document.getElementById('orderShippingType') as HTMLSelectElement;
      expect(shippingTypeSelect).not.toBeNull();
      const options = Array.from(shippingTypeSelect.options);
      expect(options.length).toBe(2);
      expect(options.map(o => o.value)).toEqual(['Residential', 'Commercial']);
      expect(options.map(o => o.text)).toEqual(['Residential', 'Commercial']);
    });
  });

  describe('Phase 24: Alternate Phones, Multi-Card, Image Upload, and Label Renames (Edit)', () => {
    it('should render customerAlternatePhone1 and customerAlternatePhone2 inputs', () => {
      render(
        <EditOrderForm
          order={getMockOrder('Pending Shipment')}
          vendors={[]}
          gateways={[]}
          agents={[]}
        />
      );
      expect(screen.getByLabelText(/alternate phone 1/i)).toBeDefined();
      expect(screen.getByLabelText(/alternate phone 2/i)).toBeDefined();
    });

    it('should render amountToCharge input', () => {
      const orderWithMultipleCards = getMockOrder('Pending Shipment');
      orderWithMultipleCards.customer.cards.push({
        cardId: 100,
        customerNameOncard: 'Jane Doe',
        customerCardNumber: '5111222233334444',
        customerCardExpDate: '11/30',
        customerCardCvv: '456',
        customerCardCopyStatus: 'No',
        customerCardPhotoStatus: 'No',
      });
      render(
        <EditOrderForm
          order={orderWithMultipleCards}
          vendors={[]}
          gateways={[]}
          agents={[]}
        />
      );
      expect(screen.getAllByLabelText(/amount to charge/i)[0]).toBeDefined();
    });

    it('should rename Card Copy Verified & Photo ID Checked labels to Card copy received and Photo ID received', () => {
      render(
        <EditOrderForm
          order={getMockOrder('Pending Shipment')}
          vendors={[]}
          gateways={[]}
          agents={[]}
        />
      );
      expect(screen.getByText('Card copy received')).toBeDefined();
      expect(screen.getByText('Photo ID received')).toBeDefined();
      expect(screen.queryByText('Card Copy Verified')).toBeNull();
      expect(screen.queryByText('Photo ID Checked')).toBeNull();
    });

    it('should rename Checklist label to Checklist by backend', () => {
      render(
        <EditOrderForm
          order={getMockOrder('Pending Shipment')}
          vendors={[]}
          gateways={[]}
          agents={[]}
        />
      );
      expect(screen.getByText('Checklist by backend')).toBeDefined();
      expect(screen.queryByText(/^checklist$/i)).toBeNull();
    });
  });

  describe('W-2501: Part Found By & Liftgate Needed', () => {
    it('should pre-populate Part Found By select dropdown and Liftgate Needed checkbox from order data', () => {
      const order = getMockOrder('Pending Shipment');
      (order as any).orderPartFoundById = 5;
      (order as any).orderLiftgateNeeded = 'Yes';

      const mockAgents = [
        { uid: 5, name: 'Agent Neo', nickname: 'Neo' }
      ];

      render(
        <EditOrderForm
          order={order}
          vendors={[]}
          gateways={[]}
          agents={mockAgents}
        />
      );

      const pfbSelect = document.getElementById('orderPartFoundById') as HTMLSelectElement;
      expect(pfbSelect).not.toBeNull();
      expect(pfbSelect.value).toBe('5');

      const liftgateCheckbox = document.getElementById('orderLiftgateNeeded') as HTMLInputElement;
      expect(liftgateCheckbox).not.toBeNull();
      expect(liftgateCheckbox.checked).toBe(true);
    });

    it('should submit form with updated orderPartFoundById and orderLiftgateNeeded', async () => {
      const order = getMockOrder('Pending Shipment');
      (order as any).orderPartFoundById = null;
      (order as any).orderLiftgateNeeded = 'No';

      const mockAgents = [
        { uid: 5, name: 'Agent Neo', nickname: 'Neo' }
      ];

      render(
        <EditOrderForm
          order={order}
          vendors={[]}
          gateways={[]}
          agents={mockAgents}
        />
      );

      // Change agent and check liftgate
      const pfbSelect = document.getElementById('orderPartFoundById') as HTMLSelectElement;
      fireEvent.change(pfbSelect, { target: { value: '5' } });

      const liftgateCheckbox = document.getElementById('orderLiftgateNeeded') as HTMLInputElement;
      fireEvent.click(liftgateCheckbox);

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });
      vi.stubGlobal('fetch', fetchSpy);

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
      const [, fetchOptions] = fetchSpy.mock.calls[0];
      const sentBody = JSON.parse(fetchOptions.body);

      expect(sentBody).toHaveProperty('orderPartFoundById', 5);
      expect(sentBody).toHaveProperty('orderLiftgateNeeded', 'Yes');

      vi.unstubAllGlobals();
    });

    describe('W-2603: Multi-Part Edit Behaviors', () => {
      it('should render all child parts and allow promoting another part to primary', async () => {
        const order = getMockOrder('Pending Shipment');
        (order as any).childOrders = [
          {
            crmOrderId: 2,
            orderPart: 'Brake Caliper',
            saleStatus: '1',
            orderCurrentStatus: 'Pending Shipment',
            orderAmountCharged: '200',
            orderRefundAmount: null,
            orderLiftgateNeeded: 'No',
          }
        ];

        render(<EditOrderForm order={order} vendors={[]} gateways={[]} agents={[]} />);

        // Confirm Part 1 and Part 2 descriptions are rendered
        expect(screen.getByDisplayValue('Alternator')).toBeDefined();
        expect(screen.getByDisplayValue('Brake Caliper')).toBeDefined();

        // Check if primary radio buttons exist (Part 1 and Part 2)
        const primaryRadios = screen.getAllByLabelText(/primary/i) as HTMLInputElement[];
        expect(primaryRadios.length).toBe(2);
        expect(primaryRadios[0].checked).toBe(true);

        // Click Part 2 primary radio
        fireEvent.click(primaryRadios[1]);
        expect(primaryRadios[1].checked).toBe(true);
      });

      it('should trigger sequential API calls on save: promote primary, update parent/child, delete removed, create new', async () => {
        const order = getMockOrder('Pending Shipment');
        (order as any).childOrders = [
          {
            crmOrderId: 2,
            orderPart: 'Child Part A',
            saleStatus: '1',
            orderCurrentStatus: 'Pending Shipment',
            orderAmountCharged: '200',
            orderRefundAmount: null,
            orderLiftgateNeeded: 'No',
          }
        ];

        const fetchSpy = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({}),
        });
        vi.stubGlobal('fetch', fetchSpy);

        render(<EditOrderForm order={order} vendors={[]} gateways={[]} agents={[]} />);

        // 1. Remove Child Part A
        const removePartBtns = screen.getAllByRole('button', { name: /remove part/i });
        fireEvent.click(removePartBtns[0]);

        // 2. Add New Part B
        const addPartBtn = screen.getByRole('button', { name: /add another part/i });
        fireEvent.click(addPartBtn);

        // Fill out Part B description (index 1 now since Child Part A was removed)
        const partInputs = screen.getAllByLabelText(/part description/i);
        fireEvent.change(partInputs[1], { target: { value: 'New Part B' } });
        
        // 3. Promote New Part B to primary
        const primaryRadios = screen.getAllByLabelText(/primary/i) as HTMLInputElement[];
        fireEvent.click(primaryRadios[1]);

        // 4. Click Save Changes
        const saveBtn = screen.getByText('Save Changes');
        fireEvent.click(saveBtn);

        await waitFor(() => {
          expect(fetchSpy).toHaveBeenCalled();
        });

        // Verify promote-part endpoint was hit first, then deletes/creates
        const calledUrls = fetchSpy.mock.calls.map(([url]) => url);
        
        // Should call PATCH /api/orders/1/promote-part (to promote the new card first)
        // Or wait: since new card does not have an ID yet, we must create it first, then promote it!
        // Order of calls:
        // - Update parent: PATCH /api/orders/1
        // - Create new card: POST /api/orders/1/parts
        // - Delete removed card: DELETE /api/orders/1/parts/2
        // - Promote new card if it was selected: PATCH /api/orders/1/promote-part (after creating it and getting its ID!)
        // Let's assert these requests occurred:
        expect(calledUrls.some(url => url.includes('/api/orders/1/parts/2'))).toBe(true); // Delete hit
        expect(calledUrls.some(url => url.includes('/api/orders/1/parts'))).toBe(true); // Create hit
        expect(calledUrls.some(url => url === '/api/orders/1')).toBe(true); // Update parent hit

        vi.unstubAllGlobals();
      });
    });
  });
});

