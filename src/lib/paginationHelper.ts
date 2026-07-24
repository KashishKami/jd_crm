export const ELLIPSIS = '...';

export interface PaginationRangeOptions {
  currentPage: number;
  totalPages: number;
  siblingCount?: number;
  boundaryCount?: number;
}

export function getPaginationRange({
  currentPage,
  totalPages,
  siblingCount = 1,
  boundaryCount = 1,
}: PaginationRangeOptions): (number | string)[] {
  const range = (start: number, end: number) => {
    const length = end - start + 1;
    return Array.from({ length: Math.max(length, 0) }, (_, i) => start + i);
  };

  if (totalPages <= 0) return [];

  const maxTotalPagesShown = boundaryCount * 2 + siblingCount * 2 + 3;
  if (totalPages <= maxTotalPagesShown) {
    return range(1, totalPages);
  }

  const startPages = range(1, Math.min(boundaryCount, totalPages));
  const endPages = range(Math.max(totalPages - boundaryCount + 1, boundaryCount + 1), totalPages);

  const leftSiblingIndex = Math.max(currentPage - siblingCount, boundaryCount + 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages - boundaryCount);

  const shouldShowLeftDots = leftSiblingIndex > boundaryCount + 1;
  const shouldShowRightDots = rightSiblingIndex < totalPages - boundaryCount;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = boundaryCount + siblingCount * 2 + 2;
    const leftRange = range(1, Math.min(leftItemCount, totalPages));
    return [...leftRange, ELLIPSIS, ...endPages];
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = boundaryCount + siblingCount * 2 + 2;
    const rightRange = range(Math.max(1, totalPages - rightItemCount + 1), totalPages);
    return [...startPages, ELLIPSIS, ...rightRange];
  }

  if (shouldShowLeftDots && shouldShowRightDots) {
    const middleRange = range(leftSiblingIndex, rightSiblingIndex);
    return [...startPages, ELLIPSIS, ...middleRange, ELLIPSIS, ...endPages];
  }

  return range(1, totalPages);
}
