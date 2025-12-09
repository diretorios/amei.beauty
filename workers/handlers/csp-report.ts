/**
 * Handle CSP violation reports
 * POST /api/csp-report
 * Receives Content Security Policy violation reports from browsers
 */

import type { Env } from '../types';

interface CSPReport {
  'csp-report': {
    'document-uri': string;
    'referrer': string;
    'violated-directive': string;
    'effective-directive': string;
    'original-policy': string;
    'disposition': string;
    'blocked-uri': string;
    'line-number'?: number;
    'column-number'?: number;
    'source-file'?: string;
    'status-code': number;
    'script-sample'?: string;
  };
}

export async function handleCspReport(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the CSP violation report
    const contentType = request.headers.get('Content-Type') || '';
    if (!contentType.includes('application/csp-report') && !contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: 'Invalid content type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const reportData: CSPReport = await request.json();
    
    // Extract violation details
    const violation = reportData['csp-report'];
    
    // Log the violation (only in development or if logging is enabled)
    if (env.ENVIRONMENT === 'development' || env.LOG_CSP_VIOLATIONS === 'true') {
      console.log('CSP Violation Report:', {
        documentUri: violation['document-uri'],
        violatedDirective: violation['violated-directive'],
        blockedUri: violation['blocked-uri'],
        sourceFile: violation['source-file'],
        lineNumber: violation['line-number'],
        columnNumber: violation['column-number'],
        timestamp: new Date().toISOString(),
      });
    }

    // In production, you could:
    // - Store violations in D1 database for analysis
    // - Send to external monitoring service (Sentry, etc.)
    // - Aggregate and alert on repeated violations
    
    // For now, we just acknowledge receipt
    // 204 No Content - standard for CSP report endpoints (no body)
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  } catch (error) {
    // Silently handle errors - we don't want CSP report failures to affect the site
    console.error('CSP report handler error:', error);
    
    // Still return success to prevent browser from retrying
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
}

