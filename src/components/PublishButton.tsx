import { useState, useEffect } from 'preact/hooks';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from './Button';
import { Input } from './Input';
import { api, ApiError } from '../lib/api';
import { storage } from '../lib/storage';
import type { CardData } from '../models/types';

interface PublishButtonProps {
  card: CardData;
  onPublished?: (publishedCard: import('../models/types').PublishedCard) => void;
  onError?: (error: Error) => void;
}

// Generate default username from full name
function generateDefaultUsername(fullName: string): string {
  if (!fullName) return '';
  
  // Convert to lowercase and replace spaces with hyphens
  const base = fullName.toLowerCase().trim().replace(/\s+/g, '-');
  
  // Generate 3 random alphanumeric characters
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const randomChars = Array.from({ length: 3 }, () => 
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  
  return `${base}-${randomChars}`;
}

export function PublishButton({ card, onPublished, onError }: PublishButtonProps) {
  const { t } = useTranslation();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState('');

  const handleCancel = () => {
    setShowModal(false);
    setUsername('');
  };

  // Handle Escape key to close modal and focus management
  useEffect(() => {
    if (!showModal) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        setUsername('');
      }
    };

    // Focus input when modal opens
    const input = document.getElementById('publish-username') as HTMLInputElement;
    if (input) {
      setTimeout(() => input.focus(), 0);
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showModal]);

  const handlePublishClick = () => {
    // Generate default username when opening the modal
    const defaultUsername = generateDefaultUsername(card.profile.full_name);
    setUsername(defaultUsername);
    setShowModal(true);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setShowModal(false);

    try {
      const publishedCard = await api.publish(card, username.trim() || undefined);
      
      // Save published card ID to local storage
      await storage.setPreference('published_card_id', publishedCard.id);
      
      setIsPublished(true);
      setUsername('');
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
    <>
      <Button
        variant="primary"
        onClick={handlePublishClick}
        isLoading={isPublishing}
        disabled={isPublishing || showModal}
      >
        {t('buttons.publish')}
      </Button>

      {showModal && (
        <div 
          className="modal-overlay"
          onClick={handleCancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="publish-modal-title"
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="publish-modal-title">{t('buttons.publish')}</h2>
            <p className="modal-description">
              {t('profile.fields.username') || 'Username (optional)'}
            </p>
            <Input
              id="publish-username"
              type="text"
              value={username}
              onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
              placeholder={t('profile.fields.username') || 'Username (optional)'}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isPublishing) {
                  handlePublish();
                }
              }}
            />
            <div className="modal-actions">
              <Button
                variant="secondary"
                onClick={handleCancel}
                disabled={isPublishing}
              >
                {t('buttons.cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={handlePublish}
                isLoading={isPublishing}
                disabled={isPublishing}
              >
                {t('buttons.publish')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

