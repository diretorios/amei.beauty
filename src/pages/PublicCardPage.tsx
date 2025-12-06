import { useEffect, useState } from 'preact/hooks';
import { useTranslation } from '../hooks/useTranslation';
import { api, ApiError } from '../lib/api';
import { openWhatsApp } from '../lib/whatsapp';
import type { PublishedCard } from '../models/types';

interface PublicCardPageProps {
  cardId?: string;
  username?: string;
}

export function PublicCardPage({ cardId, username }: PublicCardPageProps) {
  const { t } = useTranslation();
  const [card, setCard] = useState<PublishedCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use cardId or username from route params
  const identifier = cardId || username || '';

  useEffect(() => {
    const loadCard = async () => {
      if (!identifier) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const loadedCard = await api.getCard(identifier);
        setCard(loadedCard);
      } catch (err) {
        const apiError = err instanceof ApiError ? err : new Error('Failed to load card');
        setError(apiError.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (identifier) {
      loadCard();
    }
  }, [identifier]);

  if (isLoading) {
    return (
      <div className="public-card-page">
        <div className="loading">{t('loading')}</div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="public-card-page">
        <div className="error">
          <h1>{t('error')}</h1>
          <p>{error || t('errors.load_failed')}</p>
        </div>
      </div>
    );
  }

  const handleWhatsApp = () => {
    openWhatsApp(card.profile.whatsapp);
  };

  return (
    <div className="public-card-page">
      <div className="public-card">
        {card.profile.photo && (
          <div className="card-photo">
            <img src={card.profile.photo} alt={card.profile.full_name} />
          </div>
        )}

        <div className="card-header">
          <h1>{card.profile.full_name}</h1>
          <p className="profession">{card.profile.profession}</p>
          {card.profile.headline && <p className="headline">{card.profile.headline}</p>}
        </div>

        {card.profile.bio && (
          <div className="card-bio">
            <p>{card.profile.bio}</p>
          </div>
        )}

        {card.services.length > 0 && (
          <div className="card-services">
            <h2>{t('services.title')}</h2>
            <ul>
              {card.services.map((service) => (
                <li key={service.id}>
                  <strong>{service.name}</strong> - {service.price}
                  {service.description && <p>{service.description}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {card.social.length > 0 && (
          <div className="card-social">
            <h2>{t('navigation.social')}</h2>
            <ul>
              {card.social.map((social, index) => (
                <li key={index}>
                  <a href={social.url} target="_blank" rel="noopener noreferrer">
                    {social.platform}: {social.handle}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="card-actions">
          <button className="btn btn-primary whatsapp-button" onClick={handleWhatsApp}>
            📱 {t('buttons.share')} WhatsApp
          </button>
        </div>

        {card.badges.length > 0 && (
          <div className="card-badges">
            {card.badges.map((badge, index) => (
              <span key={index} className="badge">
                {badge.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

