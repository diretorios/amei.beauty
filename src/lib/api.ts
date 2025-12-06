/**
 * API client for Cloudflare Workers
 * Handles all backend communication
 */

import type { PublishedCard, CardData } from '../models/types';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8787/api';

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
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'Unknown error',
      message: response.statusText,
    }));
    throw new ApiError(error.message || 'API request failed', response.status, error);
  }

  return response;
}

export const api = {
  /**
   * Publish a card
   */
  async publish(card: CardData, username?: string): Promise<PublishedCard> {
    const publishedCard: Partial<PublishedCard> = {
      ...card,
      username,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
      is_featured: false,
      subscription_tier: 'free',
    };

    const response = await fetchApi('/publish', {
      method: 'POST',
      body: JSON.stringify(publishedCard),
    });

    return response.json();
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
    });

    return response.json();
  },

  /**
   * Unpublish a card
   */
  async unpublish(id: string): Promise<void> {
    await fetchApi(`/card/${id}`, {
      method: 'DELETE',
    });
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
   */
  async uploadImage(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_BASE_URL}/upload`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
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
   * AI Profile Completion
   */
  async completeProfile(data: {
    name: string;
    profession: string;
    whatsapp?: string;
  }): Promise<{
    profile: Partial<import('../models/types').Profile>;
    services: import('../models/types').Service[];
    social: import('../models/types').SocialLink[];
    location?: {
      city?: string;
      neighborhood?: string;
      state?: string;
    };
    bio?: string;
    headline?: string;
  }> {
    const response = await fetchApi('/ai/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    });

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
};

export { ApiError };

