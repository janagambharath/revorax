import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@revorax/database';

@Injectable()
export class OrganizationsService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async getOrgProfile(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        businessType: true,
        plan: true,
        whatsappPhoneNumberId: true,
        whatsappAccessToken: true,
        whatsappBusinessId: true,
        whatsappVerified: true,
      },
    });

    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async getOrgWithFeatures(orgId: string) {
    return this.prisma.organization.findUnique({
      where: { id: orgId },
    });
  }

  async updateOrgProfile(orgId: string, data: any) {
    return this.prisma.organization.update({
      where: { id: orgId },
      data,
    });
  }

  async findOne(orgId: string) {
    return this.prisma.organization.findUnique({ where: { id: orgId } });
  }

  async update(orgId: string, data: Record<string, unknown>) {
    return this.prisma.organization.update({ where: { id: orgId }, data: data as any });
  }

  async getMembers(orgId: string) {
    return this.prisma.user.findMany({
      where: { orgId, deletedAt: null, isActive: true },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, lastLoginAt: true, createdAt: true },
    });
  }

  async updateMemberRole(orgId: string, userId: string, role: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { role: role as any } });
  }

  async deactivateMember(orgId: string, userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { isActive: false } });
  }
}
