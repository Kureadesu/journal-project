// Editor module: formatting, autosave (localStorage), and saving to Firestore
import { createEntry, setEntry, updateEntry } from './database.js';

let currentEntryId = null;
let currentUid = null;
let autosaveTimer = null;

function setCurrentContext(uid, entryId = null) {
  currentUid = uid;
  currentEntryId = entryId;
}

function getEditor() {
  return document.getElementById('editor');
}

function getTitleInput() {
  return document.getElementById('entry-title');
}

function format(command) {
  document.execCommand(command);
}

function loadEntryToEditor(entry) {
  const editor = getEditor();
  const title = getTitleInput();
  currentEntryId = entry?.id || null;
  title.value = entry?.title || '';
  editor.innerHTML = entry?.content || '';
}

function getEditorContent() {
  return getEditor().innerHTML;
}

function startAutosave(interval = 5000) {
  stopAutosave();
  autosaveTimer = setInterval(() => {
    try {
      const content = getEditorContent();
      const title = getTitleInput().value;
      if (!currentUid) return;
      // save draft locally
      const key = `draft-${currentUid}`;
      localStorage.setItem(key, JSON.stringify({ title, content, timestamp: Date.now() }));
    } catch (e) {
      console.warn('Autosave failed', e);
    }
  }, interval);
}

function stopAutosave() {
  if (autosaveTimer) clearInterval(autosaveTimer);
}

async function saveAsDraft() {
  if (!currentUid) throw new Error('No user context');
  const content = getEditorContent();
  const title = getTitleInput().value;
  if (currentEntryId) {
    await updateEntry(currentUid, currentEntryId, { title, content, is_draft: true });
    return currentEntryId;
  } else {
    const id = await createEntry(currentUid, { title, content, is_draft: true });
    currentEntryId = id;
    return id;
  }
}

async function publishEntry(mood_tags = []) {
  if (!currentUid) throw new Error('No user context');
  const content = getEditorContent();
  const title = getTitleInput().value;
  if (currentEntryId) {
    await setEntry(currentUid, currentEntryId, { title, content, mood_tags, is_draft: false });
    return currentEntryId;
  } else {
    const id = await createEntry(currentUid, { title, content, mood_tags, is_draft: false });
    currentEntryId = id;
    return id;
  }
}

export { format, loadEntryToEditor, startAutosave, stopAutosave, saveAsDraft, publishEntry, setCurrentContext, getEditorContent };
