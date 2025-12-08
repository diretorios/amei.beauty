import { useEffect, useState } from 'preact/hooks';
import { useTranslation } from '../hooks/useTranslation';
import { OnboardingPage } from './OnboardingPage';
import { UpdateLockStatus } from '../components/UpdateLockStatus';
import { storage } from '../lib/storage';
import { api } from '../lib/api';
import type { CardData } from '../models/types';
import type { PublishedCard } from '../models/types';

export function EditPage() {
  const { t } = useTranslation();
  const [card, setCard] = useState<CardData | null>(null);
  const [publishedCard, setPublishedCard] = useState<PublishedCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCard();
    checkPublishedCard();
  }, []);

  const loadCard = async () => {
    try {
      const loadedCard = await storage.loadCard();
      setCard(loadedCard);
    } catch (error) {
      console.error('Failed to load card:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPublishedCard = async () => {
    try {
      const publishedCardId = await storage.getPreference('published_card_id');
      if (publishedCardId) {
        const card = await api.getCard(publishedCardId);
        setPublishedCard(card);
      }
    } catch (error) {
      console.error('Failed to load published card:', error);
    }
  };

  const handleComplete = async () => {
    // Refresh published card status after editing
    await checkPublishedCard();
    // Navigate back to profile page after editing
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="onboarding-page">
        <div className="loading">{t('loading')}</div>
      </div>
    );
  }

  // Check if updates are locked
  const canUpdate = publishedCard?.can_update !== false;
  if (publishedCard && !canUpdate) {
    // Show lock status instead of edit form
    return (
      <div className="edit-page">
        <div className="update-lock-container">
          <h2>{t('profile.edit')}</h2>
          <UpdateLockStatus
            card={publishedCard}
            onEndorsementRequest={() => {
              const cardUrl = publishedCard.username 
                ? `${window.location.origin}/@${publishedCard.username}`
                : `${window.location.origin}/card/${publishedCard.id}`;
              const message = `Apoie meu perfil! ${cardUrl}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
            }}
          />
          <button
            className="btn btn-outline"
            onClick={() => window.location.href = '/'}
            style={{ marginTop: '1rem', width: '100%' }}
          >
            {t('buttons.back') || 'Back'}
          </button>
        </div>
      </div>
    );
  }

  return <OnboardingPage onComplete={handleComplete} initialCard={card} />;
}

