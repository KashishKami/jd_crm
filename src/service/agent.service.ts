import * as agentRepository from '../repository/agent.repository';
import { CreateAgentInput, UpdateAgentInput } from '../repository/agent.repository';
import { prisma } from '../lib/db';
import { AgentDetail } from '../types/agent';

function sanitizeUser<T extends { password?: string | null }>(user: T | null): Omit<T, 'password'> | null {
  if (!user) return null;
  const sanitized = { ...user };
  delete sanitized.password;
  return sanitized;
}

export async function getAllAgents(status?: number, page?: number, limit?: number): Promise<any> {
  if (page !== undefined && limit !== undefined) {
    const skip = (page - 1) * limit;
    const [agents, total] = await Promise.all([
      prisma.users.findMany({
        where: status !== undefined ? { status } : undefined,
        include: {
          team: true,
          role: true,
        },
        orderBy: {
          created: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.users.count({
        where: status !== undefined ? { status } : undefined,
      })
    ]);
    return {
      data: agents.map(sanitizeUser),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  const agents = await agentRepository.findAll(status);
  return agents.map(sanitizeUser);
}

export async function getAgentById(uid: number): Promise<AgentDetail | null> {
  const agent = await agentRepository.findById(uid);
  return sanitizeUser(agent) as AgentDetail | null;
}

export async function createAgent(data: CreateAgentInput) {
  // 1. Validate username uniqueness
  const existingUser = await prisma.users.findFirst({
    where: { username: data.username },
  });
  if (existingUser) {
    throw new Error('Username is already taken');
  }

  // 2. Validate teamId exists
  if (data.teamId) {
    const team = await prisma.crmTeams.findUnique({
      where: { teamId: Number(data.teamId) },
    });
    if (!team) {
      throw new Error('Invalid team ID');
    }
  }

  // 3. Create
  const user = await agentRepository.create(data);
  return sanitizeUser(user);
}

export async function updateAgent(uid: number, data: UpdateAgentInput) {
  // 1. Validate username uniqueness if changed
  if (data.username) {
    const existingUser = await prisma.users.findFirst({
      where: {
        username: data.username,
        NOT: { uid },
      },
    });
    if (existingUser) {
      throw new Error('Username is already taken');
    }
  }

  // 2. Validate teamId exists if provided
  if (data.teamId) {
    const team = await prisma.crmTeams.findUnique({
      where: { teamId: Number(data.teamId) },
    });
    if (!team) {
      throw new Error('Invalid team ID');
    }
  }

  // 3. Update
  const user = await agentRepository.update(uid, data);
  return sanitizeUser(user);
}

export async function updateAgentStatus(uid: number, status: number) {
  const user = await agentRepository.toggleStatus(uid, status);
  return sanitizeUser(user);
}

export async function deleteAgent(uid: number) {
  const user = await agentRepository.deleteAgent(uid);
  return sanitizeUser(user);
}
