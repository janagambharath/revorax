import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@revorax/database';
import { paginate } from '@revorax/shared';

@Injectable()
export class PatientsService {
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

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip,
        take: limit,
        include: { contact: true },
        orderBy: { lastAppointmentDate: 'desc' },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return paginate(patients, total, page, limit);
  }

  async findOne(orgId: string, id: string) {
    const patient = await this.prisma.patient.findFirst({
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
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async create(orgId: string, data: {
    contactId: string;
    patientCode?: string;
    status?: string;
    lastAppointmentDate: string;
    nextAppointmentDate?: string;
    missedAppointmentCount?: number;
    treatmentValue: number;
  }) {
    return this.prisma.patient.create({
      data: {
        orgId,
        contactId: data.contactId,
        patientCode: data.patientCode,
        status: data.status || 'ACTIVE',
        lastAppointmentDate: new Date(data.lastAppointmentDate),
        nextAppointmentDate: data.nextAppointmentDate ? new Date(data.nextAppointmentDate) : null,
        missedAppointmentCount: data.missedAppointmentCount || 0,
        treatmentValue: data.treatmentValue,
      },
      include: { contact: true },
    });
  }

  async importCsv(orgId: string, patientsData: any[]) {
    let imported = 0;

    for (const row of patientsData) {
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

          const existingPatient = await tx.patient.findFirst({
            where: { orgId, contactId: contact.id, deletedAt: null },
          });

          if (!existingPatient) {
            const lastAppt = row.lastAppointmentDate ? new Date(row.lastAppointmentDate) : new Date();
            const missedCount = row.missedAppointmentCount ? parseInt(row.missedAppointmentCount) : 0;
            const status = missedCount > 0 ? 'RECALL' : 'ACTIVE';

            await tx.patient.create({
              data: {
                orgId,
                contactId: contact.id,
                patientCode: row.patientCode || null,
                status,
                lastAppointmentDate: lastAppt,
                nextAppointmentDate: row.nextAppointmentDate ? new Date(row.nextAppointmentDate) : null,
                missedAppointmentCount: missedCount,
                treatmentValue: row.treatmentValue ? parseFloat(row.treatmentValue) : 0,
              },
            });
            imported++;
          }
        });
      } catch (err) {
        console.error(`Failed to import patient row for ${row.name}:`, err);
      }
    }

    return { success: true, count: imported };
  }

  async update(orgId: string, id: string, data: Record<string, any>) {
    await this.findOne(orgId, id);
    const updateData: Record<string, any> = { ...data };
    if (typeof data.lastAppointmentDate === 'string') {
      updateData.lastAppointmentDate = new Date(data.lastAppointmentDate);
    }
    if (typeof data.nextAppointmentDate === 'string') {
      updateData.nextAppointmentDate = new Date(data.nextAppointmentDate);
    }
    if (typeof data.lastRecallDate === 'string') {
      updateData.lastRecallDate = new Date(data.lastRecallDate);
    }

    return this.prisma.patient.update({
      where: { id },
      data: updateData,
      include: { contact: true },
    });
  }

  async delete(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.patient.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getRecallList(orgId: string) {
    return this.prisma.patient.findMany({
      where: {
        orgId,
        deletedAt: null,
        status: 'RECALL',
      },
      include: { contact: true },
      orderBy: { lastAppointmentDate: 'asc' },
    });
  }

  async getScheduledRecalls(orgId: string, days = 7) {
    const now = new Date();
    const future = new Date(now);
    future.setDate(future.getDate() + days);

    return this.prisma.patient.findMany({
      where: {
        orgId,
        deletedAt: null,
        status: 'ACTIVE',
        nextAppointmentDate: { gte: now, lte: future },
      },
      include: { contact: true },
      orderBy: { nextAppointmentDate: 'asc' },
    });
  }
}
