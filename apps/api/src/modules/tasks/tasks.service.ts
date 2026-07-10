import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@revorax/database';
import { paginate } from '@revorax/shared';

@Injectable()
export class TasksService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async findAll(orgId: string, query: { status?: string; assignedToId?: string; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      orgId,
      deletedAt: null,
      ...(query.status && { status: query.status }),
    };

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        include: { contact: true, createdBy: true },
        orderBy: { dueAt: 'asc' },
      }),
      this.prisma.task.count({ where }),
    ]);

    return paginate(tasks, total, page, limit);
  }

  async create(orgId: string, userId: string, data: Record<string, unknown>) {
    return this.prisma.task.create({
      data: {
        orgId,
        createdById: userId,
        contactId: (data.contactId as string) || null,
        title: (data.title as string) || 'No Title',
        description: (data.description as string) || null,
        dueAt: data.dueAt ? new Date(data.dueAt as string) : null,
        status: (data.status as string) || 'PENDING',
      },
      include: { contact: true },
    });
  }

  async update(orgId: string, id: string, data: Record<string, unknown>) {
    const updateData = { ...data } as Record<string, unknown>;
    if (data.status === 'COMPLETED') updateData.completedAt = new Date();
    if (typeof data.dueAt === 'string') updateData.dueAt = new Date(data.dueAt);
    return this.prisma.task.update({
      where: { id },
      data: updateData as any,
      include: { contact: true },
    });
  }

  async delete(orgId: string, id: string) {
    return this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
