// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { useSession } from 'next-auth/react';
import AddFollowUpForm from '../components/AddFollowUpForm';

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('AddFollowUpForm Component Unit Tests (W-3109)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    pushMock.mockClear();
    refreshMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render all form fields correctly', () => {
    render(<AddFollowUpForm />);

    expect(screen.queryByLabelText(/Customer Name/)).not.toBeNull();
    expect(screen.queryByLabelText(/Phone Number/)).not.toBeNull();
    expect(screen.queryByLabelText(/Country/)).not.toBeNull();
    expect(screen.queryByLabelText(/State\/Province/)).not.toBeNull();
    expect(screen.queryByLabelText(/Year, Make & Model/)).not.toBeNull();
    expect(screen.queryByLabelText(/Part Required/)).not.toBeNull();
    expect(screen.queryByLabelText(/Quoted Options/)).not.toBeNull();
    expect(screen.queryByLabelText(/Follow-Up Date/)).not.toBeNull();
    expect(screen.queryByLabelText(/Follow-Up Time/)).not.toBeNull();
    expect(screen.queryByLabelText(/Follow-Up Reason/)).not.toBeNull();
    expect(screen.queryByLabelText(/Status/)).not.toBeNull();
    expect(screen.queryByLabelText(/Priority/)).not.toBeNull();
    expect(screen.queryByLabelText(/Notes/)).not.toBeNull();
  });

  it('should filter states/provinces based on selected country', () => {
    render(<AddFollowUpForm />);

    const countrySelect = screen.getByLabelText(/Country/) as HTMLSelectElement;
    const stateSelect = screen.getByLabelText(/State\/Province/) as HTMLSelectElement;

    // Default is USA
    expect(countrySelect.value).toBe('USA');
    // California should be present
    const caliOption = Array.from(stateSelect.options).find(o => o.value === 'California');
    expect(caliOption).toBeDefined();

    // Change country to Canada
    fireEvent.change(countrySelect, { target: { value: 'Canada' } });
    expect(countrySelect.value).toBe('Canada');

    // Ontario should be present, California should not be
    const ontarioOption = Array.from(stateSelect.options).find(o => o.value === 'Ontario');
    expect(ontarioOption).toBeDefined();
    const caliOption2 = Array.from(stateSelect.options).find(o => o.value === 'California');
    expect(caliOption2).toBeUndefined();
  });

  it('should display inferred timezone display label when state is selected', async () => {
    render(<AddFollowUpForm />);

    const stateSelect = screen.getByLabelText(/State\/Province/) as HTMLSelectElement;

    // Select California
    fireEvent.change(stateSelect, { target: { value: 'California' } });
    expect(screen.queryByText('Pacific Time — America/Los_Angeles')).not.toBeNull();

    // Select Texas
    fireEvent.change(stateSelect, { target: { value: 'Texas' } });
    expect(screen.queryByText('Central Time — America/Chicago')).not.toBeNull();
  });

  it('should show specify reason text input only when "Other" is selected', () => {
    render(<AddFollowUpForm />);

    const reasonSelect = screen.getByLabelText(/Follow-Up Reason/) as HTMLSelectElement;
    expect(screen.queryByLabelText(/Specify Reason/)).toBeNull();

    // Change reason to Other (Please specify)
    fireEvent.change(reasonSelect, { target: { value: 'Other (Please specify)' } });
    expect(screen.queryByLabelText(/Specify Reason/)).not.toBeNull();

    // Change back
    fireEvent.change(reasonSelect, { target: { value: 'Waiting for paycheck' } });
    expect(screen.queryByLabelText(/Specify Reason/)).toBeNull();
  });

  it('should successfully submit form data with correct body and inferred timezone', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ followUpId: 101 }),
    } as any);

    render(<AddFollowUpForm />);

    fireEvent.change(screen.getByLabelText(/Customer Name/), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/State\/Province/), { target: { value: 'California' } });
    fireEvent.change(screen.getByLabelText(/Year, Make & Model/), { target: { value: '2020 Jeep Cherokee' } });
    fireEvent.change(screen.getByLabelText(/Part Required/), { target: { value: 'Transmission' } });
    fireEvent.change(screen.getByLabelText(/Follow-Up Date/), { target: { value: '2026-09-12' } });
    fireEvent.change(screen.getByLabelText(/Follow-Up Time/), { target: { value: '14:30' } });

    fireEvent.click(screen.getAllByText('Create Follow-Up')[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/follow-ups',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String),
        })
      );
    });

    const callArgs = vi.mocked(global.fetch).mock.calls[0];
    const payload = JSON.parse(callArgs[1]?.body as string);

    expect(payload.customerName).toBe('Jane Doe');
    expect(payload.customerState).toBe('California');
    expect(payload.vehicleYearMakeModel).toBe('2020 Jeep Cherokee');
    expect(payload.followUpDate).toBe('2026-09-12');
    expect(payload.followUpTime).toBe('14:30');
    expect(pushMock).toHaveBeenCalledWith('/follow-ups');
  });

  it('should auto-format phone numbers as the user types', () => {
    render(<AddFollowUpForm />);
    const phoneInput = screen.getByLabelText(/Phone Number/) as HTMLInputElement;

    // Normal typing
    fireEvent.change(phoneInput, { target: { value: '5551234567' } });
    expect(phoneInput.value).toBe('555-123-4567');

    // Incomplete typing
    fireEvent.change(phoneInput, { target: { value: '55' } });
    expect(phoneInput.value).toBe('55');

    // Non-digits stripping and truncation
    fireEvent.change(phoneInput, { target: { value: '5551236789abc' } });
    expect(phoneInput.value).toBe('555-123-6789');
  });
});
