import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, ApiError } from '../api';

// Mock fetch
global.fetch = vi.fn();

describe('api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('publish', () => {
    it('should publish a card successfully', async () => {
      const mockCard = {
        id: '123',
        profile: { full_name: 'Test', profession: 'Test', whatsapp: '123', headline: '', bio: '', photo: null },
        services: [],
        social: [],
        links: [],
        ratings: [],
        testimonials: [],
        client_photos: [],
        badges: [],
        certifications: [],
        recommendations: { count: 0, recent: [] },
        settings: { theme: 'system' as const, accent_color: '#10B981', reduce_motion: false, language: 'pt-BR' as const },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockResponse = { ...mockCard, published_at: new Date().toISOString() };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await api.publish(mockCard);
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/publish'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should throw ApiError on failure', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Validation failed', message: 'Invalid data' }),
      });

      const mockCard = {
        profile: { full_name: '', profession: '', whatsapp: '', headline: '', bio: '', photo: null },
        services: [],
        social: [],
        links: [],
        ratings: [],
        testimonials: [],
        client_photos: [],
        badges: [],
        certifications: [],
        recommendations: { count: 0, recent: [] },
        settings: { theme: 'system' as const, accent_color: '#10B981', reduce_motion: false, language: 'pt-BR' as const },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await expect(api.publish(mockCard)).rejects.toThrow(ApiError);
    });
  });

  describe('getCard', () => {
    it('should get a card by ID', async () => {
      const mockCard = { id: '123', profile: { full_name: 'Test' } };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCard,
      });

      const result = await api.getCard('123');
      expect(result).toEqual(mockCard);
      expect(global.fetch).toHaveBeenCalled();
      const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(callArgs[0]).toContain('/api/card/123');
    });
  });

  describe('search', () => {
    it('should search cards with query', async () => {
      const mockResults = {
        cards: [],
        total: 0,
        limit: 20,
        offset: 0,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults,
      });

      const result = await api.search({ q: 'test' });
      expect(result).toEqual(mockResults);
      expect(global.fetch).toHaveBeenCalled();
      const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(callArgs[0]).toContain('q=test');
    });
  });
});

