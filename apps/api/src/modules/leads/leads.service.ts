import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@revorax/database';
import { paginate } from '@revorax/shared';

@Injectable()
export class LeadsService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async findAll(orgId: string, query: { page?: number; limit?: number; status?: string; assignedToId?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      orgId,
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.assignedToId && { assignedToId: query.assignedToId }),
    };

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({ where, skip, take: limit, include: { contact: true, assignedTo: true }, orderBy: { updatedAt: 'desc' } }),
      this.prisma.lead.count({ where }),
    ]);

    return paginate(leads, total, page, limit);
  }

  async create(orgId: string, data: Record<string, unknown>) {
    return this.prisma.lead.create({ data: { orgId, ...data } as any, include: { contact: true, assignedTo: true } });
  }

  async update(orgId: string, id: string, data: Record<string, unknown>) {
    return this.prisma.lead.update({ where: { id }, data: data as any, include: { contact: true } });
  }

  async delete(orgId: string, id: string) {
    return this.prisma.lead.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
