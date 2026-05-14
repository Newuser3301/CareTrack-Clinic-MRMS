const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,}$/;

const passwordPolicyMessage =
  'Password must be at least 12 characters and include uppercase, lowercase, number, and special character';

const validatePassword = (password) => PASSWORD_PATTERN.test(password || '');

module.exports = { PASSWORD_PATTERN, passwordPolicyMessage, validatePassword };
