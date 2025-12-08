/**
 * Cloudflare Workers environment types
 */

export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  RATE_LIMIT_KV?: KVNamespace; // KV namespace for rate limiting (can be shared across apps)
  ENVIRONMENT: string;
  ALLOWED_ORIGINS?: string; // Comma-separated list of allowed origins
  RATE_LIMIT_APP_PREFIX?: string; // Prefix for rate limit keys (defaults to 'amei-beauty')
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  AUTH_SECRET?: string; // Secret key for hashing owner tokens
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
  // New fields for endorsement/payment system
  free_period_end: number | null;
  updates_enabled_until: number | null;
  endorsement_count: number;
  last_endorsement_at: number | null;
  can_update: number;
  payment_status: string;
  payment_date: number | null;
  payment_amount: number | null;
  payment_currency: string | null;
  owner_token_hash: string | null;
}

