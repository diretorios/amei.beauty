/**
 * Handle card publishing
 * POST /api/publish
 */

import type { Env } from '../types';
import { generateCardId, generateReferralCode, cardToRow, validateCard, rowToCard } from '../utils';
import { generateOwnerToken, hashToken, extractTokenFromHeader } from '../utils/auth';
import { verifyCardOwnership } from '../middleware/auth';
import type { PublishedCard } from '../../src/models/types';

export async function handlePublish(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const cardData = (await request.json()) as Partial<PublishedCard>;

    // Generate ID and referral code if not provided
    const now = Date.now();
    const freePeriodEnd = now + (30 * 24 * 60 * 60 * 1000); // 30 days from now
    
    const card: PublishedCard = {
      id: cardData.id || generateCardId(),
      username: cardData.username,
      referral_code: cardData.referral_code || generateReferralCode(),
      profile: cardData.profile!,
      services: cardData.services || [],
      social: cardData.social || [],
      links: cardData.links || [],
      ratings: cardData.ratings || [],
      testimonials: cardData.testimonials || [],
      client_photos: cardData.client_photos || [],
      badges: cardData.badges || [],
      certifications: cardData.certifications || [],
      recommendations: cardData.recommendations || { count: 0, recent: [] },
      location: cardData.location,
      published_at: cardData.published_at || new Date(now).toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
      is_featured: cardData.is_featured || false,
      subscription_tier: cardData.subscription_tier || 'free',
      // Initialize 30-day free period
      free_period_end: cardData.free_period_end || new Date(freePeriodEnd).toISOString(),
      updates_enabled_until: cardData.updates_enabled_until || new Date(freePeriodEnd).toISOString(),
      endorsement_count: cardData.endorsement_count || 0,
      can_update: cardData.can_update !== undefined ? cardData.can_update : true,
      payment_status: cardData.payment_status || 'none',
      settings: cardData.settings || {
        theme: 'system',
        accent_color: '#10B981',
        reduce_motion: false,
        language: 'pt-BR',
      },
      created_at: cardData.created_at || new Date(now).toISOString(),
    };

    // Validate
    const errors = validateCard(card);
    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: errors }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if username is taken (if provided)
    if (card.username) {
      const existing = await env.DB.prepare(
        'SELECT id FROM cards WHERE username = ? AND id != ?'
      )
        .bind(card.username, card.id)
        .first();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'Username already taken' }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Handle authentication and token generation
    let ownerToken: string | null = null;
    let ownerTokenHash: string | null = null;

    // Check if this is a new card or updating existing
    const existingCard = await env.DB.prepare('SELECT id, owner_token_hash FROM cards WHERE id = ?')
      .bind(card.id)
      .first<{ id: string; owner_token_hash: string | null }>();

    if (!existingCard) {
      // New card - generate token
      ownerToken = await generateOwnerToken();
      const secret = env.AUTH_SECRET || 'default-secret-change-in-production';
      ownerTokenHash = await hashToken(ownerToken, secret);
    } else if (existingCard.owner_token_hash) {
      // Existing card with auth - require token
      const authHeader = request.headers.get('Authorization');
      const token = extractTokenFromHeader(authHeader);
      
      if (!token) {
        return new Response(
          JSON.stringify({ 
            error: 'Unauthorized',
            message: 'This card requires authentication. Please provide an Authorization header.'
          }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      // Verify token
      const { valid } = await verifyCardOwnership(card.id, request, env);
      
      if (!valid) {
        return new Response(
          JSON.stringify({ 
            error: 'Unauthorized',
            message: 'Invalid authentication token'
          }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      // Keep existing token hash
      ownerTokenHash = existingCard.owner_token_hash;
    } else {
      // Legacy card being republished - generate new token
      ownerToken = await generateOwnerToken();
      const secret = env.AUTH_SECRET || 'default-secret-change-in-production';
      ownerTokenHash = await hashToken(ownerToken, secret);
    }

    // Convert to row
    const row = cardToRow(card);
    const updatedAt = Date.now();

    // Insert or update
    await env.DB.prepare(
      `INSERT INTO cards (
        id, username, profile_json, services_json, social_json, links_json,
        ratings_json, testimonials_json, client_photos_json, badges_json,
        certifications_json, recommendations_json, location_json, referral_code,
        published_at, updated_at, is_active, is_featured, subscription_tier,
        free_period_end, updates_enabled_until, endorsement_count, can_update, payment_status, owner_token_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        username = excluded.username,
        profile_json = excluded.profile_json,
        services_json = excluded.services_json,
        social_json = excluded.social_json,
        links_json = excluded.links_json,
        ratings_json = excluded.ratings_json,
        testimonials_json = excluded.testimonials_json,
        client_photos_json = excluded.client_photos_json,
        badges_json = excluded.badges_json,
        certifications_json = excluded.certifications_json,
        recommendations_json = excluded.recommendations_json,
        location_json = excluded.location_json,
        updated_at = excluded.updated_at,
        is_active = excluded.is_active,
        is_featured = excluded.is_featured,
        subscription_tier = excluded.subscription_tier,
        free_period_end = excluded.free_period_end,
        updates_enabled_until = excluded.updates_enabled_until,
        endorsement_count = excluded.endorsement_count,
        can_update = excluded.can_update,
        payment_status = excluded.payment_status,
        owner_token_hash = COALESCE(excluded.owner_token_hash, cards.owner_token_hash)
      `
    )
      .bind(
        card.id,
        row.username,
        row.profile_json,
        row.services_json,
        row.social_json,
        row.links_json,
        row.ratings_json,
        row.testimonials_json,
        row.client_photos_json,
        row.badges_json,
        row.certifications_json,
        row.recommendations_json,
        row.location_json,
        row.referral_code,
        row.published_at || updatedAt,
        updatedAt,
        row.is_active,
        row.is_featured,
        row.subscription_tier,
        row.free_period_end,
        row.updates_enabled_until,
        row.endorsement_count,
        row.can_update,
        row.payment_status,
        ownerTokenHash
      )
      .run();

    // Return published card
    const result = await env.DB.prepare('SELECT * FROM cards WHERE id = ?')
      .bind(card.id)
      .first<import('../types').CardRow>();

    if (!result) {
      throw new Error('Failed to retrieve published card');
    }

    const publishedCard = rowToCard(result);

    // Return the token in the response (only for new cards or legacy cards being upgraded)
    const response: any = { ...publishedCard };
    if (ownerToken) {
      response.owner_token = ownerToken; // Include token in response
      response.token_warning = 'Save this token securely. You will need it to update or delete this card.';
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Publish error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to publish card',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

