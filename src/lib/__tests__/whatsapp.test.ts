import { describe, it, expect } from 'vitest';
import { formatWhatsAppNumber, generateWhatsAppLink, shareCardViaWhatsApp } from '../whatsapp';

describe('whatsapp utilities', () => {
  describe('formatWhatsAppNumber', () => {
    it('should format Brazilian phone number', () => {
      expect(formatWhatsAppNumber('(11) 99999-9999')).toBe('+5511999999999');
      expect(formatWhatsAppNumber('11 99999-9999')).toBe('+5511999999999');
      expect(formatWhatsAppNumber('11999999999')).toBe('+5511999999999');
    });

    it('should preserve international format', () => {
      expect(formatWhatsAppNumber('+1 555 123 4567')).toBe('+15551234567');
      expect(formatWhatsAppNumber('+34 612 345 678')).toBe('+34612345678');
    });

    it('should handle numbers starting with 0', () => {
      expect(formatWhatsAppNumber('011 99999-9999')).toBe('+5511999999999');
    });
  });

  describe('generateWhatsAppLink', () => {
    it('should generate WhatsApp link without message', () => {
      const link = generateWhatsAppLink('(11) 99999-9999');
      expect(link).toBe('https://wa.me/5511999999999');
    });

    it('should generate WhatsApp link with message', () => {
      const link = generateWhatsAppLink('(11) 99999-9999', 'Hello!');
      expect(link).toContain('https://wa.me/5511999999999');
      expect(link).toContain('text=');
      expect(link).toContain('Hello');
    });
  });

  describe('shareCardViaWhatsApp', () => {
    it('should generate share link in Portuguese', () => {
      // Function opens window, so we just verify it doesn't throw
      expect(() => shareCardViaWhatsApp('https://amei.beauty/test', 'Test', 'pt-BR')).not.toThrow();
    });

    it('should generate share link in English', () => {
      expect(() => shareCardViaWhatsApp('https://amei.beauty/test', 'Test', 'en')).not.toThrow();
    });

    it('should generate share link in Spanish', () => {
      expect(() => shareCardViaWhatsApp('https://amei.beauty/test', 'Test', 'es')).not.toThrow();
    });
  });
});

