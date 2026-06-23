// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { useSession } from 'next-auth/react';
import CustomerCards from '../components/CustomerCards';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

describe('CustomerCards Component Unit Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should render a list of cards from mock data', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Agent User',
          userPermissions: 'customers:view',
        },
      },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>);

    const mockCards = [
      {
        cardId: 1,
        cardCustomerId: 101,
        customerNameOncard: 'John Doe Card',
        customerCardNumber: '**** **** **** 5678',
        customerCardExpDate: '12/29',
        customerCardCvv: '***',
      },
    ];

    render(<CustomerCards cards={mockCards} />);

    expect(screen.queryByText('John Doe Card')).not.toBeNull();
    expect(screen.queryByText('**** **** **** 5678')).not.toBeNull();
    expect(screen.queryByText('12/29')).not.toBeNull();
    expect(screen.queryByText('CVV: ***')).not.toBeNull();
  });

  it('should render full card details if permission customers:view-cards is present', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Manager User',
          userPermissions: 'customers:view,customers:view-cards',
        },
      },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>);

    const mockCards = [
      {
        cardId: 2,
        cardCustomerId: 101,
        customerNameOncard: 'John Doe Full Card',
        customerCardNumber: '1234567812345678',
        customerCardExpDate: '12/29',
        customerCardCvv: '123',
      },
    ];

    render(<CustomerCards cards={mockCards} />);

    expect(screen.queryByText('John Doe Full Card')).not.toBeNull();
    expect(screen.queryByText('1234567812345678')).not.toBeNull();
    expect(screen.queryByText('CVV: 123')).not.toBeNull();
  });
});
