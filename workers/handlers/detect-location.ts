/**
 * Handle location detection
 * GET /api/detect-location
 * Returns country code from Cloudflare CF-IPCountry header
 */

import type { Env } from '../types';

export async function handleDetectLocation(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Cloudflare automatically adds CF-IPCountry header to all requests
    // This header contains the ISO 3166-1 alpha-2 country code (e.g., 'BR', 'US', 'MX')
    const countryCode = request.headers.get('CF-IPCountry') || null;

    // Also get other useful headers for debugging/logging
    const cfRay = request.headers.get('CF-Ray');
    const ipAddress = request.headers.get('CF-Connecting-IP');

    const response: { country: string | null; debug?: { cfRay: string | null; ipAddress: string | null } } = {
      country: countryCode,
    };

    // Include additional info for debugging in development
    if (env.ENVIRONMENT === 'development') {
      response.debug = {
        cfRay,
        ipAddress,
      };
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Location detection error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to detect location',
        message: error instanceof Error ? error.message : 'Unknown error',
        country: null,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

