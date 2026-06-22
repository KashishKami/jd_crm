import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { findByCredential } from '@/repository/user.repository';
import { verifyAndMigratePassword } from '@/service/auth.service';

const handler = NextAuth({
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

        return {
          id: String(user.uid),
          name: user.name,
          email: user.email,
          nickname: user.nickname,
          userPermissions: user.userPermissions,
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
});

export { handler as GET, handler as POST };
