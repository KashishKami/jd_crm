/**
 * Verifies if a user has a specific permission code.
 * Super Administrator (permission code '99999') automatically passes all permission checks.
 * 
 * @param userPermissions Comma-separated string of permission codes (e.g. "101,160,162")
 * @param permissionCode The specific permission code to check (e.g. "160" or 160)
 * @returns boolean indicating if the permission is granted
 */
export function hasPermission(
  userPermissions: string | null | undefined,
  permissionCode: string | number
): boolean {
  if (!userPermissions) {
    return false;
  }

  const permissionsList = userPermissions.split(',').map((p) => p.trim());

  // Super Administrator code
  if (permissionsList.includes('super-admin')) {
    return true;
  }

  return permissionsList.includes(String(permissionCode));
}
