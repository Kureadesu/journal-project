import { listenEntries, deleteEntry, getEntries } from './database.js';
import { loadEntryToEditor, setCurrentContext } from './editor.js';

let unsubscribe = null;

function renderEntryCard(entry) {
  const el = document.createElement('div');
  el.className = 'entry-card';
  const title = entry.title || '(untitled)';
  const date = entry.timestamp?.toDate ? entry.timestamp.toDate().toLocaleString() : (entry.timestamp || '');
  el.innerHTML = `<div class="entry-main"><strong>${escapeHtml(title)}</strong><div class="meta">${date}</div></div>`;
  // mood tags
  const moods = document.createElement('div');
  moods.className = 'mood-list';
  (entry.mood_tags || []).slice(0,6).forEach(tag => {
    const s = document.createElement('span');
    s.className = 'mood-pill';
    s.textContent = tag;
    moods.appendChild(s);
  });
  el.appendChild(moods);
  el.dataset.id = entry.id;
  el.addEventListener('click', (e) => {
    // navigate to entry page for editing/viewing
    e.preventDefault();
    if (entry.id) {
      location.href = `entry.html?entryId=${entry.id}`;
    }
  });
  const del = document.createElement('button');
  del.textContent = 'Delete';
  del.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!confirm('Delete entry?')) return;
    await deleteEntry(window.__CURRENT_UID__, entry.id);
  });
  el.appendChild(del);
  return el;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
}

function mountEntriesList(container) {
  if (unsubscribe) unsubscribe();
  unsubscribe = listenEntries(window.__CURRENT_UID__, (entries) => {
    container.innerHTML = '';
    entries.forEach(e => container.appendChild(renderEntryCard(e)));
    const countEl = document.getElementById('entry-count');
    if (countEl) countEl.textContent = `Entries: ${entries.length}`;
    // expose last entries for search/streak
    window.__ENTRIES__ = entries;
  });
}

async function loadInitialEntries(container) {
  const entries = await getEntries(window.__CURRENT_UID__);
  container.innerHTML = '';
  entries.forEach(e => container.appendChild(renderEntryCard(e)));
  window.__ENTRIES__ = entries;
}

export { mountEntriesList, loadInitialEntries };
