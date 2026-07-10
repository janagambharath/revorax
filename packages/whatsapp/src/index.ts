import axios, { AxiosInstance } from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  apiVersion?: string;
}

export interface TextMessage {
  to: string;
  body: string;
  previewUrl?: boolean;
}

export interface TemplateComponent {
  type: 'header' | 'body' | 'button';
  parameters: Array<{
    type: 'text' | 'currency' | 'date_time' | 'image' | 'document';
    text?: string;
    currency?: { fallback_value: string; code: string; amount_1000: number };
  }>;
}

export interface TemplateMessage {
  to: string;
  templateName: string;
  language?: string;
  components?: TemplateComponent[];
}

export interface InteractiveButton {
  type: 'reply';
  reply: { id: string; title: string };
}

export interface InteractiveMessage {
  to: string;
  body: string;
  buttons: InteractiveButton[];
  header?: string;
  footer?: string;
}

export interface SendMessageResult {
  messageId: string;
  to: string;
  timestamp: number;
}

export interface WhatsAppWebhookEvent {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: { display_phone_number: string; phone_number_id: string };
        contacts?: Array<{ profile: { name: string }; wa_id: string }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          button?: { payload: string; text: string };
        }>;
        statuses?: Array<{
          id: string;
          recipient_id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          errors?: Array<{ code: number; title: string }>;
        }>;
      };
      field: string;
    }>;
  }>;
}

// ─── WhatsApp Client ──────────────────────────────────────────────────────────

export class WhatsAppClient {
  private client: AxiosInstance;
  private phoneNumberId: string;

  constructor(config?: WhatsAppConfig) {
    const phoneNumberId = config?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID!;
    const accessToken = config?.accessToken || process.env.WHATSAPP_ACCESS_TOKEN!;
    const apiVersion = config?.apiVersion || process.env.WHATSAPP_API_VERSION || 'v21.0';

    this.phoneNumberId = phoneNumberId;
    this.client = axios.create({
      baseURL: `https://graph.facebook.com/${apiVersion}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  private normalizePhone(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    // Add country code if missing (default India +91)
    if (digits.length === 10) return `91${digits}`;
    return digits;
  }

  async sendTextMessage(params: TextMessage): Promise<SendMessageResult> {
    const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.normalizePhone(params.to),
      type: 'text',
      text: {
        preview_url: params.previewUrl ?? false,
        body: params.body,
      },
    });

    return {
      messageId: response.data.messages[0].id,
      to: params.to,
      timestamp: Date.now(),
    };
  }

  async sendTemplateMessage(params: TemplateMessage): Promise<SendMessageResult> {
    const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: this.normalizePhone(params.to),
      type: 'template',
      template: {
        name: params.templateName,
        language: { code: params.language || 'en_IN' },
        components: params.components || [],
      },
    });

    return {
      messageId: response.data.messages[0].id,
      to: params.to,
      timestamp: Date.now(),
    };
  }

  async sendInteractiveMessage(params: InteractiveMessage): Promise<SendMessageResult> {
    const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: this.normalizePhone(params.to),
      type: 'interactive',
      interactive: {
        type: 'button',
        header: params.header ? { type: 'text', text: params.header } : undefined,
        body: { text: params.body },
        footer: params.footer ? { text: params.footer } : undefined,
        action: {
          buttons: params.buttons,
        },
      },
    });

    return {
      messageId: response.data.messages[0].id,
      to: params.to,
      timestamp: Date.now(),
    };
  }

  async markMessageRead(messageId: string): Promise<void> {
    await this.client.post(`/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    });
  }

  verifyWebhook(token: string, challenge: string): string | null {
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    if (token === verifyToken) return challenge;
    return null;
  }

  parseWebhookEvent(payload: WhatsAppWebhookEvent): {
    type: 'message' | 'status' | 'unknown';
    data: unknown;
  } {
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (value?.messages?.length) {
      const message = value.messages[0];
      const contact = value.contacts?.[0];
      return {
        type: 'message',
        data: {
          messageId: message.id,
          from: message.from,
          senderName: contact?.profile?.name || 'Unknown',
          timestamp: parseInt(message.timestamp),
          type: message.type,
          text: message.text?.body || message.button?.text,
          payload: message.button?.payload,
        },
      };
    }

    if (value?.statuses?.length) {
      const status = value.statuses[0];
      return {
        type: 'status',
        data: {
          messageId: status.id,
          recipientId: status.recipient_id,
          status: status.status,
          timestamp: parseInt(status.timestamp),
          errors: status.errors,
        },
      };
    }

    return { type: 'unknown', data: payload };
  }

  // Interpolate template variables: "Hi {{name}}" + {name: "Raj"} → "Hi Raj"
  interpolateMessage(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }
}

export const whatsapp = new WhatsAppClient();
