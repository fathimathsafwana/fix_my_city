/**
 * Password and Input Validation Utilities
 */

export const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;

/**
 * Validates password strength and returns individual check statuses
 * @param {string} password
 * @returns {object} { isValid, score, strength, checks, errors }
 */
export function checkPasswordStrength(password = "") {
  const pwd = String(password || "");

  const minLength = pwd.length >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /\d/.test(pwd);
  const hasSpecial = SPECIAL_CHAR_REGEX.test(pwd);

  const checks = {
    minLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
  };

  const score = [minLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  let strength = "empty";
  let strengthLabel = "";

  if (pwd.length > 0) {
    if (score === 5) {
      strength = "strong";
      strengthLabel = "Strong";
    } else if (score >= 3 && minLength) {
      strength = "medium";
      strengthLabel = "Medium";
    } else {
      strength = "weak";
      strengthLabel = "Weak";
    }
  }

  const errors = [];
  if (!minLength) errors.push("At least 8 characters");
  if (!hasUpper) errors.push("At least one uppercase letter (A-Z)");
  if (!hasLower) errors.push("At least one lowercase letter (a-z)");
  if (!hasNumber) errors.push("At least one number (0-9)");
  if (!hasSpecial) errors.push("At least one special character (e.g. @, #, $, %, !)");

  const isValid = minLength && hasUpper && hasLower && hasNumber && hasSpecial;

  return {
    isValid,
    score,
    strength,
    strengthLabel,
    checks,
    errors,
  };
}

/**
 * Validates email format
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email = "") {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(String(email).trim());
}

