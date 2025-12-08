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
  const [error, setError] = useState<string | null>(null);

  const handleCancel = () => {
    setShowModal(false);
    setUsername('');
    setError(null);
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
    setError(null);

    try {
      // Check API URL configuration in production
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api';
      if (import.meta.env.PROD && API_BASE_URL.includes('localhost')) {
        throw new Error('API URL not configured. Please contact support.');
      }

      const publishedCard = await api.publish(card, username.trim() || undefined);
      
      // Save published card ID to local storage
      await storage.setPreference('published_card_id', publishedCard.id);
      
      setIsPublished(true);
      setShowModal(false);
      setUsername('');
      setError(null);
      onPublished?.(publishedCard);
    } catch (error) {
      console.error('Publish error:', error);
      const apiError = error instanceof ApiError 
        ? error 
        : new Error(error instanceof Error ? error.message : 'Failed to publish');
      
      // Set visible error message
      let errorMessage = apiError.message;
      if (apiError instanceof ApiError) {
        if (apiError.status === 0 || apiError.status === 500) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (apiError.status === 401) {
          errorMessage = 'Authentication failed. Please try again.';
        } else if (apiError.status === 409) {
          errorMessage = 'Username already taken. Please choose a different username.';
        }
      }
      
      setError(errorMessage);
      onError?.(apiError);
    } finally {
      setIsPublishing(false);
    }
  };

  if (isPublished) {
    return (
      <div className="publish-success" role="status" aria-live="polite" aria-atomic="true">
        <p>{t('buttons.publish')} ✓</p>
      </div>
    );
  }

  return (
    <>
      {error && !showModal && (
        <div className="error-message" role="alert" style={{
          padding: '0.75rem',
          marginBottom: '1rem',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '0.375rem',
          color: '#991b1b',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}
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
            {error && (
              <div className="error-message" role="alert" style={{
                padding: '0.75rem',
                marginBottom: '1rem',
                backgroundColor: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '0.375rem',
                color: '#991b1b',
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}
            <Input
              id="publish-username"
              type="text"
              value={username}
              onInput={(e) => {
                setUsername((e.target as HTMLInputElement).value);
                setError(null); // Clear error when user types
              }}
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

