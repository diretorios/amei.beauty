/**
 * Cloudflare Workers environment types
 */

export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  ENVIRONMENT: string;
}

export interface CardRow {
  id: string;
  username: string | null;
  profile_json: string;
  services_json: string;
  social_json: string;
  links_json: string;
  ratings_json: string;
  testimonials_json: string;
  client_photos_json: string;
  badges_json: string;
  certifications_json: string;
  recommendations_json: string;
  location_json: string | null;
  referral_code: string;
  published_at: number;
  updated_at: number;
  is_active: number;
  is_featured: number;
  subscription_tier: string;
}

