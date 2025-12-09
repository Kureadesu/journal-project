// Simple client-side search over loaded entries
function filterEntries(query) {
  const q = (query || '').toLowerCase().trim();
  if (!window.__ENTRIES__) return [];
  if (!q) return window.__ENTRIES__;
  return window.__ENTRIES__.filter(e => {
    const title = (e.title || '').toLowerCase();
    const content = (e.content || '').toLowerCase();
    const tags = (e.mood_tags || []).join(' ').toLowerCase();
    return title.includes(q) || content.includes(q) || tags.includes(q);
  });
}

export { filterEntries };
