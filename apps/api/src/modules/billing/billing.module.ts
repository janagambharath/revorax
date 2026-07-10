import { Module } from '@nestjs/common';
import { Injectable, Inject } from '@nestjs/common';
import { Controller, Post, Get, Body, Req, Headers, RawBodyRequest, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaClient } from '@revorax/database';
import { createOrder, verifyWebhookSignature, RAZORPAY_PLANS } from '@revorax/billing';
import { AuthGuard } from '../auth/auth.guard';
import { OrgId } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Request } from 'express';

@Injectable()
class BillingService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async getSubscription(orgId: string) {
    return this.prisma.subscription.findUnique({ where: { orgId } });
  }

  async createCheckoutOrder(orgId: string, plan: 'STARTER' | 'GROWTH' | 'PRO') {
    const planConfig = RAZORPAY_PLANS[plan];
    const order = await createOrder({
      amount: planConfig.amount,
      receipt: `org_${orgId}_${Date.now()}`,
      notes: { orgId, plan },
    });
    return { orderId: order.id, amount: planConfig.amount, currency: 'INR', plan };
  }

  async handleWebhook(orgId: string | null, event: { event: string; payload: Record<string, unknown> }) {
    if (event.event === 'payment.captured' || event.event === 'subscription.charged') {
      const payment = (event.payload as any).payment?.entity;
      if (!payment?.notes?.orgId) return;

      const targetOrgId = payment.notes.orgId;
      const plan = payment.notes.plan || 'STARTER';
      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      await this.prisma.subscription.upsert({
        where: { orgId: targetOrgId },
        update: { status: 'ACTIVE', plan: plan as any, currentPeriodStart: now, currentPeriodEnd: nextMonth },
        create: { orgId: targetOrgId, status: 'ACTIVE', plan: plan as any, currentPeriodStart: now, currentPeriodEnd: nextMonth },
      });
    }
  }
}

@ApiTags('Billing')
@Controller('billing')
class BillingController {
  constructor(private billingService: BillingService) {}

  @Get('subscription')
  @UseGuards(AuthGuard)
  getSubscription(@OrgId() orgId: string) {
    return this.billingService.getSubscription(orgId);
  }

  @Post('checkout')
  @UseGuards(AuthGuard)
  createCheckout(@OrgId() orgId: string, @Body() body: { plan: 'STARTER' | 'GROWTH' | 'PRO' }) {
    return this.billingService.createCheckoutOrder(orgId, body.plan);
  }

  @Post('webhook')
  @Public()
  async handleWebhook(@Req() req: Request, @Headers('x-razorpay-signature') signature: string, @Body() body: Record<string, unknown>) {
    const rawBody = JSON.stringify(body);
    if (!verifyWebhookSignature(rawBody, signature)) {
      return { error: 'Invalid signature' };
    }
    await this.billingService.handleWebhook(null, body as any);
    return { received: true };
  }
}

@Module({
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
