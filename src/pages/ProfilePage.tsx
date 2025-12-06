import { useEffect, useState } from 'preact/hooks';
import { useTranslation } from '../hooks/useTranslation';
import { LanguageSelector } from '../components/LanguageSelector';
import { PublishButton } from '../components/PublishButton';
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
      <header className="profile-header">
        <h1>{t('profile.title')}</h1>
        <LanguageSelector />
      </header>
      <main className="profile-content">
        <div className="profile-section">
          <h2>{card.profile.full_name}</h2>
          <p>{card.profile.profession}</p>
          {card.profile.headline && <p className="headline">{card.profile.headline}</p>}
          {card.profile.bio && <p className="bio">{card.profile.bio}</p>}
        </div>

        <div className="profile-actions">
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

