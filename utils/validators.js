// utils/validators.js
// Real validation — replaces the old register form which had NO password
// field and accepted "email or contact" as literally any text.

// RFC5322-ish practical email regex: good enough for real-world validation
// without being so strict it rejects valid addresses.
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  if (!EMAIL_REGEX.test(trimmed)) return false;
  // reject consecutive dots, leading/trailing dots in local part
  const [local] = trimmed.split('@');
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  return true;
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

// Password policy: min 8 chars, at least one letter and one number.
// (Adjust here if you want stricter rules e.g. symbols/uppercase.)
function isValidPassword(password) {
  if (typeof password !== 'string') return false;
  if (password.length < 8 || password.length > 128) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
}

function isValidName(name) {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
}

// dob is optional in the form, but if present must be a real date and not in the future
function isValidDob(dob) {
  if (!dob) return true; // optional field
  const d = new Date(dob);
  if (isNaN(d.getTime())) return false;
  return d.getTime() <= Date.now();
}

module.exports = {
  isValidEmail,
  normalizeEmail,
  isValidPassword,
  isValidName,
  isValidDob,
};
