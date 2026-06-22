import { describe, it, expect } from 'vitest';
import { prisma } from '../lib/db';

describe('Database Connection Integration Test', () => {
  it('should connect to database and retrieve the seeded admin user with team info', async () => {
    const adminUser = await prisma.users.findFirst({
      where: {
        username: 'admin',
      },
      include: {
        team: true,
      },
    });

    expect(adminUser).toBeDefined();
    expect(adminUser?.name).toBe('Super Admin');
    expect(adminUser?.team).toBeDefined();
    expect(adminUser?.team.teamName).toBe('IT Park');
  });

  it('should fetch all three seeded teams', async () => {
    const teams = await prisma.crmTeams.findMany({
      orderBy: {
        teamId: 'asc',
      },
    });

    const teamNames = teams.map(t => t.teamName);
    expect(teamNames).toContain('IT Park');
    expect(teamNames).toContain('DB Park');
    expect(teamNames).toContain('Alex');
  });
});
