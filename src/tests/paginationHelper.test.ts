import { describe, it, expect } from 'vitest';
import { getPaginationRange, ELLIPSIS } from '../lib/paginationHelper';

describe('getPaginationRange Unit Tests', () => {
  it('should return all page numbers when totalPages is small', () => {
    expect(getPaginationRange({ currentPage: 1, totalPages: 5, siblingCount: 1, boundaryCount: 1 })).toEqual([1, 2, 3, 4, 5]);
    expect(getPaginationRange({ currentPage: 3, totalPages: 7, siblingCount: 1, boundaryCount: 1 })).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('should show right ellipsis when current page is near the start of large totalPages', () => {
    const range = getPaginationRange({ currentPage: 1, totalPages: 20, siblingCount: 1, boundaryCount: 1 });
    expect(range).toEqual([1, 2, 3, 4, 5, ELLIPSIS, 20]);
  });

  it('should show both left and right ellipses when current page is in middle of large totalPages', () => {
    const range = getPaginationRange({ currentPage: 10, totalPages: 20, siblingCount: 1, boundaryCount: 1 });
    expect(range).toEqual([1, ELLIPSIS, 9, 10, 11, ELLIPSIS, 20]);

    const range2 = getPaginationRange({ currentPage: 10, totalPages: 20, siblingCount: 2, boundaryCount: 1 });
    expect(range2).toEqual([1, ELLIPSIS, 8, 9, 10, 11, 12, ELLIPSIS, 20]);
  });

  it('should show left ellipsis when current page is near the end of large totalPages', () => {
    const range = getPaginationRange({ currentPage: 19, totalPages: 20, siblingCount: 1, boundaryCount: 1 });
    expect(range).toEqual([1, ELLIPSIS, 16, 17, 18, 19, 20]);
  });

  it('should support 5 boundary pages and 2 siblings for ultra-wide screens (>= 1600px)', () => {
    // 99 pages, current page 11, siblingCount = 2, boundaryCount = 5
    // Should be: [1, 2, 3, 4, 5, '...', 9, 10, 11, 12, 13, '...', 95, 96, 97, 98, 99]
    const ultraWideRange = getPaginationRange({
      currentPage: 11,
      totalPages: 99,
      siblingCount: 2,
      boundaryCount: 5,
    });

    expect(ultraWideRange).toEqual([
      1, 2, 3, 4, 5,
      ELLIPSIS,
      9, 10, 11, 12, 13,
      ELLIPSIS,
      95, 96, 97, 98, 99,
    ]);
  });
});
