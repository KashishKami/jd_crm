import * as roleRepository from '../repository/role.repository';

export async function getRoles() {
  return roleRepository.findRoles();
}

export async function getRoleById(roleId: number) {
  const role = await roleRepository.findRoleById(roleId);
  if (!role) {
    throw new Error('Role not found');
  }
  return role;
}

export async function createRole(name: string) {
  if (!name || name.trim() === '') {
    throw new Error('Role name cannot be empty');
  }

  const existingRoles = await roleRepository.findRoles();
  const duplicate = existingRoles.some(
    (r) => r.roleName.toLowerCase() === name.trim().toLowerCase()
  );

  if (duplicate) {
    throw new Error('Role name must be unique');
  }

  return roleRepository.createRole(name.trim());
}

export async function updateRole(roleId: number, name: string, permissionIds: number[]) {
  if (!name || name.trim() === '') {
    throw new Error('Role name cannot be empty');
  }

  // 1. Lockout Protection check
  if (roleId === 1) {
    // Find the super-admin permission ID
    const permissions = await roleRepository.findPermissions();
    const superAdminPerm = permissions.find((p) => p.permissionName === 'super-admin');

    if (superAdminPerm) {
      const containsSuperAdmin = permissionIds.includes(superAdminPerm.permissionId);
      if (!containsSuperAdmin) {
        throw new Error('Cannot remove super-admin permission from Super Admin role to prevent lockout');
      }
    }
  }

  // 2. Validate role exists
  const existingRole = await roleRepository.findRoleById(roleId);
  if (!existingRole) {
    throw new Error('Role not found');
  }

  // 3. Validate unique name if name changed
  if (existingRole.roleName.toLowerCase() !== name.trim().toLowerCase()) {
    const existingRoles = await roleRepository.findRoles();
    const duplicate = existingRoles.some(
      (r) => r.roleName.toLowerCase() === name.trim().toLowerCase()
    );
    if (duplicate) {
      throw new Error('Role name must be unique');
    }
  }

  return roleRepository.updateRolePermissions(roleId, name.trim(), permissionIds);
}

export async function deleteRole(roleId: number) {
  // 1. Block administrative roles delete
  if (roleId === 1 || roleId === 2) {
    throw new Error('Cannot delete default administrative roles');
  }

  // 2. Check if users are assigned to this role
  const userCount = await roleRepository.countUsersByRoleId(roleId);
  if (userCount > 0) {
    throw new Error('Cannot delete role with active users associated');
  }

  // 3. Proceed to delete
  return roleRepository.deleteRole(roleId);
}

export async function getPermissions() {
  return roleRepository.findPermissions();
}
