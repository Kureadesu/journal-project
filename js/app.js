import { onAuthStateChangedListener, logout } from './auth.js';
import { mountEntriesList } from './entries.js';
import { filterEntries } from './search.js';
import { applySavedTheme, toggleTheme } from './theme.js';
import { computeStreak } from './streak.js';

let uid = null;

function initUiBindings() {
  document.getElementById('logout').addEventListener('click', async () => { 
    await logout(); 
    location.href = 'index.html'; 
  });
  
  document.getElementById('toggle-dark').addEventListener('click', () => toggleTheme(uid));

  const newBtn = document.getElementById('new-entry-btn');
  if (newBtn) {
    newBtn.addEventListener('click', () => { 
      location.href = 'entry.html'; 
    });
  }

  const search = document.getElementById('search');
  const list = document.getElementById('entries-list');
  if (search) {
    search.addEventListener('input', (e) => {
      const results = filterEntries(e.target.value || '');
      list.innerHTML = '';
      results.forEach(r => {
        const el = document.createElement('div');
        el.className = 'entry-card';
        el.textContent = r.title || '(untitled)';
        el.addEventListener('click', () => location.href = `entry.html?entryId=${r.id}`);
        list.appendChild(el);
      });
    });
  }
}

function updateStreakDisplay(entries) {
  const streak = computeStreak(entries || window.__ENTRIES__ || []);
  let el = document.getElementById('streak');
  if (!el) {
    el = document.createElement('div');
    el.id = 'streak';
    document.querySelector('header').appendChild(el);
  }
  el.textContent = `Streak: ${streak} 🔥`;
}

onAuthStateChangedListener(async (user) => {
  if (!user) return location.href = 'index.html';
  uid = user.uid;
  window.__CURRENT_UID__ = uid;
  initUiBindings();
  applySavedTheme(uid);
  const entriesList = document.getElementById('entries-list');
  mountEntriesList(entriesList);
  
  // Update entry count and streak periodically
  const entryCountEl = document.getElementById('entry-count');
  setInterval(() => {
    const entries = window.__ENTRIES__ || [];
    if (entryCountEl) entryCountEl.textContent = `Entries: ${entries.length}`;
    updateStreakDisplay(entries);
  }, 800);
});