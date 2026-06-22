import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { findByCredential } from '../../../../repository/user.repository';
import { verifyAndMigratePassword } from '../../../../service/auth.service';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username or Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await findByCredential(credentials.username);
        if (!user || !user.password) {
          return null;
        }

        const isValid = await verifyAndMigratePassword(
          credentials.password,
          user.password,
          user.uid
        );

        if (!isValid) {
          return null;
        }

        const permissionNames = (user as { role?: { permissions?: { permission?: { permissionName?: string } }[] } }).role?.permissions
          ?.map((rp: { permission?: { permissionName?: string } }) => rp.permission?.permissionName)
          .filter(Boolean)
          .join(',') || '';

        return {
          id: String(user.uid),
          name: user.name,
          email: user.email,
          nickname: user.nickname,
          userPermissions: permissionNames,
          teamId: user.teamId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.nickname = user.nickname;
        token.userPermissions = user.userPermissions;
        token.teamId = user.teamId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid;
        session.user.nickname = token.nickname;
        session.user.userPermissions = token.userPermissions;
        session.user.teamId = token.teamId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
