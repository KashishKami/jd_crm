import * as agentRepository from '../repository/agent.repository';
import { CreateAgentInput, UpdateAgentInput } from '../repository/agent.repository';
import { prisma } from '../lib/db';

function sanitizeUser<T extends { password?: string | null }>(user: T | null): Omit<T, 'password'> | null {
  if (!user) return null;
  const sanitized = { ...user };
  delete sanitized.password;
  return sanitized;
}

export async function getAllAgents(status?: number) {
  const agents = await agentRepository.findAll(status);
  return agents.map(sanitizeUser);
}

export async function getAgentById(uid: number) {
  const agent = await agentRepository.findById(uid);
  return sanitizeUser(agent);
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
