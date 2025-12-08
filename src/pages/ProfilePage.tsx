import { useEffect, useState } from 'preact/hooks';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from '../components/Button';
import { PublishButton } from '../components/PublishButton';
import { CardDisplay } from '../components/CardDisplay';
import { UpdateLockStatus } from '../components/UpdateLockStatus';
import { storage } from '../lib/storage';
import { api } from '../lib/api';
import type { CardData } from '../models/types';
import type { PublishedCard } from '../models/types';

export function ProfilePage() {
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

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="loading">{t('loading')}</div>
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
          <PublishButton
            card={card}
            onPublished={async (publishedCard) => {
              console.log('Card published:', publishedCard);
              setPublishedCard(publishedCard);
              await checkPublishedCard(); // Refresh published card status
              alert(t('buttons.publish') + ' ' + t('success'));
            }}
            onError={(error) => {
              console.error('Publish error:', error);
              alert(t('errors.save_failed') + ': ' + error.message);
            }}
          />
        </div>
      </main>
    </div>
  );
}

