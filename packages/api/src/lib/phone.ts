/**
 * Phone number utilities for WhatsApp.
 * Handles normalization, validation, and variant generation for retry logic.
 */

/**
 * Normalize a phone number by removing non-digit characters and leading zeros.
 * Does NOT add country code — that's caller's responsibility.
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").replace(/^0+/, "");
}

/**
 * Generate phone variants to try when Meta rejects a number.
 * Tries variations with/without +, with/without leading country code patterns.
 *
 * For example, "919876543210" produces:
 * ["919876543210", "+919876543210", "0919876543210"]
 */
export function generatePhoneVariants(phone: string): string[] {
  const normalized = normalizePhone(phone);
  const variants = new Set<string>();

  // Always try the normalized form first
  variants.add(normalized);

  // Try with + prefix
  if (!normalized.startsWith("+")) {
    variants.add(`+${normalized}`);
  }

  // Try without + if it has one
  if (normalized.startsWith("+")) {
    variants.add(normalized.substring(1));
  }

  // Try with 0 prefix (common in some countries)
  if (!normalized.startsWith("0")) {
    variants.add(`0${normalized}`);
  }

  // Try removing leading 0 if present
  if (normalized.startsWith("0") && normalized.length > 10) {
    variants.add(normalized.substring(1));
  }

  return Array.from(variants);
}

/**
 * Validate that a phone number looks reasonable for WhatsApp.
 * Must be 7-15 digits after normalization.
 */
export function isValidPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return normalized.length >= 7 && normalized.length <= 15;
}

/**
 * Extract country code from a phone number (best-effort).
 * Returns the country code and remaining number.
 */
export function extractCountryCode(phone: string): { countryCode: string; number: string } | null {
  const normalized = normalizePhone(phone);

  // Common country codes by length
  const countryCodeLengths = [1, 2, 3];

  for (const len of countryCodeLengths) {
    if (normalized.length > len) {
      const code = normalized.substring(0, len);
      // Validate it looks like a country code (1-999)
      const codeNum = parseInt(code, 10);
      if (codeNum > 0 && codeNum < 1000) {
        return {
          countryCode: code,
          number: normalized.substring(len),
        };
      }
    }
  }

  return null;
}

/**
 * Format phone number for display.
 * Adds + prefix and spaces for readability.
 */
export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizePhone(phone);
  if (normalized.length <= 10) {
    return normalized;
  }
  // Assume first 1-3 digits are country code
  const countryCode = normalized.substring(0, Math.min(3, normalized.length - 10));
  const number = normalized.substring(countryCode.length);
  return `+${countryCode} ${number}`;
}

/**
 * Match two phone numbers, ignoring formatting differences.
 */
export function phonesMatch(a: string, b: string): boolean {
  return normalizePhone(a) === normalizePhone(b);
}
