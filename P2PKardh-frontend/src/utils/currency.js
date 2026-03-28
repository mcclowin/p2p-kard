/**
 * Currency display utilities.
 * Campaigns/requests carry their own currency field — use it for display.
 */

const SYMBOLS = {
  GBP: '£',
  EUR: '€',
  USD: '$',
};

export function currencySymbol(code = 'GBP') {
  return SYMBOLS[code?.toUpperCase()] || code;
}

export function formatAmount(cents, currency = 'GBP') {
  const amount = (cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${currencySymbol(currency)}${amount}`;
}
