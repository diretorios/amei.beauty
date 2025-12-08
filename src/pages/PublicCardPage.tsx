import { useEffect, useState } from 'preact/hooks';
import { useTranslation } from '../hooks/useTranslation';
import { api, ApiError } from '../lib/api';
import { CardDisplay } from '../components/CardDisplay';
import { useScreenReaderAnnouncement } from '../components/ScreenReaderAnnouncer';
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
  const { announce, Announcer } = useScreenReaderAnnouncement();

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
        announce(t('a11y.content_loaded'), 'polite');
      } catch (err) {
        const apiError = err instanceof ApiError ? err : new Error('Failed to load card');
        setError(apiError.message);
        announce(apiError.message, 'assertive');
      } finally {
        setIsLoading(false);
      }
    };

    if (identifier) {
      loadCard();
    }
  }, [identifier, announce, t]);

  if (isLoading) {
    return (
      <div className="public-card-page">
        <div className="loading" role="status" aria-live="polite" aria-label={t('loading')}>
          {t('loading')}
        </div>
        <Announcer />
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="public-card-page">
        <Announcer />
        <div className="error" role="alert">
          <h1>{t('error')}</h1>
          <p>{error || t('errors.load_failed')}</p>
        </div>
      </div>
    );
  }

  return (
    <main id="main-content" className="public-card-page" role="main">
      <Announcer />
      <CardDisplay card={card} showWhatsAppButton={true} isPreview={false} />
    </main>
  );
}

