// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import VendorForm from '../components/VendorForm';

afterEach(() => {
  cleanup();
});

describe('VendorForm Unit Tests', () => {
  const defaultInitialData = {
    vendorName: '',
    vendorEmail: '',
    vendorPhone: '',
    vendorAlternatePhone1: '',
    vendorAlternatePhone2: '',
    vendorFax: '',
    vendorContactPerson: '',
    vendorStatus: '1',
    vendorCountry: 'USA',
    vendorState: '',
    vendorPaymentMode: '[]',
    vendorRemark: '',
  };

  it('should render all standard and Phase 24 extended fields', () => {
    render(<VendorForm initialData={defaultInitialData} onSubmit={vi.fn()} submitting={false} />);

    expect(screen.getByLabelText(/vendor name/i)).toBeDefined();
    expect(screen.getByLabelText(/email address/i)).toBeDefined();
    expect(screen.getByLabelText(/^phone number/i)).toBeDefined();
    expect(screen.getByLabelText(/alternate phone 1/i)).toBeDefined();
    expect(screen.getByLabelText(/alternate phone 2/i)).toBeDefined();
    expect(screen.getByLabelText(/fax number/i)).toBeDefined();
    expect(screen.getByLabelText(/contact person/i)).toBeDefined();
    expect(screen.getByLabelText(/vendor status/i)).toBeDefined();
    expect(screen.getByLabelText(/country/i)).toBeDefined();
    expect(screen.getByLabelText(/state\/province/i)).toBeDefined();
    expect(screen.getByText(/payment methods/i)).toBeDefined();
    expect(screen.getByLabelText(/remarks \/ notes/i)).toBeDefined();
  });

  it('should dynamically update state options when country changes (USA vs Canada)', () => {
    render(<VendorForm initialData={defaultInitialData} onSubmit={vi.fn()} submitting={false} />);

    const countrySelect = screen.getByLabelText(/country/i) as HTMLSelectElement;
    const stateSelect = screen.getByLabelText(/state\/province/i) as HTMLSelectElement;

    // USA is selected by default
    expect(countrySelect.value).toBe('USA');
    
    // Check USA states exist
    const optionsUSA = Array.from(stateSelect.options).map(o => o.text);
    expect(optionsUSA).toContain('California');
    expect(optionsUSA).not.toContain('Ontario');

    // Change country to Canada
    fireEvent.change(countrySelect, { target: { value: 'Canada' } });
    expect(countrySelect.value).toBe('Canada');

    // Check Canada provinces exist
    const optionsCanada = Array.from(stateSelect.options).map(o => o.text);
    expect(optionsCanada).toContain('Ontario');
    expect(optionsCanada).not.toContain('California');
  });

  it('should support checking multiple payment methods and serialize them to JSON array on submit', async () => {
    const handleSubmit = vi.fn();
    render(<VendorForm initialData={defaultInitialData} onSubmit={handleSubmit} submitting={false} />);

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/vendor name/i), { target: { value: 'Test Supplier' } });
    fireEvent.change(screen.getByLabelText(/^phone number/i), { target: { value: '111-222-3333' } });
    fireEvent.change(screen.getByLabelText(/contact person/i), { target: { value: 'Jane Ross' } });

    // Check Payment Methods
    const customerCardCheck = screen.getByLabelText('Customer Card') as HTMLInputElement;
    const linkCheck = screen.getByLabelText('Link') as HTMLInputElement;

    fireEvent.click(customerCardCheck);
    fireEvent.click(linkCheck);

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /save vendor/i });
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    const submittedData = handleSubmit.mock.calls[0][0];
    
    // vendorPaymentMode should be JSON serialized array of selected methods
    const parsedMode = JSON.parse(submittedData.vendorPaymentMode);
    expect(parsedMode).toContain('Customer Card');
    expect(parsedMode).toContain('Link');
    expect(parsedMode).not.toContain('Company Card');
  });
});
