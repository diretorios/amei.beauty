/**
 * WhatsApp integration utilities
 * Deep linking and sharing functionality
 */

/**
 * Format WhatsApp number for deep linking
 * Removes all non-digit characters except +
 */
export function formatWhatsAppNumber(phone: string): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it doesn't start with +, assume Brazilian number and add country code
  if (!cleaned.startsWith('+')) {
    // Remove leading 0 if present
    const withoutZero = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
    // Add Brazil country code (55)
    return `+55${withoutZero}`;
  }
  
  return cleaned;
}

/**
 * Generate WhatsApp deep link
 * Opens WhatsApp chat with pre-filled message
 */
export function generateWhatsAppLink(phone: string, message?: string): string {
  const formattedPhone = formatWhatsAppNumber(phone);
  const encodedMessage = message ? encodeURIComponent(message) : '';
  return `https://wa.me/${formattedPhone.replace('+', '')}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
}

/**
 * Open WhatsApp chat
 */
export function openWhatsApp(phone: string, message?: string): void {
  const link = generateWhatsAppLink(phone, message);
  window.open(link, '_blank', 'noopener,noreferrer');
}

/**
 * Share card via WhatsApp
 */
export function shareCardViaWhatsApp(cardUrl: string, _cardName: string, locale: string): void {
  const messages = {
    'pt-BR': `Amei este profissional! Confira: ${cardUrl}`,
    'en': `I loved this professional! Check it out: ${cardUrl}`,
    'es': `¡Me encantó este profesional! Échale un vistazo: ${cardUrl}`,
  };
  
  const message = messages[locale as keyof typeof messages] || messages['en'];
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappLink, '_blank', 'noopener,noreferrer');
}

