/**
 * API client for Cloudflare Workers
 * Handles all backend communication
 */

import type { PublishedCard, CardData } from '../models/types';
import { getAuthHeader, storeOwnerToken } from './auth';

// Get API URL from environment variable and trim whitespace
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:8787/api'
).trim();

// Diagnostic logging for production debugging
if (import.meta.env.PROD) {
  console.log('[API Config] Production mode detected');
  const rawApiUrl = import.meta.env.VITE_API_URL || '(not set)';
  console.log('[API Config] VITE_API_URL:', rawApiUrl);
  console.log('[API Config] Using API_BASE_URL:', API_BASE_URL);
  
  // Warn if URL has leading/trailing whitespace (indicates misconfigured secret)
  if (typeof rawApiUrl === 'string' && rawApiUrl !== rawApiUrl.trim()) {
    console.error('[API Config] ⚠️ WARNING: VITE_API_URL has leading/trailing whitespace!');
    console.error('[API Config] This may cause API calls to fail. Please update the GitHub Actions secret.');
  }
  
  // Warn if using localhost in production
  if (API_BASE_URL.includes('localhost')) {
    console.error('[API Config] ⚠️ WARNING: Using localhost URL in production!');
    console.error('[API Config] VITE_API_URL must be set during build time in GitHub Actions secrets.');
  }
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi(
  endpoint: string,
  options: RequestInit = {},
  cardId?: string
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Build headers object
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Merge existing headers if provided
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }
  
  // Add Authorization header if cardId is provided
  if (cardId) {
    const authHeader = getAuthHeader(cardId);
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
  }
  
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    // Network error (CORS, connection refused, etc.)
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Network error. Please check your connection.';
    
    // Enhanced error diagnostics for production
    let diagnosticMessage = 'Unable to connect to server.';
    
    if (import.meta.env.PROD) {
      // Log diagnostic information in production
      console.error('[API Error] Network error details:', {
        url,
        endpoint,
        apiBaseUrl: API_BASE_URL,
        errorMessage,
        isLocalhost: API_BASE_URL.includes('localhost'),
      });
      
      // Provide more specific error messages based on the issue
      if (API_BASE_URL.includes('localhost')) {
        diagnosticMessage = 'API URL not configured. The application is trying to connect to localhost. Please contact support.';
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        // Could be CORS, connection refused, or DNS error
        diagnosticMessage = `Unable to connect to API server at ${API_BASE_URL}. This could be a CORS issue, network problem, or the server may be down.`;
      } else {
        diagnosticMessage = `Network error: ${errorMessage}`;
      }
    } else {
      // Development error message
      diagnosticMessage = errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')
        ? 'Unable to connect to server. Please check your internet connection and try again.'
        : errorMessage;
    }
    
    throw new ApiError(
      diagnosticMessage,
      0, // Status 0 indicates network error
      { originalError: error, url, apiBaseUrl: API_BASE_URL }
    );
  }

  if (!response.ok) {
    let error: any;
    let errorText: string | null = null;
    
    // Try to parse JSON error response
    try {
      error = await response.json();
    } catch (jsonError) {
      // If JSON parsing fails, try to get text
      try {
        errorText = await response.text();
        error = {
          error: 'Unknown error',
          message: errorText || response.statusText,
        };
      } catch (textError) {
        // If both fail, use status text
        error = {
          error: 'Unknown error',
          message: response.statusText,
        };
      }
    }
    
    // Extract error message from various possible formats
    let errorMessage = 'API request failed';
    
    // Check for validation errors with details array (most common)
    if (error?.details && Array.isArray(error.details) && error.details.length > 0) {
      // Format validation errors nicely
      if (error.details.length === 1) {
        errorMessage = error.details[0];
      } else {
        errorMessage = `Validation errors: ${error.details.join('; ')}`;
      }
    } else if (error?.message) {
      // Standard error with message field
      errorMessage = error.message;
    } else if (error?.error) {
      // Error with error field
      if (typeof error.error === 'object' && error.error?.message) {
        errorMessage = error.error.message;
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      }
    } else if (error?.details) {
      // Non-array details field
      errorMessage = String(error.details);
    } else if (errorText) {
      errorMessage = errorText;
    } else if (response.statusText) {
      errorMessage = `${response.statusText} (${response.status})`;
    }
    
    // Enhanced error diagnostics
    console.error('[API Error] Request failed:', {
      url,
      endpoint,
      status: response.status,
      statusText: response.statusText,
      errorMessage,
      errorDetails: error,
      apiBaseUrl: API_BASE_URL,
    });
    
    // Enhanced error diagnostics for production
    if (import.meta.env.PROD && response.status >= 500) {
      console.error('[API Error] Server error details:', {
        url,
        endpoint,
        status: response.status,
        statusText: response.statusText,
        apiBaseUrl: API_BASE_URL,
        errorMessage,
      });
    }
    
    // Check for CORS errors (status 0 or specific CORS-related status codes)
    if (response.status === 0 || (response.status >= 400 && response.headers.get('Access-Control-Allow-Origin') === null)) {
      console.error('[API Error] Possible CORS issue:', {
        url,
        endpoint,
        status: response.status,
        corsHeader: response.headers.get('Access-Control-Allow-Origin'),
        apiBaseUrl: API_BASE_URL,
      });
    }
    
    throw new ApiError(errorMessage, response.status, error);
  }

  return response;
}

export const api = {
  /**
   * Publish a card
   */
  async publish(card: CardData | PublishedCard, username?: string): Promise<PublishedCard> {
    const publishedCard: Partial<PublishedCard> = {
      ...card,
      username,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
      is_featured: false,
      subscription_tier: 'free',
    };

    // Log publish attempt for debugging
    console.log('[Publish] Attempting to publish card:', {
      hasId: 'id' in card,
      cardId: 'id' in card ? card.id : undefined,
      username,
      hasProfile: !!publishedCard.profile,
      profileName: publishedCard.profile?.full_name,
      apiUrl: API_BASE_URL,
    });

    // Pass card ID for auth only if card already has an ID (republishing existing card)
    const cardId = 'id' in card ? card.id : undefined;
    
    try {
      const response = await fetchApi('/publish', {
        method: 'POST',
        body: JSON.stringify(publishedCard),
      }, cardId); // Only pass if card has ID (for republishing)

      const publishedCardData = await response.json();
      
      console.log('[Publish] Success:', {
        cardId: publishedCardData.id,
        hasToken: !!publishedCardData.owner_token,
      });
      
      // Store token if returned in response (for new cards or legacy cards being upgraded)
      if (publishedCardData.owner_token) {
        storeOwnerToken(publishedCardData.id, publishedCardData.owner_token);
      }
      
      return publishedCardData;
    } catch (error) {
      console.error('[Publish] Failed to publish card:', {
        error,
        cardId,
        username,
        apiUrl: API_BASE_URL,
      });
      throw error;
    }
  },

  /**
   * Get a published card by ID or username
   */
  async getCard(id: string): Promise<PublishedCard> {
    const response = await fetchApi(`/card/${id}`);
    return response.json();
  },

  /**
   * Update a published card
   */
  async updateCard(id: string, updates: Partial<PublishedCard>): Promise<PublishedCard> {
    const response = await fetchApi(`/card/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }, id); // Pass card ID for auth

    return response.json();
  },

  /**
   * Unpublish a card
   */
  async unpublish(id: string): Promise<void> {
    await fetchApi(`/card/${id}`, {
      method: 'DELETE',
    }, id); // Pass card ID for auth
  },

  /**
   * Search cards
   */
  async search(params: {
    q?: string;
    category?: string;
    location?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    cards: PublishedCard[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.category) searchParams.set('category', params.category);
    if (params.location) searchParams.set('location', params.location);
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.offset) searchParams.set('offset', params.offset.toString());

    const response = await fetchApi(`/search?${searchParams.toString()}`);
    return response.json();
  },

  /**
   * Get directory listing
   */
  async getDirectory(params: {
    page?: number;
    limit?: number;
    featured?: boolean;
  }): Promise<{
    cards: PublishedCard[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.featured) searchParams.set('featured', 'true');

    const response = await fetchApi(`/directory?${searchParams.toString()}`);
    return response.json();
  },

  /**
   * Upload image to R2
   * @param file - The image file to upload
   * @param cardId - Optional card ID for authenticated uploads (requires owner token)
   */
  async uploadImage(file: File, cardId?: string): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);

    // Build URL with optional cardId query parameter
    let url = `${API_BASE_URL}/upload`;
    if (cardId) {
      url += `?cardId=${encodeURIComponent(cardId)}`;
    }

    // Build headers
    const headers: Record<string, string> = {};
    
    // Add Authorization header if cardId is provided
    if (cardId) {
      const authHeader = getAuthHeader(cardId);
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Unknown error',
        message: response.statusText,
      }));
      throw new ApiError(error.message || 'Upload failed', response.status, error);
    }

    return response.json();
  },

  /**
   * Health check
   */
  async health(): Promise<{ status: string; timestamp: number }> {
    const response = await fetchApi('/health');
    return response.json();
  },

  /**
   * Detect user location (country code)
   * Uses Cloudflare CF-IPCountry header
   */
  async detectLocation(): Promise<{ country: string | null }> {
    const response = await fetchApi('/detect-location');
    return response.json();
  },

  /**
   * Create Stripe Checkout Session (Buy Now button)
   * Returns checkout URL to redirect user to Stripe payment page
   */
  async createCheckoutSession(cardId: string, options?: {
    success_url?: string;
    cancel_url?: string;
  }): Promise<{
    checkout_url: string;
    session_id: string;
    card_id: string;
    amount: number;
    currency: string;
  }> {
    const response = await fetchApi('/payment/checkout', {
      method: 'POST',
      body: JSON.stringify({
        card_id: cardId,
        ...options,
      }),
    });
    return response.json();
  },

  /**
   * Endorse a card (create endorsement/recommendation)
   */
  async endorse(cardId: string, data?: {
    recommender_name?: string;
    recommender_whatsapp?: string;
    share_method?: 'whatsapp' | 'instagram' | 'facebook' | 'link';
  }): Promise<{
    success: boolean;
    card: PublishedCard;
    endorsement_count: number;
    updates_unlocked: boolean;
    updates_months: number;
    featured: boolean;
  }> {
    const response = await fetchApi('/endorse', {
      method: 'POST',
      body: JSON.stringify({
        card_id: cardId,
        ...data,
      }),
    });
    return response.json();
  },
};

export { ApiError };

