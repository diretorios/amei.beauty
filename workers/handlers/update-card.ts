/**
 * Handle updating a published card
 * PUT /api/card/:id
 */

import type { Env } from '../types';
import { cardToRow, validateCard, rowToCard } from '../utils';
import type { PublishedCard } from '../../src/models/types';

export async function handleUpdateCard(
  id: string,
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const updates = (await request.json()) as Partial<PublishedCard>;

    // Get existing card
    const existing = await env.DB.prepare('SELECT * FROM cards WHERE id = ?')
      .bind(id)
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

    // Check if updates are allowed
    const now = Date.now();
    const existingCard = rowToCard(existing);
    const freePeriodEnd = existingCard.free_period_end 
      ? new Date(existingCard.free_period_end).getTime() 
      : 0;
    const updatesEnabledUntil = existingCard.updates_enabled_until 
      ? new Date(existingCard.updates_enabled_until).getTime() 
      : 0;
    const hasPaid = existingCard.payment_status === 'paid';
    
    const canUpdate = now <= freePeriodEnd || now <= updatesEnabledUntil || hasPaid;
    
    if (!canUpdate) {
      return new Response(
        JSON.stringify({ 
          error: 'Updates locked',
          message: 'Get 6 endorsements for 6 months free updates, 10 for 12 months + better placement, OR pay $10 USD for 12 months + better placement',
          endorsement_count: existingCard.endorsement_count || 0,
          needed: (existingCard.endorsement_count || 0) < 6 ? 6 : 10,
          payment_option: true,
          payment_amount: 10,
          payment_currency: 'USD',
          payment_benefits: '12 months updates + better search placement (equivalent to 10 endorsements)'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Merge updates
    const existingCard = rowToCard(existing);
    const updatedCard: PublishedCard = {
      ...existingCard,
      ...updates,
      id: existingCard.id, // Don't allow ID changes
      updated_at: new Date().toISOString(),
    };

    // Validate
    const errors = validateCard(updatedCard);
    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: errors }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check username uniqueness if changed
    if (updates.username && updates.username !== existingCard.username) {
      const usernameTaken = await env.DB.prepare(
        'SELECT id FROM cards WHERE username = ? AND id != ?'
      )
        .bind(updates.username, id)
        .first();

      if (usernameTaken) {
        return new Response(
          JSON.stringify({ error: 'Username already taken' }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Update in database
    const row = cardToRow(updatedCard);
    const now = Date.now();

    await env.DB.prepare(
      `UPDATE cards SET
        username = ?,
        profile_json = ?,
        services_json = ?,
        social_json = ?,
        links_json = ?,
        ratings_json = ?,
        testimonials_json = ?,
        client_photos_json = ?,
        badges_json = ?,
        certifications_json = ?,
        recommendations_json = ?,
        location_json = ?,
        updated_at = ?,
        is_active = ?,
        is_featured = ?,
        subscription_tier = ?,
        free_period_end = ?,
        updates_enabled_until = ?,
        endorsement_count = ?,
        can_update = ?,
        payment_status = ?
      WHERE id = ?`
    )
      .bind(
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
        now,
        row.is_active,
        row.is_featured,
        row.subscription_tier,
        row.free_period_end,
        row.updates_enabled_until,
        row.endorsement_count,
        row.can_update,
        row.payment_status,
        id
      )
      .run();

    // Return updated card
    const result = await env.DB.prepare('SELECT * FROM cards WHERE id = ?')
      .bind(id)
      .first<import('../types').CardRow>();

    if (!result) {
      throw new Error('Failed to retrieve updated card');
    }

    const card = rowToCard(result);

    return new Response(JSON.stringify(card), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Update card error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update card',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

