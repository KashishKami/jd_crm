import { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      nickname?: string | null;
      userPermissions?: string | null;
      teamId?: number | null;
      roleId?: number | null;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    nickname?: string | null;
    userPermissions?: string | null;
    teamId?: number | null;
    roleId?: number | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid: string;
    nickname?: string | null;
    userPermissions?: string | null;
    teamId?: number | null;
    roleId?: number | null;
  }
}
