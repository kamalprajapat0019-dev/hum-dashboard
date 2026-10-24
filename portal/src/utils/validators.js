/**
 * Common Input & Form Validators
 */

export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidPhone(phone) {
  if (!phone) return false;
  const digits = String(phone).replace(/\D/g, '');
  return digits.length === 10;
}

export function isValidPincode(pincode) {
  if (!pincode) return false;
  return /^[1-9][0-9]{5}$/.test(String(pincode).trim());
}
