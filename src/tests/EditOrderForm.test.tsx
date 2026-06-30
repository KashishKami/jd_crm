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
  orderQuotedMiles: '100',
  orderGivenMiles: '100',
  orderVin: 'VIN123',
  orderShippingType: 'Ground',
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

    // Card fields MUST be present in the sent payload
    expect(sentBody).toHaveProperty('customerNameOncard', 'John Doe');
    expect(sentBody).toHaveProperty('customerCardNumber', '4111222233334444');
    expect(sentBody).toHaveProperty('customerCardExpDate', '12/29');
    expect(sentBody).toHaveProperty('customerCardCopyStatus', 'No');
    expect(sentBody).toHaveProperty('customerCardPhotoStatus', 'No');

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
});

