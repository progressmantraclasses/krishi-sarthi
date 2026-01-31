export const validateQuery = (query: string, language: string): { isValid: boolean; error?: string } => {
  if (!query || query.trim().length === 0) {
    return { isValid: false, error: 'Query cannot be empty' };
  }

  if (query.trim().length < 3) {
    return { isValid: false, error: 'Query too short' };
  }

  if (query.length > 500) {
    return { isValid: false, error: 'Query too long (max 500 characters)' };
  }

  // Add language-specific validation if needed
  return { isValid: true };
};

export const validateLocation = (location: string): boolean => {
  const validLocations = ['delhi', 'punjab', 'uttar pradesh'];
  return validLocations.includes(location.toLowerCase());
};

export const validateLanguage = (language: string): boolean => {
  const validLanguages = ['en', 'hi', 'pa'];
  return validLanguages.includes(language);
};