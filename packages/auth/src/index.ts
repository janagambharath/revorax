import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@revorax/database';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,      // refresh if older than 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 min cache
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
    requireEmailVerification: false, // set true in production
    sendResetPassword: async ({ user, url }) => {
      // Will be connected to Resend in the email package
      console.log(`Reset password URL for ${user.email}: ${url}`);
    },
  },
  trustedOrigins: [
    process.env.CORS_ORIGIN || 'http://localhost:3000',
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ],
  advanced: {
    cookiePrefix: 'revorax',
    generateId: () => {
      // Use cuid-compatible ID generation
      return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
    },
  },
  user: {
    additionalFields: {
      orgId: {
        type: 'string',
        required: false,
        input: false,
      },
      role: {
        type: 'string',
        required: false,
        defaultValue: 'STAFF',
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
