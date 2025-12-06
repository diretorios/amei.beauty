import { useState } from 'preact/hooks';
import { useTranslation } from '../hooks/useTranslation';
import { api, ApiError } from '../lib/api';
import { Button } from './Button';
import type { Profile, Service, SocialLink } from '../models/types';

interface AICompletionProps {
  profile: Partial<Profile>;
  onComplete: (suggestions: {
    profile: Partial<Profile>;
    services: Service[];
    social: SocialLink[];
    location?: {
      city?: string;
      neighborhood?: string;
      state?: string;
    };
  }) => void;
  onSkip: () => void;
}

export function AICompletion({ profile, onComplete, onSkip }: AICompletionProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{
    profile: Partial<Profile>;
    services: Service[];
    social: SocialLink[];
    location?: {
      city?: string;
      neighborhood?: string;
      state?: string;
    };
  } | null>(null);

  const handleStart = async () => {
    if (!profile.full_name || !profile.profession) {
      setError('Name and profession are required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await api.completeProfile({
        name: profile.full_name,
        profession: profile.profession,
        whatsapp: profile.whatsapp,
      });

      setSuggestions({
        profile: result.profile,
        services: result.services,
        social: result.social,
        location: result.location,
      });
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new Error('Failed to complete profile');
      setError(apiError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = () => {
    if (suggestions) {
      onComplete(suggestions);
    }
  };

  const handleReject = () => {
    setSuggestions(null);
    onSkip();
  };

  if (suggestions) {
    return (
      <div className="ai-completion-review">
        <h2>{t('onboarding.ai_completion.review')}</h2>
        <p className="ai-review-description">
          {t('onboarding.ai_completion.review_description') || 'Revise as sugestões abaixo e aprove o que deseja usar:'}
        </p>

        {suggestions.profile.headline && (
          <div className="ai-suggestion">
            <label>
              <input
                type="checkbox"
                checked={true}
                onChange={() => {}}
              />
              <strong>{t('profile.fields.headline')}:</strong> {suggestions.profile.headline}
            </label>
          </div>
        )}

        {suggestions.profile.bio && (
          <div className="ai-suggestion">
            <label>
              <input type="checkbox" checked={true} onChange={() => {}} />
              <strong>{t('profile.fields.bio')}:</strong>
              <p>{suggestions.profile.bio}</p>
            </label>
          </div>
        )}

        {suggestions.services.length > 0 && (
          <div className="ai-suggestion">
            <strong>{t('services.title')}:</strong>
            <ul className="ai-services-list">
              {suggestions.services.map((service) => (
                <li key={service.id}>
                  <label>
                    <input type="checkbox" checked={true} onChange={() => {}} />
                    {service.name} - {service.price}
                    {service.description && <span className="service-desc"> ({service.description})</span>}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="ai-error">
            <p>{error}</p>
          </div>
        )}

        <div className="ai-actions">
          <Button variant="outline" onClick={handleReject}>
            {t('onboarding.ai_completion.skip')}
          </Button>
          <Button variant="primary" onClick={handleApprove}>
            {t('buttons.save')} {t('buttons.continue')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-completion">
      <h2>{t('onboarding.ai_completion.title')}</h2>
      <p className="ai-description">{t('onboarding.ai_completion.description')}</p>

      {isLoading ? (
        <div className="ai-loading">
          <div className="ai-spinner"></div>
          <p>{t('onboarding.ai_completion.description')}</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="ai-error">
              <p>{error}</p>
            </div>
          )}

          <div className="ai-actions">
            <Button variant="outline" onClick={onSkip}>
              {t('onboarding.ai_completion.skip')}
            </Button>
            <Button variant="primary" onClick={handleStart} disabled={!profile.full_name || !profile.profession}>
              {t('onboarding.ai_completion.start') || 'Iniciar'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

