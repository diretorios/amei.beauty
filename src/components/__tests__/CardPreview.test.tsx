import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { CardPreview } from '../CardPreview';
import type { PublishedCard } from '../../models/types';

const mockCard: PublishedCard = {
  id: '123',
  username: 'test-user',
  referral_code: 'ABC123',
  profile: {
    full_name: 'Test Professional',
    profession: 'Cabeleireira',
    whatsapp: '+5511999999999',
    headline: 'Especialista em cortes modernos',
    bio: 'Profissional com 10 anos de experiência',
    photo: 'data:image/jpeg;base64,...',
    website: '',
  },
  services: [
    { id: '1', name: 'Corte', price: 'R$ 50', description: 'Corte moderno' },
  ],
  social: [],
  links: [],
  ratings: [],
  testimonials: [],
  client_photos: [],
  badges: [{ type: 'verified', label: 'Verificado' }],
  certifications: [],
  recommendations: { count: 0, recent: [] },
  published_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_active: true,
  is_featured: false,
  subscription_tier: 'free',
  settings: {
    theme: 'system',
    accent_color: '#10B981',
    reduce_motion: false,
    language: 'pt-BR',
  },
  created_at: new Date().toISOString(),
};

describe('CardPreview', () => {
  it('should render card information', () => {
    render(<CardPreview card={mockCard} />);
    expect(screen.getByText('Test Professional')).toBeInTheDocument();
    expect(screen.getByText('Cabeleireira')).toBeInTheDocument();
  });

  it('should render WhatsApp button', () => {
    render(<CardPreview card={mockCard} />);
    const whatsappButton = screen.getByText(/WhatsApp/i);
    expect(whatsappButton).toBeInTheDocument();
  });

  it('should render featured badge when featured', () => {
    const featuredCard = { ...mockCard, is_featured: true };
    render(<CardPreview card={featuredCard} />);
    // Featured badge should be present (checking for the badge element or translation key)
    const featuredBadge = screen.getByText((content, element) => {
      return element?.classList.contains('featured-badge') || content.includes('directory.featured');
    });
    expect(featuredBadge).toBeInTheDocument();
  });

  it('should render services', () => {
    render(<CardPreview card={mockCard} />);
    expect(screen.getByText('Corte')).toBeInTheDocument();
  });
});

