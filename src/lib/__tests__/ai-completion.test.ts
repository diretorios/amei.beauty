import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../api';

// Mock fetch
global.fetch = vi.fn();

describe('AI Completion API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete profile successfully', async () => {
    const mockResponse = {
      profile: {
        headline: 'Especialista em cortes modernos',
        bio: 'Profissional com experiência...',
      },
      services: [
        { id: '1', name: 'Corte', price: 'R$ 50,00', description: 'Corte moderno' },
      ],
      social: [],
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await api.completeProfile({
      name: 'Test Professional',
      profession: 'Cabeleireira',
      whatsapp: '+5511999999999',
    });

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/ai/complete'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Test Professional'),
      })
    );
  });

  it('should handle errors gracefully', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'AI service unavailable', message: 'Service error' }),
    });

    await expect(
      api.completeProfile({
        name: 'Test',
        profession: 'Test',
      })
    ).rejects.toThrow();
  });
});

