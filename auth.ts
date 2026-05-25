import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        action: { label: "Action", type: "hidden" },
        name: { label: "Name", type: "hidden" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        const action = (credentials?.action as string) || "signin";
        const name = credentials?.name as string | undefined;

        if (!email || !password) return null;

        const existing = await prisma.user.findUnique({ where: { email } });

        if (action === "signup") {
          if (existing) throw new Error("El correo ya está registrado");
          if (!name) throw new Error("El nombre es obligatorio");
          const passwordHash = await bcrypt.hash(password, 12);
          return prisma.user.create({
            data: { email, name, passwordHash, provider: "credentials" },
          });
        }

        if (!existing || !existing.passwordHash) return null;
        const valid = await bcrypt.compare(password, existing.passwordHash);
        if (!valid) return null;
        return existing;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { image: true, name: true },
        });
        if (dbUser?.image) session.user.image = dbUser.image;
        if (dbUser?.name) session.user.name = dbUser.name;
      }
      return session;
    },
  },
});
