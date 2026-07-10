import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@revorax/database';

@Injectable()
export class NotesService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async create(orgId: string, userId: string, data: { contactId: string; body: string; isPinned?: boolean }) {
    return this.prisma.note.create({
      data: {
        orgId,
        contactId: data.contactId,
        createdById: userId,
        body: data.body,
        isPinned: data.isPinned || false,
      },
      include: { createdBy: true },
    });
  }

  async findByContact(orgId: string, contactId: string) {
    return this.prisma.note.findMany({
      where: { orgId, contactId, deletedAt: null },
      include: { createdBy: true },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async delete(orgId: string, id: string) {
    return this.prisma.note.update({
      where: { id, orgId },
      data: { deletedAt: new Date() },
    });
  }
}
