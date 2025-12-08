import { useEffect, useState } from 'preact/hooks';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from '../components/Button';
import { PublishButton } from '../components/PublishButton';
import { CardDisplay } from '../components/CardDisplay';
import { storage } from '../lib/storage';
import type { CardData } from '../models/types';

export function ProfilePage() {
  const { t } = useTranslation();
  const [card, setCard] = useState<CardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCard();
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

        <div className="profile-actions">
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = '/edit';
            }}
          >
            {t('profile.edit')}
          </Button>
          <PublishButton
            card={card}
            onPublished={(publishedCard) => {
              console.log('Card published:', publishedCard);
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

