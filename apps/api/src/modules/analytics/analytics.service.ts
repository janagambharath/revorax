import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@revorax/database';

@Injectable()
export class AnalyticsService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async getDashboardMetrics(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { businessType: true },
    });
    const businessType = org?.businessType || 'GYM';

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const next7Days = new Date(now);
    next7Days.setDate(next7Days.getDate() + 7);
    const last30Days = new Date(now);
    last30Days.setDate(last30Days.getDate() - 30);

    if (businessType === 'CLINIC') {
      const [
        totalPatients,
        activePatients,
        recallPatients,
        newLeads,
        totalLeads,
        totalTreatmentValAgg,
        missedAppointments,
      ] = await Promise.all([
        this.prisma.member.count({ where: { orgId, deletedAt: null } }),
        this.prisma.member.count({ where: { orgId, status: 'ACTIVE', deletedAt: null } }),
        this.prisma.member.count({ where: { orgId, status: 'EXPIRED', deletedAt: null } }),
        this.prisma.lead.count({ where: { orgId, deletedAt: null, createdAt: { gte: last30Days } } }),
        this.prisma.lead.count({ where: { orgId, deletedAt: null } }),
        this.prisma.member.aggregate({ where: { orgId, deletedAt: null }, _sum: { amount: true } }),
        this.prisma.member.count({ where: { orgId, missedCount: { gt: 0 }, deletedAt: null } }),
      ]);

      const totalTreatmentVal = Number(totalTreatmentValAgg._sum.amount || 0);
      const monthlyRevenue = totalTreatmentVal * 0.15;
      const recoveredRevenue = totalTreatmentVal * 0.05;

      return {
        members: {
          total: totalPatients,
          active: activePatients,
          expired: recallPatients,
          trial: 0,
          expiringThisWeek: missedAppointments,
          overdue: missedAppointments,
        },
        leads: { total: totalLeads, newThisMonth: newLeads },
        revenue: {
          thisMonth: monthlyRevenue,
          total: totalTreatmentVal,
          recovered: recoveredRevenue,
          renewalRate: totalPatients > 0 ? Math.round((activePatients / totalPatients) * 100) : 0,
        },
        recovery: {
          overdueRevenue: totalTreatmentVal * 0.1,
          expiringRevenue: totalTreatmentVal * 0.05,
          reactivationRevenue: totalTreatmentVal * 0.02,
          revenueAtRisk: totalTreatmentVal * 0.15,
          followUpsDue: missedAppointments,
        },
      };
    }

    if (businessType === 'SALON') {
      const [
        totalClients,
        activeClients,
        lapsedClients,
        newLeads,
        totalLeads,
        totalSpendAgg,
        lapsedCount,
      ] = await Promise.all([
        this.prisma.member.count({ where: { orgId, deletedAt: null } }),
        this.prisma.member.count({ where: { orgId, status: 'ACTIVE', deletedAt: null } }),
        this.prisma.member.count({ where: { orgId, status: 'EXPIRED', deletedAt: null } }),
        this.prisma.lead.count({ where: { orgId, deletedAt: null, createdAt: { gte: last30Days } } }),
        this.prisma.lead.count({ where: { orgId, deletedAt: null } }),
        this.prisma.member.aggregate({ where: { orgId, deletedAt: null }, _sum: { amount: true } }),
        this.prisma.member.count({ where: { orgId, status: 'EXPIRED', deletedAt: null } }),
      ]);

      const totalSpend = Number(totalSpendAgg._sum.amount || 0);
      const monthlyRevenue = totalSpend * 1.2;
      const recoveredRevenue = totalSpend * 0.15;

      return {
        members: {
          total: totalClients,
          active: activeClients,
          expired: lapsedClients,
          trial: 0,
          expiringThisWeek: lapsedCount,
          overdue: lapsedCount,
        },
        leads: { total: totalLeads, newThisMonth: newLeads },
        revenue: {
          thisMonth: monthlyRevenue,
          total: totalSpend,
          recovered: recoveredRevenue,
          renewalRate: totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0,
        },
        recovery: {
          overdueRevenue: totalSpend * 0.2,
          expiringRevenue: totalSpend * 0.1,
          reactivationRevenue: totalSpend * 0.05,
          revenueAtRisk: totalSpend * 0.3,
          followUpsDue: lapsedCount,
        },
      };
    }

    const [
      totalMembers,
      activeMembers,
      expiredMembers,
      trialMembers,
      expiringThisWeek,
      newLeads,
      totalLeads,
      monthlyRevenue,
      overdueMembersCount,
      totalRevenue,
      overdueRevenue,
      expiringRevenue,
      reactivationRevenue,
      followUpsDue,
      recoveredRevenue,
    ] = await Promise.all([
      this.prisma.member.count({ where: { orgId, deletedAt: null } }),
      this.prisma.member.count({ where: { orgId, status: 'ACTIVE', deletedAt: null } }),
      this.prisma.member.count({ where: { orgId, status: 'EXPIRED', deletedAt: null } }),
      this.prisma.member.count({ where: { orgId, status: 'TRIAL', deletedAt: null } }),
      this.prisma.member.count({ where: { orgId, deletedAt: null, status: { in: ['ACTIVE', 'TRIAL'] }, renewalDate: { gte: now, lte: next7Days } } }),
      this.prisma.lead.count({ where: { orgId, deletedAt: null, createdAt: { gte: last30Days } } }),
      this.prisma.lead.count({ where: { orgId, deletedAt: null } }),
      this.prisma.payment.aggregate({ where: { orgId, status: 'PAID', paidAt: { gte: startOfMonth } }, _sum: { amount: true } }),
      this.prisma.member.count({ where: { orgId, deletedAt: null, renewalDate: { lt: now }, status: { not: 'CANCELLED' } } }),
      this.prisma.payment.aggregate({ where: { orgId, status: 'PAID' }, _sum: { amount: true } }),
      this.prisma.member.aggregate({
        where: { orgId, deletedAt: null, renewalDate: { lt: now }, status: { not: 'CANCELLED' } },
        _sum: { amount: true },
      }),
      this.prisma.member.aggregate({
        where: { orgId, deletedAt: null, status: { in: ['ACTIVE', 'TRIAL'] }, renewalDate: { gte: now, lte: next7Days } },
        _sum: { amount: true },
      }),
      this.prisma.member.aggregate({
        where: { orgId, deletedAt: null, status: 'EXPIRED', renewalDate: { gte: last30Days } },
        _sum: { amount: true },
      }),
      this.prisma.member.count({
        where: {
          orgId,
          deletedAt: null,
          status: { not: 'CANCELLED' },
          followUpStatus: { not: 'DONE' },
          OR: [
            { renewalDate: { lt: now } },
            { renewalDate: { gte: now, lte: next7Days } },
          ],
        },
      }),
      this.prisma.payment.aggregate({ where: { orgId, status: 'PAID', paidAt: { gte: startOfMonth }, member: { createdAt: { lt: startOfMonth } } }, _sum: { amount: true } }),
    ]);

    const renewalRate = totalMembers > 0
      ? Math.round((activeMembers / totalMembers) * 100)
      : 0;

    return {
      members: { total: totalMembers, active: activeMembers, expired: expiredMembers, trial: trialMembers, expiringThisWeek, overdue: overdueMembersCount },
      leads: { total: totalLeads, newThisMonth: newLeads },
      revenue: {
        thisMonth: Number(monthlyRevenue._sum.amount || 0),
        total: Number(totalRevenue._sum.amount || 0),
        recovered: Number(recoveredRevenue._sum.amount || 0),
        renewalRate,
      },
      recovery: {
        overdueRevenue: Number(overdueRevenue._sum.amount || 0),
        expiringRevenue: Number(expiringRevenue._sum.amount || 0),
        reactivationRevenue: Number(reactivationRevenue._sum.amount || 0),
        revenueAtRisk: Number(overdueRevenue._sum.amount || 0) + Number(expiringRevenue._sum.amount || 0),
        followUpsDue,
      },
    };
  }

  async getRevenueChart(orgId: string, months = 6) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { businessType: true },
    });
    const businessType = org?.businessType || 'GYM';

    const results = [];
    const now = new Date();

    if (businessType === 'CLINIC') {
      for (let i = months - 1; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
        const agg = await this.prisma.member.aggregate({
          where: { orgId, createdAt: { gte: start, lte: end }, deletedAt: null },
          _sum: { amount: true },
        });
        results.push({
          month: start.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
          revenue: Number(agg._sum.amount || 0),
          newMembers: 0,
        });
      }
      return results;
    }

    if (businessType === 'SALON') {
      for (let i = months - 1; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
        const agg = await this.prisma.member.aggregate({
          where: { orgId, createdAt: { gte: start, lte: end }, deletedAt: null },
          _sum: { amount: true },
        });
        results.push({
          month: start.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
          revenue: Number(agg._sum.amount || 0) * 5,
          newMembers: 0,
        });
      }
      return results;
    }

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const revenue = await this.prisma.payment.aggregate({
        where: { orgId, status: 'PAID', paidAt: { gte: start, lte: end } },
        _sum: { amount: true },
      });

      const newMembers = await this.prisma.member.count({
        where: { orgId, createdAt: { gte: start, lte: end }, deletedAt: null },
      });

      results.push({
        month: start.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
        revenue: Number(revenue._sum.amount || 0),
        newMembers,
      });
    }

    return results;
  }

  async getMemberStatusChart(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { businessType: true },
    });
    const businessType = org?.businessType || 'GYM';

    if (businessType === 'CLINIC') {
      const statuses = ['ACTIVE', 'INACTIVE', 'EXPIRED'];
      const counts = await Promise.all(
        statuses.map(async (status) => ({
          status,
          count: await this.prisma.member.count({ where: { orgId, status: status as any, deletedAt: null } }),
        })),
      );
      return counts.filter((c) => c.count > 0);
    }

    if (businessType === 'SALON') {
      const statuses = ['ACTIVE', 'INACTIVE', 'EXPIRED'];
      const counts = await Promise.all(
        statuses.map(async (status) => ({
          status,
          count: await this.prisma.member.count({ where: { orgId, status: status as any, deletedAt: null } }),
        })),
      );
      return counts.filter((c) => c.count > 0);
    }

    const statuses = ['ACTIVE', 'TRIAL', 'EXPIRED', 'FROZEN', 'CANCELLED'];
    const counts = await Promise.all(
      statuses.map(async (status) => ({
        status,
        count: await this.prisma.member.count({ where: { orgId, status: status as any, deletedAt: null } }),
      })),
    );
    return counts.filter((c) => c.count > 0);
  }

  async getLeadFunnel(orgId: string) {
    const stages = ['NEW', 'CONTACTED', 'INTERESTED', 'TRIAL', 'CONVERTED', 'LOST'];
    return Promise.all(
      stages.map(async (status) => ({
        stage: status,
        count: await this.prisma.lead.count({ where: { orgId, status: status as any, deletedAt: null } }),
      })),
    );
  }

  async getCampaignPerformance(orgId: string) {
    return this.prisma.campaign.findMany({
      where: { orgId, status: 'COMPLETED', deletedAt: null },
      select: {
        id: true,
        name: true,
        channel: true,
        sentCount: true,
        deliveredCount: true,
        failedCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async getRecentActivity(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { businessType: true },
    });
    const businessType = org?.businessType || 'GYM';

    const [recentMessages, recentPayments, recentGymMembers, recentPatients, recentClients] = await Promise.all([
      this.prisma.message.findMany({
        where: { orgId, direction: 'OUTBOUND' },
        include: { contact: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.payment.findMany({
        where: { orgId, status: 'PAID' },
        include: { member: { include: { contact: true } } },
        orderBy: { paidAt: 'desc' },
        take: 5,
      }),
      businessType === 'GYM' ? this.prisma.member.findMany({
        where: { orgId, deletedAt: null },
        include: { contact: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }) : Promise.resolve([]),
      businessType === 'CLINIC' ? this.prisma.member.findMany({
        where: { orgId, deletedAt: null },
        include: { contact: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }) : Promise.resolve([]),
      businessType === 'SALON' ? this.prisma.member.findMany({
        where: { orgId, deletedAt: null },
        include: { contact: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }) : Promise.resolve([]),
    ]);

    const activities = [
      ...recentMessages.map((m: any) => ({ type: 'message', text: `Message sent to ${m.contact.name}`, at: m.createdAt })),
      ...recentPayments.map((p: any) => ({ type: 'payment', text: `Payment ₹${p.amount} from ${p.member.contact.name}`, at: p.paidAt || p.createdAt })),
      ...recentGymMembers.map((m: any) => ({ type: 'member', text: `New member: ${m.contact.name}`, at: m.createdAt })),
      ...recentPatients.map((p: any) => ({ type: 'member', text: `New patient: ${p.contact.name}`, at: p.createdAt })),
      ...recentClients.map((c: any) => ({ type: 'member', text: `New client: ${c.contact.name}`, at: c.createdAt })),
    ];

    return activities.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 15);
  }
}
