import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@revorax/database';
import { paginate } from '@revorax/shared';

@Injectable()
export class ContactsService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async findAll(orgId: string, query: { page?: number; limit?: number; search?: string; tags?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const tags = query.tags ? query.tags.split(',') : undefined;

    const where: Record<string, unknown> = {
      orgId,
      deletedAt: null,
      ...(tags && { tags: { hasSome: tags } }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { phone: { contains: query.search } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [contacts, total] = await Promise.all([
      this.prisma.contact.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { member: true, _count: { select: { messages: true, leads: true } } } }),
      this.prisma.contact.count({ where }),
    ]);

    return paginate(contacts, total, page, limit);
  }

  async findOne(orgId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, orgId, deletedAt: null },
      include: {
        member: true,
        leads: { orderBy: { createdAt: 'desc' }, take: 5 },
        tasks: { where: { deletedAt: null }, orderBy: { dueAt: 'asc' } },
        notesList: { orderBy: { createdAt: 'desc' }, take: 20, include: { createdBy: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 30 },
        appointments: { orderBy: { scheduledAt: 'desc' }, take: 5 },
      },
    });
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  async create(orgId: string, data: Record<string, unknown>) {
    return this.prisma.contact.create({ data: { orgId, ...data } as any, include: { member: true } });
  }

  async update(orgId: string, id: string, data: Record<string, unknown>) {
    await this.findOne(orgId, id);
    return this.prisma.contact.update({ where: { id }, data: data as any, include: { member: true } });
  }

  async delete(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.contact.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

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
      ...(query.assignedToId && { assignedToId: query.assignedToId }),
    };

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({ where, skip, take: limit, include: { contact: true, assignedTo: true, createdBy: true }, orderBy: { dueAt: 'asc' } }),
      this.prisma.task.count({ where }),
    ]);

    return paginate(tasks, total, page, limit);
  }

  async create(orgId: string, userId: string, data: Record<string, unknown>) {
    return this.prisma.task.create({ data: { orgId, createdById: userId, ...data } as any, include: { contact: true, assignedTo: true } });
  }

  async update(orgId: string, id: string, data: Record<string, unknown>) {
    const updateData = { ...data } as Record<string, unknown>;
    if (data.status === 'COMPLETED') updateData.completedAt = new Date();
    return this.prisma.task.update({ where: { id }, data: updateData as any, include: { contact: true } });
  }

  async delete(orgId: string, id: string) {
    return this.prisma.task.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

@Injectable()
export class NotesService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async create(orgId: string, userId: string, data: { contactId: string; body: string; isPinned?: boolean }) {
    return this.prisma.note.create({ data: { orgId, createdById: userId, ...data }, include: { createdBy: true } });
  }

  async findByContact(orgId: string, contactId: string) {
    return this.prisma.note.findMany({
      where: { orgId, contactId, deletedAt: null },
      include: { createdBy: true },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async delete(orgId: string, id: string) {
    return this.prisma.note.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

@Injectable()
export class OrganizationsService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async findOne(orgId: string) {
    return this.prisma.organization.findUnique({ where: { id: orgId } });
  }

  async update(orgId: string, data: Record<string, unknown>) {
    return this.prisma.organization.update({ where: { id: orgId }, data: data as any });
  }

  async getMembers(orgId: string) {
    return this.prisma.user.findMany({ where: { orgId, deletedAt: null, isActive: true }, select: { id: true, name: true, email: true, role: true, avatarUrl: true, lastLoginAt: true, createdAt: true } });
  }

  async updateMemberRole(orgId: string, userId: string, role: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { role: role as any } });
  }

  async deactivateMember(orgId: string, userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { isActive: false } });
  }
}
