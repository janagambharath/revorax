import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@revorax/database';
import { paginate } from '@revorax/shared';

@Injectable()
export class ContactsService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async findAll(
    orgId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      tags?: string;
    },
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {
      orgId,
      deletedAt: null,
      ...(query.tags && { tags: { has: query.tags } }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { phone: { contains: query.search } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [contacts, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        skip,
        take: limit,
        include: {
          member: true,
          patient: true,
          client: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contact.count({ where }),
    ]);

    return paginate(contacts, total, page, limit);
  }

  async findOne(orgId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, orgId, deletedAt: null },
      include: {
        member: true,
        patient: true,
        client: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 10 },
        notesList: { orderBy: { createdAt: 'desc' }, take: 10, include: { createdBy: true } },
      },
    });
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  async create(orgId: string, data: Record<string, any>) {
    return this.prisma.contact.create({
      data: {
        orgId,
        name: data.name as string,
        phone: data.phone as string || null,
        email: data.email as string || null,
        tags: (data.tags as string[]) || [],
        source: (data.source as any) || 'OTHER',
        city: data.city as string || null,
        notes: data.notes as string || null,
        customFields: (data.customFields as any) || {},
        isActive: data.isActive !== false,
        whatsappOptIn: data.whatsappOptIn !== false,
      },
    });
  }

  async update(orgId: string, id: string, data: Record<string, any>) {
    await this.findOne(orgId, id);
    return this.prisma.contact.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        tags: data.tags,
        source: data.source,
        city: data.city,
        notes: data.notes,
        customFields: data.customFields,
        isActive: data.isActive,
        whatsappOptIn: data.whatsappOptIn,
      },
    });
  }

  async delete(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.contact.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
