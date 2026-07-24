export interface SafeUrlParamOptions {
  searchParams?: { get: (key: string) => string | null } | null;
  paramName: string;
  expectedBasePath: string;
  defaultValue?: string;
}

/**
 * Route-isolated query parameter extraction helper.
 * Prevents cross-page filter bleeding (e.g. /orders?agentId=5 -> /follow-ups)
 * and preserves filters/page numbers when returning from detail/edit pages.
 */
export function getSafeUrlParam({
  searchParams,
  paramName,
  expectedBasePath,
  defaultValue = '',
}: SafeUrlParamOptions): string {
  // 1. Check searchParams first (Next.js route-scoped searchParams hook)
  if (searchParams) {
    const val = searchParams.get(paramName);
    if (val !== null) {
      return val;
    }
  }

  if (typeof window === 'undefined') {
    return defaultValue;
  }

  // 2. Check coming_from_detail if returning from a detail view
  const comingFromDetail = sessionStorage.getItem('coming_from_detail');
  if (comingFromDetail && comingFromDetail.startsWith(expectedBasePath) && comingFromDetail.includes('?')) {
    const queryString = comingFromDetail.substring(comingFromDetail.indexOf('?') + 1);
    const params = new URLSearchParams(queryString);
    if (params.has(paramName)) {
      return params.get(paramName) || defaultValue;
    }
  }

  // 3. Check window.location.search ONLY IF window.location.pathname matches expectedBasePath
  if (window.location.pathname.startsWith(expectedBasePath)) {
    const params = new URLSearchParams(window.location.search);
    if (params.has(paramName)) {
      return params.get(paramName) || defaultValue;
    }
  }

  return defaultValue;
}
