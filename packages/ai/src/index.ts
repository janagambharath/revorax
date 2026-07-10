import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';

// ─── Provider Types ───────────────────────────────────────────────────────────

type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'groq';

interface AIConfig {
  primaryProvider: AIProvider;
  fallbackProvider?: AIProvider;
}

// ─── Provider Factory ─────────────────────────────────────────────────────────

const getModel = (provider: AIProvider) => {
  switch (provider) {
    case 'openai':
      return openai(process.env.OPENAI_MODEL || 'gpt-4o-mini');
    case 'anthropic':
      return anthropic(process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022');
    case 'gemini': {
      const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
      return google(process.env.GEMINI_MODEL || 'gemini-2.0-flash');
    }
    case 'groq': {
      const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
      return groq(process.env.GROQ_MODEL || 'llama-3.1-70b-versatile');
    }
    default:
      return openai('gpt-4o-mini');
  }
};

const getConfig = (): AIConfig => ({
  primaryProvider: (process.env.AI_PRIMARY_PROVIDER as AIProvider) || 'openai',
  fallbackProvider: (process.env.AI_FALLBACK_PROVIDER as AIProvider) || 'groq',
});

// ─── Core AI Function ─────────────────────────────────────────────────────────

export async function aiGenerate(
  prompt: string,
  systemPrompt?: string,
  options?: { temperature?: number; maxTokens?: number },
): Promise<string> {
  const config = getConfig();

  const tryGenerate = async (provider: AIProvider): Promise<string> => {
    const { text } = await generateText({
      model: getModel(provider),
      system: systemPrompt,
      prompt,
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? 500,
    });
    return text;
  };

  try {
    return await tryGenerate(config.primaryProvider);
  } catch (primaryError) {
    if (config.fallbackProvider) {
      console.warn(
        `[AI] Primary provider (${config.primaryProvider}) failed, falling back to ${config.fallbackProvider}`,
        primaryError,
      );
      try {
        return await tryGenerate(config.fallbackProvider);
      } catch (fallbackError) {
        console.error('[AI] Fallback provider also failed:', fallbackError);
        throw new Error('AI generation failed on all providers');
      }
    }
    throw primaryError;
  }
}

export async function aiGenerateObject<T extends z.ZodType>(
  prompt: string,
  schema: T,
  systemPrompt?: string,
): Promise<z.infer<T>> {
  const config = getConfig();
  const { object } = await generateObject({
    model: getModel(config.primaryProvider),
    system: systemPrompt,
    prompt,
    schema,
  });
  return object;
}

// ─── Business Prompts ─────────────────────────────────────────────────────────

export async function generateFollowUpMessage(params: {
  contactName: string;
  businessName: string;
  businessType: string;
  channel: 'WHATSAPP' | 'EMAIL';
  context: string;
  memberStatus?: string;
  daysSinceContact?: number;
}): Promise<string> {
  const systemPrompt = `You are an AI assistant for ${params.businessName}, a ${params.businessType} business using Revorax Revenue OS.
Your job is to draft professional, friendly, and effective follow-up messages that help the business retain customers and recover revenue.
Keep messages concise, personal, and action-oriented. Never be spammy or pushy.
${params.channel === 'WHATSAPP' ? 'Format for WhatsApp: use emoji sparingly, keep under 300 characters, use line breaks for readability.' : 'Format for email: professional tone, clear subject if needed.'}`;

  const prompt = `Draft a follow-up message for: ${params.contactName}
Business: ${params.businessName}
Context: ${params.context}
${params.memberStatus ? `Member status: ${params.memberStatus}` : ''}
${params.daysSinceContact ? `Days since last contact: ${params.daysSinceContact}` : ''}
Channel: ${params.channel}

Write only the message body, no explanations.`;

  return aiGenerate(prompt, systemPrompt, { temperature: 0.8, maxTokens: 300 });
}

export async function classifyAndScoreLead(params: {
  contactName: string;
  source: string;
  notes: string;
  interactions: string[];
  businessType: string;
}): Promise<{ score: number; reasoning: string; suggestedStatus: string; nextAction: string }> {
  const systemPrompt = `You are a sales intelligence AI for a ${params.businessType} business. 
Analyze lead data and provide accurate lead scoring and next best action recommendations.`;

  const schema = z.object({
    score: z.number().min(0).max(100).describe('Lead score from 0-100'),
    reasoning: z.string().describe('Brief explanation of the score'),
    suggestedStatus: z
      .enum(['NEW', 'CONTACTED', 'INTERESTED', 'TRIAL', 'CONVERTED', 'NURTURING', 'LOST'])
      .describe('Recommended lead status'),
    nextAction: z.string().describe('Specific next action to take with this lead'),
  });

  return aiGenerateObject(
    `Analyze this lead:
Name: ${params.contactName}
Source: ${params.source}
Notes: ${params.notes}
Recent interactions: ${params.interactions.join(', ') || 'None'}`,
    schema,
    systemPrompt,
  );
}

export async function suggestNextAction(params: {
  contactName: string;
  businessType: string;
  memberStatus?: string;
  lastContactDays: number;
  openTasks: string[];
  recentMessages: string[];
}): Promise<{ action: string; priority: string; reasoning: string }> {
  const systemPrompt = `You are a revenue operations AI for a ${params.businessType} business.
Suggest the single most impactful action to take with this customer to retain them or recover revenue.`;

  const schema = z.object({
    action: z.string().describe('Specific action to take'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).describe('Priority level'),
    reasoning: z.string().describe('Why this action will help'),
  });

  return aiGenerateObject(
    `Customer: ${params.contactName}
${params.memberStatus ? `Status: ${params.memberStatus}` : ''}
Days since last contact: ${params.lastContactDays}
Open tasks: ${params.openTasks.join(', ') || 'None'}
Recent messages: ${params.recentMessages.slice(-3).join(' | ') || 'None'}`,
    schema,
    systemPrompt,
  );
}

export async function generateCampaignCopy(params: {
  purpose: string;
  businessName: string;
  businessType: string;
  channel: 'WHATSAPP' | 'EMAIL';
  audience: string;
  tone: 'professional' | 'friendly' | 'urgent';
}): Promise<{ body: string; subject?: string }> {
  const systemPrompt = `You are a marketing copywriter for ${params.businessName}, a ${params.businessType} business.
Write compelling, conversion-focused campaign messages. Tone: ${params.tone}.
${params.channel === 'WHATSAPP' ? 'For WhatsApp: keep under 400 chars, use 1-2 emoji, clear CTA.' : 'For email: include a subject line, professional body, clear CTA.'}`;

  const schema = z.object({
    body: z.string().describe('Message body'),
    subject: z.string().optional().describe('Email subject line (only for email)'),
  });

  return aiGenerateObject(
    `Create a ${params.channel} campaign message.
Purpose: ${params.purpose}
Target audience: ${params.audience}
Tone: ${params.tone}`,
    schema,
    systemPrompt,
  );
}

export async function summarizeContactHistory(params: {
  contactName: string;
  notes: string[];
  messages: string[];
  businessType: string;
}): Promise<string> {
  const systemPrompt = `You are a CRM AI assistant. Summarize customer interactions concisely for a ${params.businessType} business owner.
Focus on: current status, key concerns, revenue at risk, and recommended next step.`;

  return aiGenerate(
    `Summarize this customer's history:
Name: ${params.contactName}
Notes: ${params.notes.join(' | ')}
Recent messages: ${params.messages.slice(-5).join(' | ')}`,
    systemPrompt,
    { temperature: 0.3, maxTokens: 200 },
  );
}
