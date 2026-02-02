// ============================================================
// Message Validation Schemas
// ============================================================

import { z } from 'zod';

// Maximum message length (enforced on UI and API, not in database)
export const MAX_MESSAGE_LENGTH = 300;

export const sendMessageSchema = z.object({
  provider_id: z.string().uuid('Invalid provider ID'),
  body: z.string().min(1, 'Message cannot be empty').max(MAX_MESSAGE_LENGTH, `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`),
});

export const sendMessageToConversationSchema = z.object({
  conversation_id: z.string().uuid('Invalid conversation ID'),
  body: z.string().min(1, 'Message cannot be empty').max(MAX_MESSAGE_LENGTH, `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type SendMessageToConversationInput = z.infer<typeof sendMessageToConversationSchema>;
