// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import DeleteOrderButton from '../components/DeleteOrderButton';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('DeleteOrderButton Component Unit Tests', () => {
  it('should render a button with text Delete Order', () => {
    render(<DeleteOrderButton orderId={100} />);
    const btn = screen.getByRole('button', { name: /delete order/i });
    expect(btn).not.toBeNull();
  });

  it('should show confirmation modal when delete button is clicked', () => {
    render(<DeleteOrderButton orderId={100} />);
    
    // Modal shouldn't be in the document initially
    expect(screen.queryByText(/this action is permanent and cannot be undone/i)).toBeNull();

    const btn = screen.getByRole('button', { name: /delete order/i });
    fireEvent.click(btn);

    // Modal should now be visible
    expect(screen.getByText(/delete order #100 permanently\?/i)).not.toBeNull();
    expect(screen.getByText(/this action is permanent and cannot be undone/i)).not.toBeNull();
  });

  it('should dismiss modal when Cancel is clicked', () => {
    render(<DeleteOrderButton orderId={100} />);
    
    const btn = screen.getByRole('button', { name: /delete order/i });
    fireEvent.click(btn);

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByText(/this action is permanent and cannot be undone/i)).toBeNull();
  });

  it('should call fetch DELETE and redirect to pipeline page when Delete Permanently is clicked', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    vi.stubGlobal('fetch', fetchSpy);

    render(<DeleteOrderButton orderId={100} />);
    
    const btn = screen.getByRole('button', { name: /delete order/i });
    fireEvent.click(btn);

    const confirmBtn = screen.getByRole('button', { name: /delete permanently/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    expect(fetchSpy.mock.calls[0][0]).toBe('/api/orders/100');
    expect(fetchSpy.mock.calls[0][1].method).toBe('DELETE');

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/orders');
    });

    vi.unstubAllGlobals();
  });
});
