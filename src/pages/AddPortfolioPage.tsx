import { useEffect, useState } from 'preact/hooks';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { UpdateLockStatus } from '../components/UpdateLockStatus';
import { storage } from '../lib/storage';
import { api } from '../lib/api';
import type { CardData, ClientPhoto } from '../models/types';
import type { PublishedCard } from '../models/types';

export function AddPortfolioPage() {
  const { t } = useTranslation();
  const [card, setCard] = useState<CardData | null>(null);
  const [publishedCard, setPublishedCard] = useState<PublishedCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [clientPhotos, setClientPhotos] = useState<ClientPhoto[]>([]);
  const [editingCaptionIndex, setEditingCaptionIndex] = useState<number | null>(null);
  const [captionValue, setCaptionValue] = useState('');

  const MAX_PHOTOS = 10;

  useEffect(() => {
    loadCard();
    checkPublishedCard();
  }, []);

  const loadCard = async () => {
    try {
      const loadedCard = await storage.loadCard();
      if (loadedCard) {
        setCard(loadedCard);
        const loadedPhotos = loadedCard.client_photos || [];
        setClientPhotos(loadedPhotos);
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

  const handlePhotoChange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (clientPhotos.length >= MAX_PHOTOS) {
      alert(t('portfolio.max_photos_reached') || `Maximum ${MAX_PHOTOS} photos allowed`);
      return;
    }

    setIsUploading(true);
    try {
      // Try to upload via API first (for published cards)
      let photoUrl: string;
      try {
        const uploadResult = await api.uploadImage(file);
        photoUrl = uploadResult.url;
      } catch (uploadError) {
        // Fallback to base64 if API upload fails (e.g., in development)
        console.warn('API upload failed, using base64:', uploadError);
        photoUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve(event.target?.result as string);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const newPhoto: ClientPhoto = {
        id: Date.now().toString(),
        url: photoUrl,
        caption: '',
        created_at: new Date().toISOString(),
      };

      setClientPhotos([...clientPhotos, newPhoto]);
    } catch (error) {
      console.error('Failed to process photo:', error);
      alert(t('errors.upload_failed') || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
      // Reset file input
      (e.target as HTMLInputElement).value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setClientPhotos(clientPhotos.filter((_, i) => i !== index));
    if (editingCaptionIndex === index) {
      setEditingCaptionIndex(null);
      setCaptionValue('');
    }
  };

  const handleEditCaption = (index: number) => {
    const photo = clientPhotos[index];
    setCaptionValue(photo.caption || '');
    setEditingCaptionIndex(index);
  };

  const handleSaveCaption = () => {
    if (editingCaptionIndex === null) return;

    const updatedPhotos = [...clientPhotos];
    updatedPhotos[editingCaptionIndex] = {
      ...updatedPhotos[editingCaptionIndex],
      caption: captionValue.trim(),
    };

    setClientPhotos(updatedPhotos);
    setEditingCaptionIndex(null);
    setCaptionValue('');
  };

  const handleCancelEditCaption = () => {
    setEditingCaptionIndex(null);
    setCaptionValue('');
  };

  const handleSave = async () => {
    if (!card) return;

    setIsSaving(true);
    try {
      const updatedCard: CardData = {
        ...card,
        client_photos: clientPhotos,
        updated_at: new Date().toISOString(),
      };
      await storage.saveCard(updatedCard);
      // Navigate back to profile page
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to save portfolio:', error);
      alert(t('errors.save_failed') || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="onboarding-page">
        <div className="loading">{t('loading')}</div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="onboarding-page">
        <p>No card found. Please complete onboarding first.</p>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          {t('buttons.back')}
        </Button>
      </div>
    );
  }

  // Check if updates are locked
  const canUpdate = publishedCard?.can_update !== false;
  if (publishedCard && !canUpdate) {
    // Show lock status instead of form
    return (
      <div className="onboarding-page">
        <div className="onboarding-container">
          <h1 className="onboarding-title">{t('portfolio.title')}</h1>
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
          <div className="onboarding-actions" style={{ marginTop: '1rem' }}>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              {t('buttons.back')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <h1 className="onboarding-title">{t('portfolio.title')}</h1>
        <p className="onboarding-subtitle">{t('portfolio.description')}</p>

        <div className="onboarding-step">
          {/* Photo upload area */}
          {clientPhotos.length < MAX_PHOTOS && (
            <div className="photo-upload" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="portfolio-photo" className="photo-upload-label">
                <input
                  id="portfolio-photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="sr-only"
                  disabled={isUploading}
                />
                <span className="photo-upload-button">
                  {isUploading ? t('portfolio.uploading') || 'Uploading...' : t('portfolio.upload_photo') || 'Upload Photo'}
                </span>
                <p className="photo-upload-help">
                  {t('portfolio.upload_help') || `Add up to ${MAX_PHOTOS} photos to showcase your work`}
                </p>
              </label>
            </div>
          )}

          {clientPhotos.length >= MAX_PHOTOS && (
            <div style={{ 
              padding: '1rem', 
              marginBottom: '1.5rem',
              backgroundColor: 'var(--bg-secondary, #f9fafb)',
              border: '1px solid var(--border-color, #e5e7eb)',
              borderRadius: '0.5rem',
              textAlign: 'center',
              color: 'var(--text-secondary, #6b7280)'
            }}>
              {t('portfolio.max_photos_reached') || `Maximum ${MAX_PHOTOS} photos reached. Remove a photo to add another.`}
            </div>
          )}

          {/* Display existing photos */}
          {clientPhotos.length > 0 && (
            <div className="portfolio-grid" style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              {clientPhotos.map((photo, index) => (
                <div key={photo.id} className="portfolio-photo-item" style={{ 
                  position: 'relative',
                  border: '1px solid var(--border-color, #e5e7eb)',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  backgroundColor: 'var(--bg-secondary, #f9fafb)'
                }}>
                  <img 
                    src={photo.url} 
                    alt={photo.caption || `Portfolio photo ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                  <div style={{ padding: '0.75rem' }}>
                    {editingCaptionIndex === index ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <Input
                          id={`caption-${index}`}
                          value={captionValue}
                          onInput={(e) => setCaptionValue((e.target as HTMLInputElement).value)}
                          placeholder={t('portfolio.caption_placeholder') || 'Add a caption...'}
                          style={{ fontSize: '0.875rem' }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Button
                            variant="primary"
                            onClick={handleSaveCaption}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          >
                            {t('buttons.save')}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleCancelEditCaption}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          >
                            {t('buttons.cancel')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {photo.caption ? (
                          <p style={{ 
                            fontSize: '0.875rem', 
                            color: 'var(--text-secondary, #6b7280)',
                            margin: '0 0 0.5rem 0',
                            wordBreak: 'break-word'
                          }}>
                            {photo.caption}
                          </p>
                        ) : (
                          <p style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--text-secondary, #9ca3af)',
                            margin: '0 0 0.5rem 0',
                            fontStyle: 'italic'
                          }}>
                            {t('portfolio.no_caption') || 'No caption'}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Button
                            variant="outline"
                            onClick={() => handleEditCaption(index)}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', flex: 1 }}
                          >
                            {photo.caption ? t('portfolio.edit_caption') || 'Edit' : t('portfolio.add_caption') || 'Add Caption'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleRemovePhoto(index)}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          >
                            {t('buttons.delete')}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {clientPhotos.length === 0 && (
            <div style={{ 
              padding: '2rem', 
              textAlign: 'center', 
              color: 'var(--text-secondary, #6b7280)',
              marginBottom: '1.5rem'
            }}>
              {t('portfolio.empty') || 'No photos yet. Upload your first photo to get started!'}
            </div>
          )}
        </div>

        <div className="onboarding-actions">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            disabled={isSaving || isUploading}
          >
            {t('buttons.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={isSaving || isUploading}
          >
            {t('buttons.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}

