import { useEffect, useState } from 'preact/hooks';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { UpdateLockStatus } from '../components/UpdateLockStatus';
import { storage } from '../lib/storage';
import { api } from '../lib/api';
import type { CardData, CustomLink } from '../models/types';
import type { PublishedCard } from '../models/types';

export function AddPersonalizedLinksPage() {
  const { t } = useTranslation();
  const [card, setCard] = useState<CardData | null>(null);
  const [publishedCard, setPublishedCard] = useState<PublishedCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkValue, setNewLinkValue] = useState('');
  const [newLinkType, setNewLinkType] = useState<'http' | 'mailto' | 'nostr' | 'custom'>('http');

  useEffect(() => {
    loadCard();
    checkPublishedCard();
  }, []);

  const loadCard = async () => {
    try {
      const loadedCard = await storage.loadCard();
      if (loadedCard) {
        setCard(loadedCard);
        const links = loadedCard.links || [];
        setCustomLinks(links);
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

  const handleAddCustomLink = () => {
    if (!newLinkLabel.trim() || !newLinkValue.trim()) return;
    
    // Validate URL based on type
    let validatedValue = newLinkValue.trim();
    if (newLinkType === 'http' && !validatedValue.startsWith('http://') && !validatedValue.startsWith('https://')) {
      validatedValue = `https://${validatedValue}`;
    } else if (newLinkType === 'mailto' && !validatedValue.startsWith('mailto:')) {
      validatedValue = `mailto:${validatedValue}`;
    }
    
    const newLink: CustomLink = {
      label: newLinkLabel.trim(),
      type: newLinkType,
      value: validatedValue,
    };
    
    setCustomLinks([...customLinks, newLink]);
    setNewLinkLabel('');
    setNewLinkValue('');
    setNewLinkType('http');
  };

  const handleRemoveCustomLink = (index: number) => {
    setCustomLinks(customLinks.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!card) return;

    setIsSaving(true);
    try {
      const updatedCard: CardData = {
        ...card,
        links: customLinks,
        updated_at: new Date().toISOString(),
      };
      await storage.saveCard(updatedCard);
      // Navigate back to profile page
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to save personalized links:', error);
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
          <h1 className="onboarding-title">{t('onboarding.step7.title')}</h1>
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
        <h1 className="onboarding-title">{t('onboarding.step7.title')}</h1>
        <p className="onboarding-subtitle">{t('onboarding.step7.description')}</p>

        <div className="onboarding-step">
          {/* Display existing links */}
          {customLinks.length > 0 && (
            <div className="custom-links-list" style={{ marginBottom: '1.5rem' }}>
              {customLinks.map((link, index) => (
                <div key={index} className="custom-link-item" style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  border: '1px solid var(--border-color, #e5e7eb)',
                  borderRadius: '0.5rem'
                }}>
                  <div>
                    <strong>{link.label}</strong>
                    <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary, #6b7280)' }}>
                      ({link.type})
                    </span>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #6b7280)' }}>
                      {link.value}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleRemoveCustomLink(index)}
                  >
                    {t('buttons.delete')}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add new link form */}
          <div className="add-link-form">
            <Input
              id="link-label"
              labelKey="onboarding.step7.label.label"
              placeholder={t('onboarding.step7.label.placeholder')}
              helpKey="onboarding.step7.label.help"
              value={newLinkLabel}
              onInput={(e) => setNewLinkLabel((e.target as HTMLInputElement).value)}
            />
            
            <Select
              id="link-type"
              labelKey="onboarding.step7.type.label"
              value={newLinkType}
              onChange={(e) => setNewLinkType((e.target as HTMLSelectElement).value as 'http' | 'mailto' | 'nostr' | 'custom')}
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              <option value="http">{t('onboarding.step7.type.options.http')}</option>
              <option value="mailto">{t('onboarding.step7.type.options.mailto')}</option>
              <option value="nostr">{t('onboarding.step7.type.options.nostr')}</option>
              <option value="custom">{t('onboarding.step7.type.options.custom')}</option>
            </Select>

            <Input
              id="link-value"
              labelKey="onboarding.step7.value.label"
              placeholder={t('onboarding.step7.value.placeholder')}
              helpKey="onboarding.step7.value.help"
              value={newLinkValue}
              onInput={(e) => setNewLinkValue((e.target as HTMLInputElement).value)}
              type={newLinkType === 'mailto' ? 'email' : 'url'}
            />

            <Button
              variant="primary"
              onClick={handleAddCustomLink}
              disabled={!newLinkLabel.trim() || !newLinkValue.trim()}
              style={{ marginTop: '0.5rem' }}
            >
              {t('onboarding.step7.add_button')}
            </Button>
          </div>
        </div>

        <div className="onboarding-actions" style={{ marginTop: '2rem' }}>
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

