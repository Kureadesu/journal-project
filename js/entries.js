import { listenEntries, deleteEntry, getEntries } from './database.js';

let unsubscribe = null;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function renderEntryCard(entry) {
  const el = document.createElement('div');
  el.className = 'entry-card';
  
  const title = entry.title || '(untitled)';
  let date = '';
  
  try {
    if (entry.timestamp?.toDate) {
      date = entry.timestamp.toDate().toLocaleString();
    } else if (entry.timestamp) {
      date = new Date(entry.timestamp).toLocaleString();
    }
  } catch (error) {
    console.warn('Error formatting date:', error);
    date = 'Unknown date';
  }
  
  el.innerHTML = `
    <div class="entry-main">
      <strong>${escapeHtml(title)}</strong>
      <div class="meta">${escapeHtml(date)}</div>
    </div>
  `;
  
  // Mood tags
  if (entry.mood_tags && entry.mood_tags.length > 0) {
    const moods = document.createElement('div');
    moods.className = 'mood-list';
    entry.mood_tags.slice(0, 6).forEach(tag => {
      const s = document.createElement('span');
      s.className = 'mood-pill';
      s.textContent = tag;
      moods.appendChild(s);
    });
    el.appendChild(moods);
  }
  
  el.dataset.id = entry.id;
  
  // Click handler for viewing/editing
  el.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') return; // Don't navigate if clicking delete
    e.preventDefault();
    if (entry.id) {
      location.href = `entry.html?entryId=${entry.id}`;
    }
  });
  
  // Delete button
  const del = document.createElement('button');
  del.textContent = 'Delete';
  del.className = 'btn btn-sm btn-outline-danger mt-2';
  del.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    
    try {
      await deleteEntry(window.__CURRENT_UID__, entry.id);
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete entry: ' + error.message);
    }
  });
  el.appendChild(del);
  
  return el;
}

function mountEntriesList(container) {
  if (!container) {
    console.error('Container element not found');
    return;
  }
  
  if (unsubscribe) unsubscribe();
  
  unsubscribe = listenEntries(window.__CURRENT_UID__, (entries) => {
    container.innerHTML = '';
    
    if (entries.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'text-muted text-center p-3';
      emptyMsg.textContent = 'No entries yet. Start writing!';
      container.appendChild(emptyMsg);
    } else {
      entries.forEach(e => container.appendChild(renderEntryCard(e)));
    }
    
    const countEl = document.getElementById('entry-count');
    if (countEl) countEl.textContent = `Entries: ${entries.length}`;
    
    // Expose entries for search/streak
    window.__ENTRIES__ = entries;
  });
}

async function loadInitialEntries(container) {
  if (!container) {
    console.error('Container element not found');
    return;
  }
  
  try {
    const entries = await getEntries(window.__CURRENT_UID__);
    container.innerHTML = '';
    
    if (entries.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'text-muted text-center p-3';
      emptyMsg.textContent = 'No entries yet. Start writing!';
      container.appendChild(emptyMsg);
    } else {
      entries.forEach(e => container.appendChild(renderEntryCard(e)));
    }
    
    window.__ENTRIES__ = entries;
  } catch (error) {
    console.error('Failed to load entries:', error);
    container.innerHTML = '<div class="text-danger text-center p-3">Failed to load entries</div>';
  }
}

export { mountEntriesList, loadInitialEntries };