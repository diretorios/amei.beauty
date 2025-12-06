/**
 * Handle directory listing
 * GET /api/directory?page=1&limit=20&featured=true
 */

import type { Env } from '../types';
import { rowToCard } from '../utils';

export async function handleDirectory(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const featured = url.searchParams.get('featured') === 'true';
    const offset = (page - 1) * limit;

    let sql = 'SELECT * FROM cards WHERE is_active = 1';
    const bindings: unknown[] = [];

    if (featured) {
      sql += ' AND is_featured = 1';
    }

    sql += ' ORDER BY published_at DESC LIMIT ? OFFSET ?';
    bindings.push(limit, offset);

    const result = await env.DB.prepare(sql).bind(...bindings).all<import('../types').CardRow>();

    const cards = result.results.map(rowToCard);

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM cards WHERE is_active = 1';
    if (featured) {
      countSql += ' AND is_featured = 1';
    }

    const countResult = await env.DB.prepare(countSql).first<{ total: number }>();

    return new Response(
      JSON.stringify({
        cards,
        total: countResult?.total || 0,
        page,
        limit,
        totalPages: Math.ceil((countResult?.total || 0) / limit),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Directory error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to get directory',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

