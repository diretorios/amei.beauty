import { useEffect, useState } from 'preact/hooks';
import { useTranslation } from '../hooks/useTranslation';
import { api, ApiError } from '../lib/api';
import { CardDisplay } from '../components/CardDisplay';
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
        <div className="loading" role="status" aria-live="polite" aria-label={t('loading')}>
          {t('loading')}
        </div>
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

  return (
    <main id="main-content" className="public-card-page" role="main">
      <CardDisplay card={card} showWhatsAppButton={true} isPreview={false} />
    </main>
  );
}

