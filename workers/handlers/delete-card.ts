/**
 * Handle unpublishing a card
 * DELETE /api/card/:id
 */

import type { Env } from '../types';

export async function handleDeleteCard(
  id: string,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Soft delete (set is_active = 0) instead of hard delete
    const result = await env.DB.prepare(
      'UPDATE cards SET is_active = 0, updated_at = ? WHERE id = ?'
    )
      .bind(Date.now(), id)
      .run();

    if (result.success && result.meta.changes > 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Card unpublished' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Card not found' }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Delete card error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to unpublish card',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

