// ============================================================
// Provider Validation Schemas
// ============================================================

import { z } from 'zod';
import { serviceCodes } from '@/config/services';
import { languageCodes } from '@/config/languages';

export const updateProviderProfileSchema = z.object({
  headline: z.string().max(200, 'Headline too long').optional(),
  bio: z.string().max(2000, 'Bio too long').optional(),
  experience_years: z.number().min(0).max(100).optional(),
  country_code: z.string().max(2, 'Invalid country code').optional().transform(val => val || ''),
  city: z.string().max(100, 'City name too long').optional().transform(val => val || ''),
  languages: z.array(z.string()).max(10, 'Too many languages').optional().default([]),
  services: z.array(z.string()).max(5, 'Too many services').optional().default([]),
  youtube_url: z.string()
    .transform(val => val?.trim() || null)
    .refine(val => !val || val.startsWith('http'), 'Invalid URL')
    .nullable()
    .optional(),
});

export const adminUpdateProviderSchema = z.object({
  is_verified: z.boolean().optional(),
  verification_badge_text: z.string().max(100).nullable().optional(),
  priority_score: z.number().min(0).max(1000).optional(),
  featured: z.boolean().optional(),
  featured_country_code: z.string().length(2).nullable().optional(),
  featured_language: z.enum(languageCodes as [string, ...string[]]).nullable().optional(),
});

export const searchProvidersSchema = z.object({
  service: z.union([z.string(), z.array(z.string())]).optional(),
  language: z.union([z.string(), z.array(z.string())]).optional(),
  country_code: z.string().length(2).optional(),
  city: z.string().max(100).optional(),
  sort: z.enum(['relevance', 'top']).default('relevance'),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
});

export type UpdateProviderProfileInput = z.infer<typeof updateProviderProfileSchema>;
export type AdminUpdateProviderInput = z.infer<typeof adminUpdateProviderSchema>;
export type SearchProvidersInput = z.infer<typeof searchProvidersSchema>;
