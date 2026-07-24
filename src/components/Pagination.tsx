'use client';

import React, { useState, useEffect } from 'react';
import { getPaginationRange, ELLIPSIS } from '../lib/paginationHelper';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemLabel = 'records',
  onPageChange,
}: PaginationProps) {
  // Sibling and boundary counts based on screen width
  // < 640px: sibling 1, boundary 1
  // 640px - 1599px: sibling 2, boundary 1
  // >= 1600px: sibling 2, boundary 5
  const [siblingCount, setSiblingCount] = useState<number>(1);
  const [boundaryCount, setBoundaryCount] = useState<number>(1);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1600) {
        setSiblingCount(2);
        setBoundaryCount(5);
      } else if (width >= 640) {
        setSiblingCount(2);
        setBoundaryCount(1);
      } else {
        setSiblingCount(1);
        setBoundaryCount(1);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (totalPages <= 0) return null;

  const paginationRange = getPaginationRange({
    currentPage,
    totalPages,
    siblingCount,
    boundaryCount,
  });

  return (
    <div className="pagination-bar">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        className="pagination-btn"
        aria-label="Previous Page"
      >
        ← Prev
      </button>

      <div className="pagination-numbers">
        {paginationRange.map((pageNumber, index) => {
          if (pageNumber === ELLIPSIS) {
            return (
              <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                &#8230;
              </span>
            );
          }

          const page = pageNumber as number;
          const isActive = page === currentPage;

          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`pagination-number-btn ${isActive ? 'active' : ''}`}
              aria-label={`Page ${page}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        className="pagination-btn"
        aria-label="Next Page"
      >
        Next →
      </button>
    </div>
  );
}
