/**
 * Handle getting a published card
 * GET /api/card/:id
 */

import type { Env } from '../types';
import { rowToCard } from '../utils';

export async function handleGetCard(
  id: string,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Support both ID and username lookup
    const result = await env.DB.prepare(
      'SELECT * FROM cards WHERE (id = ? OR username = ?) AND is_active = 1'
    )
      .bind(id, id)
      .first<import('../types').CardRow>();

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'Card not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const card = rowToCard(result);

    return new Response(JSON.stringify(card), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get card error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to get card',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

