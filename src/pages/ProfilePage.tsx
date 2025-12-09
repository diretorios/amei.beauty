import { useEffect, useState } from 'preact/hooks';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from '../components/Button';
import { PublishButton } from '../components/PublishButton';
import { CardDisplay } from '../components/CardDisplay';
import { UpdateLockStatus } from '../components/UpdateLockStatus';
import { storage } from '../lib/storage';
import { api } from '../lib/api';
import { useScreenReaderAnnouncement } from '../components/ScreenReaderAnnouncer';
import type { CardData } from '../models/types';
import type { PublishedCard } from '../models/types';

export function ProfilePage() {
  const { t } = useTranslation();
  const [card, setCard] = useState<CardData | null>(null);
  const [publishedCard, setPublishedCard] = useState<PublishedCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { announce, Announcer } = useScreenReaderAnnouncement();

  useEffect(() => {
    loadCard();
    checkPublishedCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCard = async () => {
    try {
      const loadedCard = await storage.loadCard();
      setCard(loadedCard);
      if (loadedCard) {
        announce(t('a11y.content_loaded'), 'polite');
      }
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

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="loading" role="status" aria-live="polite" aria-label={t('loading')}>
          {t('loading')}
        </div>
        <Announcer />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="profile-page">
        <p>No card found. Please complete onboarding first.</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Announcer />
      <main className="profile-content">
        <div className="profile-preview-section">
          <h2 className="preview-section-title">{t('profile.preview')}</h2>
          <div className="profile-preview-container">
            <CardDisplay card={card} showWhatsAppButton={false} isPreview={true} />
          </div>
        </div>

        {/* Update Lock Status - Show if card is published */}
        {publishedCard && (
          <UpdateLockStatus
            card={publishedCard}
            onEndorsementRequest={() => {
              // TODO: Open endorsement request modal/share dialog
              const cardUrl = publishedCard.username 
                ? `${window.location.origin}/@${publishedCard.username}`
                : `${window.location.origin}/card/${publishedCard.id}`;
              const message = `Apoie meu perfil! ${cardUrl}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
            }}
          />
        )}

        <div className="profile-actions">
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = '/edit';
            }}
            disabled={publishedCard ? (publishedCard.can_update === false) : undefined}
          >
            {publishedCard && !publishedCard.can_update ? '🔒 ' : ''}
            {t('profile.edit')}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = '/add-social-networks';
            }}
            disabled={publishedCard ? (publishedCard.can_update === false) : undefined}
          >
            {t('buttons.add_social_networks')}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = '/add-personalized-links';
            }}
            disabled={true}
          >
            {t('buttons.add_personalized_links')}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = '/add-services-and-prices';
            }}
            disabled={true}
          >
            {t('buttons.add_services_and_prices')}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = '/add-portfolio';
            }}
            disabled={true}
          >
            {t('buttons.add_portfolio')}
          </Button>
          <PublishButton
            card={card}
            onPublished={async (publishedCard) => {
              console.log('Card published:', publishedCard);
              setPublishedCard(publishedCard);
              await checkPublishedCard(); // Refresh published card status
              announce(t('a11y.publish_success'), 'assertive');
            }}
            onError={(error) => {
              console.error('Publish error:', error);
              announce(t('a11y.publish_error') + ': ' + error.message, 'assertive');
            }}
          />
        </div>
      </main>
    </div>
  );
}

