/**
 * Country code to language mapping
 * Maps ISO 3166-1 alpha-2 country codes to supported locales
 */

import type { Locale } from '../models/types';

/**
 * Spanish-speaking countries (LATAM + Spain)
 * These countries should default to Spanish (es)
 */
const SPANISH_SPEAKING_COUNTRIES = new Set([
  'ES', // Spain
  'MX', // Mexico
  'AR', // Argentina
  'CO', // Colombia
  'CL', // Chile
  'PE', // Peru
  'VE', // Venezuela
  'EC', // Ecuador
  'GT', // Guatemala
  'CU', // Cuba
  'BO', // Bolivia
  'DO', // Dominican Republic
  'HN', // Honduras
  'PY', // Paraguay
  'SV', // El Salvador
  'NI', // Nicaragua
  'CR', // Costa Rica
  'PA', // Panama
  'UY', // Uruguay
  'PR', // Puerto Rico
]);

/**
 * Portuguese-speaking countries
 * Brazil should default to pt-BR
 */
const PORTUGUESE_SPEAKING_COUNTRIES = new Set(['BR']); // Brazil

/**
 * Maps a country code to a locale
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., 'BR', 'MX', 'US')
 * @returns Locale code or null if country is not mapped
 */
export function countryToLanguage(countryCode: string | null | undefined): Locale | null {
  if (!countryCode || typeof countryCode !== 'string') {
    return null;
  }

  const upperCode = countryCode.toUpperCase();

  // Check Portuguese-speaking countries first
  if (PORTUGUESE_SPEAKING_COUNTRIES.has(upperCode)) {
    return 'pt-BR';
  }

  // Check Spanish-speaking countries
  if (SPANISH_SPEAKING_COUNTRIES.has(upperCode)) {
    return 'es';
  }

  // For other countries, return null to allow fallback to browser language
  // This includes English-speaking countries (US, UK, CA, AU, etc.)
  // which will be handled by browser language detection
  return null;
}

