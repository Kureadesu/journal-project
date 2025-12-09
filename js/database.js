// Firestore helpers for journal entries and user settings
import { db } from '../firebase-config.js';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  getDoc,
  updateDoc,
  deleteDoc
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

function userEntriesCollection(uid) {
  return collection(db, 'users', uid, 'journal_entries');
}

async function createEntry(uid, { title = '', content = '', mood_tags = [], is_draft = true } = {}) {
  const col = userEntriesCollection(uid);
  const docRef = await addDoc(col, {
    title,
    content,
    mood_tags,
    is_draft,
    timestamp: serverTimestamp()
  });
  return docRef.id;
}

async function updateEntry(uid, entryId, data) {
  const ref = doc(db, 'users', uid, 'journal_entries', entryId);
  await updateDoc(ref, data);
}

async function setEntry(uid, entryId, data) {
  const ref = doc(db, 'users', uid, 'journal_entries', entryId);
  await setDoc(ref, { ...data, timestamp: serverTimestamp() }, { merge: true });
}

async function deleteEntry(uid, entryId) {
  const ref = doc(db, 'users', uid, 'journal_entries', entryId);
  await deleteDoc(ref);
}

async function getEntries(uid) {
  const col = userEntriesCollection(uid);
  const q = query(col, orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  const results = [];
  snap.forEach(d => results.push({ id: d.id, ...d.data() }));
  return results;
}

function listenEntries(uid, onChange) {
  const col = userEntriesCollection(uid);
  const q = query(col, orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snap) => {
    const results = [];
    snap.forEach(d => results.push({ id: d.id, ...d.data() }));
    onChange(results);
  });
}

// User settings
async function setUserSettings(uid, settings) {
  const ref = doc(db, 'users', uid);
  await setDoc(ref, { settings }, { merge: true });
}

async function updateUserSettings(uid, patches) {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, { 'settings': { ...patches } });
}

async function getUserDoc(uid) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

async function getEntry(uid, entryId) {
  const ref = doc(db, 'users', uid, 'journal_entries', entryId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export { createEntry, updateEntry, setEntry, deleteEntry, getEntries, listenEntries, setUserSettings, getUserDoc, updateUserSettings, getEntry };
