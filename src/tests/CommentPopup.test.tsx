// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import OrderList from '../components/OrderList';

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: '1',
        name: 'Test Admin',
        userPermissions: 'super-admin',
      },
    },
    status: 'authenticated',
  }),
}));

const originalFetch = global.fetch;

describe('OrderList Action Comments Popup Unit Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
  });

  it('should render a comment button in the Actions column and open a popup with CommentTimeline on click', async () => {
    const mockOrder = {
      crmOrderId: 77,
      orderDate: '2026-06-30',
      orderMakeModel: '2026 Mazda CX-5',
      orderPart: 'Mirror',
      orderTotalPitched: '500',
      orderVendorPrice: '300',
      orderAmountCharged: '200',
      orderCurrentStatus: 'Pending Booking',
      customer: {
        customerName: 'Marcus Aurelius',
        customerEmail: 'marcus@rome.com',
      },
    };

    // Mock fetch for comments endpoint
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/orders/77/comments')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              commentId: 101,
              customerId: 1,
              orderId: 77,
              comment: 'Popup Comment 1',
              commentImage: null,
              commentAgentId: 1,
              commentAgentName: 'Test Admin',
              commentCreatedDate: '2026-06-30T12:00:00Z',
              commentUpdatedDate: null,
            },
          ],
        });
      }
      return Promise.reject(new Error('Unknown url: ' + url));
    });

    render(<OrderList orders={[mockOrder] as any} />);

    // Check that comment button is in the document
    const commentBtn = screen.getByTitle('View Comments');
    expect(commentBtn).toBeDefined();

    // Click on the comments button
    fireEvent.click(commentBtn);

    // Assert fetch was called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/orders/77/comments');
    });

    // Assert that the popup comments title and comment text is displayed
    await waitFor(() => {
      expect(screen.getByText('Order Comments #77')).toBeDefined();
      expect(screen.getByText('Popup Comment 1')).toBeDefined();
    });

    // Close the popup
    const closeBtn = screen.getByText('×');
    fireEvent.click(closeBtn);

    // Verify it is removed
    await waitFor(() => {
      expect(screen.queryByText('Order Comments #77')).toBeNull();
    });
  });
});
