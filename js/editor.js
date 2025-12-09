// Enhanced editor module with rich text features
import { createEntry, setEntry, updateEntry } from './database.js';
import { showToast } from './toast.js';
import { showLoading, hideLoading } from './loading.js';

let currentEntryId = null;
let currentUid = null;
let autosaveTimer = null;
let wordCountTimer = null;

function setCurrentContext(uid, entryId = null) {
  currentUid = uid;
  currentEntryId = entryId;
}

function getEditor() {
  const editor = document.getElementById('editor');
  if (!editor) {
    console.warn('Editor element not found');
  }
  return editor;
}

function getTitleInput() {
  const title = document.getElementById('entry-title');
  if (!title) {
    console.warn('Title input element not found');
  }
  return title;
}

function format(command, value = null) {
  try {
    document.execCommand(command, false, value);
    const editor = getEditor();
    if (editor) editor.focus();
  } catch (error) {
    console.error('Format command failed:', error);
    showToast('Formatting failed', 'error');
  }
}

// Enhanced formatting commands
function formatHeading(level) {
  format('formatBlock', `h${level}`);
}

function insertLink() {
  const url = prompt('Enter URL:');
  if (url) {
    format('createLink', url);
  }
}

function insertList(ordered = false) {
  format(ordered ? 'insertOrderedList' : 'insertUnorderedList');
}

function insertQuote() {
  format('formatBlock', 'blockquote');
}

function clearFormatting() {
  format('removeFormat');
}

function undo() {
  format('undo');
}

function redo() {
  format('redo');
}

function loadEntryToEditor(entry) {
  const editor = getEditor();
  const title = getTitleInput();
  
  if (!editor || !title) {
    console.error('Cannot load entry: editor elements not found');
    return;
  }
  
  currentEntryId = entry?.id || null;
  title.value = entry?.title || '';
  editor.innerHTML = entry?.content || '';
  
  updateWordCount();
}

function getEditorContent() {
  const editor = getEditor();
  return editor ? editor.innerHTML : '';
}

function getPlainTextContent() {
  const editor = getEditor();
  if (!editor) return '';
  
  const text = editor.innerText || editor.textContent || '';
  return text.trim();
}

function updateWordCount() {
  const text = getPlainTextContent();
  const words = text ? text.split(/\s+/).filter(w => w.length > 0).length : 0;
  const chars = text.length;
  
  let wordCountEl = document.getElementById('word-count');
  if (!wordCountEl) {
    wordCountEl = document.createElement('div');
    wordCountEl.id = 'word-count';
    wordCountEl.style.cssText = `
      color: var(--text-secondary);
      font-size: 0.85rem;
      padding: 0.5rem;
      text-align: right;
    `;
    
    const toolbar = document.querySelector('.editor-toolbar');
    if (toolbar) {
      toolbar.appendChild(wordCountEl);
    }
  }
  
  wordCountEl.textContent = `${words} words · ${chars} characters`;
}

function startAutosave(interval = 5000) {
  stopAutosave();
  
  // Update word count on input
  const editor = getEditor();
  if (editor) {
    editor.addEventListener('input', () => {
      clearTimeout(wordCountTimer);
      wordCountTimer = setTimeout(updateWordCount, 300);
    });
  }
  
  autosaveTimer = setInterval(() => {
    try {
      const content = getEditorContent();
      const title = getTitleInput()?.value || '';
      
      if (!currentUid) {
        console.warn('No user context for autosave');
        return;
      }
      
      // Save draft locally
      const key = `draft-${currentUid}`;
      const draftData = { 
        title, 
        content, 
        timestamp: Date.now() 
      };
      
      localStorage.setItem(key, JSON.stringify(draftData));
      
      // Show autosave indicator
      showAutosaveIndicator();
    } catch (e) {
      console.warn('Autosave failed:', e);
    }
  }, interval);
}

function showAutosaveIndicator() {
  let indicator = document.getElementById('autosave-indicator');
  
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'autosave-indicator';
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 0.5rem 1rem;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 20px;
      font-size: 0.85rem;
      color: var(--text-secondary);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
      z-index: 1000;
    `;
    document.body.appendChild(indicator);
  }
  
  indicator.textContent = '💾 Saved';
  indicator.style.opacity = '1';
  
  setTimeout(() => {
    indicator.style.opacity = '0';
  }, 2000);
}

function stopAutosave() {
  if (autosaveTimer) {
    clearInterval(autosaveTimer);
    autosaveTimer = null;
  }
  if (wordCountTimer) {
    clearTimeout(wordCountTimer);
    wordCountTimer = null;
  }
}

async function saveAsDraft() {
  if (!currentUid) throw new Error('No user context');
  
  const content = getEditorContent();
  const title = getTitleInput()?.value || '';
  
  if (!content.trim() && !title.trim()) {
    showToast('Cannot save empty entry', 'warning');
    throw new Error('Cannot save empty entry');
  }
  
  try {
    showLoading('Saving draft...');
    
    if (currentEntryId) {
      await updateEntry(currentUid, currentEntryId, { title, content, is_draft: true });
    } else {
      const id = await createEntry(currentUid, { title, content, is_draft: true });
      currentEntryId = id;
    }
    
    showToast('Draft saved successfully', 'success');
    return currentEntryId;
  } catch (error) {
    console.error('Save draft failed:', error);
    showToast('Failed to save draft', 'error');
    throw new Error('Failed to save draft: ' + error.message);
  } finally {
    hideLoading();
  }
}

async function publishEntry(mood_tags = []) {
  if (!currentUid) throw new Error('No user context');
  
  const content = getEditorContent();
  const title = getTitleInput()?.value || '';
  
  if (!content.trim()) {
    showToast('Cannot publish empty entry', 'warning');
    throw new Error('Cannot publish empty entry');
  }
  
  try {
    showLoading('Publishing entry...');
    
    if (currentEntryId) {
      await setEntry(currentUid, currentEntryId, { 
        title, 
        content, 
        mood_tags, 
        is_draft: false 
      });
    } else {
      const id = await createEntry(currentUid, { 
        title, 
        content, 
        mood_tags, 
        is_draft: false 
      });
      currentEntryId = id;
    }
    
    showToast('Entry published successfully!', 'success');
    return currentEntryId;
  } catch (error) {
    console.error('Publish failed:', error);
    showToast('Failed to publish entry', 'error');
    throw new Error('Failed to publish entry: ' + error.message);
  } finally {
    hideLoading();
  }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  stopAutosave();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Check if we're in the editor
  const editor = getEditor();
  if (!editor || document.activeElement !== editor) return;
  
  if (e.ctrlKey || e.metaKey) {
    switch(e.key.toLowerCase()) {
      case 'b':
        e.preventDefault();
        format('bold');
        break;
      case 'i':
        e.preventDefault();
        format('italic');
        break;
      case 'u':
        e.preventDefault();
        format('underline');
        break;
      case 'k':
        e.preventDefault();
        insertLink();
        break;
      case 'z':
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
        break;
      case 's':
        e.preventDefault();
        saveAsDraft();
        break;
    }
  }
});

export { 
  format, 
  formatHeading,
  insertLink,
  insertList,
  insertQuote,
  clearFormatting,
  undo,
  redo,
  loadEntryToEditor, 
  startAutosave, 
  stopAutosave, 
  saveAsDraft, 
  publishEntry, 
  setCurrentContext, 
  getEditorContent,
  updateWordCount
};