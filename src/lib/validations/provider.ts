// ============================================================
// Provider Validation Schemas
// ============================================================

import { z } from 'zod';
import { serviceCodes } from '@/config/services';
import { languageCodes } from '@/config/languages';
import { countryCodes, ONLINE_COUNTRY_CODE } from '@/config/countries';

// URL detection regex - matches http(s) URLs and common URL patterns
const URL_REGEX = /(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_+.~#?&//=]*/gi;

// Helper to check if text contains URLs
export function containsUrls(text: string | null | undefined): boolean {
  if (!text) return false;
  return URL_REGEX.test(text);
}

// Helper to strip URLs from text
export function stripUrls(text: string | null | undefined): string {
  if (!text) return '';
  // Reset regex state (important for global regex)
  URL_REGEX.lastIndex = 0;
  return text
    .replace(URL_REGEX, '')           // Remove URLs
    .replace(/[^\S\n]+/g, ' ')        // Replace multiple spaces (but not newlines) with single space
    .replace(/\n{3,}/g, '\n\n')       // Limit consecutive newlines to max 2
    .trim();
}

// Schema that strips URLs from text and tracks if URLs were found
const textWithoutUrlsSchema = (maxLength: number, fieldName: string) => 
  z.string()
    .max(maxLength, `${fieldName} too long`)
    .transform(val => {
      if (!val) return val;
      const stripped = stripUrls(val);
      return stripped;
    })
    .optional();

// FAQ item schema with URL stripping
const faqItemSchema = z.object({
  question: z.string()
    .min(1, 'Question is required')
    .max(200, 'Question too long')
    .transform(val => stripUrls(val)),
  answer: z.string()
    .min(1, 'Answer is required')
    .max(1000, 'Answer too long')
    .transform(val => stripUrls(val)),
});

// FAQ array schema with validation
const faqSchema = z.array(faqItemSchema)
  .max(5, 'Maximum 5 FAQ items allowed')
  .refine(
    (items) => {
      const totalChars = items.reduce(
        (sum, item) => sum + item.question.length + item.answer.length,
        0
      );
      return totalChars <= 2500;
    },
    { message: 'Total FAQ content exceeds 2500 characters' }
  )
  .optional()
  .default([]);

// Social URL validation helper
const socialUrlSchema = (domain: string) =>
  z.string()
    .transform(val => val?.trim() || null)
    .refine(
      val => !val || val.includes(domain),
      { message: `URL must be a ${domain} profile link` }
    )
    .nullable()
    .optional();

// Social links schema (private - only visible to owner and admin)
const socialLinksSchema = z.object({
  facebook_url: socialUrlSchema('facebook.com'),
  instagram_url: socialUrlSchema('instagram.com'),
  linkedin_url: socialUrlSchema('linkedin.com'),
}).optional().default({});

// Slug validation and transformation
const slugSchema = z.string()
  .max(50, 'Slug must be 50 characters or less')
  .transform(val => {
    if (!val || val.trim() === '') return null;
    // Convert to lowercase, replace spaces with underscore, remove invalid chars
    return val
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 50) || null;
  })
  .nullable()
  .optional();

export const updateProviderProfileSchema = z.object({
  headline: z.string()
    .max(200, 'Headline too long')
    .transform(val => val ? stripUrls(val) : val)
    .optional(),
  bio: z.string()
    .max(2000, 'Bio too long')
    .transform(val => val ? stripUrls(val) : val)
    .optional(),
  experience_years: z.number().min(0).max(100).optional(),
  country_code: z.string()
    .refine(val => !val || countryCodes.includes(val), 'Invalid country code')
    .optional()
    .transform(val => val || ''),
  city: z.string().max(100, 'City name too long').optional().transform(val => val || ''),
  // SEO-friendly URL slug (max 50 chars, URL-safe)
  slug: slugSchema,
  // Geocoded location fields
  // place_id format: "R435514" (R/W/N prefix + osm_id) or legacy numeric
  city_place_id: z.string().max(50).regex(/^([RWN]\d+|\d+)$/i, 'Invalid place_id format').nullable().optional(),
  city_display_name: z.string().max(500).nullable().optional(),
  city_name_normalized: z.string().max(100).nullable().optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lon: z.number().min(-180).max(180).nullable().optional(),
  // FAQ section (max 5 items, max 2500 total characters)
  faq: faqSchema,
  // Social links (private - only visible to owner and admin)
  social_links: socialLinksSchema,
  // Other fields
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
  country_code: z.string().refine(val => !val || countryCodes.includes(val), 'Invalid country code').optional(),
  city: z.string().max(100).optional(),
  // Geocoded city search (preferred - exact match)
  // place_id format: "R435514" (R/W/N prefix + osm_id) or legacy numeric
  city_place_id: z.string().max(50).regex(/^([RWN]\d+|\d+)$/i, 'Invalid place_id format').optional(),
  // Nearby search
  lat: z.number().min(-90).max(90).optional(),
  lon: z.number().min(-180).max(180).optional(),
  radius_km: z.number().min(1).max(500).default(50),
  sort: z.enum(['relevance', 'top', 'distance']).default('relevance'),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
});

export type UpdateProviderProfileInput = z.infer<typeof updateProviderProfileSchema>;
export type AdminUpdateProviderInput = z.infer<typeof adminUpdateProviderSchema>;
export type SearchProvidersInput = z.infer<typeof searchProvidersSchema>;
