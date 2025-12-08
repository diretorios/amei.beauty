import { useState } from 'preact/hooks';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from './Button';
import { api, ApiError } from '../lib/api';

interface BuyNowButtonProps {
  cardId: string;
  amount?: number;
  currency?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

export function BuyNowButton({
  cardId,
  amount = 10,
  currency = 'USD',
  onSuccess,
  onError,
  className = '',
}: BuyNowButtonProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleBuyNow = async () => {
    setIsLoading(true);

    try {
      // Create Stripe Checkout Session
      const { checkout_url } = await api.createCheckoutSession(cardId, {
        success_url: `${window.location.origin}/?payment=success&card_id=${encodeURIComponent(cardId)}`,
        cancel_url: `${window.location.origin}/?payment=cancelled`,
      });

      // Redirect to Stripe Checkout
      window.location.href = checkout_url;
    } catch (error) {
      console.error('Buy Now error:', error);
      const apiError = error instanceof ApiError 
        ? error 
        : new Error(error instanceof Error ? error.message : 'Failed to start payment');
      onError?.(apiError);
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="primary"
      onClick={handleBuyNow}
      isLoading={isLoading}
      disabled={isLoading}
      className={className}
    >
      💳 {t('payments.buy_now', { amount, currency }) || `Buy Now - $${amount} ${currency}`}
    </Button>
  );
}

