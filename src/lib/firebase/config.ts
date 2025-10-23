// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  "projectId": "studio-4703207530-7e045",
  "appId": "1:749682482571:web:1f1954385e5aba2aae638e",
  "apiKey": "AIzaSyCcauqOxcRYx9CBOVSrOLQBnFkoyAwTc6c",
  "authDomain": "studio-4703207530-7e045.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "749682482571"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
export const db = getFirestore(app);
