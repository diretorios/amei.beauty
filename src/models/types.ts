/**
 * Core data models for amei.beauty
 * Based on PROMPT file requirements + credibility features
 */

export type Locale = 'en' | 'pt-BR' | 'es';

export interface Profile {
  photo: string | null; // base64 string
  full_name: string;
  profession: string; // e.g., "Cabeleireira", "Manicure"
  headline: string;
  bio: string;
  whatsapp: string; // WhatsApp number
}

export interface SocialLink {
  platform: string; // "instagram", "facebook", "tiktok", etc.
  handle: string;
  url: string; // validated URL
}

export interface CustomLink {
  label: string;
  type: 'http' | 'mailto' | 'nostr' | 'custom';
  value: string; // validated
}

export interface Service {
  id: string;
  name: string;
  price: string;
  description: string;
}

export interface Rating {
  id: string;
  value: number; // 1-5
  comment?: string;
  reviewer_name?: string;
  created_at: string; // ISO-8601
}

export interface Testimonial {
  id: string;
  client_name: string;
  client_photo?: string; // base64 or URL
  comment: string;
  rating: number; // 1-5
  created_at: string; // ISO-8601
}

export interface ClientPhoto {
  id: string;
  url: string; // base64 or URL
  caption?: string;
  is_before_after?: boolean; // true for before, false for after
  created_at: string; // ISO-8601
}

export type BadgeType =
  | 'verified'
  | 'years_experience'
  | 'clients_served'
  | 'certified'
  | 'most_loved'
  | 'viral';

export interface Badge {
  type: BadgeType;
  label: string; // Translated label
  value?: string | number; // e.g., "5+ anos", "100+ clientes"
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issue_date?: string; // ISO-8601
  expiry_date?: string; // ISO-8601
  certificate_url?: string;
}

export interface Recommendation {
  id: string;
  card_id: string;
  recommender_name?: string;
  recommender_whatsapp?: string;
  referral_code: string;
  shared_via: 'whatsapp' | 'instagram' | 'facebook' | 'link';
  shared_at: string; // ISO-8601
  clicked_count: number;
  converted_count: number;
}

export interface NostrKeypair {
  public_key: string; // hex string
  private_key: string; // hex string (encrypted at rest)
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  accent_color: string;
  reduce_motion: boolean;
  language: Locale;
}

export interface CardData {
  profile: Profile;
  social: SocialLink[];
  links: CustomLink[];
  services: Service[];
  ratings: Rating[];
  testimonials: Testimonial[];
  client_photos: ClientPhoto[];
  badges: Badge[];
  certifications: Certification[];
  recommendations: {
    count: number;
    recent: Recommendation[];
  };
  nostr?: NostrKeypair;
  settings: Settings;
  created_at: string; // ISO-8601
  updated_at: string; // ISO-8601
}

export interface PublishedCard extends CardData {
  id: string;
  username?: string;
  referral_code: string;
  location?: {
    city?: string;
    neighborhood?: string;
    state?: string;
  };
  published_at: string;
  is_active: boolean;
  is_featured: boolean;
  subscription_tier: 'free' | 'basic' | 'pro';
}

