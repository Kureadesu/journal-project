import { setUserSettings, getUserDoc } from './database.js';

async function applySavedTheme(uid) {
  try {
    const user = await getUserDoc(uid);
    const dark = user?.settings?.darkMode ?? false;
    setDarkMode(dark);
  } catch (e) {
    console.warn('Failed to apply saved theme', e);
  }
}

function setDarkMode(enabled) {
  if (enabled) document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}

async function toggleTheme(uid) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const next = !isDark;
  setDarkMode(next);
  try {
    await setUserSettings(uid, { darkMode: next });
  } catch (e) {
    console.warn('Failed to save theme', e);
  }
}

export { applySavedTheme, toggleTheme, setDarkMode };
