// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
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
    firstName: 'John',
    lastName: 'Doe',
    customerPhone: '1234567890',
    customerEmail: 'john@example.com',
    customerBillingAddress: '123 Street',
    customerShippingAddress: '123 Street',
    cards: [
      {
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
});
