// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import Pagination from '../components/Pagination';

afterEach(() => {
  cleanup();
});

describe('Pagination Component Unit Tests', () => {
  it('should render Prev and Next buttons and clickable page numbers', () => {
    const handlePageChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={10}
        totalItems={100}
        onPageChange={handlePageChange}
      />
    );

    expect(screen.getByText('← Prev')).toBeDefined();
    expect(screen.getByText('Next →')).toBeDefined();
    expect(screen.getByText('1')).toBeDefined();
    expect(screen.getByText('10')).toBeDefined();
  });

  it('should highlight the active page pill with active class', () => {
    const handlePageChange = vi.fn();
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        totalItems={50}
        onPageChange={handlePageChange}
      />
    );

    const activePill = screen.getByText('3');
    expect(activePill.classList.contains('active')).toBe(true);
  });

  it('should call onPageChange with clicked page number when a page pill is clicked', () => {
    const handlePageChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={10}
        totalItems={100}
        onPageChange={handlePageChange}
      />
    );

    const page2Button = screen.getByText('2');
    fireEvent.click(page2Button);
    expect(handlePageChange).toHaveBeenCalledWith(2);
  });

  it('should disable Prev button on page 1 and Next button on totalPages', () => {
    const handlePageChange = vi.fn();
    const { rerender } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={50}
        onPageChange={handlePageChange}
      />
    );

    const prevBtn = screen.getByText('← Prev') as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(true);

    rerender(
      <Pagination
        currentPage={5}
        totalPages={5}
        totalItems={50}
        onPageChange={handlePageChange}
      />
    );

    const nextBtn = screen.getByText('Next →') as HTMLButtonElement;
    expect(nextBtn.disabled).toBe(true);
  });
});
