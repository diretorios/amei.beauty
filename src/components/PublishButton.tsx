import { useState } from 'preact/hooks';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from './Button';
import { api, ApiError } from '../lib/api';
import { storage } from '../lib/storage';
import type { CardData } from '../models/types';

interface PublishButtonProps {
  card: CardData;
  onPublished?: (publishedCard: import('../models/types').PublishedCard) => void;
  onError?: (error: Error) => void;
}

export function PublishButton({ card, onPublished, onError }: PublishButtonProps) {
  const { t } = useTranslation();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);

    try {
      // TODO: Add username input modal
      const username = prompt(t('profile.fields.username') || 'Username (optional):');
      
      const publishedCard = await api.publish(card, username || undefined);
      
      // Save published card ID to local storage
      await storage.setPreference('published_card_id', publishedCard.id);
      
      setIsPublished(true);
      onPublished?.(publishedCard);
    } catch (error) {
      console.error('Publish error:', error);
      const apiError = error instanceof ApiError 
        ? error 
        : new Error(error instanceof Error ? error.message : 'Failed to publish');
      onError?.(apiError);
    } finally {
      setIsPublishing(false);
    }
  };

  if (isPublished) {
    return (
      <div className="publish-success">
        <p>{t('buttons.publish')} ✓</p>
      </div>
    );
  }

  return (
    <Button
      variant="primary"
      onClick={handlePublish}
      isLoading={isPublishing}
      disabled={isPublishing}
    >
      {t('buttons.publish')}
    </Button>
  );
}

