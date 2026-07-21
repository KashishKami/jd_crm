import { prisma } from '../lib/db';
import {
  CallDispositionFilters,
  CallDispositionListResult,
  CallDispositionRecord,
  CallDispositionUpdateInput,
} from '../types/callDisposition';

export async function findAll(filters: CallDispositionFilters): Promise<CallDispositionListResult> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (filters.agentId)     where.agentId = filters.agentId;
  if (filters.teamId)      where.teamId = filters.teamId;
  if (filters.disposition) where.disposition = filters.disposition;
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom + 'T00:00:00.000Z');
    if (filters.dateTo)   where.createdAt.lte = new Date(filters.dateTo + 'T23:59:59.999Z');
  }

  const [dispositions, total] = await prisma.$transaction([
    prisma.crmCallDispositions.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.crmCallDispositions.count({ where }),
  ]);

  return { dispositions: dispositions as CallDispositionRecord[], total };
}

export async function findAll_noLimit(filters: CallDispositionFilters): Promise<CallDispositionRecord[]> {
  const where: any = {};
  if (filters.agentId)     where.agentId = filters.agentId;
  if (filters.teamId)      where.teamId = filters.teamId;
  if (filters.disposition) where.disposition = filters.disposition;
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom + 'T00:00:00.000Z');
    if (filters.dateTo)   where.createdAt.lte = new Date(filters.dateTo + 'T23:59:59.999Z');
  }
  return prisma.crmCallDispositions.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  }) as Promise<CallDispositionRecord[]>;
}

export async function findById(id: number): Promise<CallDispositionRecord | null> {
  return prisma.crmCallDispositions.findUnique({
    where: { callId: id },
  }) as Promise<CallDispositionRecord | null>;
}

export async function create(data: {
  customerPhone: string;
  customerName?: string | null;
  agentId: number;
  agentName: string;
  teamId: number;
  disposition: string;
}) {
  return prisma.crmCallDispositions.create({ data }) as Promise<CallDispositionRecord>;
}

export async function update(id: number, data: CallDispositionUpdateInput) {
  return prisma.crmCallDispositions.update({
    where: { callId: id },
    data,
  }) as Promise<CallDispositionRecord>;
}

export async function remove(id: number) {
  return prisma.crmCallDispositions.delete({
    where: { callId: id },
  });
}
