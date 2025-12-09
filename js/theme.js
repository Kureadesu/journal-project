import { setUserSettings, getUserDoc } from './database.js';

// Dark is default. Light theme is applied by setting `data-theme="light"` on :root.
async function applySavedTheme(uid) {
  try {
    const user = await getUserDoc(uid);
    const dark = user?.settings?.darkMode;
    // If undefined, prefer dark by default
    if (dark === undefined) return setTheme(true);
    setTheme(!!dark);
  } catch (e) {
    console.warn('Failed to apply saved theme', e);
  }
}

function setTheme(darkEnabled) {
  if (darkEnabled) {
    // dark: remove the explicit light attribute so default dark variables apply
    document.documentElement.removeAttribute('data-theme');
  } else {
    // light: set explicit light theme
    document.documentElement.setAttribute('data-theme', 'light');
  }
}

async function toggleTheme(uid) {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const nextDark = isLight; // if currently light, next should be dark (true)
  setTheme(nextDark);
  try {
    await setUserSettings(uid, { darkMode: nextDark });
  } catch (e) {
    console.warn('Failed to save theme', e);
  }
}

async function setThemeAndSave(uid, darkEnabled) {
  setTheme(darkEnabled);
  try {
    await setUserSettings(uid, { darkMode: darkEnabled });
  } catch (e) {
    console.warn('Failed to save theme', e);
  }
}

export { applySavedTheme, toggleTheme, setTheme, setThemeAndSave };
