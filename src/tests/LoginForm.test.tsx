// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
// We mock next-auth/react
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

import { signIn } from 'next-auth/react';
import LoginForm from '../components/LoginForm';

afterEach(() => {
  cleanup();
});

describe('LoginForm Unit Test', () => {
  it('should render username and password fields and submit button', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/username or email/i)).toBeDefined();
    expect(screen.getByLabelText(/password/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /login/i })).toBeDefined();
  });

  it('should trigger NextAuth signIn when form is submitted with credentials', async () => {
    render(<LoginForm />);
    
    const usernameInput = screen.getByLabelText(/username or email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', {
        redirect: false,
        username: 'admin',
        password: 'admin123',
      });
    });
  });

  it('should render the unified JD CRM header and not mention Monolith', () => {
    render(<LoginForm />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('JD CRM');
  });
});
