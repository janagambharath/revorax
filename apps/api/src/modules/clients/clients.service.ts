import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@revorax/database';
import { paginate } from '@revorax/shared';

@Injectable()
export class ClientsService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async findAll(
    orgId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
    },
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {
      orgId,
      deletedAt: null,
      ...(query.status && { status: query.status }),
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

    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        include: { contact: true },
        orderBy: { lastVisitDate: 'desc' },
      }),
      this.prisma.client.count({ where }),
    ]);

    return paginate(clients, total, page, limit);
  }

  async findOne(orgId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, orgId, deletedAt: null },
      include: {
        contact: {
          include: {
            messages: { orderBy: { createdAt: 'desc' }, take: 20 },
            notesList: { orderBy: { createdAt: 'desc' }, take: 10, include: { createdBy: true } },
          },
        },
      },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async create(orgId: string, data: {
    contactId: string;
    status?: string;
    lastVisitDate: string;
    nextBookingDate?: string;
    averageSpend: number;
    visitCount?: number;
  }) {
    return this.prisma.client.create({
      data: {
        orgId,
        contactId: data.contactId,
        status: data.status || 'ACTIVE',
        lastVisitDate: new Date(data.lastVisitDate),
        nextBookingDate: data.nextBookingDate ? new Date(data.nextBookingDate) : null,
        averageSpend: data.averageSpend,
        visitCount: data.visitCount || 1,
      },
      include: { contact: true },
    });
  }

  async importCsv(orgId: string, clientsData: any[]) {
    let imported = 0;

    for (const row of clientsData) {
      if (!row.name || !row.phone) continue;

      try {
        await this.prisma.$transaction(async (tx) => {
          let contact = await tx.contact.findFirst({
            where: { orgId, phone: row.phone, deletedAt: null },
          });

          if (!contact) {
            contact = await tx.contact.create({
              data: {
                orgId,
                name: row.name,
                phone: row.phone,
                email: row.email || null,
                source: 'OTHER',
              },
            });
          }

          const existingClient = await tx.client.findFirst({
            where: { orgId, contactId: contact.id, deletedAt: null },
          });

          if (!existingClient) {
            const lastVisit = row.lastVisitDate ? new Date(row.lastVisitDate) : new Date();
            const daysSinceLastVisit = (new Date().getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24);
            const status = daysSinceLastVisit > 60 ? 'LAPSED' : 'ACTIVE';

            await tx.client.create({
              data: {
                orgId,
                contactId: contact.id,
                status,
                lastVisitDate: lastVisit,
                nextBookingDate: row.nextBookingDate ? new Date(row.nextBookingDate) : null,
                averageSpend: row.averageSpend ? parseFloat(row.averageSpend) : 0,
                visitCount: row.visitCount ? parseInt(row.visitCount) : 1,
              },
            });
            imported++;
          }
        });
      } catch (err) {
        console.error(`Failed to import client row for ${row.name}:`, err);
      }
    }

    return { success: true, count: imported };
  }

  async update(orgId: string, id: string, data: Record<string, any>) {
    await this.findOne(orgId, id);
    const updateData: Record<string, any> = { ...data };
    if (typeof data.lastVisitDate === 'string') {
      updateData.lastVisitDate = new Date(data.lastVisitDate);
    }
    if (typeof data.nextBookingDate === 'string') {
      updateData.nextBookingDate = new Date(data.nextBookingDate);
    }

    return this.prisma.client.update({
      where: { id },
      data: updateData,
      include: { contact: true },
    });
  }

  async delete(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getLapsedList(orgId: string) {
    return this.prisma.client.findMany({
      where: {
        orgId,
        deletedAt: null,
        status: 'LAPSED',
      },
      include: { contact: true },
      orderBy: { lastVisitDate: 'asc' },
    });
  }

  async getScheduledBookings(orgId: string, days = 7) {
    const now = new Date();
    const future = new Date(now);
    future.setDate(future.getDate() + days);

    return this.prisma.client.findMany({
      where: {
        orgId,
        deletedAt: null,
        status: 'ACTIVE',
        nextBookingDate: { gte: now, lte: future },
      },
      include: { contact: true },
      orderBy: { nextBookingDate: 'asc' },
    });
  }
}
