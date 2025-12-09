// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD0xejqaVR_vRnyR27zMyP0CQlDh3cUFws",
  authDomain: "journal-project-10950.firebaseapp.com",
  projectId: "journal-project-10950",
  storageBucket: "journal-project-10950.firebasestorage.app",
  messagingSenderId: "1008297451940",
  appId: "1:1008297451940:web:3fb1ad7692b558553ae131",
  measurementId: "G-XNVD4P38X1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);