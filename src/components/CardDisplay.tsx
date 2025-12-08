import { useTranslation } from '../hooks/useTranslation';
import { openWhatsApp } from '../lib/whatsapp';
import type { CardData, PublishedCard } from '../models/types';

interface CardDisplayProps {
  card: CardData | PublishedCard;
  showWhatsAppButton?: boolean;
  isPreview?: boolean;
}

export function CardDisplay({ card, showWhatsAppButton = true, isPreview = false }: CardDisplayProps) {
  const { t } = useTranslation();

  const handleWhatsApp = () => {
    if (card.profile.whatsapp) {
      openWhatsApp(card.profile.whatsapp);
    }
  };

  return (
    <div className={`public-card ${isPreview ? 'card-preview-mode' : ''}`}>
      {isPreview && (
        <div className="preview-badge">
          <span>{t('profile.preview') || 'Preview'}</span>
        </div>
      )}
      
      {card.profile.photo && (
        <div className="card-photo">
          <img src={card.profile.photo} alt={card.profile.full_name} />
        </div>
      )}

      <div className="card-header">
        <h1>{card.profile.full_name}</h1>
        <p className="profession">{card.profile.profession}</p>
        {card.profile.headline && <p className="headline">{card.profile.headline}</p>}
      </div>

      {card.profile.bio && (
        <div className="card-bio">
          <p>{card.profile.bio}</p>
        </div>
      )}

      {card.profile.website && (
        <div className="card-website">
          <a href={card.profile.website} target="_blank" rel="noopener noreferrer" className="website-link">
            🌐 {card.profile.website}
          </a>
        </div>
      )}

      {card.links.length > 0 && (
        <div className="card-links">
          <h2>{t('navigation.links')}</h2>
          <ul>
            {card.links.map((link, index) => (
              <li key={index}>
                <a href={link.value} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {card.certifications.length > 0 && (
        <div className="card-certifications">
          <h2>{t('certifications.title') || 'Certifications'}</h2>
          <ul>
            {card.certifications.map((cert) => (
              <li key={cert.id}>
                <strong>{cert.name}</strong>
                {cert.issuer && <span className="cert-issuer"> - {cert.issuer}</span>}
                {cert.issue_date && (
                  <span className="cert-date">
                    {' '}({new Date(cert.issue_date).getFullYear()})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {card.services.length > 0 && (
        <div className="card-services">
          <h2>{t('services.title')}</h2>
          <ul>
            {card.services.map((service) => (
              <li key={service.id}>
                <strong>{service.name}</strong> - {service.price}
                {service.description && <p>{service.description}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {card.social.length > 0 && (
        <div className="card-social">
          <h2>{t('navigation.social')}</h2>
          <ul>
            {card.social.map((social, index) => (
              <li key={index}>
                <a href={social.url} target="_blank" rel="noopener noreferrer">
                  {social.platform}: {social.handle}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showWhatsAppButton && card.profile.whatsapp && (
        <div className="card-actions">
          <button className="btn btn-primary whatsapp-button" onClick={handleWhatsApp}>
            📱 {t('buttons.share')} WhatsApp
          </button>
        </div>
      )}

      {card.badges.length > 0 && (
        <div className="card-badges">
          {card.badges.map((badge, index) => (
            <span key={index} className="badge">
              {badge.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

