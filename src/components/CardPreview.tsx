import { useTranslation } from '../hooks/useTranslation';
import { openWhatsApp } from '../lib/whatsapp';
import type { PublishedCard } from '../models/types';
import { WhatsAppIcon } from './WhatsAppIcon';

interface CardPreviewProps {
  card: PublishedCard;
  onClick?: () => void;
}

export function CardPreview({ card, onClick }: CardPreviewProps) {
  const { t } = useTranslation();

  const handleWhatsApp = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    if (card.profile.whatsapp) {
      openWhatsApp(card.profile.whatsapp);
    }
  };

  const cardUrl = card.username 
    ? `/${card.username}` 
    : `/card/${card.id}`;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onClick) onClick();
    }
  };

  return (
    <div 
      className="card-preview" 
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="article"
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Card for ${card.profile.full_name}`}
    >
      <a href={cardUrl} className="card-preview-link" aria-label={`View ${card.profile.full_name}'s card`}>
        {card.profile.photo && (
          <div className="card-preview-photo">
            <img src={card.profile.photo} alt={card.profile.full_name} />
          </div>
        )}
        <div className="card-preview-content">
          <h3 className="card-preview-name">{card.profile.full_name}</h3>
          <div className="card-preview-profession-row">
            <p className="card-preview-profession">{card.profile.profession}</p>
            {card.profile.whatsapp && (
              <button
                className="card-preview-whatsapp-inline"
                onClick={handleWhatsApp}
                aria-label="Contact via WhatsApp"
                title="Contact via WhatsApp"
              >
                <WhatsAppIcon size={20} />
              </button>
            )}
          </div>
          {card.profile.headline && (
            <p className="card-preview-headline">{card.profile.headline}</p>
          )}
          {card.location && (
            <p className="card-preview-location">
              📍 {card.location.city || ''} {card.location.neighborhood ? `- ${card.location.neighborhood}` : ''}
            </p>
          )}
          {card.services.length > 0 && (
            <div className="card-preview-services">
              {card.services.slice(0, 3).map((service) => (
                <span key={service.id} className="service-tag">
                  {service.name}
                </span>
              ))}
              {card.services.length > 3 && (
                <span className="service-tag-more">+{card.services.length - 3}</span>
              )}
            </div>
          )}
          {card.badges.length > 0 && (
            <div className="card-preview-badges">
              {card.badges.slice(0, 3).map((badge, index) => (
                <span key={index} className="badge-small">
                  {badge.label}
                </span>
              ))}
            </div>
          )}
        </div>
        {card.is_featured && (
          <span className="featured-badge">⭐ {t('directory.featured')}</span>
        )}
      </a>
      <button
        className="card-preview-whatsapp"
        onClick={handleWhatsApp}
        aria-label="Contact via WhatsApp"
      >
        <WhatsAppIcon size={20} /> WhatsApp
      </button>
    </div>
  );
}

