import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@revorax/database';
import { paginate } from '@revorax/shared';

@Injectable()
export class MembersService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async findAll(
    orgId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      membershipType?: string;
    },
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      orgId,
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.membershipType && { membershipType: query.membershipType }),
      ...(query.search && {
        contact: {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { phone: { contains: query.search } },
            { email: { contains: query.search, mode: 'insensitive' } },
          ],
        },
      }),
    };

    const [members, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        skip,
        take: limit,
        include: { contact: true },
        orderBy: { renewalDate: 'asc' },
      }),
      this.prisma.member.count({ where }),
    ]);

    return paginate(members, total, page, limit);
  }

  async findOne(orgId: string, id: string) {
    const member = await this.prisma.member.findFirst({
      where: { id, orgId, deletedAt: null },
      include: {
        contact: {
          include: {
            messages: { orderBy: { createdAt: 'desc' }, take: 20 },
            notesList: { orderBy: { createdAt: 'desc' }, take: 10, include: { createdBy: true } },
            tasks: { where: { deletedAt: null }, orderBy: { dueAt: 'asc' }, take: 10 },
          },
        },
        payments: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!member) throw new NotFoundException('Member not found');
    return member;
  }

  async create(orgId: string, data: {
    contactId: string;
    membershipType: string;
    status?: string;
    startDate: string;
    renewalDate: string;
    amount: number;
    notes?: string;
    goals?: string;
  }) {
    return this.prisma.member.create({
      data: {
        orgId,
        contactId: data.contactId,
        membershipType: data.membershipType as any,
        status: (data.status as any) || 'TRIAL',
        startDate: new Date(data.startDate),
        renewalDate: new Date(data.renewalDate),
        amount: data.amount,
        notes: data.notes,
        goals: data.goals,
      },
      include: { contact: true },
    });
  }

  async update(orgId: string, id: string, data: Record<string, unknown>) {
    await this.findOne(orgId, id);
    const updateData: Record<string, unknown> = { ...data };
    if (typeof data.renewalDate === 'string') {
      updateData.renewalDate = new Date(data.renewalDate);
    }
    if (typeof data.startDate === 'string') {
      updateData.startDate = new Date(data.startDate);
    }

    return this.prisma.member.update({
      where: { id },
      data: updateData as any,
      include: { contact: true },
    });
  }

  async delete(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.member.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async recordPayment(orgId: string, data: {
    memberId: string;
    amount: number;
    method: string;
    paidAt?: string;
    notes?: string;
  }) {
    await this.findOne(orgId, data.memberId);

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          orgId,
          memberId: data.memberId,
          amount: data.amount,
          status: 'PAID',
          method: data.method as any,
          paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
          notes: data.notes,
        },
      });

      // Update member paid amount and status
      await tx.member.update({
        where: { id: data.memberId },
        data: {
          paidAmount: { increment: data.amount },
          status: 'ACTIVE',
          followUpStatus: 'DONE',
          lastContactedAt: new Date(),
        },
      });

      return payment;
    });
  }

  async markFollowUp(orgId: string, id: string, status = 'DONE') {
    await this.findOne(orgId, id);

    return this.prisma.member.update({
      where: { id },
      data: {
        followUpStatus: status,
        lastContactedAt: new Date(),
      },
      include: { contact: true },
    });
  }

  async getExpiringSoon(orgId: string, days = 7) {
    const now = new Date();
    const future = new Date(now);
    future.setDate(future.getDate() + days);

    return this.prisma.member.findMany({
      where: {
        orgId,
        deletedAt: null,
        status: { in: ['ACTIVE', 'TRIAL'] },
        renewalDate: { gte: now, lte: future },
      },
      include: { contact: true },
      orderBy: { renewalDate: 'asc' },
    });
  }

  async getOverdue(orgId: string) {
    return this.prisma.member.findMany({
      where: {
        orgId,
        deletedAt: null,
        status: { in: ['EXPIRED', 'ACTIVE'] },
        renewalDate: { lt: new Date() },
      },
      include: { contact: true },
      orderBy: { renewalDate: 'desc' },
    });
  }

  async getReactivationList(orgId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.prisma.member.findMany({
      where: {
        orgId,
        deletedAt: null,
        status: 'EXPIRED',
        renewalDate: { gte: thirtyDaysAgo },
      },
      include: { contact: true },
      orderBy: { renewalDate: 'desc' },
    });
  }
}
