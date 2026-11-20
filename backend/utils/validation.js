// backend/utils/validation.js
// Validation utilities matching the challenge PDF specifications:
// - Name: 20-60 characters
// - Address: max 400 characters
// - Password: 8-16 characters, at least 1 uppercase and 1 special character
// - Email: standard email validation
// - Rating: integer between 1 and 5

function validateName(name) {
  if (!name || typeof name !== 'string') {
    return 'Name is required.';
  }
  const trimmed = name.trim();
  if (trimmed.length < 20 || trimmed.length > 60) {
    return `Name must be between 20 and 60 characters long (currently ${trimmed.length} characters).`;
  }
  return null;
}

function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return 'Email is required.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Please provide a valid email address.';
  }
  return null;
}

function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return 'Password is required.';
  }
  if (password.length < 8 || password.length > 16) {
    return `Password must be between 8 and 16 characters long (currently ${password.length} characters).`;
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter.';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must include at least one special character.';
  }
  return null;
}

function validateAddress(address) {
  if (!address || typeof address !== 'string') {
    return 'Address is required.';
  }
  const trimmed = address.trim();
  if (trimmed.length === 0) {
    return 'Address cannot be empty.';
  }
  if (trimmed.length > 400) {
    return `Address must not exceed 400 characters (currently ${trimmed.length} characters).`;
  }
  return null;
}

function validateRating(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1 || num > 5) {
    return 'Rating must be an integer between 1 and 5.';
  }
  return null;
}

module.exports = {
  validateName,
  validateEmail,
  validatePassword,
  validateAddress,
  validateRating,
};
