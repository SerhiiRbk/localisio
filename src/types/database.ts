// ============================================================
// Database Types for Localisio
// ============================================================

export type UserRole = 'seeker' | 'provider';

export interface Profile {
  id: string;
  role: UserRole;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
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
  created_at: string;
  updated_at: string;
}

export interface ProviderPhoto {
  id: string;
  provider_user_id: string;
  storage_path: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  seeker_id: string;
  provider_id: string;
  created_at: string;
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
  sort?: 'relevance' | 'top';
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
