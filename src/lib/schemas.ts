import { z } from "zod";

// --- Auth / Agency ---

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member", "viewer"]),
});

export const agencySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
});

// --- Chat ---

export const chatMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(32_000),
  model: z.string().optional(),
});

// --- Documents ---

export const documentSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string(),
  agencyId: z.string().uuid(),
});

// --- Agents ---

export const agentSchema = z.object({
  name: z.string().min(1).max(100),
  systemPrompt: z.string().max(8_000).optional(),
  model: z.string().optional(),
  agencyId: z.string().uuid(),
});

// --- API Keys ---

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(80),
  agencyId: z.string().uuid(),
});

// --- v1 external API ---

export const v1ChatCompletionSchema = z.object({
  model: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string(),
    }),
  ),
  stream: z.boolean().optional().default(false),
  max_tokens: z.number().int().min(1).max(32_000).optional(),
  temperature: z.number().min(0).max(2).optional(),
});

export type InviteMember = z.infer<typeof inviteMemberSchema>;
export type Agency = z.infer<typeof agencySchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type Document = z.infer<typeof documentSchema>;
export type Agent = z.infer<typeof agentSchema>;
export type CreateApiKey = z.infer<typeof createApiKeySchema>;
export type V1ChatCompletion = z.infer<typeof v1ChatCompletionSchema>;
