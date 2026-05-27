// Dark Mode Management Utility
const DARK_MODE_KEY = "admin-dark-mode";

export const getDarkMode = () => {
  try {
    const stored = localStorage.getItem(DARK_MODE_KEY);
    return stored ? JSON.parse(stored) : false;
  } catch (error) {
    console.error("Error reading dark mode from localStorage:", error);
    return false;
  }
};

export const setDarkModeStorage = (isDarkMode) => {
  try {
    localStorage.setItem(DARK_MODE_KEY, JSON.stringify(isDarkMode));
  } catch (error) {
    console.error("Error saving dark mode to localStorage:", error);
  }
};

export const toggleDarkMode = () => {
  const current = getDarkMode();
  const newValue = !current;
  setDarkModeStorage(newValue);
  return newValue;
};
