import { useTranslation } from '../hooks/useTranslation';
import { BuyNowButton } from './BuyNowButton';
import type { PublishedCard } from '../models/types';

interface UpdateLockStatusProps {
  card: PublishedCard;
  onEndorsementRequest?: () => void;
}

export function UpdateLockStatus({ card, onEndorsementRequest }: UpdateLockStatusProps) {
  const { t } = useTranslation();

  // Check if updates are locked
  const now = Date.now();
  const freePeriodEnd = card.free_period_end 
    ? new Date(card.free_period_end).getTime() 
    : 0;
  const updatesEnabledUntil = card.updates_enabled_until 
    ? new Date(card.updates_enabled_until).getTime() 
    : 0;
  const hasPaid = card.payment_status === 'paid';
  
  const canUpdate = now <= freePeriodEnd || now <= updatesEnabledUntil || hasPaid;
  const isLocked = !canUpdate;

  // Calculate days remaining
  const daysRemaining = freePeriodEnd > now 
    ? Math.ceil((freePeriodEnd - now) / (24 * 60 * 60 * 1000))
    : 0;

  // Endorsement progress
  const endorsementCount = card.endorsement_count || 0;
  const nextThreshold = endorsementCount < 6 ? 6 : 10;
  const progressPercent = (endorsementCount / nextThreshold) * 100;

  if (!isLocked) {
    // Updates are enabled - show countdown
    const updatesUntil = updatesEnabledUntil || freePeriodEnd;
    const updatesDaysRemaining = updatesUntil > now
      ? Math.ceil((updatesUntil - now) / (24 * 60 * 60 * 1000))
      : 0;
    const updatesMonthsRemaining = Math.floor(updatesDaysRemaining / 30);

    return (
      <div className="update-status update-status-enabled">
        <div className="status-icon">✅</div>
        <div className="status-content">
          <h3>{t('payments.updates_enabled') || 'Updates Enabled'}</h3>
          {updatesMonthsRemaining > 0 && (
            <p>
              {t('payments.updates_remaining_months', { count: updatesMonthsRemaining }) || 
               `${updatesMonthsRemaining} months remaining`}
            </p>
          )}
          {updatesDaysRemaining > 0 && updatesDaysRemaining < 30 && (
            <p>
              {t('payments.updates_remaining_days', { count: updatesDaysRemaining }) || 
               `${updatesDaysRemaining} days remaining`}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Updates are locked - show lock status and options
  return (
    <div className="update-status update-status-locked">
      <div className="status-icon">🔒</div>
      <div className="status-content">
        <h3>{t('payments.updates_locked') || 'Updates Locked'}</h3>
        <p className="status-message">
          {t('payments.updates_locked_message') || 
           'Get endorsements from your customers or pay to unlock updates'}
        </p>

        {/* Endorsement Progress */}
        <div className="endorsement-progress">
          <div className="progress-header">
            <span>
              {t('payments.endorsements_progress', { 
                current: endorsementCount, 
                needed: nextThreshold 
              }) || `${endorsementCount}/${nextThreshold} endorsements`}
            </span>
            {endorsementCount < 6 && (
              <span className="progress-benefit">
                {t('payments.endorsements_benefit_6') || '→ 6 months free updates'}
              </span>
            )}
            {endorsementCount >= 6 && endorsementCount < 10 && (
              <span className="progress-benefit">
                {t('payments.endorsements_benefit_10') || '→ 12 months + better placement'}
              </span>
            )}
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Payment Option */}
        <div className="payment-option">
          <div className="payment-header">
            <strong>{t('payments.or_pay') || 'OR'}</strong>
            <span className="payment-benefit">
              {t('payments.payment_benefit') || 
               '$10 USD = 12 months + better placement (equivalent to 10 endorsements)'}
            </span>
          </div>
          <BuyNowButton
            cardId={card.id}
            amount={card.payment_amount || 10}
            currency={card.payment_currency || 'USD'}
            className="buy-now-button"
          />
        </div>

        {/* Endorsement Request CTA */}
        {onEndorsementRequest && (
          <button
            className="btn btn-outline endorsement-request-button"
            onClick={onEndorsementRequest}
          >
            {t('payments.request_endorsements') || 'Request Endorsements from Customers'}
          </button>
        )}
      </div>
    </div>
  );
}

