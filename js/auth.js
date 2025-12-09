// Authentication helpers for the journal app (ES modules)
// Usage: import { signUp, signIn, logout, sendPasswordReset, onAuthStateChangedListener } from './js/auth.js'

import { auth } from "../firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

async function signUp(email, password, displayName) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }
  // send verification email (optional, but recommended)
  await sendEmailVerification(userCredential.user);
  return userCredential.user;
}

async function signIn(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

async function logout() {
  await signOut(auth);
}

async function sendPasswordReset(email) {
  await sendPasswordResetEmail(auth, email);
}

function onAuthStateChangedListener(callback) {
  return onAuthStateChanged(auth, callback);
}

function getCurrentUser() {
  return auth.currentUser;
}

export { signUp, signIn, logout, sendPasswordReset, onAuthStateChangedListener, getCurrentUser };

// Example usage (in your pages):
// import { signIn, signUp, onAuthStateChangedListener } from './js/auth.js';
// onAuthStateChangedListener(user => { if (user) { /* show app */ } else { /* show login */ } });
