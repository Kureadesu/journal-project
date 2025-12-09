// Centralized app logic for the home page
import { onAuthStateChangedListener, logout } from './auth.js';
import { listenEntries, deleteEntry } from './database.js';
import { filterEntries } from './search.js';
import { applySavedTheme, setThemeAndSave } from './theme.js';
import { computeStreak } from './streak.js';
import { showToast } from './toast.js';
import { showLoading, hideLoading } from './loading.js';

let uid = null;
let allEntries = [];
let pendingDeleteEntry = null;

function updateStreakDisplay(entries) {
  const streak = computeStreak(entries || []);
  let el = document.getElementById('streak');
  if (el) {
    el.textContent = `🔥 ${streak} day${streak !== 1 ? 's' : ''}`;
    el.style.display = streak > 0 ? 'block' : 'none';
  }
}

function updateStatsCards(entries) {
  const statsContainer = document.getElementById('stats-cards');
  if (!statsContainer) return;

  const totalWords = entries.reduce((sum, e) => {
    const text = e.content?.replace(/<[^>]*>/g, '') || '';
    return sum + text.split(/\s+/).filter(w => w).length;
  }, 0);

  const allMoods = entries.flatMap(e => e.mood_tags || []);
  const uniqueMoods = new Set(allMoods);

  const stats = [
    { icon: '📊', label: 'Total Entries', value: entries.length },
    { icon: '📝', label: 'Total Words', value: totalWords.toLocaleString() },
    { icon: '😊', label: 'Unique Moods', value: uniqueMoods.size },
    { icon: '🔥', label: 'Day Streak', value: computeStreak(entries) }
  ];

  statsContainer.innerHTML = stats.map(stat => `
    <div style="background: var(--card); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border); text-align: center;">
      <div style="font-size: 2rem; margin-bottom: 0.5rem;">${stat.icon}</div>
      <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem;">${stat.value}</div>
      <div style="font-size: 0.85rem; color: var(--text-secondary);">${stat.label}</div>
    </div>
  `).join('');
}

function renderEntryCard(entry) {
  const el = document.createElement('div');
  el.className = 'entry-card';
  el.style.cssText = `
    padding: 1rem;
    border-radius: 8px;
    background: var(--hover);
    border: 1px solid var(--border);
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 0.75rem;
  `;

  const title = entry.title || '(untitled)';
  let date = '';
  try {
    if (entry.timestamp?.toDate) {
      date = entry.timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  } catch (error) {
    date = 'Unknown date';
  }

  const preview = entry.content?.replace(/<[^>]*>/g, '').substring(0, 100) || '';

  el.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
      <strong style="color: var(--text-primary); font-size: 1rem;">${escapeHtml(title)}</strong>
      <button class="delete-btn" style="background: transparent; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.2rem; padding: 0; width: 24px; height: 24px;">✕</button>
    </div>
    <div style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 0.5rem;">${date}</div>
    ${preview ? `<div style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.4; margin-bottom: 0.5rem;">${escapeHtml(preview)}...</div>` : ''}
    ${entry.mood_tags?.length ? `
      <div style="display: flex; gap: 0.35rem; flex-wrap: wrap; margin-top: 0.5rem;">
        ${entry.mood_tags.slice(0, 3).map(tag => `
          <span style="background: var(--accent); color: white; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.75rem;">${escapeHtml(tag)}</span>
        `).join('')}
        ${entry.mood_tags.length > 3 ? `<span style="color: var(--text-secondary); font-size: 0.75rem; padding: 0.2rem 0.5rem;">+${entry.mood_tags.length - 3} more</span>` : ''}
      </div>
    ` : ''}
  `;

  el.addEventListener('click', (e) => {
    if (!e.target.classList.contains('delete-btn')) {
      location.href = `entry.html?entryId=${entry.id}`;
    }
  });

  el.querySelector('.delete-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    showDeleteConfirmation(entry);
  });

  return el;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>\"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
}

function showDeleteConfirmation(entry) {
  pendingDeleteEntry = entry;
  const modal = document.getElementById('confirm-modal');
  const message = document.getElementById('confirm-message');
  message.textContent = `Are you sure you want to delete "${entry.title || 'Untitled'}"? This cannot be undone.`;
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
}

function hideDeleteConfirmation() {
  const modal = document.getElementById('confirm-modal');
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  pendingDeleteEntry = null;
}

document.getElementById('cancel-delete').addEventListener('click', hideDeleteConfirmation);
document.getElementById('confirm-delete').addEventListener('click', async () => {
  if (!pendingDeleteEntry) return;
  try {
    showLoading('Deleting entry...');
    await deleteEntry(uid, pendingDeleteEntry.id);
    showToast('Entry deleted successfully', 'success');
    hideDeleteConfirmation();
  } catch (error) {
    console.error('Delete failed:', error);
    showToast('Failed to delete entry', 'error');
  } finally {
    hideLoading();
  }
});

function populateMoodFilter(entries) {
  const moodFilter = document.getElementById('filter-mood');
  const allMoods = new Set();
  entries.forEach(e => {
    (e.mood_tags || []).forEach(mood => allMoods.add(mood));
  });

  moodFilter.innerHTML = '<option value="">All Moods</option>';
  Array.from(allMoods).sort().forEach(mood => {
    const option = document.createElement('option');
    option.value = mood;
    option.textContent = mood;
    moodFilter.appendChild(option);
  });
}

function applyFiltersAndSort() {
  const searchTerm = document.getElementById('search').value.toLowerCase();
  const moodFilter = document.getElementById('filter-mood').value;
  const sortBy = document.getElementById('sort-by').value;

  let filtered = allEntries.filter(e => {
    const matchesSearch = !searchTerm || 
      (e.title || '').toLowerCase().includes(searchTerm) ||
      (e.content || '').toLowerCase().includes(searchTerm) ||
      (e.mood_tags || []).some(m => m.toLowerCase().includes(searchTerm));
    
    const matchesMood = !moodFilter || (e.mood_tags || []).includes(moodFilter);

    return matchesSearch && matchesMood;
  });

  // Sort
  filtered.sort((a, b) => {
    if (sortBy === 'date-desc') {
      return (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0);
    } else if (sortBy === 'date-asc') {
      return (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0);
    } else if (sortBy === 'title') {
      return (a.title || '').localeCompare(b.title || '');
    }
    return 0;
  });

  const container = document.getElementById('entries-list');
  container.innerHTML = '';
  
  if (filtered.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">No entries found</div>';
  } else {
    filtered.forEach(e => container.appendChild(renderEntryCard(e)));
  }
}

onAuthStateChangedListener(async (user) => {
  if (!user) return location.href = 'index.html';
  uid = user.uid;
  window.__CURRENT_UID__ = uid;

  document.getElementById('logout').addEventListener('click', async () => {
    try {
      await logout();
      showToast('Signed out successfully', 'success');
      location.href = 'index.html';
    } catch (error) {
      showToast('Failed to sign out', 'error');
    }
  });

  const themeSwitch = document.getElementById('theme-switch');
  await applySavedTheme(uid);
  // sync switch state: aria-checked=true means light
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  if (themeSwitch) {
    themeSwitch.setAttribute('aria-checked', isLight ? 'true' : 'false');
    themeSwitch.classList.toggle('on', isLight);
    themeSwitch.addEventListener('click', (e) => {
      const currentlyLight = document.documentElement.getAttribute('data-theme') === 'light';
      const nextDark = currentlyLight; // if currently light, next should be dark (true)
      setThemeAndSave(uid, nextDark).then(() => {
        // update UI state
        const nowLight = document.documentElement.getAttribute('data-theme') === 'light';
        if (themeSwitch) {
          themeSwitch.setAttribute('aria-checked', nowLight ? 'true' : 'false');
          themeSwitch.classList.toggle('on', nowLight);
        }
      });
    });
  }

  const entriesList = document.getElementById('entries-list');
  listenEntries(uid, (entries) => {
    allEntries = entries;
    applyFiltersAndSort();
    
    document.getElementById('entry-count').textContent = `${entries.length} ${entries.length === 1 ? 'Entry' : 'Entries'}`;
    updateStreakDisplay(entries);
    updateStatsCards(entries);
    populateMoodFilter(entries);

    window.__ENTRIES__ = entries;
  });

  document.getElementById('search').addEventListener('input', applyFiltersAndSort);
  document.getElementById('filter-mood').addEventListener('change', applyFiltersAndSort);
  document.getElementById('sort-by').addEventListener('change', applyFiltersAndSort);
});

export {};