// ============================================================
// Message Validation Schemas
// ============================================================

import { z } from 'zod';

export const sendMessageSchema = z.object({
  provider_id: z.string().uuid('Invalid provider ID'),
  body: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long'),
});

export const sendMessageToConversationSchema = z.object({
  conversation_id: z.string().uuid('Invalid conversation ID'),
  body: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long'),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type SendMessageToConversationInput = z.infer<typeof sendMessageToConversationSchema>;
