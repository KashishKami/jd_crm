// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
// @ts-ignore
import AddDispositionModal from '../components/AddDispositionModal';

afterEach(() => {
  cleanup();
});

describe('AddDispositionModal Unit Tests', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders modal with form fields when isOpen is true', () => {
    render(
      <AddDispositionModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Log Inbound Call Disposition')).toBeDefined();
    expect(screen.getByLabelText('Customer Phone *')).toBeDefined();
    expect(screen.getByLabelText('Customer Name (Optional)')).toBeDefined();
    expect(screen.getByLabelText('Disposition *')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDefined();
  });

  it('validates required fields and shows error messages', async () => {
    render(
      <AddDispositionModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const submitBtn = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Phone number is required')).toBeDefined();
    expect(await screen.findByText('Disposition is required')).toBeDefined();
  });

  it('calls onSubmit and onClose when valid data is entered', async () => {
    // Mock the global fetch
    const mockResponse = { disposition: { callId: 1 } };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    render(
      <AddDispositionModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.change(screen.getByLabelText('Customer Phone *'), {
      target: { value: '5551234567' },
    });
    fireEvent.change(screen.getByLabelText('Customer Name (Optional)'), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText('Disposition *'), {
      target: { value: 'Price Quoted' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/call-dispositions', expect.any(Object));
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
