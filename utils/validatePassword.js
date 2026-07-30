// Returns { valid: boolean, message?: string }
function validatePassword(password) {
  if (!password || password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long." };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must include at least one lowercase letter." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must include at least one uppercase letter." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must include at least one number." };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: "Password must include at least one special character." };
  }
  return { valid: true };
}

// Returns { strength: "weak"|"medium"|"strong", score: 0-5 }
// Used for live feedback while typing — separate from validatePassword's
// pass/fail gate, since a password can be "valid" but still weak (e.g. exactly 8 chars).
function getPasswordStrength(password) {
  if (!password) return { strength: "weak", score: 0 };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  let strength = "weak";
  if (score >= 4) strength = "strong";
  else if (score >= 2) strength = "medium";

  return { strength, score };
}

module.exports = { validatePassword, getPasswordStrength };
