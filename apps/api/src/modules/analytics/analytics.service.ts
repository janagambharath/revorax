import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@revorax/database';

@Injectable()
export class AnalyticsService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async getDashboardMetrics(orgId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const next7Days = new Date(now);
    next7Days.setDate(next7Days.getDate() + 7);
    const last30Days = new Date(now);
    last30Days.setDate(last30Days.getDate() - 30);

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
    const results = [];
    const now = new Date();

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
    const [recentMessages, recentPayments, recentMembers] = await Promise.all([
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
      this.prisma.member.findMany({
        where: { orgId, deletedAt: null },
        include: { contact: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const activities = [
      ...recentMessages.map((m) => ({ type: 'message', text: `Message sent to ${m.contact.name}`, at: m.createdAt })),
      ...recentPayments.map((p) => ({ type: 'payment', text: `Payment ₹${p.amount} from ${p.member.contact.name}`, at: p.paidAt || p.createdAt })),
      ...recentMembers.map((m) => ({ type: 'member', text: `New member: ${m.contact.name}`, at: m.createdAt })),
    ];

    return activities.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 15);
  }
}
