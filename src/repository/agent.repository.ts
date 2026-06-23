import { prisma } from '../lib/db';
import bcrypt from 'bcrypt';
import { FormAcademicRecord, FormProfessionalRecord } from '../types/agent';
import { Prisma } from '@prisma/client';

export interface CreateAgentInput {
  name: string;
  username: string;
  password?: string | null;
  email?: string | null;
  mobile?: string | null;
  gender?: string;
  status?: number;
  age?: number | null;
  designation?: string | null;
  dateOfJoining?: string | Date | null;
  agentId?: string | null;
  agentTarget?: string | null;
  agentSalary?: string | null;
  teamId: number;
  roleId: number;
  profile?: Record<string, unknown> | null;
  academicRecord?: FormAcademicRecord[] | null;
  professionalRecord?: FormProfessionalRecord[] | null;
}

export interface UpdateAgentInput {
  name?: string;
  username?: string;
  password?: string | null;
  email?: string | null;
  mobile?: string | null;
  gender?: string;
  status?: number;
  age?: number | null;
  designation?: string | null;
  dateOfJoining?: string | Date | null;
  agentId?: string | null;
  agentTarget?: string | null;
  agentSalary?: string | null;
  teamId?: number;
  roleId?: number;
  profile?: Record<string, unknown> | null;
  academicRecord?: FormAcademicRecord[] | null;
  professionalRecord?: FormProfessionalRecord[] | null;
}

export async function findAll(status?: number) {
  return prisma.users.findMany({
    where: status !== undefined ? { status } : undefined,
    include: {
      team: true,
      role: true,
    },
    orderBy: {
      uid: 'asc',
    },
  });
}

export async function findById(uid: number) {
  return prisma.users.findUnique({
    where: { uid },
    include: {
      team: true,
      role: true,
      profile: true,
      academicRecord: true,
      professionalRecord: true,
    },
  });
}

export async function create(data: CreateAgentInput) {
  const { password, profile, academicRecord, professionalRecord, ...userData } = data;
  const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

  return prisma.$transaction(async (tx) => {
    // 1. Create main user row
    const user = await tx.users.create({
      data: {
        ...userData,
        password: hashedPassword,
      } as Prisma.UsersUncheckedCreateInput,
    });

    // 2. Create profile if provided
    if (profile) {
      await tx.usersProfile.create({
        data: {
          ...profile,
          profileUserId: user.uid,
        },
      });
    }

    // 3. Create academic records if provided
    if (Array.isArray(academicRecord) && academicRecord.length > 0) {
      await tx.usersProfileAcademic.createMany({
        data: academicRecord.map((record: FormAcademicRecord) => ({
          ...record,
          academicUserId: user.uid,
        })),
      });
    }

    // 4. Create professional records if provided
    if (Array.isArray(professionalRecord) && professionalRecord.length > 0) {
      await tx.usersProfileProfessional.createMany({
        data: professionalRecord.map((record: FormProfessionalRecord) => ({
          ...record,
          professionalUserId: user.uid,
        })),
      });
    }

    return user;
  });
}

export async function update(uid: number, data: UpdateAgentInput) {
  const { profile, academicRecord, professionalRecord, password, ...userData } = data;

  let hashedPassword = password;
  if (password && !password.startsWith('$2')) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  // Handle nested profile updates
  return prisma.$transaction(async (tx) => {
    // 1. Update primary user fields
    const user = await tx.users.update({
      where: { uid },
      data: {
        ...userData,
        ...(password ? { password: hashedPassword } : {}),
      } as Prisma.UsersUncheckedUpdateInput,
    });

    // 2. Update profile if provided
    if (profile) {
      await tx.usersProfile.upsert({
        where: { profileUserId: uid },
        update: profile,
        create: {
          ...profile,
          profileUserId: uid,
        },
      });
    }

    // 3. Update academic records (simple recreate/upsert pattern)
    if (academicRecord) {
      // Clean and recreate academic records
      await tx.usersProfileAcademic.deleteMany({
        where: { academicUserId: uid },
      });
      if (Array.isArray(academicRecord) && academicRecord.length > 0) {
        await tx.usersProfileAcademic.createMany({
          data: academicRecord.map((record: FormAcademicRecord) => ({
            ...record,
            academicUserId: uid,
          })),
        });
      }
    }

    // 4. Update professional records
    if (professionalRecord) {
      await tx.usersProfileProfessional.deleteMany({
        where: { professionalUserId: uid },
      });
      if (Array.isArray(professionalRecord) && professionalRecord.length > 0) {
        await tx.usersProfileProfessional.createMany({
          data: professionalRecord.map((record: FormProfessionalRecord) => ({
            ...record,
            professionalUserId: uid,
          })),
        });
      }
    }

    return user;
  });
}

export async function toggleStatus(uid: number, status: number) {
  return prisma.users.update({
    where: { uid },
    data: { status },
  });
}

export async function deleteAgent(uid: number) {
  return prisma.users.delete({
    where: { uid },
  });
}
