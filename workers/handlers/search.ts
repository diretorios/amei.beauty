/**
 * Handle card search
 * GET /api/search?q=query&category=hair&location=sao-paulo
 */

import type { Env } from '../types';
import { rowToCard } from '../utils';

export async function handleSearch(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const category = url.searchParams.get('category') || '';
    const location = url.searchParams.get('location') || '';
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    let sql = 'SELECT * FROM cards WHERE is_active = 1';
    const bindings: unknown[] = [];

    // Full-text search
    if (query) {
      sql += ` AND id IN (
        SELECT id FROM cards_fts WHERE cards_fts MATCH ?
      )`;
      bindings.push(query);
    }

    // Category filter (search in services_json)
    if (category) {
      sql += ` AND services_json LIKE ?`;
      bindings.push(`%${category}%`);
    }

    // Location filter
    if (location) {
      sql += ` AND location_json LIKE ?`;
      bindings.push(`%${location}%`);
    }

    sql += ' ORDER BY published_at DESC LIMIT ? OFFSET ?';
    bindings.push(limit, offset);

    const result = await env.DB.prepare(sql).bind(...bindings).all<import('../types').CardRow>();

    const cards = result.results.map(rowToCard);

    // Get total count for pagination
    let countSql = 'SELECT COUNT(*) as total FROM cards WHERE is_active = 1';
    const countBindings: unknown[] = [];

    if (query) {
      countSql += ` AND id IN (
        SELECT id FROM cards_fts WHERE cards_fts MATCH ?
      )`;
      countBindings.push(query);
    }

    if (category) {
      countSql += ` AND services_json LIKE ?`;
      countBindings.push(`%${category}%`);
    }

    if (location) {
      countSql += ` AND location_json LIKE ?`;
      countBindings.push(`%${location}%`);
    }

    const countResult = await env.DB.prepare(countSql)
      .bind(...countBindings)
      .first<{ total: number }>();

    return new Response(
      JSON.stringify({
        cards,
        total: countResult?.total || 0,
        limit,
        offset,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to search cards',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

