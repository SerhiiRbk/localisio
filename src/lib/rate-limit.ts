// ============================================================
// Smart Rate Limiter with Anti-Spam Protection
// ============================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);
  
  if (!entry || entry.resetTime < now) {
    // Create new entry
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }
  
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }
  
  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  };
}

// ============================================================
// Rate Limit Configs
// ============================================================

// Global message rate limit (safety net)
export const MESSAGE_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 20, // 20 messages
  windowMs: 60000, // per minute
};

// Per-conversation message rate limit
export const CONVERSATION_MESSAGE_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10,  // 10 messages per conversation
  windowMs: 60000,  // per minute
};

// Cooldown between creating new conversations with different providers
export const NEW_CONVERSATION_COOLDOWN: RateLimitConfig = {
  maxRequests: 1,
  windowMs: 30000, // 30 seconds between new conversations
};

export const UPLOAD_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10, // 10 uploads
  windowMs: 300000, // per 5 minutes
};

// ============================================================
// New Conversation Limits (account-age based)
// ============================================================

interface NewConversationLimits {
  perHour: number;
  perDay: number;
}

/**
 * Returns new-conversation limits based on account age.
 * Newer accounts get stricter limits to prevent spam.
 */
export function getNewConversationLimits(accountCreatedAt: string): NewConversationLimits {
  const ageMs = Date.now() - new Date(accountCreatedAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  const ageDays = ageHours / 24;

  if (ageHours < 24) {
    return { perHour: 3, perDay: 5 };
  }
  if (ageDays < 7) {
    return { perHour: 5, perDay: 10 };
  }
  return { perHour: 10, perDay: 20 };
}

// ============================================================
// Duplicate First-Message Detection
// ============================================================

interface FirstMessageEntry {
  body: string;
  timestamp: number;
}

const firstMessageStore = new Map<string, FirstMessageEntry[]>();

// Clean up old first-message entries every minute
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000;
  for (const [key, entries] of firstMessageStore.entries()) {
    const filtered = entries.filter((e) => e.timestamp > oneHourAgo);
    if (filtered.length === 0) {
      firstMessageStore.delete(key);
    } else {
      firstMessageStore.set(key, filtered);
    }
  }
}, 60000);

function normalizeMessage(body: string): string {
  return body.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Track a first message sent when opening a new conversation.
 * Call this AFTER successfully creating the conversation + message.
 */
export function trackFirstMessage(userId: string, body: string): void {
  const entries = firstMessageStore.get(userId) || [];
  entries.push({ body: normalizeMessage(body), timestamp: Date.now() });
  firstMessageStore.set(userId, entries);
}

/**
 * Check if user is sending the same first message to many providers (spam pattern).
 * Returns true if 3+ identical first messages were sent within the last hour.
 */
export function isDuplicateSpam(userId: string, body: string): boolean {
  const entries = firstMessageStore.get(userId) || [];
  const oneHourAgo = Date.now() - 3600000;
  const recentEntries = entries.filter((e) => e.timestamp > oneHourAgo);

  const normalized = normalizeMessage(body);
  const duplicateCount = recentEntries.filter((e) => e.body === normalized).length;

  return duplicateCount >= 3;
}
