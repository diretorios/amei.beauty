import { useEffect, useState } from 'preact/hooks';
import { useTranslation } from '../hooks/useTranslation';
import { OnboardingPage } from './OnboardingPage';
import { storage } from '../lib/storage';
import type { CardData } from '../models/types';

export function EditPage() {
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

  const handleComplete = () => {
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

  return <OnboardingPage onComplete={handleComplete} initialCard={card} />;
}

