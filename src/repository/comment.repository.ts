import { prisma } from '../lib/db';
import { Prisma } from '@prisma/client';

export async function findByOrderId(orderId: number) {
  return prisma.crmComments.findMany({
    where: { orderId },
    include: {
      agent: {
        select: {
          uid: true,
          name: true,
          nickname: true,
          profileImage: true,
        },
      },
    },
    orderBy: {
      commentCreatedDate: 'asc',
    },
  });
}

export async function create(data: Prisma.CrmCommentsUncheckedCreateInput) {
  return prisma.crmComments.create({
    data,
    include: {
      agent: {
        select: {
          uid: true,
          name: true,
          nickname: true,
          profileImage: true,
        },
      },
    },
  });
}
