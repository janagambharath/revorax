import {
  Injectable,
  Inject,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient, UserRole } from '@revorax/database';
import { getVerticalPack, slugify } from '@revorax/shared';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendEmail, emailTemplates, baseEmailTemplate } from '@revorax/email';

@Injectable()
export class AuthService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async signup(data: {
    name: string;
    email: string;
    password: string;
    orgName: string;
    businessType: string;
  }) {
    // Check if email already exists
    const existing = await this.prisma.user.findFirst({ where: { email: data.email } });
    if (existing) throw new ConflictException('An account with this email already exists');

    // Create org slug
    let slug = slugify(data.orgName);
    const slugExists = await this.prisma.organization.findUnique({ where: { slug } });
    if (slugExists) slug = `${slug}-${Date.now().toString(36)}`;

    const passwordHash = await bcrypt.hash(data.password, 12);
    const pack = getVerticalPack(data.businessType);

    // Create org + user in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: data.orgName,
          slug,
          businessType: pack.businessType as any,
          settings: {
            verticalPack: {
              label: pack.label,
              positioning: pack.positioning,
              revenueGoal: pack.revenueGoal,
              painPoint: pack.painPoint,
              modules: pack.modules,
              v1: pack.v1,
            },
          },
        },
      });

      const user = await tx.user.create({
        data: {
          orgId: org.id,
          name: data.name,
          email: data.email,
          passwordHash,
          role: UserRole.OWNER,
        },
      });

      // Create trial subscription
      await tx.subscription.create({
        data: {
          orgId: org.id,
          plan: 'STARTER',
          status: 'TRIALING',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 day trial
        },
      });

      await tx.template.createMany({
        data: pack.templates.map((template) => ({
          orgId: org.id,
          name: template.name,
          channel: template.channel as any,
          category: template.category as any,
          body: template.body,
          variables: template.variables,
          isActive: true,
        })),
      });

      await tx.workflow.createMany({
        data: pack.workflows.map((workflow) => ({
          orgId: org.id,
          name: workflow.label,
          description: workflow.leak,
          trigger: workflow.trigger as any,
          steps: workflow.steps as any,
          isActive: true,
        })),
      });

      return { org, user };
    });

    // Send welcome email (non-blocking)
    sendEmail({
      to: result.user.email,
      ...emailTemplates.welcome({
        name: result.user.name,
        orgName: result.org.name,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
      }),
    }).catch((err) => console.error('[Auth] Welcome email failed:', err));

    // Create session
    const session = await this.createSession(result.user.id);

    return {
      user: this.sanitizeUser(result.user),
      org: result.org,
      sessionToken: session.token,
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { org: true },
    });

    if (!user || !user.isActive) throw new UnauthorizedException('Invalid email or password');

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) throw new UnauthorizedException('Invalid email or password');

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session
    const session = await this.createSession(user.id);

    return {
      user: this.sanitizeUser(user),
      org: user.org,
      sessionToken: session.token,
    };
  }

  async logout(sessionToken: string) {
    await this.prisma.session.deleteMany({ where: { token: sessionToken } });
    return { success: true };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { org: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return { user: this.sanitizeUser(user), org: user.org };
  }

  async inviteUser(orgId: string, email: string, role: UserRole) {
    // Check if user already exists in org
    const existing = await this.prisma.user.findUnique({
      where: { orgId_email: { orgId, email } },
    });
    if (existing) throw new ConflictException('User already exists in this organization');

    // Create invite token
    const token = crypto.randomBytes(32).toString('hex');
    const invite = await this.prisma.inviteToken.create({
      data: {
        orgId,
        email,
        role,
        token,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
      },
      include: { org: true },
    });

    const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;

    sendEmail({
      to: email,
      ...emailTemplates.inviteUser({
        inviteeName: email,
        orgName: invite.org.name,
        inviterName: 'Team',
        role,
        acceptUrl,
      }),
    }).catch((err) => console.error('[Auth] Invite email failed:', err));

    return { success: true, invite };
  }

  async acceptInvite(token: string, name: string, password: string) {
    const invite = await this.prisma.inviteToken.findUnique({
      where: { token },
      include: { org: true },
    });

    if (!invite) throw new BadRequestException('Invalid or expired invite link');
    if (invite.usedAt) throw new BadRequestException('Invite already used');
    if (invite.expiresAt < new Date()) throw new BadRequestException('Invite expired');

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          orgId: invite.orgId,
          name,
          email: invite.email,
          passwordHash,
          role: invite.role,
        },
      });
      await tx.inviteToken.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });
      return u;
    });

    const session = await this.createSession(user.id);
    return { user: this.sanitizeUser(user), org: invite.org, sessionToken: session.token };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { org: true },
    });

    // Always return success to prevent email enumeration
    if (!user) return { success: true };

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token as an invite token with special role marker
    await this.prisma.inviteToken.create({
      data: {
        orgId: user.orgId,
        email: user.email,
        role: user.role as UserRole,
        token,
        expiresAt,
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    sendEmail({
      to: user.email,
      subject: 'Reset your Revorax password',
      html: baseEmailTemplate(
        `<h1>Password Reset</h1>
        <p>Hi ${user.name}, we received a request to reset your password for <span class="highlight">${user.org.name}</span>.</p>
        <a href="${resetUrl}" class="btn">Reset Password →</a>
        <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`,
        user.org.name,
      ),
    }).catch((err) => console.error('[Auth] Reset email failed:', err));

    return { success: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const invite = await this.prisma.inviteToken.findUnique({
      where: { token },
    });

    if (!invite) throw new BadRequestException('Invalid or expired reset link');
    if (invite.usedAt) throw new BadRequestException('Reset link already used');
    if (invite.expiresAt < new Date()) throw new BadRequestException('Reset link expired');

    const user = await this.prisma.user.findFirst({
      where: { email: invite.email, orgId: invite.orgId, deletedAt: null },
    });

    if (!user) throw new NotFoundException('Account not found');

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
      await tx.inviteToken.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });
      // Invalidate all existing sessions for security
      await tx.session.deleteMany({ where: { userId: user.id } });
    });

    return { success: true };
  }

  private async createSession(userId: string) {
    const token = crypto.randomBytes(32).toString('hex');
    return this.prisma.session.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
  }

  private sanitizeUser(user: Record<string, unknown>) {
    const { passwordHash, deletedAt, ...safe } = user;
    return safe;
  }
}
