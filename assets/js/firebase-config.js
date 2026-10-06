/**
 * DIMABIN Portal — Central Firebase Configuration
 * Pure Vanilla JavaScript ES Module (Firebase Web SDK v12.19.0 CDN)
 *
 * Project ID: dimabinnewportal-cd827
 * Compatible with GitHub Pages and static deployments without any build step.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

export const firebaseConfig = {
  apiKey: "AIzaSyBbbUUzO5ZSg_UKnzPt706K4vtm4LEMX2U",
  authDomain: "dimabinnewportal-cd827.firebaseapp.com",
  projectId: "dimabinnewportal-cd827",
  storageBucket: "dimabinnewportal-cd827.firebasestorage.app",
  messagingSenderId: "632872437179",
  appId: "1:632872437179:web:195caaab7f2f272c45f09e"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);
