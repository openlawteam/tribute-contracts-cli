/**
 * normalizeString
 *
 * Converts string case to lowerCase and trims whitespace.
 *
 * @param {string} stringToNormalize
 * @returns {string} The normalized string lowercased and trimmed.
 */
export const normalizeString = (stringToNormalize) => {
  return stringToNormalize.toLowerCase().trim();
};
