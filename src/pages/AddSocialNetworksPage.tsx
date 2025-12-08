import { useEffect, useState } from 'preact/hooks';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { UpdateLockStatus } from '../components/UpdateLockStatus';
import { storage } from '../lib/storage';
import { api } from '../lib/api';
import type { CardData, SocialLink } from '../models/types';
import type { PublishedCard } from '../models/types';

export function AddSocialNetworksPage() {
  const { t } = useTranslation();
  const [card, setCard] = useState<CardData | null>(null);
  const [publishedCard, setPublishedCard] = useState<PublishedCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [socialHandles, setSocialHandles] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCard();
    checkPublishedCard();
  }, []);

  const loadCard = async () => {
    try {
      const loadedCard = await storage.loadCard();
      if (loadedCard) {
        setCard(loadedCard);
        const social = loadedCard.social || [];
        setSocialLinks(social);
        // Initialize handles from existing social links
        const handles: Record<string, string> = {};
        social.forEach(link => {
          handles[link.platform] = link.handle;
        });
        setSocialHandles(handles);
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

  const handleSocialHandleChange = (platform: string, handle: string) => {
    // Update the handle state
    setSocialHandles({ ...socialHandles, [platform]: handle });
    
    // Update or remove the social link
    if (handle.trim()) {
      const url = generateSocialUrl(platform, handle);
      const existingIndex = socialLinks.findIndex(link => link.platform === platform);
      if (existingIndex >= 0) {
        const updated = [...socialLinks];
        updated[existingIndex] = { platform, handle: handle.trim(), url };
        setSocialLinks(updated);
      } else {
        setSocialLinks([...socialLinks, { platform, handle: handle.trim(), url }]);
      }
    } else {
      // Remove if handle is empty
      setSocialLinks(socialLinks.filter(link => link.platform !== platform));
    }
  };

  const handleRemoveSocialLink = (platform: string) => {
    setSocialLinks(socialLinks.filter(link => link.platform !== platform));
    const updatedHandles = { ...socialHandles };
    delete updatedHandles[platform];
    setSocialHandles(updatedHandles);
  };

  const generateSocialUrl = (platform: string, handle: string): string => {
    const cleanHandle = handle.trim().replace(/^@/, '');
    switch (platform.toLowerCase()) {
      case 'instagram':
        return `https://instagram.com/${cleanHandle}`;
      case 'facebook':
        return `https://facebook.com/${cleanHandle}`;
      case 'tiktok':
        return `https://tiktok.com/@${cleanHandle}`;
      case 'twitter':
      case 'x':
        return `https://x.com/${cleanHandle}`;
      case 'youtube':
        return `https://youtube.com/@${cleanHandle}`;
      case 'linkedin':
        return `https://linkedin.com/in/${cleanHandle}`;
      case 'pinterest':
        return `https://pinterest.com/${cleanHandle}`;
      case 'snapchat':
        return `https://snapchat.com/add/${cleanHandle}`;
      case 'threads':
        return `https://threads.net/@${cleanHandle}`;
      default:
        return `https://${platform.toLowerCase()}.com/${cleanHandle}`;
    }
  };

  const handleSave = async () => {
    if (!card) return;

    setIsSaving(true);
    try {
      const updatedCard: CardData = {
        ...card,
        social: socialLinks,
        updated_at: new Date().toISOString(),
      };
      await storage.saveCard(updatedCard);
      // Navigate back to profile page
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to save social networks:', error);
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
          <h1 className="onboarding-title">{t('onboarding.step6.title')}</h1>
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
        <h1 className="onboarding-title">{t('onboarding.step6.title')}</h1>
        <p className="onboarding-subtitle">{t('onboarding.step6.description')}</p>

        <div className="onboarding-step">
          {['instagram', 'facebook', 'tiktok', 'youtube', 'twitter', 'linkedin', 'pinterest', 'snapchat', 'threads'].map((platform) => {
            const existingLink = socialLinks.find(link => link.platform === platform);
            const handle = socialHandles[platform] || existingLink?.handle || '';
            
            return (
              <div key={platform} className="social-link-input" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      id={`social-${platform}`}
                      labelKey={`onboarding.step6.${platform}.label`}
                      placeholder={t(`onboarding.step6.${platform}.placeholder`)}
                      helpKey={existingLink ? undefined : `onboarding.step6.${platform}.help`}
                      value={handle}
                      onInput={(e) => {
                        const value = (e.target as HTMLInputElement).value;
                        handleSocialHandleChange(platform, value);
                      }}
                    />
                  </div>
                  {existingLink && (
                    <Button
                      variant="outline"
                      onClick={() => handleRemoveSocialLink(platform)}
                      style={{ marginBottom: '0.5rem' }}
                    >
                      {t('buttons.delete')}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="onboarding-actions">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            disabled={isSaving}
          >
            {t('buttons.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={isSaving}
          >
            {t('buttons.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}

