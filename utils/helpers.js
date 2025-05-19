// utils/helpers.js
/**
 * Generate a random password
 * @param {number} [length=10] - Password length
 * @returns {string} - Random password
 */
exports.generateRandomPassword = (length = 10) => {
  const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const specialChars = '@$!%*?&';
  const allChars = lowerChars + upperChars + numbers + specialChars;
  
  // Ensure at least one of each character type
  let password = '';
  password += lowerChars.charAt(Math.floor(Math.random() * lowerChars.length));
  password += upperChars.charAt(Math.floor(Math.random() * upperChars.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  
  // Fill the rest with random characters
  for (let i = 4; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date - Date object
 * @returns {string} - Formatted date
 */
exports.formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();
  
  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  
  return [year, month, day].join('-');
};

/**
 * Calculate age from date of birth
 * @param {Date} dob - Date of birth
 * @returns {number} - Age in years
 */
exports.calculateAge = (dob) => {
  if (!dob) return 0;
  
  const birthDate = new Date(dob);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Truncate text to a specific length
 * @param {string} text - Text to truncate
 * @param {number} [length=100] - Maximum length
 * @returns {string} - Truncated text
 */
exports.truncateText = (text, length = 100) => {
  if (!text) return '';
  
  if (text.length <= length) return text;
  
  return text.substring(0, length) + '...';
};

/**
 * Generate a unique ID with prefix
 * @param {string} [prefix=''] - Prefix for the ID
 * @returns {string} - Unique ID
 */
exports.generateUniqueId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).substring(2, 8);
  return prefix + timestamp + randomString;
};

/**
 * Convert snake_case to camelCase
 * @param {string} str - String in snake_case
 * @returns {string} - String in camelCase
 */
exports.snakeToCamel = (str) => {
  return str.toLowerCase().replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
};

/**
 * Convert camelCase to snake_case
 * @param {string} str - String in camelCase
 * @returns {string} - String in snake_case
 */
exports.camelToSnake = (str) => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

/**
 * Get nested object property safely
 * @param {Object} obj - Source object
 * @param {string} path - Property path (e.g., 'user.name')
 * @param {*} [defaultValue=null] - Default value if property doesn't exist
 * @returns {*} - Property value or default value
 */
exports.getNestedProperty = (obj, path, defaultValue = null) => {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined || !result.hasOwnProperty(key)) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result === undefined ? defaultValue : result;
};