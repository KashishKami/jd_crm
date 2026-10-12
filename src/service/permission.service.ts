/**
 * Verifies if a user has a specific permission code.
 * Super Administrator (permission code '99999') automatically passes all permission checks.
 * 
 * @param userPermissions Comma-separated string of permission codes (e.g. "101,160,162")
 * @param permissionCode The specific permission code to check (e.g. "160" or 160)
 * @returns boolean indicating if the permission is granted
 */
export function hasPermission(
  userPermissions: string | string[] | null | undefined,
  permissionCode: string | number
): boolean {
  if (!userPermissions) {
    return false;
  }

  const permissionsList = Array.isArray(userPermissions)
    ? userPermissions.map(String).map((p) => p.trim())
    : userPermissions.split(',').map((p) => p.trim());

  // Super Administrator code
  if (permissionsList.includes('super-admin')) {
    return true;
  }

  return permissionsList.includes(String(permissionCode));
}

/**
 * Checks if user has reports module access.
 * Grants access if user has:
 * - any report-specific view permission (e.g. 'reports:agent-sales', or future 'reports:*' non-export)
 * - 'super-admin'
 * - roleId === 1
 */
export function hasReportsAccess(
  userPermissions: string | string[] | null | undefined,
  roleId?: number | null
): boolean {
  if (roleId === 1) {
    return true;
  }
  if (!userPermissions) {
    return false;
  }

  const permissionsList = Array.isArray(userPermissions)
    ? userPermissions.map(String).map((p) => p.trim())
    : userPermissions.split(',').map((p) => p.trim());

  if (permissionsList.includes('super-admin')) {
    return true;
  }

  return permissionsList.some(
    (p) => p.startsWith('reports:') && !p.endsWith('-export')
  );
}
