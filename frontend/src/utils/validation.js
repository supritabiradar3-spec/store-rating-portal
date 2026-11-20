// Form validation rules for Store Rating App

export const validateName = (name) => {
  if (!name || name.trim().length === 0) {
    return 'Name is required';
  }
  const len = name.trim().length;
  if (len < 20 || len > 60) {
    return `Name must be between 20 and 60 characters long (currently ${len} chars)`;
  }
  return null;
};

export const validateEmail = (email) => {
  if (!email || email.trim().length === 0) {
    return 'Email is required';
  }
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email.trim())) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const validatePassword = (password) => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 8 || password.length > 16) {
    return `Password must be 8-16 characters long (currently ${password.length} chars)`;
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least 1 uppercase letter';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must contain at least 1 special character';
  }
  return null;
};

export const validateAddress = (address) => {
  if (!address || address.trim().length === 0) {
    return 'Address is required';
  }
  if (address.trim().length > 400) {
    return 'Address must not exceed 400 characters';
  }
  return null;
};
