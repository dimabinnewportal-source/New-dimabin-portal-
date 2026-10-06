/**
 * DIMABIN Portal — Admission Management System Foundation
 * Pure Vanilla JavaScript ES Module (Firebase Web SDK v12.19.0 CDN)
 *
 * Firestore Document Structure:
 * Collection: "system_settings"
 * Document:   "admissions"
 *
 * Fields:
 * - isOpen: boolean
 * - academicSession: string
 * - openingDate: timestamp or ISO-compatible date value
 * - closingDate: timestamp or ISO-compatible date value
 * - updatedAt: timestamp or ISO-compatible date value
 * - updatedBy: string
 */

import { app } from "./firebase-config.js";
import { db } from "./firebase-users.js";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

export const SETTINGS_COLLECTION = "system_settings";
export const ADMISSIONS_DOC_ID = "admissions";
export const STORAGE_KEY = "dimabin_admission_settings";
export const SETTINGS_EVENT = "dimabin:admissions-updated";

/**
 * Initial canonical development values
 */
export const DEFAULT_ADMISSION_SETTINGS = Object.freeze({
  isOpen: true,
  academicSession: "2026/2027",
  openingDate: "2026-01-15",
  closingDate: "2026-11-30",
  updatedAt: new Date().toISOString(),
  updatedBy: "DIMABIN/ADM/2026/01"
});

/**
 * Format a Firestore Timestamp or date representation into YYYY-MM-DD or readable string
 */
export function formatAdmissionDate(dateVal) {
  if (!dateVal) return "";
  try {
    if (typeof dateVal?.toDate === "function") {
      return dateVal.toDate().toISOString().split("T")[0];
    }
    if (dateVal instanceof Date) {
      return dateVal.toISOString().split("T")[0];
    }
    if (typeof dateVal === "string") {
      return dateVal.includes("T") ? dateVal.split("T")[0] : dateVal;
    }
    if (typeof dateVal?.seconds === "number") {
      return new Date(dateVal.seconds * 1000).toISOString().split("T")[0];
    }
  } catch (_) {}
  return String(dateVal);
}

/**
 * Format timestamp into human-readable date and time for admin audit display
 */
export function formatAuditDateTime(dateVal) {
  if (!dateVal) return "Recently";
  try {
    let d;
    if (typeof dateVal?.toDate === "function") {
      d = dateVal.toDate();
    } else if (typeof dateVal?.seconds === "number") {
      d = new Date(dateVal.seconds * 1000);
    } else {
      d = new Date(dateVal);
    }
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
  } catch (_) {}
  return String(dateVal);
}

/**
 * Read cached settings from localStorage with fallback to default
 */
export function getLocalAdmissionSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_ADMISSION_SETTINGS,
        ...parsed,
        isOpen: Boolean(parsed.isOpen)
      };
    }
  } catch (_) {}
  return { ...DEFAULT_ADMISSION_SETTINGS };
}

/**
 * Save settings to localStorage and trigger internal notification event
 */
export function saveLocalAdmissionSettings(settings) {
  try {
    const payload = {
      ...DEFAULT_ADMISSION_SETTINGS,
      ...settings,
      isOpen: Boolean(settings.isOpen)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: payload }));
    }
    return payload;
  } catch (err) {
    console.warn("[DIMABIN Admissions] Local storage write warning:", err.message);
    return settings;
  }
}

/**
 * Normalize Firestore document snapshot or data object
 */
export function normalizeAdmissionData(rawData) {
  if (!rawData) return getLocalAdmissionSettings();

  return {
    isOpen: typeof rawData.isOpen === "boolean" ? rawData.isOpen : true,
    academicSession: rawData.academicSession || "2026/2027",
    openingDate: formatAdmissionDate(rawData.openingDate) || "2026-01-15",
    closingDate: formatAdmissionDate(rawData.closingDate) || "2026-11-30",
    updatedAt: rawData.updatedAt || new Date().toISOString(),
    updatedBy: rawData.updatedBy || "DIMABIN/ADM/2026/01"
  };
}

/**
 * Fetch current admission settings from Firestore with resilient fallback
 * @returns {Promise<{ isOpen: boolean, academicSession: string, openingDate: string, closingDate: string, updatedAt: any, updatedBy: string }>}
 */
export async function getAdmissionSettings() {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, ADMISSIONS_DOC_ID);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = normalizeAdmissionData(snap.data());
      saveLocalAdmissionSettings(data);
      return data;
    } else {
      console.log("[DIMABIN Admissions] No system_settings/admissions doc found. Returning defaults.");
      return getLocalAdmissionSettings();
    }
  } catch (err) {
    console.warn("[DIMABIN Admissions] Firestore read warning (using local/default cache):", err.message);
    return getLocalAdmissionSettings();
  }
}

/**
 * Subscribe to real-time changes of system_settings/admissions
 * @param {(settings: Object) => void} onUpdate
 * @returns {() => void} Unsubscribe function
 */
export function subscribeAdmissionSettings(onUpdate) {
  if (typeof onUpdate !== "function") return () => {};

  // Immediate emit from local cache for instant UI rendering
  onUpdate(getLocalAdmissionSettings());

  // Listen to window custom event and cross-tab storage changes
  const handleLocalEvent = (e) => {
    if (e.detail) onUpdate(e.detail);
  };
  const handleStorageEvent = (e) => {
    if (e.key === STORAGE_KEY) {
      onUpdate(getLocalAdmissionSettings());
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener(SETTINGS_EVENT, handleLocalEvent);
    window.addEventListener("storage", handleStorageEvent);
  }

  // Subscribe to Firestore live updates
  let unsubscribeFirestore = () => {};
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, ADMISSIONS_DOC_ID);
    unsubscribeFirestore = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = normalizeAdmissionData(snap.data());
          saveLocalAdmissionSettings(data);
          onUpdate(data);
        } else {
          onUpdate(getLocalAdmissionSettings());
        }
      },
      (error) => {
        console.warn("[DIMABIN Admissions] Firestore onSnapshot warning (active local fallback):", error.message);
        onUpdate(getLocalAdmissionSettings());
      }
    );
  } catch (err) {
    console.warn("[DIMABIN Admissions] Firestore subscription initialization warning:", err.message);
  }

  return () => {
    try {
      unsubscribeFirestore();
    } catch (_) {}
    if (typeof window !== "undefined") {
      window.removeEventListener(SETTINGS_EVENT, handleLocalEvent);
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
}

/**
 * Save / Update admission settings in Firestore (system_settings/admissions)
 * @param {Object} newSettings
 * @param {boolean} newSettings.isOpen
 * @param {string} newSettings.academicSession
 * @param {string} newSettings.openingDate
 * @param {string} newSettings.closingDate
 * @param {string} [newSettings.updatedBy]
 * @returns {Promise<{ success: boolean, data: Object, message: string }>}
 */
export async function updateAdmissionSettings({
  isOpen,
  academicSession,
  openingDate,
  closingDate,
  updatedBy = "DIMABIN/ADM/2026/01"
}) {
  const normalized = {
    isOpen: Boolean(isOpen),
    academicSession: (academicSession || "2026/2027").trim(),
    openingDate: openingDate || "2026-01-15",
    closingDate: closingDate || "2026-11-30",
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy || "DIMABIN/ADM/2026/01"
  };

  // Always save locally first so UI updates immediately
  saveLocalAdmissionSettings(normalized);

  let firestoreSuccess = false;
  let firestoreError = null;

  try {
    const docRef = doc(db, SETTINGS_COLLECTION, ADMISSIONS_DOC_ID);
    await setDoc(
      docRef,
      {
        ...normalized,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    firestoreSuccess = true;
    console.log("[DIMABIN Admissions] Firestore system_settings/admissions updated successfully.");
  } catch (err) {
    firestoreError = err;
    console.warn("[DIMABIN Admissions] Firestore setDoc error (saved to local cache):", err.message);
  }

  return {
    success: true,
    firestoreSynced: firestoreSuccess,
    data: normalized,
    message: firestoreSuccess
      ? "Admission availability settings saved to Firestore and published institute-wide."
      : `Admission settings updated locally (Firestore note: ${firestoreError?.message || "Synced to local session"}).`
  };
}
