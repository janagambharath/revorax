import Razorpay from 'razorpay';
import crypto from 'crypto';

// ─── Plans Config ─────────────────────────────────────────────────────────────

export const RAZORPAY_PLANS = {
  STARTER: {
    id: process.env.RAZORPAY_PLAN_STARTER_ID || '',
    amount: 299900, // ₹2,999 in paise
    interval: 1,
    period: 'monthly' as const,
  },
  GROWTH: {
    id: process.env.RAZORPAY_PLAN_GROWTH_ID || '',
    amount: 599900, // ₹5,999 in paise
    interval: 1,
    period: 'monthly' as const,
  },
  PRO: {
    id: process.env.RAZORPAY_PLAN_PRO_ID || '',
    amount: 999900, // ₹9,999 in paise
    interval: 1,
    period: 'monthly' as const,
  },
} as const;

// ─── Razorpay Client ──────────────────────────────────────────────────────────

const getRazorpay = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

// ─── Orders ──────────────────────────────────────────────────────────────────

export interface CreateOrderParams {
  amount: number; // in paise (₹1 = 100 paise)
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export async function createOrder(params: CreateOrderParams) {
  const razorpay = getRazorpay();
  return razorpay.orders.create({
    amount: params.amount,
    currency: params.currency || 'INR',
    receipt: params.receipt,
    notes: params.notes,
  });
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export async function createSubscription(params: {
  planId: string;
  customerId?: string;
  totalCount?: number;
  notes?: Record<string, string>;
}) {
  const razorpay = getRazorpay();
  return razorpay.subscriptions.create({
    plan_id: params.planId,
    customer_notify: 1,
    total_count: params.totalCount || 12,
    notes: params.notes,
  });
}

export async function cancelSubscription(subscriptionId: string, atEndOfCycle = true) {
  const razorpay = getRazorpay();
  return razorpay.subscriptions.cancel(subscriptionId, atEndOfCycle);
}

export async function fetchSubscription(subscriptionId: string) {
  const razorpay = getRazorpay();
  return razorpay.subscriptions.fetch(subscriptionId);
}

// ─── Payment Verification ─────────────────────────────────────────────────────

export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  const body = `${params.orderId}|${params.paymentId}`;
  const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expectedSignature === params.signature;
}

export function verifySubscriptionSignature(params: {
  subscriptionId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  const body = `${params.paymentId}|${params.subscriptionId}`;
  const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expectedSignature === params.signature;
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
  const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expectedSignature === signature;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

export const rupeesToPaise = (rupees: number): number => Math.round(rupees * 100);
export const paiseToRupees = (paise: number): number => paise / 100;
