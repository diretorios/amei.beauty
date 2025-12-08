/**
 * Utility functions for Workers
 */

import type { CardRow } from './types';
import type { PublishedCard } from '../src/models/types';
import { validateUsername, validateUrl, validateWhatsAppNumber, validateTextLength } from './utils/validation';

/**
 * Generate a unique ID for cards
 */
export function generateCardId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Generate a referral code
 */
export function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

/**
 * Convert CardRow from database to PublishedCard
 */
export function rowToCard(row: CardRow): PublishedCard {
  return {
    id: row.id,
    username: row.username || undefined,
    referral_code: row.referral_code,
    profile: JSON.parse(row.profile_json),
    services: JSON.parse(row.services_json),
    social: JSON.parse(row.social_json),
    links: JSON.parse(row.links_json),
    ratings: JSON.parse(row.ratings_json),
    testimonials: JSON.parse(row.testimonials_json),
    client_photos: JSON.parse(row.client_photos_json),
    badges: JSON.parse(row.badges_json),
    certifications: JSON.parse(row.certifications_json),
    recommendations: JSON.parse(row.recommendations_json),
    location: row.location_json ? JSON.parse(row.location_json) : undefined,
    published_at: new Date(row.published_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
    is_active: row.is_active === 1,
    is_featured: row.is_featured === 1,
    subscription_tier: row.subscription_tier as 'free' | 'basic' | 'pro',
    settings: {
      theme: 'system',
      accent_color: '#10B981',
      reduce_motion: false,
      language: 'pt-BR',
    },
    created_at: new Date(row.published_at).toISOString(),
  };
}

/**
 * Convert PublishedCard to database row
 */
export function cardToRow(card: PublishedCard): Omit<CardRow, 'id' | 'published_at' | 'updated_at'> & {
  id?: string;
  published_at?: number;
  updated_at?: number;
} {
  return {
    id: card.id,
    username: card.username || null,
    profile_json: JSON.stringify(card.profile),
    services_json: JSON.stringify(card.services),
    social_json: JSON.stringify(card.social),
    links_json: JSON.stringify(card.links),
    ratings_json: JSON.stringify(card.ratings),
    testimonials_json: JSON.stringify(card.testimonials),
    client_photos_json: JSON.stringify(card.client_photos),
    badges_json: JSON.stringify(card.badges),
    certifications_json: JSON.stringify(card.certifications),
    recommendations_json: JSON.stringify(card.recommendations),
    location_json: card.location ? JSON.stringify(card.location) : null,
    referral_code: card.referral_code,
    published_at: new Date(card.published_at).getTime(),
    updated_at: new Date(card.updated_at).getTime(),
    is_active: card.is_active ? 1 : 0,
    is_featured: card.is_featured ? 1 : 0,
    subscription_tier: card.subscription_tier,
  };
}

/**
 * Validate card data
 */
export function validateCard(card: Partial<PublishedCard>): string[] {
  const errors: string[] = [];

  // Validate full_name
  if (!card.profile?.full_name) {
    errors.push('Profile full_name is required');
  } else {
    const nameValidation = validateTextLength(card.profile.full_name, 'Full name', 100, 1);
    if (!nameValidation.valid) {
      errors.push(nameValidation.error || 'Invalid full name');
    }
  }

  // Validate whatsapp
  if (!card.profile?.whatsapp) {
    errors.push('Profile whatsapp is required');
  } else {
    const whatsappValidation = validateWhatsAppNumber(card.profile.whatsapp);
    if (!whatsappValidation.valid) {
      errors.push(whatsappValidation.error || 'Invalid WhatsApp number');
    }
  }

  // Validate profession
  if (card.profile?.profession) {
    const professionValidation = validateTextLength(card.profile.profession, 'Profession', 100);
    if (!professionValidation.valid) {
      errors.push(professionValidation.error || 'Invalid profession');
    }
  }

  // Validate username if provided
  if (card.username) {
    const usernameValidation = validateUsername(card.username);
    if (!usernameValidation.valid) {
      errors.push(usernameValidation.error || 'Invalid username');
    }
  }

  // Validate website URL if provided
  if (card.profile?.website) {
    const urlValidation = validateUrl(card.profile.website);
    if (!urlValidation.valid) {
      errors.push(urlValidation.error || 'Invalid website URL');
    }
  }

  // Validate bio length
  if (card.profile?.bio) {
    const bioValidation = validateTextLength(card.profile.bio, 'Bio', 1000);
    if (!bioValidation.valid) {
      errors.push(bioValidation.error || 'Bio too long');
    }
  }

  // Validate headline length
  if (card.profile?.headline) {
    const headlineValidation = validateTextLength(card.profile.headline, 'Headline', 200);
    if (!headlineValidation.valid) {
      errors.push(headlineValidation.error || 'Headline too long');
    }
  }

  // Validate referral code
  if (!card.referral_code) {
    errors.push('Referral code is required');
  }

  return errors;
}

