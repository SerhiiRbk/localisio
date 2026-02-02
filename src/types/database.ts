// ============================================================
// Database Types for Localisio
// ============================================================

export type UserRole = 'seeker' | 'provider';

/**
 * FAQ item structure for provider profiles
 */
export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Social profile links (private - visible only to owner and admin)
 */
export interface SocialLinks {
  facebook_url?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
}

export interface Profile {
  id: string;
  role: UserRole;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  // Blocking (managed by admin)
  is_blocked: boolean;
  blocked_at: string | null;
  blocked_reason: string | null;
  // Activity tracking
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderProfile {
  user_id: string;
  headline: string;
  bio: string;
  experience_years: number;
  country_code: string;
  city: string;
  // SEO-friendly URL slug (optional)
  slug: string | null;
  // Geocoded location fields
  city_place_id: string | null;
  city_display_name: string | null;
  city_name_normalized: string | null;
  lat: number | null;
  lon: number | null;
  // FAQ section
  faq: FAQItem[];
  // Social links (private - only visible to owner and admin)
  social_links: SocialLinks;
  // Other fields
  languages: string[];
  services: string[];
  youtube_url: string | null;
  is_verified: boolean;
  verification_badge_text: string | null;
  priority_score: number;
  featured: boolean;
  featured_country_code: string | null;
  featured_language: string | null;
  average_rating: number;
  review_count: number;
  is_hidden: boolean;
  // Approval status (admin-controlled)
  is_approved: boolean;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Location data structure for geocoded cities
 */
export interface LocationData {
  place_id: string;
  display_name: string;
  city_name: string;
  country_code: string;
  country_name: string;
  lat: number;
  lon: number;
}

export interface ProviderPhoto {
  id: string;
  provider_user_id: string;
  storage_path: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

// Conversation lifecycle types
export type ConversationStatus = 'open' | 'active' | 'closed';
export type ConversationCloseMethod = 'manual' | 'auto_inactive';
export type ConversationCloseReason = 'success' | 'cancelled' | 'not_actual' | 'no_result' | 'other';

export interface Conversation {
  id: string;
  seeker_id: string;
  provider_id: string;
  created_at: string;
  // Lifecycle fields
  status: ConversationStatus;
  closed_at: string | null;
  closed_by: string | null;
  closed_method: ConversationCloseMethod | null;
  closed_reason: ConversationCloseReason | null;
  reopened_at: string | null;
  last_message_at: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  payload: {
    conversation_id?: string;
    message_id?: string;
    sender_id?: string;
    [key: string]: unknown;
  };
  is_read: boolean;
  created_at: string;
}

export interface AdminRole {
  user_id: string;
  role: string;
  created_at: string;
}

export interface Review {
  id: string;
  provider_user_id: string;
  reviewer_user_id: string;
  rating: number;
  review_text: string | null;
  is_approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewWithReviewer extends Review {
  reviewer: Profile;
}

// ============================================================
// Extended Types (with relations)
// ============================================================

export interface ProviderWithProfile extends ProviderProfile {
  profile: Profile;
  photos: ProviderPhoto[];
}

export interface ConversationWithDetails extends Conversation {
  seeker: Profile;
  provider: Profile;
  last_message?: Message;
  unread_count?: number;
  is_system_conversation?: boolean;
  // Computed fields for UI
  can_reopen?: boolean; // closed_at within 14 days
  can_close?: boolean;  // status !== 'closed'
}

export interface MessageWithSender extends Message {
  sender: Profile;
}

// ============================================================
// API Request/Response Types
// ============================================================

export interface SearchProvidersParams {
  service?: string | string[];
  language?: string | string[];
  country_code?: string;
  city?: string;
  /** Canonical city place_id from geocoder (preferred for exact match) */
  city_place_id?: string;
  /** For nearby search: latitude */
  lat?: number;
  /** For nearby search: longitude */
  lon?: number;
  /** Radius in km for nearby search (default: 50) */
  radius_km?: number;
  sort?: 'relevance' | 'top' | 'distance';
  limit?: number;
  offset?: number;
}

export interface SearchProvidersResponse {
  providers: ProviderWithProfile[];
  total: number;
  has_more: boolean;
}

export interface CreateMessageParams {
  provider_id: string;
  body: string;
}

export interface UpdateProviderProfileParams {
  headline?: string;
  bio?: string;
  experience_years?: number;
  country_code?: string;
  city?: string;
  /** SEO-friendly URL slug (max 50 chars, URL-safe) */
  slug?: string | null;
  /** Geocoded location data */
  city_place_id?: string | null;
  city_display_name?: string | null;
  city_name_normalized?: string | null;
  lat?: number | null;
  lon?: number | null;
  /** FAQ items (max 5, max 2500 total characters) */
  faq?: FAQItem[];
  /** Social profile links (private - only visible to owner and admin) */
  social_links?: SocialLinks;
  languages?: string[];
  services?: string[];
  youtube_url?: string | null;
}

export interface AdminUpdateProviderParams {
  is_verified?: boolean;
  verification_badge_text?: string | null;
  priority_score?: number;
  featured?: boolean;
  featured_country_code?: string | null;
  featured_language?: string | null;
}
