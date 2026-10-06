/**
 * DIMABIN Portal — Central Firebase User & Role Foundation
 * Pure Vanilla JavaScript ES Module (Firebase Web SDK v12.19.0 CDN)
 *
 * Implements role-based foundation for:
 * 1. student
 * 2. lecturer
 * 3. admin (Registrar / Administrator)
 *
 * Session structure:
 * Firebase Auth User -> UID -> users/{uid} -> role -> Student / Lecturer / Admin
 */

import { app } from "./firebase-config.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// Initialize Firebase Auth and Firestore services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Collection Name
export const USERS_COLLECTION = "users";

// TASK 2 — Role Constants
export const USER_ROLES = Object.freeze({
  STUDENT: "student",
  LECTURER: "lecturer",
  ADMIN: "admin"
});

// User Account Status Constants
export const USER_STATUS = Object.freeze({
  ACTIVE: "active",
  DISABLED: "disabled"
});

/**
 * TASK 3 & 4 — AUTHENTICATION, PROFILE & SESSION HELPERS
 */

/**
 * Get the currently authenticated Firebase user instance synchronously
 * @returns {import("https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js").User|null}
 */
export function getCurrentAuthUser() {
  return auth.currentUser;
}

/**
 * Listen for Firebase Authentication state changes
 * @param {(user: import("https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js").User|null) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Fetch user document from Firestore: users/{uid}
 * @param {string} uid - Firebase Auth UID
 * @returns {Promise<Object|null>} User profile data or null if document doesn't exist
 */
export async function getUserProfile(uid) {
  if (!uid) return null;
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return { id: userDocSnap.id, ...userDocSnap.data() };
    }
    return null;
  } catch (error) {
    console.error(`[DIMABIN Users] Error fetching profile for UID ${uid}:`, error);
    throw error;
  }
}

/**
 * Retrieve user's role from their Firestore profile
 * @param {string} uid - Firebase Auth UID
 * @returns {Promise<string|null>} Role string ('student' | 'lecturer' | 'admin') or null
 */
export async function getUserRole(uid) {
  const profile = await getUserProfile(uid);
  return profile?.role || null;
}

/**
 * Check whether a profile or role string matches the expected role
 * @param {Object|string} userOrRole - User profile object or role string
 * @param {string} expectedRole - Role from USER_ROLES
 * @returns {boolean}
 */
export function hasRole(userOrRole, expectedRole) {
  if (!userOrRole || !expectedRole) return false;
  const role = typeof userOrRole === "string" ? userOrRole : userOrRole?.role;
  return role === expectedRole;
}

/**
 * Check whether the currently authenticated user possesses a specific role
 * @param {string} expectedRole - Role from USER_ROLES
 * @returns {Promise<boolean>}
 */
export async function isCurrentUserRole(expectedRole) {
  const currentUser = getCurrentAuthUser();
  if (!currentUser) return false;
  const role = await getUserRole(currentUser.uid);
  return role === expectedRole;
}

/**
 * Create a new user profile document in users/{uid}
 * @param {string} uid - Firebase Auth UID
 * @param {Object} userData - User details (email, fullName, role, status)
 * @returns {Promise<Object>} Created user profile
 */
export async function createUserProfile(uid, userData = {}) {
  if (!uid) throw new Error("A valid UID is required to create a user profile.");

  const role = Object.values(USER_ROLES).includes(userData.role)
    ? userData.role
    : USER_ROLES.STUDENT;

  const status = Object.values(USER_STATUS).includes(userData.status)
    ? userData.status
    : USER_STATUS.ACTIVE;

  const newProfile = {
    uid,
    email: userData.email || "",
    fullName: userData.fullName || "",
    role,
    status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const userDocRef = doc(db, USERS_COLLECTION, uid);
  await setDoc(userDocRef, newProfile);
  return newProfile;
}

/**
 * Update an existing user profile in users/{uid}
 * @param {string} uid - Firebase Auth UID
 * @param {Object} updateData - Fields to update
 * @returns {Promise<void>}
 */
export async function updateUserProfile(uid, updateData = {}) {
  if (!uid) throw new Error("A valid UID is required to update a user profile.");

  const sanitizedData = {
    ...updateData,
    updatedAt: serverTimestamp()
  };

  // Prevent overriding UID or creation timestamp accidentally
  delete sanitizedData.uid;
  delete sanitizedData.createdAt;

  const userDocRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userDocRef, sanitizedData);
}

/**
 * Create or update user profile after authentication
 * @param {string} uid - Firebase Auth UID
 * @param {Object} data - Profile fields
 * @returns {Promise<Object>} Resulting profile
 */
export async function createOrUpdateUserProfile(uid, data = {}) {
  if (!uid) throw new Error("A valid UID is required.");
  const existing = await getUserProfile(uid);
  if (!existing) {
    return await createUserProfile(uid, data);
  }
  await updateUserProfile(uid, data);
  return { ...existing, ...data };
}

/**
 * Sign out the currently authenticated user safely
 * @returns {Promise<void>}
 */
export async function signOutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("[DIMABIN Users] Sign out error:", error);
    throw error;
  }
}

/**
 * TASK 4 — SESSION RESOLVER
 * Resolves full session state: Auth User -> UID -> users/{uid} -> Role
 * @returns {Promise<{
 *   isAuthenticated: boolean,
 *   authUser: Object|null,
 *   uid: string|null,
 *   profile: Object|null,
 *   role: string|null,
 *   isActive: boolean
 * }>}
 */
export async function getCurrentSession() {
  const authUser = getCurrentAuthUser();
  if (!authUser) {
    return {
      isAuthenticated: false,
      authUser: null,
      uid: null,
      profile: null,
      role: null,
      isActive: false
    };
  }

  const profile = await getUserProfile(authUser.uid);
  const role = profile?.role || null;
  const isActive = profile?.status === USER_STATUS.ACTIVE;

  return {
    isAuthenticated: true,
    authUser,
    uid: authUser.uid,
    profile,
    role,
    isActive
  };
}

// Expose safe inspection namespace on window for developer testing
if (typeof window !== "undefined") {
  window.dimabinUsers = {
    USER_ROLES,
    USER_STATUS,
    USERS_COLLECTION,
    getCurrentAuthUser,
    onAuthStateChange,
    getUserProfile,
    getUserRole,
    hasRole,
    isCurrentUserRole,
    createUserProfile,
    updateUserProfile,
    createOrUpdateUserProfile,
    signOutUser,
    getCurrentSession
  };
}
