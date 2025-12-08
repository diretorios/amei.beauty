/**
 * Handle card endorsement (repurposed from recommendations)
 * POST /api/endorse
 * 
 * When customer clicks "Amei este profissional!" → Creates endorsement
 * Tracks endorsement_count and unlocks updates when thresholds reached:
 * - 6 endorsements = 6 months free updates
 * - 10 endorsements = 12 months free updates + better search placement
 */

import type { Env } from '../types';
import { rowToCard } from '../utils';
import type { Recommendation } from '../../src/models/types';

export async function handleEndorse(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body = await request.json() as {
      card_id: string;
      recommender_name?: string;
      recommender_whatsapp?: string;
      share_method?: 'whatsapp' | 'instagram' | 'facebook' | 'link';
    };

    const { card_id, recommender_name, recommender_whatsapp, share_method = 'link' } = body;

    if (!card_id) {
      return new Response(
        JSON.stringify({ error: 'card_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get existing card
    const existing = await env.DB.prepare('SELECT * FROM cards WHERE id = ?')
      .bind(card_id)
      .first<import('../types').CardRow>();

    if (!existing) {
      return new Response(
        JSON.stringify({ error: 'Card not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const card = rowToCard(existing);
    const recommendations = card.recommendations || { count: 0, recent: [] };

    // Create new endorsement/recommendation
    const endorsement: Recommendation = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      card_id,
      recommender_name,
      recommender_whatsapp,
      referral_code: card.referral_code,
      shared_via: share_method,
      shared_at: new Date().toISOString(),
      clicked_count: 0,
      converted_count: 0,
    };

    // Update recommendations
    const newCount = recommendations.count + 1;
    const recent = [endorsement, ...recommendations.recent].slice(0, 20); // Keep last 20

    const updatedRecommendations = {
      count: newCount,
      recent,
    };

    // Calculate FREE UPDATE period extension
    // Updates unlock starts from NOW when threshold reached
    let updatesExtensionMonths = 0;
    let shouldSetFeatured = false;
    
    if (newCount === 10) {
      // Just reached 10 endorsements = 12 months FREE updates + featured
      updatesExtensionMonths = 12;
      shouldSetFeatured = true;
    } else if (newCount === 6) {
      // Just reached 6 endorsements = 6 months FREE updates
      updatesExtensionMonths = 6;
    }

    const now = Date.now();
    let updatesEnabledUntil = card.updates_enabled_until 
      ? new Date(card.updates_enabled_until).getTime() 
      : 0;

    // If threshold reached, grant FREE update period starting NOW
    if (updatesExtensionMonths > 0) {
      updatesEnabledUntil = now + (updatesExtensionMonths * 30 * 24 * 60 * 60 * 1000);
    } else {
      // If already have updates enabled, keep the existing expiration
      // Otherwise, don't change it
      if (updatesEnabledUntil === 0) {
        updatesEnabledUntil = card.free_period_end 
          ? new Date(card.free_period_end).getTime() 
          : now;
      }
    }

    // Update card with endorsement and potentially unlock updates
    await env.DB.prepare(
      `UPDATE cards SET
        recommendations_json = ?,
        endorsement_count = ?,
        last_endorsement_at = ?,
        updates_enabled_until = ?,
        can_update = ?,
        is_featured = ?
      WHERE id = ?`
    )
      .bind(
        JSON.stringify(updatedRecommendations),
        newCount,
        now,
        updatesEnabledUntil,
        updatesExtensionMonths > 0 ? 1 : card.can_update ? 1 : 0,
        shouldSetFeatured ? 1 : existing.is_featured,
        card_id
      )
      .run();

    // Return updated card
    const result = await env.DB.prepare('SELECT * FROM cards WHERE id = ?')
      .bind(card_id)
      .first<import('../types').CardRow>();

    if (!result) {
      throw new Error('Failed to retrieve updated card');
    }

    const updatedCard = rowToCard(result);

    return new Response(
      JSON.stringify({
        success: true,
        card: updatedCard,
        endorsement_count: newCount,
        updates_unlocked: updatesExtensionMonths > 0,
        updates_months: updatesExtensionMonths,
        featured: shouldSetFeatured,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Endorse error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create endorsement',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

