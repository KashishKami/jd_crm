import { prisma } from '../lib/db';

export interface RoleWithPermissions {
  roleId: number;
  roleName: string;
  roleCreated: Date;
  roleUpdated: Date | null;
  permissionIds: number[];
}

export async function findRoles(): Promise<RoleWithPermissions[]> {
  const roles = await prisma.crmRoles.findMany({
    include: {
      permissions: true,
    },
    orderBy: {
      roleId: 'asc',
    },
  });

  return roles.map((role) => ({
    roleId: role.roleId,
    roleName: role.roleName,
    roleCreated: role.roleCreated,
    roleUpdated: role.roleUpdated,
    permissionIds: role.permissions.map((p) => p.permissionId),
  }));
}

export async function findRoleById(roleId: number): Promise<RoleWithPermissions | null> {
  const role = await prisma.crmRoles.findUnique({
    where: { roleId },
    include: {
      permissions: true,
    },
  });

  if (!role) {
    return null;
  }

  return {
    roleId: role.roleId,
    roleName: role.roleName,
    roleCreated: role.roleCreated,
    roleUpdated: role.roleUpdated,
    permissionIds: role.permissions.map((p) => p.permissionId),
  };
}

export async function createRole(name: string) {
  return prisma.crmRoles.create({
    data: {
      roleName: name,
    },
  });
}

export async function updateRolePermissions(
  roleId: number,
  name: string,
  permissionIds: number[]
) {
  return prisma.$transaction(async (tx) => {
    // 1. Update the role details
    const role = await tx.crmRoles.update({
      where: { roleId },
      data: {
        roleName: name,
        roleUpdated: new Date(),
      },
    });

    // 2. Delete existing permission relationships for this role
    await tx.crmRolePermissions.deleteMany({
      where: { roleId },
    });

    // 3. Create new permission relationships
    if (permissionIds.length > 0) {
      await tx.crmRolePermissions.createMany({
        data: permissionIds.map((pid) => ({
          roleId,
          permissionId: pid,
        })),
      });
    }

    return role;
  });
}

export async function deleteRole(roleId: number) {
  return prisma.crmRoles.delete({
    where: { roleId },
  });
}

export async function countUsersByRoleId(roleId: number): Promise<number> {
  return prisma.users.count({
    where: { roleId },
  });
}

export async function findPermissions() {
  return prisma.crmPermissions.findMany({
    orderBy: {
      permissionId: 'asc',
    },
  });
}
