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

    expect(teams.length).toBe(3);
    expect(teams[0].teamName).toBe('IT Park');
    expect(teams[1].teamName).toBe('DB Park');
    expect(teams[2].teamName).toBe('Alex');
  });
});
