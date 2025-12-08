import { useState, useEffect } from 'preact/hooks';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { storage } from '../lib/storage';
import type { Profile, CardData } from '../models/types';

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
      social: [],
      links: [],
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
    if (step < 5) {
      setStep(step + 1);
    } else if (step === 5) {
      // After optional bio/website step, save and complete onboarding
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
      default:
        return false;
    }
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
        </div>

        <div className="onboarding-actions">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack}>
              {t('buttons.back')}
            </Button>
          )}
          <Button variant="primary" onClick={handleNext} disabled={!isStepValid()}>
            {step === 5 ? t('buttons.finish') || t('buttons.next') : t('buttons.next')}
          </Button>
        </div>
      </div>
    </div>
  );
}

