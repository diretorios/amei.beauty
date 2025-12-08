import { useState, useEffect } from 'preact/hooks';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { storage } from '../lib/storage';
import type { Profile, CardData, SocialLink, CustomLink } from '../models/types';

interface OnboardingPageProps {
  onComplete: () => void;
  initialCard?: CardData | null;
}

export function OnboardingPage({ onComplete, initialCard }: OnboardingPageProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<Profile>>({
    full_name: '',
    profession: '',
    whatsapp: '',
    photo: null,
    headline: '',
    bio: '',
    website: '',
  });
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [socialHandles, setSocialHandles] = useState<Record<string, string>>({});
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkValue, setNewLinkValue] = useState('');
  const [newLinkType, setNewLinkType] = useState<'http' | 'mailto' | 'nostr' | 'custom'>('http');

  // Load existing card data if editing
  useEffect(() => {
    if (initialCard) {
      setProfile({
        full_name: initialCard.profile.full_name || '',
        profession: initialCard.profile.profession || '',
        whatsapp: initialCard.profile.whatsapp || '',
        photo: initialCard.profile.photo || null,
        headline: initialCard.profile.headline || '',
        bio: initialCard.profile.bio || '',
        website: initialCard.profile.website || '',
      });
      const social = initialCard.social || [];
      setSocialLinks(social);
      // Initialize handles from existing social links
      const handles: Record<string, string> = {};
      social.forEach(link => {
        handles[link.platform] = link.handle;
      });
      setSocialHandles(handles);
      setCustomLinks(initialCard.links || []);
    }
  }, [initialCard]);

  const saveAndComplete = async () => {
    // Preserve existing card data if editing, otherwise create new
    const cardData: CardData = initialCard ? {
      ...initialCard,
      profile: {
        full_name: profile.full_name || '',
        profession: profile.profession || '',
        whatsapp: profile.whatsapp || '',
        photo: profile.photo || null,
        headline: profile.headline || '',
        bio: profile.bio || '',
        website: profile.website || '',
      },
      social: socialLinks,
      links: customLinks,
      updated_at: new Date().toISOString(),
    } : {
      profile: {
        full_name: profile.full_name || '',
        profession: profile.profession || '',
        whatsapp: profile.whatsapp || '',
        photo: profile.photo || null,
        headline: profile.headline || '',
        bio: profile.bio || '',
        website: profile.website || '',
      },
      social: socialLinks,
      links: customLinks,
      services: [],
      ratings: [],
      testimonials: [],
      client_photos: [],
      badges: [],
      certifications: [],
      recommendations: {
        count: 0,
        recent: [],
      },
      settings: {
        theme: 'system',
        accent_color: '#10B981',
        reduce_motion: false,
        language: 'pt-BR',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await storage.saveCard(cardData);
      onComplete();
    } catch (error) {
      console.error('Failed to save card:', error);
      // Still complete onboarding even if save fails
      onComplete();
    }
  };

  const handleNext = async () => {
    if (step < 7) {
      setStep(step + 1);
    } else if (step === 7) {
      // After personalized links step, save and complete onboarding
      await saveAndComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handlePhotoChange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfile({ ...profile, photo: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return !!profile.full_name?.trim();
      case 2:
        return !!profile.profession?.trim();
      case 3:
        return !!profile.whatsapp?.trim(); // WhatsApp is mandatory
      case 4:
        return true; // Photo is optional
      case 5:
        return true; // Bio and website are optional
      case 6:
        return true; // Social networks are optional
      case 7:
        return true; // Personalized links are optional
      default:
        return false;
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
      default:
        return `https://${platform.toLowerCase()}.com/${cleanHandle}`;
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

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <h1 className="onboarding-title">{t('onboarding.title')}</h1>
        <p className="onboarding-subtitle">{t('onboarding.subtitle')}</p>

        <div className="onboarding-steps">
          {step === 1 && (
            <div className="onboarding-step">
              <h2>{t('onboarding.step1.title')}</h2>
              <Input
                id="full_name"
                labelKey="onboarding.step1.label"
                placeholder={t('onboarding.step1.placeholder')}
                helpKey="onboarding.step1.help"
                value={profile.full_name || ''}
                onInput={(e) =>
                  setProfile({ ...profile, full_name: (e.target as HTMLInputElement).value })
                }
                required
              />
            </div>
          )}

          {step === 2 && (
            <div className="onboarding-step">
              <h2>{t('onboarding.step2.title')}</h2>
              <Input
                id="profession"
                labelKey="onboarding.step2.label"
                placeholder={t('onboarding.step2.placeholder')}
                helpKey="onboarding.step2.help"
                value={profile.profession || ''}
                onInput={(e) =>
                  setProfile({ ...profile, profession: (e.target as HTMLInputElement).value })
                }
                required
              />
            </div>
          )}

          {step === 3 && (
            <div className="onboarding-step">
              <h2>{t('onboarding.step3.title')}</h2>
              <Input
                id="whatsapp"
                labelKey="onboarding.step3.label"
                placeholder={t('onboarding.step3.placeholder')}
                helpKey="onboarding.step3.help"
                type="tel"
                inputMode="tel"
                value={profile.whatsapp || ''}
                onInput={(e) =>
                  setProfile({ ...profile, whatsapp: (e.target as HTMLInputElement).value })
                }
                required
              />
            </div>
          )}

          {step === 4 && (
            <div className="onboarding-step">
              <h2>{t('onboarding.step4.title')}</h2>
              <div className="photo-upload">
                {profile.photo ? (
                  <div className="photo-preview">
                    <img src={profile.photo} alt="Profile" />
                    <Button variant="outline" onClick={() => setProfile({ ...profile, photo: null })}>
                      {t('onboarding.step4.remove')}
                    </Button>
                  </div>
                ) : (
                  <label htmlFor="photo" className="photo-upload-label">
                    <input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="sr-only"
                    />
                    <span className="photo-upload-button">{t('onboarding.step4.upload')}</span>
                    <p className="photo-upload-help">{t('onboarding.step4.help')}</p>
                  </label>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="onboarding-step">
              <h2>{t('onboarding.step5.title')}</h2>
              <p className="onboarding-step-description">{t('onboarding.step5.description')}</p>
              <Textarea
                id="bio"
                labelKey="onboarding.step5.bio.label"
                placeholder={t('onboarding.step5.bio.placeholder')}
                helpKey="onboarding.step5.bio.help"
                value={profile.bio || ''}
                onInput={(e) =>
                  setProfile({ ...profile, bio: (e.target as HTMLTextAreaElement).value })
                }
              />
              <Input
                id="website"
                labelKey="onboarding.step5.website.label"
                placeholder={t('onboarding.step5.website.placeholder')}
                helpKey="onboarding.step5.website.help"
                type="url"
                inputMode="url"
                value={profile.website || ''}
                onInput={(e) =>
                  setProfile({ ...profile, website: (e.target as HTMLInputElement).value })
                }
              />
            </div>
          )}

          {step === 6 && (
            <div className="onboarding-step">
              <h2>{t('onboarding.step6.title')}</h2>
              <p className="onboarding-step-description">{t('onboarding.step6.description')}</p>
              
              {['instagram', 'facebook', 'tiktok', 'youtube'].map((platform) => {
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
          )}

          {step === 7 && (
            <div className="onboarding-step">
              <h2>{t('onboarding.step7.title')}</h2>
              <p className="onboarding-step-description">{t('onboarding.step7.description')}</p>
              
              {/* Existing links */}
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
                
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="link-type" className="input-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                    {t('onboarding.step7.type.label')}
                  </label>
                  <select
                    id="link-type"
                    value={newLinkType}
                    onChange={(e) => setNewLinkType(e.target.value as 'http' | 'mailto' | 'nostr' | 'custom')}
                    className="input"
                    style={{ width: '100%' }}
                  >
                    <option value="http">{t('onboarding.step7.type.options.http')}</option>
                    <option value="mailto">{t('onboarding.step7.type.options.mailto')}</option>
                    <option value="nostr">{t('onboarding.step7.type.options.nostr')}</option>
                    <option value="custom">{t('onboarding.step7.type.options.custom')}</option>
                  </select>
                </div>

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
          )}
        </div>

        <div className="onboarding-actions">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack}>
              {t('buttons.back')}
            </Button>
          )}
          {step === 5 ? (
            <Button variant="primary" onClick={saveAndComplete}>
              {t('buttons.finish')}
            </Button>
          ) : step === 6 ? (
            <Button variant="primary" onClick={() => setStep(7)}>
              {t('buttons.next')}
            </Button>
          ) : step === 7 ? (
            <>
              <Button variant="primary" disabled>
                {t('onboarding.step6.add_links')}
              </Button>
              <Button variant="outline" onClick={saveAndComplete}>
                {t('buttons.finish')}
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={handleNext} disabled={!isStepValid()}>
              {t('buttons.next')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

