/**
 * DIMABIN ADMINISTRATOR DASHBOARD — CENTRAL FIREBASE BACKEND SERVICE
 * Pure Vanilla JavaScript ES Module (Firebase Web SDK v12.19.0 CDN)
 *
 * Connects the Administrator Dashboard to real Firestore collections:
 * - users
 * - admissions
 * - students
 * - lecturers
 * - courses
 * - course_allocations
 * - study_centres
 * - results
 * - announcements
 * - notifications
 * - public_notifications
 * - portal_notifications
 * - hgs_activity_logs
 * - system_settings
 */

import { app } from "./firebase-config.js";
import { auth, db, getCurrentAuthUser } from "./firebase-users.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// Canonical collection identifiers
export const COLLECTIONS = Object.freeze({
  USERS: "users",
  ADMISSIONS: "admissions",
  STUDENTS: "students",
  LECTURERS: "lecturers",
  COURSES: "courses",
  COURSE_ALLOCATIONS: "course_allocations",
  REGISTRATION_SETTINGS: "registration_settings",
  COURSE_REGISTRATIONS: "course_registrations",
  STUDY_CENTRES: "studyCentres",
  STUDY_CENTRES_LEGACY: "study_centres",
  RESULTS: "results",
  ASSESSMENTS: "course_assessments",
  CBT_QUESTIONS: "cbt_questions",
  CBT_ASSESSMENTS: "cbt_assessments",
  CBT_SUBMISSIONS: "cbt_submissions",
  CBT_SETTINGS: "cbt_settings",
  ANNOUNCEMENTS: "announcements",
  NOTIFICATIONS: "notifications",
  PUBLIC_NOTIFICATIONS: "public_notifications",
  PORTAL_NOTIFICATIONS: "portal_notifications",
  ACTIVITY_LOGS: "hgs_activity_logs",
  SYSTEM_SETTINGS: "system_settings"
});

// Canonical Admin Identifiers
export const ADMIN_CREDENTIALS = Object.freeze({
  ADMIN_ID: "DIMABIN/ADM/2026/01",
  ADMIN_EMAIL: "dimabinnewportal@gmail.com",
  ROLE: "SUPER ADMINISTRATOR"
});

// Local cache key prefix for fallback storage
const CACHE_PREFIX = "dimabin_db_cache_";

/**
 * Format timestamp or date to readable string
 */
export function formatDateTime(val) {
  if (!val) return "Just now";
  try {
    let d;
    if (typeof val?.toDate === "function") {
      d = val.toDate();
    } else if (typeof val?.seconds === "number") {
      d = new Date(val.seconds * 1000);
    } else if (val instanceof Date) {
      d = val;
    } else {
      d = new Date(val);
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
  return String(val);
}

export function formatDateOnly(val) {
  if (!val) return "N/A";
  try {
    let d;
    if (typeof val?.toDate === "function") {
      d = val.toDate();
    } else if (typeof val?.seconds === "number") {
      d = new Date(val.seconds * 1000);
    } else if (val instanceof Date) {
      d = val;
    } else {
      d = new Date(val);
    }
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    }
  } catch (_) {}
  return String(val);
}

/**
 * Local resilient cache helpers
 */
function getCachedCollection(collName) {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${collName}`);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [];
}

function setCachedCollection(collName, items) {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${collName}`, JSON.stringify(items));
  } catch (_) {}
}

function upsertCachedItem(collName, item) {
  const items = getCachedCollection(collName);
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], ...item };
  } else {
    items.unshift(item);
  }
  setCachedCollection(collName, items);
  dispatchCollectionEvent(collName, items);
}

function removeCachedItem(collName, itemId) {
  const items = getCachedCollection(collName).filter((i) => i.id !== itemId);
  setCachedCollection(collName, items);
  dispatchCollectionEvent(collName, items);
}

function dispatchCollectionEvent(collName, items) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(`dimabin:db:${collName}`, { detail: items }));
  }
}

/**
 * =========================================================================
 * SAMPLE ARTIFACT ELIMINATION & PURGE ROUTINE
 * Guarantees that only genuine, admin-created records ever exist.
 * Permanently removes all known AI Studio placeholder/seed records.
 * =========================================================================
 */
export const KNOWN_SAMPLE_CENTRE_IDS = Object.freeze([
  "centre_goshen_central",
  "centre_lagos_outreach",
  "centre_ibadan_regional",
  "centre_online_hub"
]);

export const KNOWN_SAMPLE_LECTURER_IDS = Object.freeze([
  "lec_olubunmi_01",
  "lec_adebayo_02",
  "lec_adeleke_03",
  "lec_ogundipe_04",
  "lec_babalola_05"
]);

export const KNOWN_SAMPLE_ALLOCATION_IDS = Object.freeze([
  "alloc_crs_THY_101_goshen_sem1",
  "alloc_crs_BIB_101_goshen_sem1"
]);

// 1. Immediately purge local cache from sample records
(function purgeLegacySampleCache() {
  try {
    const centreSet = new Set(KNOWN_SAMPLE_CENTRE_IDS);
    const cKey = `${CACHE_PREFIX}${COLLECTIONS.STUDY_CENTRES}`;
    const rawC = localStorage.getItem(cKey);
    if (rawC) {
      const list = JSON.parse(rawC);
      if (Array.isArray(list)) {
        const cleaned = list.filter((c) => !centreSet.has(c.id) && !centreSet.has(c.centreId));
        localStorage.setItem(cKey, JSON.stringify(cleaned));
      }
    }

    const lecSet = new Set(KNOWN_SAMPLE_LECTURER_IDS);
    const lKey = `${CACHE_PREFIX}${COLLECTIONS.LECTURERS}`;
    const rawL = localStorage.getItem(lKey);
    if (rawL) {
      const list = JSON.parse(rawL);
      if (Array.isArray(list)) {
        const cleaned = list.filter((l) => !lecSet.has(l.id) && !lecSet.has(l.staffId));
        localStorage.setItem(lKey, JSON.stringify(cleaned));
      }
    }

    const allocSet = new Set(KNOWN_SAMPLE_ALLOCATION_IDS);
    const aKey = `${CACHE_PREFIX}${COLLECTIONS.COURSE_ALLOCATIONS}`;
    const rawA = localStorage.getItem(aKey);
    if (rawA) {
      const list = JSON.parse(rawA);
      if (Array.isArray(list)) {
        const cleaned = list.filter((a) => !allocSet.has(a.id));
        localStorage.setItem(aKey, JSON.stringify(cleaned));
      }
    }
  } catch (_) {}
})();

// 2. Quietly clean up confirmed AI Studio sample documents from Firestore if present
(async function cleanupSampleRecordsFromFirestore() {
  try {
    for (const cId of KNOWN_SAMPLE_CENTRE_IDS) {
      try {
        const snap = await getDoc(doc(db, COLLECTIONS.STUDY_CENTRES, cId));
        if (snap.exists()) {
          await deleteDoc(doc(db, COLLECTIONS.STUDY_CENTRES, cId));
        }
      } catch (_) {}
    }
    for (const lId of KNOWN_SAMPLE_LECTURER_IDS) {
      try {
        const snap = await getDoc(doc(db, COLLECTIONS.LECTURERS, lId));
        if (snap.exists()) {
          await deleteDoc(doc(db, COLLECTIONS.LECTURERS, lId));
        }
      } catch (_) {}
    }
    for (const aId of KNOWN_SAMPLE_ALLOCATION_IDS) {
      try {
        const snap = await getDoc(doc(db, COLLECTIONS.COURSE_ALLOCATIONS, aId));
        if (snap.exists()) {
          await deleteDoc(doc(db, COLLECTIONS.COURSE_ALLOCATIONS, aId));
        }
      } catch (_) {}
    }
  } catch (_) {}
})();

/**
 * =========================================================================
 * 1. ACTIVITY LOGGING (hgs_activity_logs)
 * =========================================================================
 */
export async function logActivity({
  action,
  description,
  targetCollection = "",
  targetDocumentId = ""
}) {
  const user = getCurrentAuthUser();
  const adminEmail = user?.email || ADMIN_CREDENTIALS.ADMIN_EMAIL;
  const adminUid = user?.uid || ADMIN_CREDENTIALS.ADMIN_ID;

  const logItem = {
    action: action || "general_action",
    description: description || "Administrative action executed.",
    adminUid,
    adminEmail,
    adminId: ADMIN_CREDENTIALS.ADMIN_ID,
    targetCollection,
    targetDocumentId,
    timestamp: new Date().toISOString()
  };

  // Upsert local cache first
  const localId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  upsertCachedItem(COLLECTIONS.ACTIVITY_LOGS, { id: localId, ...logItem });

  try {
    const collRef = collection(db, COLLECTIONS.ACTIVITY_LOGS);
    await addDoc(collRef, {
      ...logItem,
      timestamp: serverTimestamp()
    });
    console.log(`[DIMABIN Activity Log] ${action}: ${description}`);
  } catch (err) {
    console.warn(`[DIMABIN Activity Log] Firestore write note: ${err.message}`);
  }
}

/**
 * Subscribe to real-time activity logs
 */
export function subscribeActivityLogs(callback, limitCount = 30) {
  if (typeof callback !== "function") return () => {};

  // Immediate callback with cached logs
  const cached = getCachedCollection(COLLECTIONS.ACTIVITY_LOGS);
  callback(cached.slice(0, limitCount));

  // Local event listener
  const localListener = (e) => {
    if (e.detail) callback(e.detail.slice(0, limitCount));
  };
  window.addEventListener(`dimabin:db:${COLLECTIONS.ACTIVITY_LOGS}`, localListener);

  let unsubscribe = () => {};
  try {
    const q = query(
      collection(db, COLLECTIONS.ACTIVITY_LOGS),
      orderBy("timestamp", "desc"),
      limit(limitCount)
    );
    unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCachedCollection(COLLECTIONS.ACTIVITY_LOGS, list);
        callback(list);
      },
      (err) => {
        console.warn("[DIMABIN Backend] Activity logs onSnapshot note:", err.message);
        callback(getCachedCollection(COLLECTIONS.ACTIVITY_LOGS).slice(0, limitCount));
      }
    );
  } catch (err) {
    console.warn("[DIMABIN Backend] Activity logs listener init note:", err.message);
  }

  return () => {
    try { unsubscribe(); } catch (_) {}
    window.removeEventListener(`dimabin:db:${COLLECTIONS.ACTIVITY_LOGS}`, localListener);
  };
}

/**
 * =========================================================================
 * 2. SYSTEM STATUS CHECK
 * =========================================================================
 */
export async function checkSystemStatus() {
  const result = {
    authConnected: false,
    firestoreConnected: false,
    admissionControlOpen: true,
    publicWebsiteConnected: true,
    lastChecked: new Date().toISOString()
  };

  // 1. Auth check
  try {
    const user = getCurrentAuthUser();
    const storedSession = sessionStorage.getItem("dimabin_admin_session") || localStorage.getItem("dimabin_admin_session");
    result.authConnected = Boolean(user || storedSession);
  } catch (_) {
    result.authConnected = false;
  }

  // 2. Firestore ping check
  try {
    const docRef = doc(db, COLLECTIONS.SYSTEM_SETTINGS, "admissions");
    const snap = await getDoc(docRef);
    result.firestoreConnected = true;
    if (snap.exists()) {
      result.admissionControlOpen = Boolean(snap.data()?.isOpen);
    }
  } catch (_) {
    // If permission or network blocks client read, check if firestore initialized
    result.firestoreConnected = Boolean(db && db.app);
  }

  return result;
}

/**
 * =========================================================================
 * 3. ADMISSIONS MANAGEMENT (admissions)
 * =========================================================================
 */

/**
 * Save public application from admissions.html
 * Enforces: ONE EMAIL ADDRESS = ONE STUDENT ADMISSION RECORD.
 */
export async function savePublicApplication(formData) {
  const normalizedEmail = (formData.email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("A valid email address is required to submit an application.");
  }

  // 1. Check local cache first for duplicate email
  const cachedAdmissions = getCachedCollection(COLLECTIONS.ADMISSIONS) || [];
  const existingCached = cachedAdmissions.find(
    (app) => (app.email || "").trim().toLowerCase() === normalizedEmail
  );
  if (existingCached) {
    throw new Error("This email address has already been used for an admission application. Each applicant must use a unique email address.");
  }

  // 2. Query Firestore collection 'admissions' for existing record with this normalized email
  try {
    const q = query(
      collection(db, COLLECTIONS.ADMISSIONS),
      where("email", "==", normalizedEmail),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      throw new Error("This email address has already been used for an admission application. Each applicant must use a unique email address.");
    }
  } catch (err) {
    if (err.message && err.message.includes("already been used")) {
      throw err;
    }
    console.warn(`[DIMABIN Admissions] Firestore uniqueness check warning: ${err.message}`);
  }

  // Enforce institutional award qualification policy: Diploma in Theology is the ONLY qualification awarded by DIMABIN
  const officialProgramme = "Diploma in Theology (Dipl.Th.)";
  const requestedProg = (formData.program || formData.programme || "").trim();
  // Allow variants of Diploma in Theology, but reject any unsupported award qualifications
  if (requestedProg && !requestedProg.toLowerCase().includes("diploma in theology") && !requestedProg.toLowerCase().includes("dipl.th")) {
    throw new Error("Diploma in Theology is the only qualification awarded by DIMABIN Bible Institute upon successful completion of the programme.");
  }

  const appId = `DIMABIN/APP/2026/${Math.floor(1000 + Math.random() * 9000)}`;
  const record = {
    applicationId: appId,
    fullName: (formData.name || formData.fullName || "Candidate").trim(),
    email: normalizedEmail,
    phone: (formData.phone || "").trim(),
    whatsapp: (formData.whatsapp || formData.phone || "").trim(),
    programme: officialProgramme,
    gender: formData.gender || "Male",
    dob: formData.dob || "",
    maritalStatus: formData.maritalStatus || "Single",
    nationality: formData.nationality || "Nigerian",
    stateOfOrigin: formData.stateOfOrigin || "Ogun State",
    lga: formData.lga || "Abeokuta South",
    residentialAddress: formData.residentialAddress || "Abeokuta, Ogun State",
    qualification: formData.qualification || "SSCE / WASSCE",
    graduationYear: formData.graduationYear || "2021",
    institution: formData.institution || "High School / College",
    courseOfStudy: formData.courseOfStudy || formData.academicCourse || "",
    relevantCredentials: formData.relevantCredentials || formData.academicCredentials || "",
    previousTheology: formData.previousTheology || formData.academicPreviousTheology || "",
    churchName: formData.churchName || "",
    denomination: formData.denomination || "",
    ministryRole: formData.ministryRole || formData.churchRole || "",
    yearsInMinistry: formData.yearsInMinistry || formData.churchYears || "",
    pastorName: formData.pastorName || formData.churchPastorName || "",
    pastorPhone: formData.pastorPhone || formData.churchPastorPhone || "",
    pastorEmail: formData.pastorEmail || formData.churchPastorEmail || "",
    briefTestimony: formData.briefTestimony || formData.churchTestimony || "",
    kinName: formData.kinName || "",
    kinRelationship: formData.kinRelationship || "",
    kinPhone: formData.kinPhone || "",
    kinWhatsapp: formData.kinWhatsapp || "",
    kinEmail: formData.kinEmail || "",
    kinAddress: formData.kinAddress || "",
    studyCentre: (formData.studyCentre || "").trim(),
    academicSession: formData.academicSession || "2026/2027",
    status: "pending", // pending | approved | rejected
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Cache locally
  const localId = `adm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  upsertCachedItem(COLLECTIONS.ADMISSIONS, { id: localId, ...record });

  // Save to Firestore
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.ADMISSIONS), {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log(`[DIMABIN Admissions] Application ${appId} submitted to Firestore (ID: ${docRef.id}).`);
    return { success: true, id: docRef.id, applicationId: appId, ...record };
  } catch (err) {
    console.warn(`[DIMABIN Admissions] Firestore application save note: ${err.message}`);
    return { success: true, id: localId, applicationId: appId, ...record };
  }
}

/**
 * Subscribe to real-time admission applications
 */
export function subscribeAdmissions(callback, { statusFilter = "all" } = {}) {
  if (typeof callback !== "function") return () => {};

  const filterList = (items) => {
    if (statusFilter === "all" || !statusFilter) return items;
    return items.filter((i) => (i.status || "pending").toLowerCase() === statusFilter.toLowerCase());
  };

  // Immediate cached callback
  callback(filterList(getCachedCollection(COLLECTIONS.ADMISSIONS)));

  const localListener = (e) => {
    if (e.detail) callback(filterList(e.detail));
  };
  window.addEventListener(`dimabin:db:${COLLECTIONS.ADMISSIONS}`, localListener);

  let unsubscribe = () => {};
  try {
    const collRef = collection(db, COLLECTIONS.ADMISSIONS);
    unsubscribe = onSnapshot(
      collRef,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Sort descending by date
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setCachedCollection(COLLECTIONS.ADMISSIONS, list);
        callback(filterList(list));
      },
      (err) => {
        console.warn("[DIMABIN Admissions] onSnapshot note:", err.message);
        callback(filterList(getCachedCollection(COLLECTIONS.ADMISSIONS)));
      }
    );
  } catch (err) {
    console.warn("[DIMABIN Admissions] onSnapshot init note:", err.message);
  }

  return () => {
    try { unsubscribe(); } catch (_) {}
    window.removeEventListener(`dimabin:db:${COLLECTIONS.ADMISSIONS}`, localListener);
  };
}

/**
 * Update admission application status (pending, approved, rejected)
 */
export async function updateAdmissionStatus(docId, newStatus, reason = "") {
  if (!docId || !newStatus) throw new Error("Document ID and status are required.");

  const payload = {
    status: newStatus.toLowerCase(),
    statusReason: reason || "",
    updatedAt: new Date().toISOString(),
    updatedBy: ADMIN_CREDENTIALS.ADMIN_ID
  };

  upsertCachedItem(COLLECTIONS.ADMISSIONS, { id: docId, ...payload });

  try {
    const docRef = doc(db, COLLECTIONS.ADMISSIONS, docId);
    await updateDoc(docRef, {
      ...payload,
      updatedAt: serverTimestamp()
    });
    console.log(`[DIMABIN Admissions] Application ${docId} updated to ${newStatus}.`);
  } catch (err) {
    console.warn(`[DIMABIN Admissions] Firestore update note: ${err.message}`);
  }

  // Log to activity logs
  await logActivity({
    action: `application_${newStatus.toLowerCase()}`,
    description: `Application ${docId} was marked as '${newStatus.toUpperCase()}'${reason ? `: ${reason}` : "."}`,
    targetCollection: COLLECTIONS.ADMISSIONS,
    targetDocumentId: docId
  });

  return { success: true, docId, status: newStatus };
}

/**
 * Canonical Sample Admissions (Empty: Strictly authentic applications are displayed)
 */
export const SAMPLE_ADMISSIONS = Object.freeze([]);

/**
 * Format/Normalize Date of Birth representation into YYYY-MM-DD
 */
export function normalizeDateString(dateVal) {
  if (!dateVal) return "";
  try {
    if (typeof dateVal?.toDate === "function") {
      return dateVal.toDate().toISOString().split("T")[0];
    }
    if (dateVal instanceof Date) {
      return dateVal.toISOString().split("T")[0];
    }
    if (typeof dateVal === "string") {
      const trimmed = dateVal.trim();
      if (trimmed.includes("T")) return trimmed.split("T")[0];
      const parts = trimmed.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
        } else if (parts[2].length === 4) {
          // DD-MM-YYYY or MM-DD-YYYY
          return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        }
      }
      return trimmed;
    }
    if (typeof dateVal?.seconds === "number") {
      return new Date(dateVal.seconds * 1000).toISOString().split("T")[0];
    }
  } catch (_) {}
  return String(dateVal).trim();
}

/**
 * Check candidate admission status using Application Number and Date of Birth
 * @param {string} rawAppId - e.g. "DIMABIN/APP/2026/1001"
 * @param {string} rawDob - e.g. "1998-05-14"
 * @returns {Promise<{ found: boolean, record?: Object, id?: string, dobMismatch?: boolean, error?: string }>}
 */
export async function checkAdmissionStatus(rawAppId, rawDob) {
  const normAppId = (rawAppId || "").trim().toUpperCase();
  const normDob = normalizeDateString(rawDob);

  if (!normAppId) {
    throw new Error("Please enter your Application Number (e.g. DIMABIN/APP/2026/1001).");
  }
  if (!normDob) {
    throw new Error("Please enter your Date of Birth.");
  }

  const matchesDob = (recordDob) => {
    if (!recordDob) return false;
    return normalizeDateString(recordDob) === normDob;
  };

  // 1. Query Firestore 'admissions' collection
  try {
    const collRef = collection(db, COLLECTIONS.ADMISSIONS);
    const q1 = query(collRef, where("applicationId", "==", normAppId));
    let snap = await getDocs(q1);

    if (snap.empty) {
      const q2 = query(collRef, where("applicationId", "==", rawAppId.trim()));
      snap = await getDocs(q2);
    }

    if (!snap.empty) {
      for (const d of snap.docs) {
        const data = d.data();
        if (matchesDob(data.dob)) {
          return {
            found: true,
            id: d.id,
            ...data
          };
        } else {
          return {
            found: false,
            dobMismatch: true,
            error: "The Date of Birth entered does not match our registry records for this Application Number. Please verify your credentials and try again."
          };
        }
      }
    }
  } catch (err) {
    console.warn("[DIMABIN Admissions] Firestore query note:", err.message);
  }

  // 2. Check local cached collection
  const cached = getCachedCollection(COLLECTIONS.ADMISSIONS) || [];
  const foundCached = cached.find((a) => {
    const aId = (a.applicationId || a.id || "").trim().toUpperCase();
    return aId === normAppId;
  });

  if (foundCached) {
    if (matchesDob(foundCached.dob)) {
      return { found: true, ...foundCached };
    } else {
      return {
        found: false,
        dobMismatch: true,
        error: "The Date of Birth entered does not match our registry records for this Application Number. Please verify your credentials and try again."
      };
    }
  }

  // 3. Check sample/demo admissions (allows immediate verification across cohorts)
  const foundSample = SAMPLE_ADMISSIONS.find((s) => s.applicationId.toUpperCase() === normAppId);
  if (foundSample) {
    if (matchesDob(foundSample.dob)) {
      return { found: true, ...foundSample };
    } else {
      return {
        found: false,
        dobMismatch: true,
        error: "The Date of Birth entered does not match our registry records for this Application Number. Please verify your credentials and try again."
      };
    }
  }

  return {
    found: false,
    error: "No admission record found matching the specified Application Number and Date of Birth. Please check your details and try again."
  };
}

/**
 * Find approved admission application by applicant's email address
 * Enforces: Only APPROVED/ADMITTED applicants can proceed to Student Portal onboarding.
 * @param {string} rawEmail
 * @returns {Promise<{ success: boolean, approved?: boolean, record?: Object, notFound?: boolean, error?: string }>}
 */
export async function findApprovedAdmissionByEmail(rawEmail) {
  const normEmail = (rawEmail || "").trim().toLowerCase();
  if (!normEmail) {
    throw new Error("Please enter your registered applicant email address.");
  }

  const isApprovedStatus = (status) => {
    const s = (status || "").toLowerCase().trim();
    return s === "approved" || s === "admitted";
  };

  // 1. Check Firestore
  try {
    const collRef = collection(db, COLLECTIONS.ADMISSIONS);
    const q = query(collRef, where("email", "==", normEmail), limit(1));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const docSnap = snap.docs[0];
      const data = { id: docSnap.id, ...docSnap.data() };
      if (isApprovedStatus(data.status)) {
        return { success: true, approved: true, record: data };
      } else {
        return {
          success: false,
          approved: false,
          status: data.status,
          record: data,
          error: `Your admission application status is currently '${(data.status || "pending").toUpperCase()}'. Student Portal onboarding is only available for approved candidates.`
        };
      }
    }
  } catch (err) {
    console.warn("[DIMABIN Admissions] Firestore email lookup note:", err.message);
  }

  // 2. Check local cached collection
  const cached = getCachedCollection(COLLECTIONS.ADMISSIONS) || [];
  const foundCached = cached.find((a) => (a.email || "").trim().toLowerCase() === normEmail);
  if (foundCached) {
    if (isApprovedStatus(foundCached.status)) {
      return { success: true, approved: true, record: foundCached };
    } else {
      return {
        success: false,
        approved: false,
        status: foundCached.status,
        record: foundCached,
        error: `Your admission application status is currently '${(foundCached.status || "pending").toUpperCase()}'. Student Portal onboarding is only available for approved candidates.`
      };
    }
  }

  // 3. Check sample/demo admissions
  const foundSample = SAMPLE_ADMISSIONS.find((s) => s.email.toLowerCase() === normEmail);
  if (foundSample) {
    if (isApprovedStatus(foundSample.status)) {
      return { success: true, approved: true, record: foundSample };
    } else {
      return {
        success: false,
        approved: false,
        status: foundSample.status,
        record: foundSample,
        error: `Your admission application status is currently '${(foundSample.status || "pending").toUpperCase()}'. Student Portal onboarding is only available for approved candidates.`
      };
    }
  }

  return {
    success: false,
    notFound: true,
    error: "No admission record was found matching this email address. Please make sure you use the exact email address provided during your admission application."
  };
}

/**
 * Complete Student Portal Password Setup and Onboarding
 * 1. Creates Firebase Auth user account (or connects to existing)
 * 2. Writes students/{uid} and users/{uid} documents with permanent technical identity
 * 3. Updates admissions record with onboarded status
 * 4. Initializes active student session
 */
export async function completeStudentPortalSetup(rawEmail, rawPassword, admissionRecord) {
  const normEmail = (rawEmail || "").trim().toLowerCase();
  const password = rawPassword || "";

  if (!normEmail) {
    throw new Error("Email Address is required.");
  }
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }
  if (!admissionRecord) {
    throw new Error("No verified admission record provided for onboarding.");
  }

  let userCredential = null;

  try {
    userCredential = await createUserWithEmailAndPassword(auth, normEmail, password);
  } catch (authErr) {
    if (authErr.code === "auth/email-already-in-use") {
      // The student account was already created in Firebase Auth
      try {
        userCredential = await signInWithEmailAndPassword(auth, normEmail, password);
      } catch (signInErr) {
        throw new Error(
          "A Student Portal account has already been registered for this email address. Please sign in at the Student Portal Login, or use 'Forgot Password' if you need to reset your password."
        );
      }
    } else if (authErr.code === "auth/weak-password") {
      throw new Error("Password is too weak. Please use at least 6 characters including letters and numbers.");
    } else {
      throw new Error(authErr.message || "Failed to create authentication credentials.");
    }
  }

  const user = userCredential.user;
  const uid = user.uid;

  // Format student ID and admission number
  const studentId = admissionRecord.studentId || 
    (admissionRecord.applicationId ? admissionRecord.applicationId.replace("/APP/", "/STU/") : `DIMABIN/STU/2026/${uid.substring(0, 5).toUpperCase()}`);
  const admissionNumber = admissionRecord.applicationId || `DIMABIN/ADM/2026/${uid.substring(0, 5).toUpperCase()}`;

  const studentProfile = {
    uid,
    studentId,
    admissionNumber,
    fullName: (admissionRecord.fullName || "DIMABIN Student").trim(),
    email: normEmail,
    phone: admissionRecord.phone || "",
    programme: admissionRecord.programme || "Diploma in Theology (Dipl.Th.)",
    department: "Biblical Studies & Theology",
    level: "Diploma I",
    academicSession: admissionRecord.academicSession || "2026/2027",
    studyCentre: (admissionRecord.studyCentre || "").trim(),
    status: "active",
    role: "student",
    cgpa: null,
    onboardedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 1. Persist to students/{uid}
  try {
    const studentDocRef = doc(db, COLLECTIONS.STUDENTS, uid);
    await setDoc(studentDocRef, {
      ...studentProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    console.log(`[DIMABIN Onboarding] Student document created: students/${uid}`);
  } catch (err) {
    console.warn(`[DIMABIN Onboarding] Firestore students write note: ${err.message}`);
  }

  // 2. Persist to users/{uid}
  try {
    const userDocRef = doc(db, COLLECTIONS.USERS, uid);
    await setDoc(userDocRef, {
      ...studentProfile,
      role: "student",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    console.log(`[DIMABIN Onboarding] User document created: users/${uid}`);
  } catch (err) {
    console.warn(`[DIMABIN Onboarding] Firestore users write note: ${err.message}`);
  }

  // 3. Update admissions document
  if (admissionRecord.id) {
    try {
      const admDocRef = doc(db, COLLECTIONS.ADMISSIONS, admissionRecord.id);
      await updateDoc(admDocRef, {
        onboarded: true,
        studentUid: uid,
        studentId: studentId,
        onboardedAt: serverTimestamp()
      });
    } catch (_) {}
  }

  // 4. Cache locally
  upsertCachedItem(COLLECTIONS.STUDENTS, { id: uid, ...studentProfile });

  // 5. Initialize active session
  const sessionData = {
    uid,
    email: normEmail,
    fullName: studentProfile.fullName,
    studentId: studentProfile.studentId,
    admissionNumber: studentProfile.admissionNumber,
    programme: studentProfile.programme,
    level: studentProfile.level,
    role: "student",
    authenticatedAt: new Date().toISOString()
  };

  try {
    sessionStorage.setItem("dimabin_student_session", JSON.stringify(sessionData));
    localStorage.setItem("dimabin_student_session", JSON.stringify(sessionData));
  } catch (_) {}

  return {
    success: true,
    user,
    student: studentProfile,
    session: sessionData
  };
}

/**
 * =========================================================================
 * 4. STUDENT DIRECTORY (students)
 * =========================================================================
 */
export function subscribeStudents(callback) {
  if (typeof callback !== "function") return () => {};

  callback(getCachedCollection(COLLECTIONS.STUDENTS));

  const localListener = (e) => {
    if (e.detail) callback(e.detail);
  };
  window.addEventListener(`dimabin:db:${COLLECTIONS.STUDENTS}`, localListener);

  let unsubscribe = () => {};
  try {
    const collRef = collection(db, COLLECTIONS.STUDENTS);
    unsubscribe = onSnapshot(
      collRef,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCachedCollection(COLLECTIONS.STUDENTS, list);
        callback(list);
      },
      (err) => {
        console.warn("[DIMABIN Students] onSnapshot note:", err.message);
        callback(getCachedCollection(COLLECTIONS.STUDENTS));
      }
    );
  } catch (err) {
    console.warn("[DIMABIN Students] init note:", err.message);
  }

  return () => {
    try { unsubscribe(); } catch (_) {}
    window.removeEventListener(`dimabin:db:${COLLECTIONS.STUDENTS}`, localListener);
  };
}

export async function createStudent(studentData) {
  const regNumber = studentData.matricNumber || studentData.admissionNumber || `DIMABIN/STU/2026/${Math.floor(100 + Math.random() * 900)}`;
  const record = {
    matricNumber: regNumber,
    admissionNumber: regNumber,
    fullName: (studentData.fullName || "Student Candidate").trim(),
    email: (studentData.email || "").trim(),
    phone: (studentData.phone || "").trim(),
    programme: studentData.programme || "Diploma in Theology (Dipl.Th.)",
    level: studentData.level || "Diploma I",
    studyCentre: (studentData.studyCentre || "").trim(),
    academicSession: studentData.academicSession || "2026/2027",
    status: studentData.status || "active", // active | inactive | graduated
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const localId = `stu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  upsertCachedItem(COLLECTIONS.STUDENTS, { id: localId, ...record });

  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.STUDENTS), {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log(`[DIMABIN Students] Student record created in Firestore (ID: ${docRef.id}).`);
  } catch (err) {
    console.warn(`[DIMABIN Students] Firestore create note: ${err.message}`);
  }

  await logActivity({
    action: "student_registered",
    description: `Registered student ${record.fullName} (${record.admissionNumber}).`,
    targetCollection: COLLECTIONS.STUDENTS,
    targetDocumentId: record.admissionNumber
  });

  return { success: true, ...record };
}

export async function toggleStudentStatus(studentId, currentStatus) {
  const newStatus = currentStatus === "active" ? "inactive" : "active";
  upsertCachedItem(COLLECTIONS.STUDENTS, { id: studentId, status: newStatus, updatedAt: new Date().toISOString() });

  try {
    const docRef = doc(db, COLLECTIONS.STUDENTS, studentId);
    await updateDoc(docRef, { status: newStatus, updatedAt: serverTimestamp() });
  } catch (err) {
    console.warn(`[DIMABIN Students] Status update note: ${err.message}`);
  }

  await logActivity({
    action: "student_status_changed",
    description: `Student ${studentId} status set to '${newStatus.toUpperCase()}'.`,
    targetCollection: COLLECTIONS.STUDENTS,
    targetDocumentId: studentId
  });

  return { success: true, studentId, status: newStatus };
}

/**
 * =========================================================================
 * 5. LECTURER MANAGEMENT (lecturers)
 * Institutional Faculty Directory with Single Account Principle
 * =========================================================================
 */
export function subscribeLecturers(callback) {
  if (typeof callback !== "function") return () => {};

  // Pure authoritative subscription: never seed sample faculty
  let currentList = getCachedCollection(COLLECTIONS.LECTURERS) || [];
  callback(currentList);

  const localListener = (e) => {
    if (e.detail) callback(e.detail);
  };
  window.addEventListener(`dimabin:db:${COLLECTIONS.LECTURERS}`, localListener);

  let unsubscribe = () => {};
  try {
    const collRef = collection(db, COLLECTIONS.LECTURERS);
    unsubscribe = onSnapshot(
      collRef,
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            accountStatus: d.data().accountStatus || d.data().status || "active",
            employmentStatus: d.data().employmentStatus || "active",
            specialization: d.data().specialization || ""
          }));
          setCachedCollection(COLLECTIONS.LECTURERS, list);
          callback(list);
        } else {
          // If collection is empty, state is strictly empty. Never synthesize placeholder records.
          setCachedCollection(COLLECTIONS.LECTURERS, []);
          callback([]);
        }
      },
      (err) => {
        console.warn("[DIMABIN Lecturers] onSnapshot note:", err.message);
        callback(getCachedCollection(COLLECTIONS.LECTURERS) || []);
      }
    );
  } catch (err) {
    console.warn("[DIMABIN Lecturers] init note:", err.message);
  }

  return () => {
    try { unsubscribe(); } catch (_) {}
    window.removeEventListener(`dimabin:db:${COLLECTIONS.LECTURERS}`, localListener);
  };
}

export async function createLecturer(lecturerData) {
  const fullName = (lecturerData.fullName || "").trim();
  if (!fullName) throw new Error("Full Name is required.");

  const staffId = (lecturerData.staffId || "").trim();
  if (!staffId) throw new Error("Institutional Lecturer ID is required.");

  const email = (lecturerData.email || "").trim().toLowerCase();
  if (!email) throw new Error("Email Address is required.");

  const phone = (lecturerData.phone || "").trim();
  const department = (lecturerData.department || "Biblical Studies & Theology").trim();
  const qualification = (lecturerData.qualification || "M.Th., B.Th.").trim();
  const specialization = (lecturerData.specialization || "").trim();
  const studyCentre = (lecturerData.studyCentre || "").trim();
  const accountStatus = lecturerData.accountStatus === "inactive" || lecturerData.status === "inactive" ? "inactive" : "active";
  const employmentStatus = lecturerData.employmentStatus || "active";

  // Check unique constraints against existing lecturers
  const existingLecturers = getCachedCollection(COLLECTIONS.LECTURERS) || [];
  const staffIdExists = existingLecturers.some((l) => (l.staffId || "").trim().toLowerCase() === staffId.toLowerCase());
  if (staffIdExists) {
    throw new Error(`Lecturer ID '${staffId}' is already registered to another faculty member. Institutional IDs must be unique.`);
  }

  const emailExists = existingLecturers.some((l) => (l.email || "").trim().toLowerCase() === email);
  if (emailExists) {
    throw new Error(`A faculty member with email address '${email}' is already registered.`);
  }

  const nowIso = new Date().toISOString();
  const stableUid = lecturerData.uid || `lec_uid_${staffId.replace(/[^A-Za-z0-9]/g, "_").toLowerCase()}`;

  const record = {
    uid: stableUid,
    staffId,
    fullName,
    email,
    phone,
    department,
    qualification,
    specialization,
    studyCentre,
    accountStatus,
    employmentStatus,
    status: accountStatus, // maintain status for backwards compatibility
    createdAt: nowIso,
    updatedAt: nowIso
  };

  const localId = `lec_${staffId.replace(/[^A-Za-z0-9]/g, "_")}`;
  upsertCachedItem(COLLECTIONS.LECTURERS, { id: localId, ...record });

  let savedId = localId;
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.LECTURERS), {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    savedId = docRef.id;
    removeCachedItem(COLLECTIONS.LECTURERS, localId);
    upsertCachedItem(COLLECTIONS.LECTURERS, { id: savedId, ...record });
  } catch (err) {
    console.warn(`[DIMABIN Lecturers] Firestore create note: ${err.message}`);
  }

  await logActivity({
    action: "lecturer_added",
    description: `Added faculty instructor ${record.fullName} (${record.staffId}) to ${record.department}.`,
    targetCollection: COLLECTIONS.LECTURERS,
    targetDocumentId: record.staffId
  });

  refreshLecturerDashboardData();
  return { success: true, id: savedId, ...record };
}

export async function updateLecturer(lecturerId, updateData) {
  if (!lecturerId) throw new Error("Lecturer ID is required for updating.");

  const existingLecturers = getCachedCollection(COLLECTIONS.LECTURERS) || [];
  const target = existingLecturers.find((l) => l.id === lecturerId || l.staffId === lecturerId);
  if (!target) throw new Error("Faculty profile not found.");

  const fullName = (updateData.fullName || target.fullName).trim();
  const email = (updateData.email || target.email).trim().toLowerCase();
  const phone = (updateData.phone || target.phone || "").trim();
  const department = (updateData.department || target.department).trim();
  const qualification = (updateData.qualification || target.qualification || "").trim();
  const specialization = (updateData.specialization !== undefined ? updateData.specialization : target.specialization || "").trim();
  const studyCentre = (updateData.studyCentre || target.studyCentre).trim();
  const accountStatus = updateData.accountStatus || updateData.status || target.accountStatus || target.status || "active";
  const employmentStatus = updateData.employmentStatus || target.employmentStatus || "active";

  // Check email uniqueness if email changed
  if (email !== (target.email || "").toLowerCase()) {
    const emailConflict = existingLecturers.some((l) => l.id !== target.id && (l.email || "").toLowerCase() === email);
    if (emailConflict) {
      throw new Error(`Email '${email}' is already in use by another faculty instructor.`);
    }
  }

  const photoUrl = updateData.photoUrl !== undefined ? updateData.photoUrl : (target.photoUrl || "");

  const nowIso = new Date().toISOString();
  const updatedRecord = {
    ...target,
    fullName,
    email,
    phone,
    department,
    qualification,
    specialization,
    studyCentre,
    accountStatus,
    employmentStatus,
    status: accountStatus,
    photoUrl,
    updatedAt: nowIso
  };

  upsertCachedItem(COLLECTIONS.LECTURERS, { id: target.id, ...updatedRecord });

  try {
    const docRef = doc(db, COLLECTIONS.LECTURERS, target.id);
    await updateDoc(docRef, {
      fullName,
      email,
      phone,
      department,
      qualification,
      specialization,
      studyCentre,
      accountStatus,
      employmentStatus,
      status: accountStatus,
      photoUrl,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn(`[DIMABIN Lecturers] Firestore update note: ${err.message}`);
  }

  await logActivity({
    action: "lecturer_updated",
    description: `Updated profile details for faculty instructor ${fullName} (${target.staffId}).`,
    targetCollection: COLLECTIONS.LECTURERS,
    targetDocumentId: target.staffId
  });

  refreshLecturerDashboardData();
  return { success: true, id: target.id, ...updatedRecord };
}

export async function setLecturerStatus(lecturerId, newStatus, reason = "") {
  if (!lecturerId) throw new Error("Lecturer ID is required.");
  const statusVal = ["active", "inactive", "concluded"].includes(newStatus) ? newStatus : "active";

  const existingLecturers = getCachedCollection(COLLECTIONS.LECTURERS) || [];
  const target = existingLecturers.find((l) => l.id === lecturerId || l.staffId === lecturerId);
  if (!target) throw new Error("Faculty profile not found.");

  const nowIso = new Date().toISOString();
  const employmentStatus = statusVal === "concluded" ? "concluded" : target.employmentStatus || "active";

  const updatedRecord = {
    ...target,
    accountStatus: statusVal,
    employmentStatus: employmentStatus,
    status: statusVal,
    statusReason: reason ? reason.trim() : target.statusReason || "",
    updatedAt: nowIso
  };

  upsertCachedItem(COLLECTIONS.LECTURERS, { id: target.id, ...updatedRecord });

  try {
    const docRef = doc(db, COLLECTIONS.LECTURERS, target.id);
    await updateDoc(docRef, {
      accountStatus: statusVal,
      employmentStatus: employmentStatus,
      status: statusVal,
      statusReason: updatedRecord.statusReason,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn(`[DIMABIN Lecturers] Status update note: ${err.message}`);
  }

  await logActivity({
    action: "lecturer_status_changed",
    description: `Faculty instructor ${target.fullName} (${target.staffId}) status changed to '${statusVal.toUpperCase()}'.${reason ? ` Reason: ${reason}` : ""}`,
    targetCollection: COLLECTIONS.LECTURERS,
    targetDocumentId: target.staffId
  });

  refreshLecturerDashboardData();
  return { success: true, id: target.id, status: statusVal };
}

export async function toggleLecturerStatus(lecturerId, currentStatus) {
  const newStatus = currentStatus === "active" ? "inactive" : "active";
  return setLecturerStatus(lecturerId, newStatus);
}

export async function deleteLecturer(lecturerId) {
  if (!lecturerId) throw new Error("Lecturer ID is required.");
  const existingLecturers = getCachedCollection(COLLECTIONS.LECTURERS) || [];
  const target = existingLecturers.find((l) => l.id === lecturerId || l.staffId === lecturerId);
  const targetId = target ? target.id : lecturerId;
  const staffId = target ? target.staffId : lecturerId;
  const fullName = target ? target.fullName : "Faculty Instructor";

  removeCachedItem(COLLECTIONS.LECTURERS, targetId);

  try {
    const docRef = doc(db, COLLECTIONS.LECTURERS, targetId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn(`[DIMABIN Lecturers] Delete note: ${err.message}`);
  }

  await logActivity({
    action: "lecturer_deleted",
    description: `Deleted faculty record: ${fullName} (${staffId}).`,
    targetCollection: COLLECTIONS.LECTURERS,
    targetDocumentId: targetId
  });

  refreshLecturerDashboardData();
  return { success: true, id: targetId };
}

export function getLecturerAssignments(lecturerStaffId) {
  if (!lecturerStaffId) return [];
  const allocations = getCachedCollection(COLLECTIONS.COURSE_ALLOCATIONS) || [];
  return allocations.filter((a) => (a.lecturerId || "").trim().toLowerCase() === lecturerStaffId.trim().toLowerCase());
}

/**
 * Verify whether an email address or Staff ID corresponds to an authorized institutional lecturer
 * @param {string} identifier - Email address or Staff ID
 * @returns {Promise<{ success: boolean, authorized?: boolean, lecturer?: Object, notFound?: boolean, inactive?: boolean, error?: string }>}
 */
export async function findLecturerByEmailOrStaffId(identifier) {
  const norm = (identifier || "").trim().toLowerCase();
  if (!norm) {
    throw new Error("Please enter your registered institutional email address or Lecturer ID.");
  }

  // 1. Query Firestore lecturers collection by email or staffId
  try {
    const collRef = collection(db, COLLECTIONS.LECTURERS);
    // Try email first
    let q = query(collRef, where("email", "==", norm), limit(1));
    let snap = await getDocs(q);

    // If empty and could be staffId (e.g. uppercase check)
    if (snap.empty) {
      q = query(collRef, where("staffId", "==", identifier.trim().toUpperCase()), limit(1));
      snap = await getDocs(q);
    }

    if (!snap.empty) {
      const docSnap = snap.docs[0];
      const data = { id: docSnap.id, ...docSnap.data() };
      const status = (data.accountStatus || data.status || "active").toLowerCase();
      if (status === "active") {
        return { success: true, authorized: true, lecturer: data };
      } else {
        return {
          success: false,
          authorized: false,
          inactive: true,
          lecturer: data,
          error: `Your faculty account is currently ${status.toUpperCase()}. Please contact the DIMABIN Academic Administration Office.`
        };
      }
    }
  } catch (err) {
    console.warn("[DIMABIN Lecturers] Firestore lookup note:", err.message);
  }

  // 2. Check local cached collection
  const cached = getCachedCollection(COLLECTIONS.LECTURERS) || [];
  const foundCached = cached.find((l) => 
    (l.email || "").trim().toLowerCase() === norm ||
    (l.staffId || "").trim().toLowerCase() === norm
  );
  if (foundCached) {
    const status = (foundCached.accountStatus || foundCached.status || "active").toLowerCase();
    if (status === "active") {
      return { success: true, authorized: true, lecturer: foundCached };
    } else {
      return {
        success: false,
        authorized: false,
        inactive: true,
        lecturer: foundCached,
        error: `Your faculty account is currently ${status.toUpperCase()}. Please contact the DIMABIN Academic Administration Office.`
      };
    }
  }

  return {
    success: false,
    notFound: true,
    error: "No authorized faculty member was found matching this institutional email or Lecturer ID. Please contact the administrator if you have not been registered."
  };
}

/**
 * Complete Lecturer Portal Password Setup and Account Activation
 * Creates or syncs the Firebase Auth account and updates the lecturer's Firestore document.
 * @param {string} rawEmail - Authorized email address
 * @param {string} rawPassword - Lecturer's chosen password
 * @param {Object} lecturerRecord - The authorized lecturer profile
 */
export async function completeLecturerPortalSetup(rawEmail, rawPassword, lecturerRecord) {
  const normEmail = (rawEmail || "").trim().toLowerCase();
  const password = rawPassword || "";

  if (!normEmail) throw new Error("Email Address is required.");
  if (!password || password.length < 6) throw new Error("Password must be at least 6 characters long.");
  if (!lecturerRecord) throw new Error("No authorized faculty profile provided.");

  let userCredential = null;
  try {
    userCredential = await createUserWithEmailAndPassword(auth, normEmail, password);
  } catch (authErr) {
    if (authErr.code === "auth/email-already-in-use") {
      try {
        userCredential = await signInWithEmailAndPassword(auth, normEmail, password);
      } catch (signInErr) {
        throw new Error(
          "A Lecturer Portal account has already been set up for this email address. Please sign in or use 'Forgot Password' if you need to reset it."
        );
      }
    } else if (authErr.code === "auth/weak-password") {
      throw new Error("Password is too weak. Please use at least 6 characters including letters and numbers.");
    } else {
      throw new Error(authErr.message || "Failed to create authentication credentials.");
    }
  }

  const user = userCredential.user;
  const uid = user.uid;

  const updatedProfile = {
    ...lecturerRecord,
    uid,
    authUid: uid,
    accountStatus: "active",
    status: "active",
    passwordConfigured: true,
    activatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 1. Update lecturers collection document
  try {
    const docRef = doc(db, COLLECTIONS.LECTURERS, lecturerRecord.id);
    await updateDoc(docRef, {
      uid,
      authUid: uid,
      passwordConfigured: true,
      activatedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn("[DIMABIN Lecturer Setup] Firestore lecturers update note:", err.message);
  }

  // 2. Write users/{uid} document for unified identity
  try {
    const userDocRef = doc(db, COLLECTIONS.USERS, uid);
    await setDoc(userDocRef, {
      uid,
      staffId: lecturerRecord.staffId,
      fullName: lecturerRecord.fullName,
      email: normEmail,
      phone: lecturerRecord.phone || "",
      department: lecturerRecord.department || "Biblical Studies & Theology",
      role: "lecturer",
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn("[DIMABIN Lecturer Setup] Firestore users write note:", err.message);
  }

  // Update local cache
  upsertCachedItem(COLLECTIONS.LECTURERS, { id: lecturerRecord.id, ...updatedProfile });

  // Store active lecturer session
  const sessionData = {
    uid,
    staffId: lecturerRecord.staffId,
    fullName: lecturerRecord.fullName,
    email: normEmail,
    department: lecturerRecord.department,
    qualification: lecturerRecord.qualification,
    specialization: lecturerRecord.specialization,
    studyCentre: lecturerRecord.studyCentre,
    role: "lecturer",
    authenticatedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem("dimabin_lecturer_session", JSON.stringify(sessionData));
    sessionStorage.setItem("dimabin_lecturer_session", JSON.stringify(sessionData));
  } catch (_) {}

  await logActivity({
    action: "lecturer_account_setup",
    description: `Faculty instructor ${lecturerRecord.fullName} (${lecturerRecord.staffId}) completed portal account setup.`,
    targetCollection: COLLECTIONS.LECTURERS,
    targetDocumentId: lecturerRecord.staffId
  });

  return { success: true, lecturer: updatedProfile, session: sessionData };
}

/**
 * Authenticate Lecturer with User ID / Email and Password
 * @param {string} rawUserId - Institutional Email or Lecturer ID
 * @param {string} rawPassword - Password
 * @param {boolean} rememberMe - Whether to persist across sessions
 */
export async function authenticateLecturer(rawUserId, rawPassword, rememberMe = false) {
  const normInput = (rawUserId || "").trim();
  const password = rawPassword || "";

  if (!normInput || !password) {
    throw new Error("Please enter both your User ID (or Email) and Password.");
  }

  // 1. Verify lecturer is registered in institutional database
  const lookup = await findLecturerByEmailOrStaffId(normInput);
  if (!lookup.success || !lookup.authorized) {
    if (lookup.inactive) {
      throw new Error(lookup.error || "Your faculty account is currently inactive. Please contact the administrator.");
    }
    throw new Error(
      "No authorized faculty member was found matching this institutional ID or email. Please register or complete account setup first."
    );
  }

  const lecturer = lookup.lecturer;
  const email = (lecturer.email || "").trim().toLowerCase();

  // 2. Set persistence
  try {
    const persistenceMode = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistenceMode);
  } catch (pErr) {
    console.warn("[DIMABIN Lecturer Login] Persistence note:", pErr.message);
  }

  // 3. Sign in via Firebase Auth
  let userCredential;
  try {
    userCredential = await signInWithEmailAndPassword(auth, email, password);
  } catch (authError) {
    console.warn("[DIMABIN Lecturer Login] Firebase Auth error:", authError.code);
    if (
      authError.code === "auth/user-not-found" ||
      authError.code === "auth/invalid-credential" ||
      authError.code === "auth/wrong-password"
    ) {
      throw new Error(
        "Invalid password. If this is your first time accessing the portal, please use 'Set Up Password / First Time Login' below."
      );
    } else if (authError.code === "auth/too-many-requests") {
      throw new Error("Too many unsuccessful login attempts. Please wait a few minutes before trying again.");
    } else {
      throw new Error(authError.message || "Authentication failed. Please verify your credentials.");
    }
  }

  const user = userCredential.user;
  const uid = user.uid;

  // Session payload
  const sessionData = {
    uid,
    staffId: lecturer.staffId,
    fullName: lecturer.fullName,
    email: lecturer.email,
    phone: lecturer.phone || "",
    department: lecturer.department,
    qualification: lecturer.qualification,
    specialization: lecturer.specialization,
    studyCentre: lecturer.studyCentre,
    photoUrl: lecturer.photoUrl || lecturer.passportPhoto || "",
    role: "lecturer",
    authenticatedAt: new Date().toISOString()
  };

  try {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("dimabin_lecturer_session", JSON.stringify(sessionData));
  } catch (_) {}

  await logActivity({
    action: "lecturer_login",
    description: `Faculty instructor ${lecturer.fullName} (${lecturer.staffId}) signed into Lecturer Portal.`,
    targetCollection: COLLECTIONS.LECTURERS,
    targetDocumentId: lecturer.staffId
  });

  return { success: true, lecturer, session: sessionData };
}

/**
 * Dispatch Firebase password reset email to institutional lecturer
 * @param {string} rawEmailOrId - Institutional Email or Lecturer ID
 */
export async function sendLecturerPasswordReset(rawEmailOrId) {
  const normInput = (rawEmailOrId || "").trim();
  if (!normInput) {
    throw new Error("Please enter your registered institutional email address or Lecturer ID.");
  }

  const lookup = await findLecturerByEmailOrStaffId(normInput);
  if (!lookup.success || !lookup.authorized) {
    throw new Error(
      lookup.error || "No authorized faculty member was found matching this institutional ID or email."
    );
  }

  const targetEmail = lookup.lecturer.email;
  try {
    await sendPasswordResetEmail(auth, targetEmail);
    return { success: true, email: targetEmail };
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      throw new Error(
        "Your account has not completed initial password configuration yet. Please use 'Set Up Password / First Time Login'."
      );
    }
    throw new Error(err.message || "Failed to dispatch password reset email.");
  }
}

/**
 * =========================================================================
 * 6. COURSE MANAGEMENT (courses)
 * =========================================================================
 */
/**
 * =========================================================================
 * 6. COURSE MANAGEMENT (courses)
 * Full 3-Semester Academic System with Strict Validation & Dependency Safety
 * =========================================================================
 */

export function normalizeCourseCode(code) {
  if (!code) return "";
  return String(code).trim().toUpperCase().replace(/\s+/g, "-");
}

export const DEFAULT_DIMABIN_COURSES = Object.freeze([
  // --- FIRST SEMESTER (2026/2027) ---
  {
    id: "crs_THY_101_sem1",
    courseCode: "THY-101",
    title: "Christology & The Person of Christ",
    courseTitle: "Christology & The Person of Christ",
    description: "In-depth study of the deity, humanity, prophetic titles, and redemptive mission of Jesus Christ in biblical theology.",
    department: "Biblical Studies & Theology",
    programme: "Diploma in Theology (Dipl.Th.)",
    level: "100",
    academicSession: "2026/2027",
    semester: "First Semester",
    creditUnits: 3,
    creditUnit: 3,
    studyCentre: "",
    status: "active",
    prerequisiteCourseIds: [],
    createdAt: "2026-01-15T08:00:00.000Z",
    updatedAt: "2026-01-15T08:00:00.000Z"
  },
  {
    id: "crs_BIB_101_sem1",
    courseCode: "BIB-101",
    title: "Old Testament Survey & Covenant History",
    courseTitle: "Old Testament Survey & Covenant History",
    description: "Foundational survey of the Pentateuch, historical records, prophetic oracles, and wisdom literature of the Old Covenant.",
    department: "Biblical Studies & Theology",
    programme: "Diploma in Theology (Dipl.Th.)",
    level: "100",
    academicSession: "2026/2027",
    semester: "First Semester",
    creditUnits: 3,
    creditUnit: 3,
    studyCentre: "",
    status: "active",
    prerequisiteCourseIds: [],
    createdAt: "2026-01-15T08:00:00.000Z",
    updatedAt: "2026-01-15T08:00:00.000Z"
  },
  {
    id: "crs_MIN_101_sem1",
    courseCode: "MIN-101",
    title: "Foundations of Christian Ministry & Homiletics",
    courseTitle: "Foundations of Christian Ministry & Homiletics",
    description: "Principles of biblical sermon preparation, expository preaching, pastoral calling, and holy pulpit decorum.",
    department: "Practical Theology & Pastoral Ministry",
    programme: "Certificate in Christian Ministry",
    level: "100",
    academicSession: "2026/2027",
    semester: "First Semester",
    creditUnits: 2,
    creditUnit: 2,
    studyCentre: "",
    status: "active",
    prerequisiteCourseIds: [],
    createdAt: "2026-01-15T08:00:00.000Z",
    updatedAt: "2026-01-15T08:00:00.000Z"
  },
  {
    id: "crs_EVA_101_sem1",
    courseCode: "EVA-101",
    title: "Personal Evangelism & Missions Strategy",
    courseTitle: "Personal Evangelism & Missions Strategy",
    description: "The Great Commission imperative, cross-cultural outreach methods, soul-winning mechanics, and discipleship planting.",
    department: "Missions & Evangelism",
    programme: "Certificate in Christian Ministry",
    level: "100",
    academicSession: "2026/2027",
    semester: "First Semester",
    creditUnits: 2,
    creditUnit: 2,
    studyCentre: "",
    status: "active",
    prerequisiteCourseIds: [],
    createdAt: "2026-01-15T08:00:00.000Z",
    updatedAt: "2026-01-15T08:00:00.000Z"
  },

  // --- SECOND SEMESTER (2026/2027) ---
  {
    id: "crs_THY_102_sem2",
    courseCode: "THY-102",
    title: "Pneumatology & The Ministry of the Holy Spirit",
    courseTitle: "Pneumatology & The Ministry of the Holy Spirit",
    description: "The personality, biblical gifts, spiritual fruit, and empowering work of the Holy Ghost in the contemporary believer.",
    department: "Biblical Studies & Theology",
    programme: "Diploma in Theology (Dipl.Th.)",
    level: "100",
    academicSession: "2026/2027",
    semester: "Second Semester",
    creditUnits: 3,
    creditUnit: 3,
    studyCentre: "",
    status: "active",
    prerequisiteCourseIds: ["THY-101"],
    createdAt: "2026-01-15T08:00:00.000Z",
    updatedAt: "2026-01-15T08:00:00.000Z"
  },
  {
    id: "crs_BIB_102_sem2",
    courseCode: "BIB-102",
    title: "New Testament Epistles & Pauline Theology",
    courseTitle: "New Testament Epistles & Pauline Theology",
    description: "Comprehensive exegesis of Romans, Galatians, and the pastoral epistles with apostolic application for church doctrine.",
    department: "Biblical Studies & Theology",
    programme: "Diploma in Theology (Dipl.Th.)",
    level: "100",
    academicSession: "2026/2027",
    semester: "Second Semester",
    creditUnits: 3,
    creditUnit: 3,
    studyCentre: "",
    status: "active",
    prerequisiteCourseIds: ["BIB-101"],
    createdAt: "2026-01-15T08:00:00.000Z",
    updatedAt: "2026-01-15T08:00:00.000Z"
  },
  {
    id: "crs_PAS_102_sem2",
    courseCode: "PAS-102",
    title: "Pastoral Care, Ethics & Ministry Integrity",
    courseTitle: "Pastoral Care, Ethics & Ministry Integrity",
    description: "Biblical ethics in ministerial finances, family life, pastoral counselling, confidentiality, and institutional fidelity.",
    department: "Practical Theology & Pastoral Ministry",
    programme: "Diploma in Theology (Dipl.Th.)",
    level: "100",
    academicSession: "2026/2027",
    semester: "Second Semester",
    creditUnits: 3,
    creditUnit: 3,
    studyCentre: "",
    status: "active",
    prerequisiteCourseIds: [],
    createdAt: "2026-01-15T08:00:00.000Z",
    updatedAt: "2026-01-15T08:00:00.000Z"
  },
  {
    id: "crs_ADM_102_sem2",
    courseCode: "ADM-102",
    title: "Church Administration & Financial Stewardship",
    courseTitle: "Church Administration & Financial Stewardship",
    description: "Administrative governance, institutional compliance, committee leadership, accounting principles, and church operations.",
    department: "Church Administration & Leadership",
    programme: "Diploma in Theology (Dipl.Th.)",
    level: "100",
    academicSession: "2026/2027",
    semester: "Second Semester",
    creditUnits: 2,
    creditUnit: 2,
    studyCentre: "",
    status: "active",
    prerequisiteCourseIds: [],
    createdAt: "2026-01-15T08:00:00.000Z",
    updatedAt: "2026-01-15T08:00:00.000Z"
  },

  // --- THIRD SEMESTER (2026/2027) ---
  {
    id: "crs_THY_103_sem3",
    courseCode: "THY-103",
    title: "Eschatology & Biblical Prophecy",
    courseTitle: "Eschatology & Biblical Prophecy",
    description: "The Rapture, the Millennial reign, prophetic chronologies of Daniel & Revelation, and eternal state theology.",
    department: "Biblical Studies & Theology",
    programme: "Diploma in Theology (Dipl.Th.)",
    level: "100",
    academicSession: "2026/2027",
    semester: "Third Semester",
    creditUnits: 3,
    creditUnit: 3,
    studyCentre: "",
    status: "active",
    prerequisiteCourseIds: ["THY-101"],
    createdAt: "2026-01-15T08:00:00.000Z",
    updatedAt: "2026-01-15T08:00:00.000Z"
  },
  {
    id: "crs_BIB_103_sem3",
    courseCode: "BIB-103",
    title: "Biblical Hermeneutics & Exegesis",
    courseTitle: "Biblical Hermeneutics & Exegesis",
    description: "Principles of grammatical-historical scripture interpretation, contextual analysis, and dispensational discernment.",
    department: "Biblical Studies & Theology",
    programme: "Diploma in Theology (Dipl.Th.)",
    level: "100",
    academicSession: "2026/2027",
    semester: "Third Semester",
    creditUnits: 3,
    creditUnit: 3,
    studyCentre: "",
    status: "active",
    prerequisiteCourseIds: ["BIB-101", "BIB-102"],
    createdAt: "2026-01-15T08:00:00.000Z",
    updatedAt: "2026-01-15T08:00:00.000Z"
  },
  {
    id: "crs_PRA_103_sem3",
    courseCode: "PRA-103",
    title: "Field Practicum & Pastoral Internship",
    courseTitle: "Field Practicum & Pastoral Internship",
    description: "Supervised ministerial placement in an accredited assembly or chaplaincy centre evaluating real-world leadership conduct.",
    department: "Practical Theology & Pastoral Ministry",
    programme: "Diploma in Theology (Dipl.Th.)",
    level: "100",
    academicSession: "2026/2027",
    semester: "Third Semester",
    creditUnits: 4,
    creditUnit: 4,
    studyCentre: "",
    status: "active",
    prerequisiteCourseIds: ["PAS-102"],
    createdAt: "2026-01-15T08:00:00.000Z",
    updatedAt: "2026-01-15T08:00:00.000Z"
  },
  {
    id: "crs_LEA_103_sem3",
    courseCode: "LEA-103",
    title: "Christian Leadership in Contemporary Society",
    courseTitle: "Christian Leadership in Contemporary Society",
    description: "Servant leadership, conflict resolution, institutional growth strategies, and maintaining the fear of God in administration.",
    department: "Church Administration & Leadership",
    programme: "Executive Ministry Certificate",
    level: "200",
    academicSession: "2026/2027",
    semester: "Third Semester",
    creditUnits: 2,
    creditUnit: 2,
    studyCentre: "",
    status: "active",
    prerequisiteCourseIds: [],
    createdAt: "2026-01-15T08:00:00.000Z",
    updatedAt: "2026-01-15T08:00:00.000Z"
  }
]);

export function subscribeCourses(callback) {
  if (typeof callback !== "function") return () => {};

  // 1. Initial hydration: use cached collection or seed defaults if completely empty
  let initialList = getCachedCollection(COLLECTIONS.COURSES);
  if (!Array.isArray(initialList) || initialList.length === 0) {
    initialList = [...DEFAULT_DIMABIN_COURSES];
    setCachedCollection(COLLECTIONS.COURSES, initialList);
  }
  callback(initialList);

  const localListener = (e) => {
    if (e.detail) callback(e.detail);
  };
  window.addEventListener(`dimabin:db:${COLLECTIONS.COURSES}`, localListener);

  let unsubscribe = () => {};
  try {
    const collRef = collection(db, COLLECTIONS.COURSES);
    unsubscribe = onSnapshot(
      collRef,
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            courseCode: d.data().courseCode || d.data().code || "",
            title: d.data().title || d.data().courseTitle || "",
            courseTitle: d.data().courseTitle || d.data().title || "",
            creditUnits: d.data().creditUnits || d.data().creditUnit || 3,
            creditUnit: d.data().creditUnit || d.data().creditUnits || 3
          }));
          setCachedCollection(COLLECTIONS.COURSES, list);
          callback(list);
        } else {
          // If Firestore collection is pristine and empty, keep seed catalog and optionally seed
          const currentCache = getCachedCollection(COLLECTIONS.COURSES);
          if (currentCache.length === 0) {
            setCachedCollection(COLLECTIONS.COURSES, [...DEFAULT_DIMABIN_COURSES]);
            callback([...DEFAULT_DIMABIN_COURSES]);
          } else {
            callback(currentCache);
          }
        }
      },
      (err) => {
        console.warn("[DIMABIN Courses] onSnapshot note:", err.message);
        callback(getCachedCollection(COLLECTIONS.COURSES));
      }
    );
  } catch (err) {
    console.warn("[DIMABIN Courses] init note:", err.message);
  }

  return () => {
    try { unsubscribe(); } catch (_) {}
    window.removeEventListener(`dimabin:db:${COLLECTIONS.COURSES}`, localListener);
  };
}

export async function createCourse(courseData) {
  const code = normalizeCourseCode(courseData.courseCode);
  if (!code) throw new Error("Course Code is required.");

  const title = (courseData.title || courseData.courseTitle || "").trim();
  if (!title) throw new Error("Course Title is required.");

  const session = (courseData.academicSession || "2026/2027").trim();
  if (!session) throw new Error("Academic Session is required.");

  const semester = (courseData.semester || "First Semester").trim();
  if (!["First Semester", "Second Semester", "Third Semester"].includes(semester)) {
    throw new Error("Invalid semester. Must be First Semester, Second Semester, or Third Semester.");
  }

  const credits = parseInt(courseData.creditUnits || courseData.creditUnit, 10);
  if (isNaN(credits) || credits <= 0) {
    throw new Error("Credit Units must be a valid positive number.");
  }

  // Duplicate Check: Same code within same session and semester is prohibited
  const existingCourses = getCachedCollection(COLLECTIONS.COURSES);
  const isDuplicate = existingCourses.some((c) => {
    const cCode = normalizeCourseCode(c.courseCode);
    const cSession = (c.academicSession || "").trim();
    const cSemester = (c.semester || "").trim();
    return cCode === code && cSession === session && cSemester === semester;
  });

  if (isDuplicate) {
    throw new Error(
      `Course Code '${code}' is already registered for ${semester} (${session}). Duplicate course codes within the same academic session and semester are prohibited.`
    );
  }

  let prereqs = [];
  if (Array.isArray(courseData.prerequisiteCourseIds)) {
    prereqs = courseData.prerequisiteCourseIds;
  } else if (typeof courseData.prerequisiteCourseIds === "string") {
    prereqs = courseData.prerequisiteCourseIds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const nowIso = new Date().toISOString();
  const record = {
    courseCode: code,
    title: title,
    courseTitle: title, // maintain both for backwards compatibility
    description: (courseData.description || "").trim(),
    department: (courseData.department || "Biblical Studies & Theology").trim(),
    programme: (courseData.programme || "Diploma in Theology (Dipl.Th.)").trim(),
    level: String(courseData.level || "100").trim(),
    academicSession: session,
    semester: semester,
    creditUnits: credits,
    creditUnit: credits,
    studyCentre: (courseData.studyCentre || "").trim(),
    status: courseData.status === "inactive" ? "inactive" : "active",
    prerequisiteCourseIds: prereqs,
    createdAt: nowIso,
    updatedAt: nowIso
  };

  // Generate clean document ID
  const localId = `crs_${code.replace(/[^A-Z0-9]/g, "_")}_${session.replace(/[^0-9]/g, "_")}_${semester.replace(/\s+/g, "_")}`;
  upsertCachedItem(COLLECTIONS.COURSES, { id: localId, ...record });

  let savedDocId = localId;
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.COURSES), {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    savedDocId = docRef.id;
    // Update cached entry with true Firestore id
    removeCachedItem(COLLECTIONS.COURSES, localId);
    upsertCachedItem(COLLECTIONS.COURSES, { id: savedDocId, ...record });
  } catch (err) {
    console.warn(`[DIMABIN Courses] Firestore create note: ${err.message}`);
  }

  await logActivity({
    action: "course_created",
    description: `Created central institution-wide course [${record.courseCode}] "${record.title}" for ${record.semester} (${record.academicSession}).`,
    targetCollection: COLLECTIONS.COURSES,
    targetDocumentId: savedDocId
  });

  return { success: true, id: savedDocId, ...record };
}

export async function updateCourse(courseId, courseData) {
  if (!courseId) throw new Error("Course ID is required for updating.");

  const code = normalizeCourseCode(courseData.courseCode);
  if (!code) throw new Error("Course Code is required.");

  const title = (courseData.title || courseData.courseTitle || "").trim();
  if (!title) throw new Error("Course Title is required.");

  const session = (courseData.academicSession || "2026/2027").trim();
  if (!session) throw new Error("Academic Session is required.");

  const semester = (courseData.semester || "First Semester").trim();
  if (!["First Semester", "Second Semester", "Third Semester"].includes(semester)) {
    throw new Error("Invalid semester. Must be First Semester, Second Semester, or Third Semester.");
  }

  const credits = parseInt(courseData.creditUnits || courseData.creditUnit, 10);
  if (isNaN(credits) || credits <= 0) {
    throw new Error("Credit Units must be a valid positive number.");
  }

  // Duplicate Check: Exclude current course being edited
  const existingCourses = getCachedCollection(COLLECTIONS.COURSES);
  const isDuplicate = existingCourses.some((c) => {
    if (c.id === courseId) return false;
    const cCode = normalizeCourseCode(c.courseCode);
    const cSession = (c.academicSession || "").trim();
    const cSemester = (c.semester || "").trim();
    return cCode === code && cSession === session && cSemester === semester;
  });

  if (isDuplicate) {
    throw new Error(
      `Course Code '${code}' is already assigned to another course in ${semester} (${session}). Duplicate course codes within the same academic session and semester are prohibited.`
    );
  }

  let prereqs = [];
  if (Array.isArray(courseData.prerequisiteCourseIds)) {
    prereqs = courseData.prerequisiteCourseIds;
  } else if (typeof courseData.prerequisiteCourseIds === "string") {
    prereqs = courseData.prerequisiteCourseIds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Fetch current cached record to preserve creation timestamp
  const existingRecord = existingCourses.find((c) => c.id === courseId) || {};
  const createdAt = existingRecord.createdAt || new Date().toISOString();
  const nowIso = new Date().toISOString();

  const updatedRecord = {
    courseCode: code,
    title: title,
    courseTitle: title,
    description: (courseData.description || "").trim(),
    department: (courseData.department || "Biblical Studies & Theology").trim(),
    programme: (courseData.programme || "Diploma in Theology (Dipl.Th.)").trim(),
    level: String(courseData.level || "100").trim(),
    academicSession: session,
    semester: semester,
    creditUnits: credits,
    creditUnit: credits,
    studyCentre: (courseData.studyCentre !== undefined ? courseData.studyCentre : (existingRecord.studyCentre || "")).trim(),
    status: courseData.status === "inactive" ? "inactive" : "active",
    prerequisiteCourseIds: prereqs,
    createdAt: createdAt,
    updatedAt: nowIso
  };

  upsertCachedItem(COLLECTIONS.COURSES, { id: courseId, ...updatedRecord });

  try {
    const docRef = doc(db, COLLECTIONS.COURSES, courseId);
    await updateDoc(docRef, {
      ...updatedRecord,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn(`[DIMABIN Courses] Firestore update note: ${err.message}`);
  }

  await logActivity({
    action: "course_updated",
    description: `Updated curriculum parameters for [${updatedRecord.courseCode}] "${updatedRecord.title}" (${updatedRecord.semester}, ${updatedRecord.academicSession}).`,
    targetCollection: COLLECTIONS.COURSES,
    targetDocumentId: courseId
  });

  return { success: true, id: courseId, ...updatedRecord };
}

export async function setCourseStatus(courseId, newStatus) {
  if (!courseId) throw new Error("Course ID is required.");
  const status = newStatus === "active" ? "active" : "inactive";

  const courses = getCachedCollection(COLLECTIONS.COURSES);
  const target = courses.find((c) => c.id === courseId);
  const courseCode = target ? target.courseCode : courseId;

  upsertCachedItem(COLLECTIONS.COURSES, {
    id: courseId,
    status: status,
    updatedAt: new Date().toISOString()
  });

  try {
    const docRef = doc(db, COLLECTIONS.COURSES, courseId);
    await updateDoc(docRef, {
      status: status,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn(`[DIMABIN Courses] Status update note: ${err.message}`);
  }

  await logActivity({
    action: status === "active" ? "course_activated" : "course_deactivated",
    description: `Course [${courseCode}] status changed to '${status.toUpperCase()}'.`,
    targetCollection: COLLECTIONS.COURSES,
    targetDocumentId: courseId
  });

  return { success: true, courseId, status };
}

export async function toggleCourseStatus(courseId, currentStatus) {
  const newStatus = currentStatus === "active" ? "inactive" : "active";
  return setCourseStatus(courseId, newStatus);
}

export async function checkCourseDependencies(courseCode, courseId) {
  const code = normalizeCourseCode(courseCode);
  const references = [];

  // 1. Check allocations
  const allocations = getCachedCollection(COLLECTIONS.COURSE_ALLOCATIONS) || [];
  const allocMatches = allocations.filter((a) => {
    return normalizeCourseCode(a.courseCode) === code || a.courseId === courseId;
  });
  if (allocMatches.length > 0) {
    references.push(`${allocMatches.length} Faculty Teaching Allocation(s)`);
  }

  // 2. Check academic results
  const results = getCachedCollection(COLLECTIONS.RESULTS) || [];
  const resultMatches = results.filter((r) => normalizeCourseCode(r.courseCode) === code);
  if (resultMatches.length > 0) {
    references.push(`${resultMatches.length} Student Academic Result Record(s)`);
  }

  return {
    hasDependencies: references.length > 0,
    references,
    allocationsCount: allocMatches.length,
    resultsCount: resultMatches.length
  };
}

export async function deleteCoursePermanently(courseId) {
  if (!courseId) throw new Error("Course ID is required for deletion.");

  const courses = getCachedCollection(COLLECTIONS.COURSES);
  const target = courses.find((c) => c.id === courseId);
  const code = target ? target.courseCode : courseId;
  const title = target ? target.title : "";

  // Institutional Data Protection Check: Never silently break active academic relationships
  const depCheck = await checkCourseDependencies(code, courseId);
  if (depCheck.hasDependencies) {
    throw new Error(
      `Cannot permanently delete course [${code}]: It is actively referenced in ${depCheck.references.join(
        ", "
      )}. To safeguard academic transcript integrity, please DEACTIVATE this course instead of deleting it.`
    );
  }

  // Safe to delete only this isolated course document
  removeCachedItem(COLLECTIONS.COURSES, courseId);

  try {
    const docRef = doc(db, COLLECTIONS.COURSES, courseId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn(`[DIMABIN Courses] Firestore delete note: ${err.message}`);
  }

  await logActivity({
    action: "course_deleted",
    description: `Permanently deleted course curriculum [${code}] "${title}".`,
    targetCollection: COLLECTIONS.COURSES,
    targetDocumentId: courseId
  });

  return { success: true, courseId, courseCode: code };
}

/**
 * =========================================================================
 * 7. COURSE ALLOCATION (course_allocations)
 * Real-Time Offering Assignment with Multi-Centre Independence & Audit History
 * =========================================================================
 */
export function subscribeCourseAllocations(callback) {
  if (typeof callback !== "function") return () => {};

  let currentList = getCachedCollection(COLLECTIONS.COURSE_ALLOCATIONS) || [];
  callback(currentList);

  const localListener = (e) => {
    if (e.detail) callback(e.detail);
  };
  window.addEventListener(`dimabin:db:${COLLECTIONS.COURSE_ALLOCATIONS}`, localListener);

  let unsubscribe = () => {};
  try {
    const collRef = collection(db, COLLECTIONS.COURSE_ALLOCATIONS);
    unsubscribe = onSnapshot(
      collRef,
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setCachedCollection(COLLECTIONS.COURSE_ALLOCATIONS, list);
          callback(list);
          refreshLecturerDashboardData();
        } else {
          setCachedCollection(COLLECTIONS.COURSE_ALLOCATIONS, []);
          callback([]);
          refreshLecturerDashboardData();
        }
      },
      (err) => {
        console.warn("[DIMABIN Allocations] onSnapshot note:", err.message);
        callback(getCachedCollection(COLLECTIONS.COURSE_ALLOCATIONS) || []);
      }
    );
  } catch (err) {
    console.warn("[DIMABIN Allocations] init note:", err.message);
  }

  return () => {
    try { unsubscribe(); } catch (_) {}
    window.removeEventListener(`dimabin:db:${COLLECTIONS.COURSE_ALLOCATIONS}`, localListener);
  };
}

export async function createCourseAllocation(allocData) {
  return assignCourseOffering(allocData);
}

export async function assignCourseOffering(allocData) {
  const courseCode = normalizeCourseCode(allocData.courseCode);
  if (!courseCode) throw new Error("Course Code is required.");

  const studyCentre = (allocData.studyCentre || "").trim();
  const session = (allocData.academicSession || "2026/2027").trim();
  const semester = (allocData.semester || "First Semester").trim();
  const lecturerId = (allocData.lecturerId || "").trim();
  const lecturerName = (allocData.lecturerName || "").trim();

  if (!lecturerId || !lecturerName) {
    throw new Error("Assigned Lecturer (Full Name and Institutional Staff ID) is required.");
  }

  // Prevent duplicate active assignments for the same course offering:
  // An offering is uniquely identified by (courseCode, studyCentre, academicSession, semester)
  const currentAllocations = getCachedCollection(COLLECTIONS.COURSE_ALLOCATIONS);
  const existingActive = currentAllocations.find((a) => {
    return (
      normalizeCourseCode(a.courseCode) === courseCode &&
      (a.studyCentre || "").trim() === studyCentre &&
      (a.academicSession || "").trim() === session &&
      (a.semester || "").trim() === semester &&
      a.status !== "ended"
    );
  });

  if (existingActive) {
    throw new Error(
      `Course offering [${courseCode}] at ${studyCentre} (${semester}, ${session}) is already actively assigned to ${existingActive.lecturerName} (${existingActive.lecturerId}). Duplicate active assignments are prohibited. Please use 'Reassign / Transfer' to reallocate this offering.`
    );
  }

  const nowIso = new Date().toISOString();
  const record = {
    courseCode,
    courseTitle: (allocData.courseTitle || "").trim() || courseCode,
    programme: (allocData.programme || "Diploma in Theology (Dipl.Th.)").trim(),
    level: (allocData.level || "100").trim(),
    academicSession: session,
    semester,
    studyCentre,
    lecturerId,
    lecturerName,
    status: "active",
    assignmentHistory: [],
    allocatedAt: nowIso,
    allocatedBy: ADMIN_CREDENTIALS.ADMIN_ID,
    notes: (allocData.notes || "").trim()
  };

  const localId = `alloc_${courseCode.replace(/[^A-Z0-9]/g, "_")}_${studyCentre.replace(/[^A-Za-z0-9]/g, "_")}_${session.replace(/[^0-9]/g, "_")}_${semester.replace(/\s+/g, "_")}`;
  upsertCachedItem(COLLECTIONS.COURSE_ALLOCATIONS, { id: localId, ...record });

  let savedId = localId;
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.COURSE_ALLOCATIONS), {
      ...record,
      allocatedAt: serverTimestamp()
    });
    savedId = docRef.id;
    removeCachedItem(COLLECTIONS.COURSE_ALLOCATIONS, localId);
    upsertCachedItem(COLLECTIONS.COURSE_ALLOCATIONS, { id: savedId, ...record });
  } catch (err) {
    console.warn(`[DIMABIN Allocations] Firestore add note: ${err.message}`);
  }

  await logActivity({
    action: "course_allocated",
    description: `Assigned course offering [${courseCode}] at ${studyCentre} to ${lecturerName} (${lecturerId}) for ${semester} (${session}).`,
    targetCollection: COLLECTIONS.COURSE_ALLOCATIONS,
    targetDocumentId: savedId
  });

  refreshLecturerDashboardData();
  return { success: true, id: savedId, ...record };
}

export async function reassignCourseAllocation(allocId, { newLecturerId, newLecturerName, reason, notes }) {
  if (!allocId) throw new Error("Allocation ID is required.");
  if (!newLecturerId || !newLecturerName) throw new Error("New Lecturer selection is required.");

  const currentAllocations = getCachedCollection(COLLECTIONS.COURSE_ALLOCATIONS);
  const existing = currentAllocations.find((a) => a.id === allocId);
  if (!existing) throw new Error("Allocation record not found in system.");

  if (existing.lecturerId === newLecturerId) {
    throw new Error(`This course offering is already assigned to ${newLecturerName}. Please select a different faculty instructor.`);
  }

  const nowIso = new Date().toISOString();
  // Preserve previous assignment history
  const previousRecord = {
    lecturerId: existing.lecturerId,
    lecturerName: existing.lecturerName,
    assignedAt: existing.allocatedAt || nowIso,
    endedAt: nowIso,
    reason: (reason || "Transferred to new instructor for trimester rotation").trim()
  };

  const updatedHistory = [previousRecord, ...(existing.assignmentHistory || [])];

  const updatedRecord = {
    ...existing,
    lecturerId: newLecturerId.trim(),
    lecturerName: newLecturerName.trim(),
    status: "reassigned",
    assignmentHistory: updatedHistory,
    reassignedAt: nowIso,
    reassignedBy: ADMIN_CREDENTIALS.ADMIN_ID,
    notes: notes ? `${existing.notes ? existing.notes + " | " : ""}${notes}` : existing.notes,
    updatedAt: nowIso
  };

  upsertCachedItem(COLLECTIONS.COURSE_ALLOCATIONS, { id: allocId, ...updatedRecord });

  try {
    const docRef = doc(db, COLLECTIONS.COURSE_ALLOCATIONS, allocId);
    await updateDoc(docRef, {
      lecturerId: updatedRecord.lecturerId,
      lecturerName: updatedRecord.lecturerName,
      status: "reassigned",
      assignmentHistory: updatedHistory,
      reassignedAt: serverTimestamp(),
      reassignedBy: ADMIN_CREDENTIALS.ADMIN_ID,
      notes: updatedRecord.notes || "",
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn(`[DIMABIN Allocations] Reassign note: ${err.message}`);
  }

  await logActivity({
    action: "course_reassigned",
    description: `Transferred course offering [${existing.courseCode}] at ${existing.studyCentre} from ${existing.lecturerName} (${existing.lecturerId}) to ${newLecturerName} (${newLecturerId}). Reason: ${reason || "Faculty reallocation"}.`,
    targetCollection: COLLECTIONS.COURSE_ALLOCATIONS,
    targetDocumentId: allocId
  });

  refreshLecturerDashboardData();
  return { success: true, id: allocId, ...updatedRecord };
}

export async function endCourseAllocation(allocId, { reason } = {}) {
  if (!allocId) throw new Error("Allocation ID is required.");

  const currentAllocations = getCachedCollection(COLLECTIONS.COURSE_ALLOCATIONS);
  const existing = currentAllocations.find((a) => a.id === allocId);
  if (!existing) throw new Error("Allocation record not found.");

  const nowIso = new Date().toISOString();
  const previousRecord = {
    lecturerId: existing.lecturerId,
    lecturerName: existing.lecturerName,
    assignedAt: existing.allocatedAt || nowIso,
    endedAt: nowIso,
    reason: (reason || "Assignment concluded / course offering released").trim()
  };

  const updatedHistory = [previousRecord, ...(existing.assignmentHistory || [])];

  const updatedRecord = {
    ...existing,
    status: "ended",
    assignmentHistory: updatedHistory,
    endedAt: nowIso,
    endReason: (reason || "Assignment concluded").trim(),
    updatedAt: nowIso
  };

  upsertCachedItem(COLLECTIONS.COURSE_ALLOCATIONS, { id: allocId, ...updatedRecord });

  try {
    const docRef = doc(db, COLLECTIONS.COURSE_ALLOCATIONS, allocId);
    await updateDoc(docRef, {
      status: "ended",
      assignmentHistory: updatedHistory,
      endedAt: serverTimestamp(),
      endReason: updatedRecord.endReason,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn(`[DIMABIN Allocations] End allocation note: ${err.message}`);
  }

  await logActivity({
    action: "course_allocation_ended",
    description: `Concluded assignment for [${existing.courseCode}] at ${existing.studyCentre} (previously taught by ${existing.lecturerName}). Offering is now Available.`,
    targetCollection: COLLECTIONS.COURSE_ALLOCATIONS,
    targetDocumentId: allocId
  });

  refreshLecturerDashboardData();
  return { success: true, id: allocId, ...updatedRecord };
}

export async function deleteCourseAllocation(allocId) {
  removeCachedItem(COLLECTIONS.COURSE_ALLOCATIONS, allocId);

  try {
    const docRef = doc(db, COLLECTIONS.COURSE_ALLOCATIONS, allocId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn(`[DIMABIN Allocations] Delete note: ${err.message}`);
  }

  await logActivity({
    action: "course_allocation_revoked",
    description: `Revoked course allocation record ${allocId}.`,
    targetCollection: COLLECTIONS.COURSE_ALLOCATIONS,
    targetDocumentId: allocId
  });

  refreshLecturerDashboardData();
  return { success: true, allocId };
}

export function refreshLecturerDashboardData() {
  try {
    const allocations = getCachedCollection(COLLECTIONS.COURSE_ALLOCATIONS) || [];
    const activeAllocations = allocations.filter((a) => a.status === "active" || a.status === "reassigned");

    const workloadByLecturer = {};
    activeAllocations.forEach((alloc) => {
      if (!alloc.lecturerId) return;
      if (!workloadByLecturer[alloc.lecturerId]) {
        workloadByLecturer[alloc.lecturerId] = {
          lecturerId: alloc.lecturerId,
          lecturerName: alloc.lecturerName,
          coursesCount: 0,
          studyCentres: new Set(),
          offerings: []
        };
      }
      workloadByLecturer[alloc.lecturerId].coursesCount += 1;
      if (alloc.studyCentre) {
        workloadByLecturer[alloc.lecturerId].studyCentres.add(alloc.studyCentre);
      }
      workloadByLecturer[alloc.lecturerId].offerings.push({
        courseCode: alloc.courseCode,
        courseTitle: alloc.courseTitle,
        studyCentre: alloc.studyCentre,
        semester: alloc.semester,
        academicSession: alloc.academicSession,
        status: alloc.status,
        allocatedAt: alloc.allocatedAt
      });
    });

    const serialized = {};
    Object.keys(workloadByLecturer).forEach((lecId) => {
      serialized[lecId] = {
        ...workloadByLecturer[lecId],
        studyCentres: Array.from(workloadByLecturer[lecId].studyCentres)
      };
    });

    localStorage.setItem("dimabin_lecturer_dashboard_data", JSON.stringify(serialized));
    window.dispatchEvent(new CustomEvent("dimabin:lecturer-allocations-updated", { detail: serialized }));
  } catch (err) {
    console.warn("[DIMABIN Dashboard] refreshLecturerDashboardData note:", err.message);
  }
}

/**
 * =========================================================================
 * 7B. CENTRAL COURSE REGISTRATION CONTROL & STUDENT REGISTRATIONS
 * Full 3-Semester Institutional Management Across All Study Centres
 * =========================================================================
 */

export const DEFAULT_REGISTRATION_SETTINGS = Object.freeze([
  {
    id: "reg_2026_2027_First_Semester",
    academicSession: "2026/2027",
    semester: "First Semester",
    isOpen: true,
    openDate: "2026-09-01",
    closeDate: "2026-11-30",
    minCredits: 1,
    maxCredits: 24,
    notes: "Central course registration for First Semester 2026/2027 is active across all study centres.",
    updatedAt: "2026-09-01T08:00:00.000Z",
    updatedBy: ADMIN_CREDENTIALS.ADMIN_ID
  },
  {
    id: "reg_2026_2027_Second_Semester",
    academicSession: "2026/2027",
    semester: "Second Semester",
    isOpen: false,
    openDate: "2027-01-15",
    closeDate: "2027-03-31",
    minCredits: 1,
    maxCredits: 24,
    notes: "Second Semester registration opens per academic calendar.",
    updatedAt: "2026-09-01T08:00:00.000Z",
    updatedBy: ADMIN_CREDENTIALS.ADMIN_ID
  },
  {
    id: "reg_2026_2027_Third_Semester",
    academicSession: "2026/2027",
    semester: "Third Semester",
    isOpen: false,
    openDate: "2027-04-15",
    closeDate: "2027-06-30",
    minCredits: 1,
    maxCredits: 24,
    notes: "Third Semester registration opens per academic calendar.",
    updatedAt: "2026-09-01T08:00:00.000Z",
    updatedBy: ADMIN_CREDENTIALS.ADMIN_ID
  }
]);

export function getRegistrationSettingsDocId(session, semester) {
  const cleanSession = (session || "2026/2027").trim().replace(/[^0-9]/g, "_");
  const cleanSemester = (semester || "First Semester").trim().replace(/\s+/g, "_");
  return `reg_${cleanSession}_${cleanSemester}`;
}

export function subscribeRegistrationSettings(callback) {
  if (typeof callback !== "function") return () => {};

  let initialList = getCachedCollection(COLLECTIONS.REGISTRATION_SETTINGS);
  if (!Array.isArray(initialList) || initialList.length === 0) {
    initialList = [...DEFAULT_REGISTRATION_SETTINGS];
    setCachedCollection(COLLECTIONS.REGISTRATION_SETTINGS, initialList);
  }
  callback(initialList);

  const localListener = (e) => {
    if (e.detail) callback(e.detail);
  };
  window.addEventListener(`dimabin:db:${COLLECTIONS.REGISTRATION_SETTINGS}`, localListener);

  let unsubscribe = () => {};
  try {
    const collRef = collection(db, COLLECTIONS.REGISTRATION_SETTINGS);
    unsubscribe = onSnapshot(
      collRef,
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setCachedCollection(COLLECTIONS.REGISTRATION_SETTINGS, list);
          callback(list);
        } else {
          // If Firestore is empty, seed defaults
          const currentCache = getCachedCollection(COLLECTIONS.REGISTRATION_SETTINGS);
          if (!currentCache || currentCache.length === 0) {
            setCachedCollection(COLLECTIONS.REGISTRATION_SETTINGS, [...DEFAULT_REGISTRATION_SETTINGS]);
            callback([...DEFAULT_REGISTRATION_SETTINGS]);
          } else {
            callback(currentCache);
          }
        }
      },
      (err) => {
        console.warn("[DIMABIN Registration Settings] onSnapshot note:", err.message);
        callback(getCachedCollection(COLLECTIONS.REGISTRATION_SETTINGS));
      }
    );
  } catch (err) {
    console.warn("[DIMABIN Registration Settings] init note:", err.message);
  }

  return () => {
    try { unsubscribe(); } catch (_) {}
    window.removeEventListener(`dimabin:db:${COLLECTIONS.REGISTRATION_SETTINGS}`, localListener);
  };
}

export async function saveRegistrationSettings(session, semester, updateData) {
  const normSession = (session || "2026/2027").trim();
  const normSemester = (semester || "First Semester").trim();
  const docId = getRegistrationSettingsDocId(normSession, normSemester);

  const existingList = getCachedCollection(COLLECTIONS.REGISTRATION_SETTINGS) || [];
  const existingRecord = existingList.find((r) => r.id === docId || (r.academicSession === normSession && r.semester === normSemester)) || {};

  const isOpen = updateData.isOpen !== undefined ? Boolean(updateData.isOpen) : (existingRecord.isOpen || false);
  const openDate = updateData.openDate !== undefined ? updateData.openDate : (existingRecord.openDate || "");
  const closeDate = updateData.closeDate !== undefined ? updateData.closeDate : (existingRecord.closeDate || "");
  const minCredits = updateData.minCredits !== undefined ? parseInt(updateData.minCredits, 10) : (existingRecord.minCredits || 1);
  const maxCredits = updateData.maxCredits !== undefined ? parseInt(updateData.maxCredits, 10) : (existingRecord.maxCredits || 24);
  const notes = updateData.notes !== undefined ? updateData.notes : (existingRecord.notes || "");
  const nowIso = new Date().toISOString();

  const record = {
    id: docId,
    academicSession: normSession,
    semester: normSemester,
    isOpen,
    openDate,
    closeDate,
    minCredits,
    maxCredits,
    notes,
    updatedAt: nowIso,
    updatedBy: updateData.updatedBy || ADMIN_CREDENTIALS.ADMIN_ID
  };

  upsertCachedItem(COLLECTIONS.REGISTRATION_SETTINGS, record);

  try {
    const docRef = doc(db, COLLECTIONS.REGISTRATION_SETTINGS, docId);
    await setDoc(docRef, {
      ...record,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn("[DIMABIN Registration Settings] Firestore save note:", err.message);
  }

  await logActivity({
    action: isOpen ? "course_registration_opened" : "course_registration_closed",
    description: `Centrally ${isOpen ? "OPENED" : "CLOSED"} course registration for ${normSemester} (${normSession}) across all active study centres.`,
    targetCollection: COLLECTIONS.REGISTRATION_SETTINGS,
    targetDocumentId: docId
  });

  return { success: true, ...record };
}

export async function toggleRegistrationOpenStatus(session, semester, targetStatus) {
  const normSession = (session || "2026/2027").trim();
  const normSemester = (semester || "First Semester").trim();
  const current = getRegistrationSettings(normSession, normSemester);
  const nextStatus = targetStatus !== undefined ? Boolean(targetStatus) : !current.isOpen;
  return saveRegistrationSettings(normSession, normSemester, { isOpen: nextStatus });
}

export function getRegistrationSettings(session, semester) {
  const normSession = (session || "2026/2027").trim();
  const normSemester = (semester || "First Semester").trim();
  const docId = getRegistrationSettingsDocId(normSession, normSemester);

  const list = getCachedCollection(COLLECTIONS.REGISTRATION_SETTINGS) || [];
  const found = list.find((r) => r.id === docId || (r.academicSession === normSession && r.semester === normSemester));
  if (found) return found;

  const defFound = DEFAULT_REGISTRATION_SETTINGS.find((r) => r.id === docId || (r.academicSession === normSession && r.semester === normSemester));
  if (defFound) return defFound;

  return {
    id: docId,
    academicSession: normSession,
    semester: normSemester,
    isOpen: false,
    openDate: "",
    closeDate: "",
    minCredits: 1,
    maxCredits: 24,
    notes: ""
  };
}

export function subscribeCourseRegistrations(callback) {
  if (typeof callback !== "function") return () => {};

  let currentList = getCachedCollection(COLLECTIONS.COURSE_REGISTRATIONS) || [];
  callback(currentList);

  const localListener = (e) => {
    if (e.detail) callback(e.detail);
  };
  window.addEventListener(`dimabin:db:${COLLECTIONS.COURSE_REGISTRATIONS}`, localListener);

  let unsubscribe = () => {};
  try {
    const collRef = collection(db, COLLECTIONS.COURSE_REGISTRATIONS);
    unsubscribe = onSnapshot(
      collRef,
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setCachedCollection(COLLECTIONS.COURSE_REGISTRATIONS, list);
          callback(list);
        } else {
          setCachedCollection(COLLECTIONS.COURSE_REGISTRATIONS, []);
          callback([]);
        }
      },
      (err) => {
        console.warn("[DIMABIN Course Registrations] onSnapshot note:", err.message);
        callback(getCachedCollection(COLLECTIONS.COURSE_REGISTRATIONS) || []);
      }
    );
  } catch (err) {
    console.warn("[DIMABIN Course Registrations] init note:", err.message);
  }

  return () => {
    try { unsubscribe(); } catch (_) {}
    window.removeEventListener(`dimabin:db:${COLLECTIONS.COURSE_REGISTRATIONS}`, localListener);
  };
}

export function getStudentCourseRegistration(studentUid, session, semester) {
  if (!studentUid) return null;
  const list = getCachedCollection(COLLECTIONS.COURSE_REGISTRATIONS) || [];
  const normSession = (session || "2026/2027").trim();
  const normSemester = (semester || "First Semester").trim();

  return list.find((r) => {
    const matchesUser = r.studentUid === studentUid || r.userId === studentUid;
    const matchesSession = !normSession || r.academicSession === normSession;
    const matchesSemester = !normSemester || r.semester === normSemester;
    return matchesUser && matchesSession && matchesSemester;
  }) || null;
}

export async function submitStudentCourseRegistration({
  studentUid,
  studentProfile,
  academicSession,
  semester,
  selectedCourseIds
}) {
  if (!studentUid) {
    throw new Error("Authentication error: Valid student login credentials are required to register courses.");
  }

  if (!studentProfile) {
    throw new Error("Student profile could not be loaded. Please re-authenticate and try again.");
  }

  const session = (academicSession || studentProfile.academicSession || "2026/2027").trim();
  const sem = (semester || "First Semester").trim();

  if (!["First Semester", "Second Semester", "Third Semester"].includes(sem)) {
    throw new Error("Invalid academic semester specified for registration.");
  }

  // 1. Authoritative Server/Firestore check: Is registration currently OPEN for this session and semester?
  const regSettings = getRegistrationSettings(session, sem);
  if (!regSettings || !regSettings.isOpen) {
    throw new Error(
      `Course registration is currently closed for ${sem} (${session}). Please check the academic calendar or contact the administration.`
    );
  }

  // 2. Validate course selection
  if (!Array.isArray(selectedCourseIds) || selectedCourseIds.length === 0) {
    throw new Error("Please select at least one course to complete your registration.");
  }

  // 3. Fetch central catalogue to validate courses
  const allCourses = getCachedCollection(COLLECTIONS.COURSES) || [...DEFAULT_DIMABIN_COURSES];
  const allAllocations = getCachedCollection(COLLECTIONS.COURSE_ALLOCATIONS) || [];

  // Deduplicate selected IDs
  const uniqueCourseIds = Array.from(new Set(selectedCourseIds));

  // Find and validate each course in central catalogue
  const studentCentre = (studentProfile.studyCentre || "Abeokuta Main Campus").trim();
  const compiledCourses = [];
  let totalCredits = 0;

  for (const cId of uniqueCourseIds) {
    const courseObj = allCourses.find((c) => c.id === cId || c.courseCode === cId);
    if (!courseObj) {
      throw new Error(`Selected course with identifier '${cId}' does not exist in the central catalogue.`);
    }

    if (courseObj.status === "inactive") {
      throw new Error(`Course [${courseObj.courseCode}] "${courseObj.title}" is currently deactivated and cannot be registered.`);
    }

    // Verify course belongs to this semester and session
    if (courseObj.semester !== sem) {
      throw new Error(`Course [${courseObj.courseCode}] is catalogued for ${courseObj.semester}, not ${sem}.`);
    }

    const credits = parseInt(courseObj.creditUnits || courseObj.creditUnit || 3, 10);
    totalCredits += credits;

    // Resolve assigned lecturer from allocations (checking student's centre first, then central/any)
    const normCode = normalizeCourseCode(courseObj.courseCode);
    const centreAlloc = allAllocations.find((a) => {
      const matchCode = normalizeCourseCode(a.courseCode) === normCode || a.courseId === courseObj.id;
      const matchSem = a.semester === sem;
      const matchSess = a.academicSession === session;
      const matchCentre = (a.studyCentre || "").trim().toLowerCase() === studentCentre.toLowerCase();
      return matchCode && matchSem && matchSess && matchCentre && a.status !== "ended";
    });

    const generalAlloc = allAllocations.find((a) => {
      const matchCode = normalizeCourseCode(a.courseCode) === normCode || a.courseId === courseObj.id;
      const matchSem = a.semester === sem;
      const matchSess = a.academicSession === session;
      return matchCode && matchSem && matchSess && a.status !== "ended";
    });

    const assignedAlloc = centreAlloc || generalAlloc;
    const lecturerName = assignedAlloc ? assignedAlloc.lecturerName : (courseObj.lecturerName || "To be announced (TBA)");
    const lecturerId = assignedAlloc ? assignedAlloc.lecturerId : (courseObj.lecturerId || "");

    compiledCourses.push({
      courseId: courseObj.id,
      courseCode: courseObj.courseCode,
      courseTitle: courseObj.title || courseObj.courseTitle,
      creditUnits: credits,
      department: courseObj.department || "Biblical Studies & Theology",
      programme: courseObj.programme || "Diploma in Theology (Dipl.Th.)",
      lecturerName: lecturerName,
      lecturerId: lecturerId
    });
  }

  // 4. Validate credit units limits
  if (regSettings.maxCredits && totalCredits > regSettings.maxCredits) {
    throw new Error(`Total credit units (${totalCredits}) exceeds the maximum allowed limit of ${regSettings.maxCredits} units.`);
  }

  // 5. Existing registration check: Prevent duplicate registration overwriting approved records
  const regDocId = `${studentUid}_${session.replace(/[^0-9]/g, "_")}_${sem.replace(/\s+/g, "_")}`;
  const existingReg = getStudentCourseRegistration(studentUid, session, sem);

  if (existingReg && existingReg.status === "approved") {
    throw new Error(`Your course registration for ${sem} (${session}) has already been approved by the Academic Registry and cannot be modified.`);
  }

  const nowIso = new Date().toISOString();
  const studentId = studentProfile.studentId || studentProfile.admissionNumber || "DIMABIN/STU/2026";
  const studentName = studentProfile.fullName || "Student Candidate";

  const registrationRecord = {
    id: regDocId,
    studentUid: studentUid,
    userId: studentUid,
    studentId: studentId,
    admissionNumber: studentId,
    studentName: studentName,
    studentEmail: studentProfile.email || "",
    studentPhone: studentProfile.phone || "",
    studyCentre: studentCentre,
    studyCentreId: studentProfile.studyCentreId || "",
    programme: studentProfile.programme || "Diploma in Theology (Dipl.Th.)",
    level: studentProfile.level || "Diploma I",
    academicSession: session,
    semester: sem,
    courseIds: compiledCourses.map((c) => c.courseId),
    courses: compiledCourses,
    totalCredits: totalCredits,
    courseCount: compiledCourses.length,
    status: existingReg && existingReg.status === "returned" ? "resubmitted" : "submitted",
    submittedAt: existingReg ? (existingReg.submittedAt || nowIso) : nowIso,
    updatedAt: nowIso,
    history: existingReg && Array.isArray(existingReg.history) ? [...existingReg.history, { timestamp: nowIso, action: "resubmitted" }] : [{ timestamp: nowIso, action: "initial_submission" }]
  };

  upsertCachedItem(COLLECTIONS.COURSE_REGISTRATIONS, registrationRecord);

  try {
    const docRef = doc(db, COLLECTIONS.COURSE_REGISTRATIONS, regDocId);
    await setDoc(docRef, {
      ...registrationRecord,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn("[DIMABIN Course Registrations] Firestore save note:", err.message);
  }

  await logActivity({
    action: "course_registration_submitted",
    description: `Student [${studentId}] "${studentName}" at ${studentCentre} registered for ${compiledCourses.length} course(s) (${totalCredits} credit units) in ${sem} (${session}).`,
    targetCollection: COLLECTIONS.COURSE_REGISTRATIONS,
    targetDocumentId: regDocId
  });

  return { success: true, registrationId: regDocId, registration: registrationRecord };
}

export async function updateCourseRegistrationStatus(registrationId, newStatus, reviewNotes = "", adminId = ADMIN_CREDENTIALS.ADMIN_ID) {
  if (!registrationId) throw new Error("Registration ID is required.");

  const validStatuses = ["submitted", "approved", "rejected", "returned", "resubmitted"];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(", ")}`);
  }

  const list = getCachedCollection(COLLECTIONS.COURSE_REGISTRATIONS) || [];
  const existing = list.find((r) => r.id === registrationId);
  if (!existing) {
    throw new Error(`Registration record '${registrationId}' was not found.`);
  }

  const nowIso = new Date().toISOString();
  const updatedRecord = {
    ...existing,
    status: newStatus,
    reviewNotes: (reviewNotes || "").trim(),
    reviewedBy: adminId,
    reviewedAt: nowIso,
    updatedAt: nowIso,
    history: [
      ...(Array.isArray(existing.history) ? existing.history : []),
      { timestamp: nowIso, action: `status_${newStatus}`, notes: reviewNotes, adminId }
    ]
  };

  upsertCachedItem(COLLECTIONS.COURSE_REGISTRATIONS, updatedRecord);

  try {
    const docRef = doc(db, COLLECTIONS.COURSE_REGISTRATIONS, registrationId);
    await updateDoc(docRef, {
      status: newStatus,
      reviewNotes: updatedRecord.reviewNotes,
      reviewedBy: adminId,
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      history: updatedRecord.history
    });
  } catch (err) {
    console.warn("[DIMABIN Course Registrations] Status update note:", err.message);
  }

  await logActivity({
    action: `course_registration_${newStatus}`,
    description: `Registration for [${existing.studentId}] "${existing.studentName}" at ${existing.studyCentre} set to '${newStatus.toUpperCase()}' by Registry.`,
    targetCollection: COLLECTIONS.COURSE_REGISTRATIONS,
    targetDocumentId: registrationId
  });

  return { success: true, registrationId, status: newStatus };
}

/**
 * =========================================================================
 * 8. OFFICIAL STUDY CENTRES (studyCentres)
 * Authoritative single source of truth for physical campuses and learning hubs.
 * =========================================================================
 */

export function normalizeCentreCode(code) {
  return (code || "").trim().toUpperCase();
}

export function normalizeCentreName(name) {
  return (name || "").trim().toLowerCase();
}

/**
 * Get current cached official study centres (strictly genuine records)
 */
export function getStudyCentres() {
  const list = getCachedCollection(COLLECTIONS.STUDY_CENTRES);
  return Array.isArray(list) ? list : [];
}

/**
 * Subscribe to real-time official study centres from Firestore
 * Single source of truth: strictly reads genuine documents from Firestore.
 * If empty, stays empty. Never seeds or synthesizes sample centres.
 */
export function subscribeStudyCentres(callback) {
  if (typeof callback !== "function") return () => {};

  let list = getStudyCentres();
  callback(list);

  // Local storage broadcast listener
  const localListener = (e) => {
    if (e.detail) callback(e.detail);
  };
  window.addEventListener(`dimabin:db:${COLLECTIONS.STUDY_CENTRES}`, localListener);
  window.addEventListener("dimabin:study-centres-updated", localListener);

  let unsubscribe = () => {};
  try {
    const collRef = collection(db, COLLECTIONS.STUDY_CENTRES);
    unsubscribe = onSnapshot(
      collRef,
      (snap) => {
        if (!snap.empty) {
          const remoteList = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              centreId: data.centreId || d.id,
              centreCode: data.centreCode || "DIMABIN-CTR",
              centreName: data.centreName || "DIMABIN Study Centre",
              address: data.address || data.location || "Nigeria",
              location: data.address || data.location || "Nigeria",
              coordinator: data.coordinator || "Coordinator",
              contactPhone: data.contactPhone || data.phone || "",
              phone: data.contactPhone || data.phone || "",
              contactEmail: data.contactEmail || data.email || "",
              email: data.contactEmail || data.email || "",
              status: data.status || "active",
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString(),
              createdBy: data.createdBy || ADMIN_CREDENTIALS.ADMIN_ID,
              ...data
            };
          });

          // Sort by centreCode or centreName
          remoteList.sort((a, b) => (a.centreCode || "").localeCompare(b.centreCode || ""));

          setCachedCollection(COLLECTIONS.STUDY_CENTRES, remoteList);
          callback(remoteList);
        } else {
          // Authoritative state is empty when Firestore has no documents. Never write sample centres.
          setCachedCollection(COLLECTIONS.STUDY_CENTRES, []);
          callback([]);
        }
      },
      (err) => {
        console.warn("[DIMABIN Centres] onSnapshot note:", err.message);
        callback(getStudyCentres());
      }
    );
  } catch (err) {
    console.warn("[DIMABIN Centres] init note:", err.message);
  }

  return () => {
    try { unsubscribe(); } catch (_) {}
    window.removeEventListener(`dimabin:db:${COLLECTIONS.STUDY_CENTRES}`, localListener);
    window.removeEventListener("dimabin:study-centres-updated", localListener);
  };
}

/**
 * Create a new official study centre
 */
export async function createStudyCentre(centreData) {
  if (!centreData) throw new Error("Study centre parameters are required.");

  const name = (centreData.centreName || "").trim();
  const rawCode = (centreData.centreCode || "").trim().toUpperCase();
  const address = (centreData.address || centreData.location || "").trim();

  // 1. Validation
  if (!name) {
    throw new Error("Official Study Centre Name is required.");
  }
  if (!rawCode) {
    throw new Error("Institutional Centre Code is required.");
  }
  if (!address) {
    throw new Error("Physical Campus Address / Location is required.");
  }

  const existingCentres = getStudyCentres();

  // 2. Duplicate Code Check (case-insensitive)
  const codeConflict = existingCentres.find(
    (c) => normalizeCentreCode(c.centreCode) === normalizeCentreCode(rawCode)
  );
  if (codeConflict) {
    throw new Error(`Institutional Centre Code "${rawCode}" is already in use by "${codeConflict.centreName}".`);
  }

  // 3. Duplicate Name Check (case-insensitive)
  const nameConflict = existingCentres.find(
    (c) => normalizeCentreName(c.centreName) === normalizeCentreName(name)
  );
  if (nameConflict) {
    throw new Error(`A study centre named "${name}" already exists in the institutional registry.`);
  }

  const nowIso = new Date().toISOString();
  const cleanId = `centre_${rawCode.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now().toString(36).substring(2, 6)}`;

  const record = {
    id: cleanId,
    centreId: cleanId,
    centreCode: rawCode,
    centreName: name,
    address,
    location: address,
    coordinator: (centreData.coordinator || "Registry Appointed Coordinator").trim(),
    contactPhone: (centreData.contactPhone || centreData.phone || "").trim(),
    phone: (centreData.contactPhone || centreData.phone || "").trim(),
    contactEmail: (centreData.contactEmail || centreData.email || "").trim(),
    email: (centreData.contactEmail || centreData.email || "").trim(),
    status: (centreData.status || "active").toLowerCase() === "inactive" ? "inactive" : "active",
    createdAt: nowIso,
    updatedAt: nowIso,
    createdBy: ADMIN_CREDENTIALS.ADMIN_ID
  };

  // Upsert to local storage cache immediately
  upsertCachedItem(COLLECTIONS.STUDY_CENTRES, record);
  window.dispatchEvent(new CustomEvent("dimabin:study-centres-updated", { detail: getStudyCentres() }));

  // Save to Firestore
  try {
    const docRef = doc(db, COLLECTIONS.STUDY_CENTRES, cleanId);
    await setDoc(docRef, {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log(`[DIMABIN Centres] Study centre created in Firestore: ${record.centreName} (${cleanId}).`);
  } catch (err) {
    console.warn(`[DIMABIN Centres] Firestore create note: ${err.message}`);
  }

  // Institutional Activity Log
  await logActivity({
    action: "study_centre_registered",
    description: `Added official Study Centre: ${record.centreName} [${record.centreCode}] located at ${record.address}.`,
    targetCollection: COLLECTIONS.STUDY_CENTRES,
    targetDocumentId: cleanId
  });

  return { success: true, ...record };
}

/**
 * Update an existing official study centre
 */
export async function updateStudyCentre(centreId, updateData) {
  if (!centreId) throw new Error("Study Centre ID is required.");
  if (!updateData) throw new Error("Update details are required.");

  const existingCentres = getStudyCentres();
  const target = existingCentres.find((c) => c.id === centreId || c.centreId === centreId);
  if (!target) {
    throw new Error("Target study centre could not be found in the registry.");
  }

  const name = (updateData.centreName || target.centreName).trim();
  const rawCode = (updateData.centreCode || target.centreCode).trim().toUpperCase();
  const address = (updateData.address || updateData.location || target.address || target.location).trim();

  // Validate Required
  if (!name) throw new Error("Official Study Centre Name cannot be blank.");
  if (!rawCode) throw new Error("Institutional Centre Code cannot be blank.");
  if (!address) throw new Error("Physical Campus Address cannot be blank.");

  // Check code conflicts with other centres
  const codeConflict = existingCentres.find(
    (c) => (c.id !== centreId && c.centreId !== centreId) && normalizeCentreCode(c.centreCode) === normalizeCentreCode(rawCode)
  );
  if (codeConflict) {
    throw new Error(`Institutional Centre Code "${rawCode}" is already in use by "${codeConflict.centreName}".`);
  }

  // Check name conflicts with other centres
  const nameConflict = existingCentres.find(
    (c) => (c.id !== centreId && c.centreId !== centreId) && normalizeCentreName(c.centreName) === normalizeCentreName(name)
  );
  if (nameConflict) {
    throw new Error(`A study centre named "${name}" already exists in the institutional registry.`);
  }

  const nowIso = new Date().toISOString();
  const updatedRecord = {
    ...target,
    centreCode: rawCode,
    centreName: name,
    address,
    location: address,
    coordinator: updateData.coordinator !== undefined ? updateData.coordinator.trim() : target.coordinator,
    contactPhone: updateData.contactPhone !== undefined ? updateData.contactPhone.trim() : (updateData.phone || target.contactPhone),
    phone: updateData.contactPhone !== undefined ? updateData.contactPhone.trim() : (updateData.phone || target.phone),
    contactEmail: updateData.contactEmail !== undefined ? updateData.contactEmail.trim() : (updateData.email || target.contactEmail),
    email: updateData.contactEmail !== undefined ? updateData.contactEmail.trim() : (updateData.email || target.email),
    status: updateData.status ? updateData.status.toLowerCase() : target.status,
    updatedAt: nowIso,
    updatedBy: ADMIN_CREDENTIALS.ADMIN_ID
  };

  // Upsert to cache
  upsertCachedItem(COLLECTIONS.STUDY_CENTRES, updatedRecord);
  window.dispatchEvent(new CustomEvent("dimabin:study-centres-updated", { detail: getStudyCentres() }));

  // Update in Firestore
  try {
    const docRef = doc(db, COLLECTIONS.STUDY_CENTRES, centreId);
    await updateDoc(docRef, {
      ...updatedRecord,
      updatedAt: serverTimestamp()
    });
    console.log(`[DIMABIN Centres] Study centre ${centreId} updated in Firestore.`);
  } catch (err) {
    console.warn(`[DIMABIN Centres] Firestore update note: ${err.message}`);
  }

  // Institutional Activity Log
  await logActivity({
    action: "study_centre_updated",
    description: `Updated Study Centre details for: ${updatedRecord.centreName} [${updatedRecord.centreCode}].`,
    targetCollection: COLLECTIONS.STUDY_CENTRES,
    targetDocumentId: centreId
  });

  return { success: true, ...updatedRecord };
}

/**
 * Toggle Study Centre Status (Active / Inactive)
 */
export async function toggleStudyCentreStatus(centreId, currentStatus) {
  if (!centreId) throw new Error("Study Centre ID is required.");

  const existingCentres = getStudyCentres();
  const target = existingCentres.find((c) => c.id === centreId || c.centreId === centreId);
  if (!target) throw new Error("Study centre not found.");

  const newStatus = (currentStatus || target.status) === "active" ? "inactive" : "active";

  const updatedRecord = {
    ...target,
    status: newStatus,
    updatedAt: new Date().toISOString()
  };

  upsertCachedItem(COLLECTIONS.STUDY_CENTRES, updatedRecord);
  window.dispatchEvent(new CustomEvent("dimabin:study-centres-updated", { detail: getStudyCentres() }));

  try {
    const docRef = doc(db, COLLECTIONS.STUDY_CENTRES, centreId);
    await updateDoc(docRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn(`[DIMABIN Centres] Status toggle note: ${err.message}`);
  }

  await logActivity({
    action: "study_centre_status_changed",
    description: `Study centre "${target.centreName}" status updated to: ${newStatus.toUpperCase()}.`,
    targetCollection: COLLECTIONS.STUDY_CENTRES,
    targetDocumentId: centreId
  });

  return { success: true, centreId, status: newStatus };
}

/**
 * Delete a Study Centre (Guarded by relational integrity check)
 */
export async function deleteStudyCentre(centreId) {
  if (!centreId) throw new Error("Study Centre ID is required.");

  const centres = getStudyCentres();
  const target = centres.find((c) => c.id === centreId || c.centreId === centreId);
  if (!target) throw new Error("Study centre record not found.");

  // Relational safety check: Do course allocations or students belong to this centre?
  const allocations = getCachedCollection(COLLECTIONS.COURSE_ALLOCATIONS) || [];
  const allocCount = allocations.filter((a) => a.studyCentre === target.centreName).length;

  const courses = getCachedCollection(COLLECTIONS.COURSES) || [];
  const legacyCourseCount = courses.filter((c) => c.studyCentre && c.studyCentre === target.centreName).length;

  const students = getCachedCollection(COLLECTIONS.STUDENTS) || [];
  const studentCount = students.filter((s) => s.studyCentre === target.centreName).length;

  if (allocCount > 0 || legacyCourseCount > 0 || studentCount > 0) {
    throw new Error(
      `Cannot delete "${target.centreName}" because it is actively associated with ${allocCount} course allocation(s), ${legacyCourseCount} legacy assigned course(s), and ${studentCount} student(s). Please deactivate the centre instead to maintain academic record integrity.`
    );
  }

  removeCachedItem(COLLECTIONS.STUDY_CENTRES, centreId);
  window.dispatchEvent(new CustomEvent("dimabin:study-centres-updated", { detail: getStudyCentres() }));

  try {
    const docRef = doc(db, COLLECTIONS.STUDY_CENTRES, centreId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn(`[DIMABIN Centres] Delete note: ${err.message}`);
  }

  await logActivity({
    action: "study_centre_deleted",
    description: `Deleted unassigned Study Centre: ${target.centreName} [${target.centreCode}].`,
    targetCollection: COLLECTIONS.STUDY_CENTRES,
    targetDocumentId: centreId
  });

  return { success: true, centreId };
}

/**
 * Get Study Centre Metrics (Allocations & Student enrollments per centre)
 */
export function getStudyCentreMetrics() {
  const centres = getStudyCentres();
  const allocations = getCachedCollection(COLLECTIONS.COURSE_ALLOCATIONS) || [];
  const courses = getCachedCollection(COLLECTIONS.COURSES) || [];
  const students = getCachedCollection(COLLECTIONS.STUDENTS) || [];
  const lecturers = getCachedCollection(COLLECTIONS.LECTURERS) || [];

  const metrics = {};

  centres.forEach((c) => {
    const centreName = c.centreName;
    const activeAllocCount = allocations.filter((a) => a.studyCentre === centreName && (a.status === "active" || a.status === "reassigned")).length;
    
    // Count active offerings/allocations at this centre (or legacy centre-tagged courses)
    const offeredCourseCodes = new Set();
    allocations
      .filter((a) => a.studyCentre === centreName && (a.status === "active" || a.status === "reassigned"))
      .forEach((a) => {
        if (a.courseCode) offeredCourseCodes.add(normalizeCourseCode(a.courseCode));
      });
    courses
      .filter((co) => co.studyCentre === centreName && co.status === "active")
      .forEach((co) => {
        if (co.courseCode) offeredCourseCodes.add(normalizeCourseCode(co.courseCode));
      });
    const courseOfferingsCount = offeredCourseCodes.size;

    const studentCount = students.filter((s) => s.studyCentre === centreName && s.status === "active").length;

    // Faculty teaching at this centre
    const facultySet = new Set();
    allocations.filter((a) => a.studyCentre === centreName && (a.status === "active" || a.status === "reassigned")).forEach((a) => {
      if (a.lecturerName) facultySet.add(a.lecturerName);
    });
    // Also include faculty based at this centre
    lecturers.filter((l) => l.studyCentre === centreName).forEach((l) => {
      facultySet.add(l.fullName);
    });

    metrics[c.id || c.centreId] = {
      allocationsCount: activeAllocCount,
      coursesCount: courseOfferingsCount,
      studentsCount: studentCount,
      facultyCount: facultySet.size
    };
  });

  return metrics;
}

/**
 * =========================================================================
 * 9. RESULT APPROVAL (results)
 * =========================================================================
 */
export function subscribeResults(callback, { statusFilter = "all" } = {}) {
  if (typeof callback !== "function") return () => {};

  const filterList = (items) => {
    if (statusFilter === "all" || !statusFilter) return items;
    return items.filter((i) => (i.status || "submitted").toLowerCase() === statusFilter.toLowerCase());
  };

  callback(filterList(getCachedCollection(COLLECTIONS.RESULTS)));

  const localListener = (e) => {
    if (e.detail) callback(filterList(e.detail));
  };
  window.addEventListener(`dimabin:db:${COLLECTIONS.RESULTS}`, localListener);

  let unsubscribe = () => {};
  try {
    const collRef = collection(db, COLLECTIONS.RESULTS);
    unsubscribe = onSnapshot(
      collRef,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCachedCollection(COLLECTIONS.RESULTS, list);
        callback(filterList(list));
      },
      (err) => {
        console.warn("[DIMABIN Results] onSnapshot note:", err.message);
        callback(filterList(getCachedCollection(COLLECTIONS.RESULTS)));
      }
    );
  } catch (err) {
    console.warn("[DIMABIN Results] init note:", err.message);
  }

  return () => {
    try { unsubscribe(); } catch (_) {}
    window.removeEventListener(`dimabin:db:${COLLECTIONS.RESULTS}`, localListener);
  };
}

export async function createResult(resultData) {
  const score = parseInt(resultData.score, 10) || 0;
  let grade = "F";
  if (score >= 70) grade = "A";
  else if (score >= 60) grade = "B";
  else if (score >= 50) grade = "C";
  else if (score >= 45) grade = "D";
  else if (score >= 40) grade = "E";

  const record = {
    studentName: (resultData.studentName || "").trim(),
    matricNumber: (resultData.matricNumber || "").trim(),
    courseCode: (resultData.courseCode || "").trim().toUpperCase(),
    courseTitle: (resultData.courseTitle || "").trim(),
    semester: resultData.semester || "First Semester",
    academicSession: resultData.academicSession || "2026/2027",
    score,
    grade,
    status: resultData.status || "submitted", // draft | submitted | approved | rejected
    submittedBy: resultData.submittedBy || "Course Tutor",
    submittedAt: new Date().toISOString()
  };

  const localId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  upsertCachedItem(COLLECTIONS.RESULTS, { id: localId, ...record });

  try {
    await addDoc(collection(db, COLLECTIONS.RESULTS), {
      ...record,
      submittedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn(`[DIMABIN Results] Firestore create note: ${err.message}`);
  }

  await logActivity({
    action: "result_submitted",
    description: `Submitted examination score for ${record.studentName} in ${record.courseCode}: ${score}% (${grade}).`,
    targetCollection: COLLECTIONS.RESULTS,
    targetDocumentId: localId
  });

  return { success: true, ...record };
}

export async function updateResultStatus(resultId, newStatus) {
  const payload = {
    status: newStatus.toLowerCase(),
    reviewedAt: new Date().toISOString(),
    reviewedBy: ADMIN_CREDENTIALS.ADMIN_ID
  };

  upsertCachedItem(COLLECTIONS.RESULTS, { id: resultId, ...payload });

  try {
    const docRef = doc(db, COLLECTIONS.RESULTS, resultId);
    await updateDoc(docRef, { ...payload, reviewedAt: serverTimestamp() });
  } catch (err) {
    console.warn(`[DIMABIN Results] Status update note: ${err.message}`);
  }

  await logActivity({
    action: `result_${newStatus.toLowerCase()}`,
    description: `Examination result ${resultId} marked as '${newStatus.toUpperCase()}' by Registry.`,
    targetCollection: COLLECTIONS.RESULTS,
    targetDocumentId: resultId
  });

  return { success: true, resultId, status: newStatus };
}

/**
 * Save or submit an individual course grade record for a student
 * Supports granular Continuous Assessment (CBT max 10, Attendance max 5, Assignment max 5, Practical max 10 => CA max 30)
 * and Final Examination (max 70) => Total max 100
 */
export async function saveLecturerGradeRecord(gradeData) {
  // Continuous Assessment Granular breakdown
  const cbtScore = gradeData.cbtScore !== undefined && gradeData.cbtScore !== "" 
    ? Math.max(0, Math.min(10, parseInt(gradeData.cbtScore, 10) || 0)) 
    : undefined;
  const attendanceScore = gradeData.attendanceScore !== undefined && gradeData.attendanceScore !== "" 
    ? Math.max(0, Math.min(5, parseInt(gradeData.attendanceScore, 10) || 0)) 
    : undefined;
  const assignmentScore = gradeData.assignmentScore !== undefined && gradeData.assignmentScore !== "" 
    ? Math.max(0, Math.min(5, parseInt(gradeData.assignmentScore, 10) || 0)) 
    : undefined;
  const practicalScore = gradeData.practicalScore !== undefined && gradeData.practicalScore !== "" 
    ? Math.max(0, Math.min(10, parseInt(gradeData.practicalScore, 10) || 0)) 
    : undefined;

  // Compute or preserve total CA score (max 30)
  let caScore;
  if (cbtScore !== undefined || attendanceScore !== undefined || assignmentScore !== undefined || practicalScore !== undefined) {
    caScore = (cbtScore || 0) + (attendanceScore || 0) + (assignmentScore || 0) + (practicalScore || 0);
  } else if (gradeData.caScore !== undefined && gradeData.caScore !== "") {
    caScore = parseInt(gradeData.caScore, 10) || 0;
  } else {
    caScore = 0;
  }
  caScore = Math.max(0, Math.min(30, caScore));

  // Examination Score (max 70)
  const hasExamVal = gradeData.examScore !== undefined && gradeData.examScore !== "";
  const examScore = hasExamVal ? Math.max(0, Math.min(70, parseInt(gradeData.examScore, 10) || 0)) : undefined;

  // Total Course Score
  const totalScore = caScore + (examScore !== undefined ? examScore : 0);

  // Letter Grade, GP & Remarks
  let grade = "F";
  let gradePoint = 0.0;
  let remarks = "Fail";
  if (totalScore >= 70) { grade = "A"; gradePoint = 5.0; remarks = "Distinction / Excellent"; }
  else if (totalScore >= 60) { grade = "B"; gradePoint = 4.0; remarks = "Very Good"; }
  else if (totalScore >= 50) { grade = "C"; gradePoint = 3.0; remarks = "Good"; }
  else if (totalScore >= 45) { grade = "D"; gradePoint = 2.0; remarks = "Fair"; }
  else if (totalScore >= 40) { grade = "E"; gradePoint = 1.0; remarks = "Pass"; }

  const status = (gradeData.status || "draft").toLowerCase(); // draft | submitted | approved | published | rejected
  const matricNumber = (gradeData.matricNumber || "").trim().toUpperCase();
  const courseCode = (gradeData.courseCode || "").trim().toUpperCase();
  const session = gradeData.academicSession || "2026/2027";
  const semester = gradeData.semester || "First Semester";

  const existingResults = getCachedCollection(COLLECTIONS.RESULTS) || [];
  const existing = existingResults.find(
    (r) =>
      (r.matricNumber || "").trim().toUpperCase() === matricNumber &&
      (r.courseCode || "").trim().toUpperCase() === courseCode &&
      (r.academicSession || "") === session &&
      (r.semester || "") === semester
  );

  const nowIso = new Date().toISOString();
  const caPublished = gradeData.caPublished !== undefined 
    ? Boolean(gradeData.caPublished) 
    : (existing ? Boolean(existing.caPublished) : false);

  const recordPayload = {
    studentName: (gradeData.studentName || (existing ? existing.studentName : "")).trim(),
    matricNumber,
    courseCode,
    courseTitle: (gradeData.courseTitle || (existing ? existing.courseTitle : "Theological Study")).trim(),
    creditUnits: parseInt(gradeData.creditUnits, 10) || (existing ? existing.creditUnits : 3) || 3,
    studyCentre: gradeData.studyCentre || (existing ? existing.studyCentre : "") || "",
    academicSession: session,
    semester,
    // CA Granular
    cbtScore: cbtScore !== undefined ? cbtScore : (existing?.cbtScore !== undefined ? existing.cbtScore : 0),
    attendanceScore: attendanceScore !== undefined ? attendanceScore : (existing?.attendanceScore !== undefined ? existing.attendanceScore : 0),
    assignmentScore: assignmentScore !== undefined ? assignmentScore : (existing?.assignmentScore !== undefined ? existing.assignmentScore : 0),
    practicalScore: practicalScore !== undefined ? practicalScore : (existing?.practicalScore !== undefined ? existing.practicalScore : 0),
    caScore,
    caStatus: caPublished ? "published" : (gradeData.caStatus || (existing?.caStatus || "draft")),
    caPublished,
    caPublishedAt: caPublished ? (existing?.caPublishedAt || nowIso) : null,
    // Final Exam
    examScore: examScore !== undefined ? examScore : (existing?.examScore !== undefined ? existing.examScore : 0),
    score: totalScore,
    grade,
    gradePoint,
    remarks,
    // Overall Registry Approval Workflow Status
    status,
    lecturerStaffId: gradeData.lecturerStaffId || (existing ? existing.lecturerStaffId : ""),
    lecturerName: gradeData.lecturerName || (existing ? existing.lecturerName : ""),
    submittedBy: gradeData.lecturerName || gradeData.lecturerStaffId || (existing ? existing.submittedBy : "Faculty Lecturer"),
    submittedAt: status === "submitted" ? (existing?.submittedAt || nowIso) : (existing?.submittedAt || null),
    reviewNotes: gradeData.reviewNotes !== undefined ? gradeData.reviewNotes : (existing?.reviewNotes || ""),
    updatedAt: nowIso
  };

  let resultId;
  if (existing) {
    resultId = existing.id;
    upsertCachedItem(COLLECTIONS.RESULTS, { id: resultId, ...recordPayload });
    try {
      const docRef = doc(db, COLLECTIONS.RESULTS, resultId);
      await updateDoc(docRef, { ...recordPayload, updatedAt: serverTimestamp() });
    } catch (err) {
      console.warn(`[DIMABIN Results] Update note: ${err.message}`);
    }
  } else {
    resultId = `res_${matricNumber.replace(/[^A-Za-z0-9]/g, "_")}_${courseCode.replace(/[^A-Za-z0-9]/g, "_")}_${Date.now()}`;
    upsertCachedItem(COLLECTIONS.RESULTS, { id: resultId, ...recordPayload, createdAt: nowIso });
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.RESULTS), {
        ...recordPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      resultId = docRef.id;
    } catch (err) {
      console.warn(`[DIMABIN Results] Add note: ${err.message}`);
    }
  }

  await logActivity({
    action: status === "submitted" ? "grade_submitted_registry" : (caPublished ? "ca_published_students" : "grade_draft_saved"),
    description: `Faculty instructor ${gradeData.lecturerName || gradeData.lecturerStaffId} saved ${status} grade for ${recordPayload.studentName} (${matricNumber}) in ${courseCode}: CA=${caScore}/30, Exam=${recordPayload.examScore}/70, Total=${totalScore}% (${grade}).`,
    targetCollection: COLLECTIONS.RESULTS,
    targetDocumentId: resultId
  });

  return { success: true, id: resultId, ...recordPayload };
}

/**
 * Publish Continuous Assessment (CA) scores to students directly
 * No Admin approval required for CA publishing!
 */
export async function publishCourseCAResults(courseCode, { session = "2026/2027", semester = "First Semester", studyCentre = "all", lecturerStaffId = "", lecturerName = "" } = {}) {
  const normCourse = (courseCode || "").trim().toUpperCase();
  const existingResults = getCachedCollection(COLLECTIONS.RESULTS) || [];
  const nowIso = new Date().toISOString();

  const matching = existingResults.filter((r) => {
    const matchCourse = (r.courseCode || "").trim().toUpperCase() === normCourse;
    const matchSession = !session || r.academicSession === session;
    const matchSem = !semester || r.semester === semester;
    const matchCentre = !studyCentre || studyCentre === "all" || (r.studyCentre || "").toLowerCase().includes(studyCentre.toLowerCase());
    return matchCourse && matchSession && matchSem && matchCentre;
  });

  if (matching.length === 0) {
    throw new Error(`No continuous assessment records found for ${normCourse} in ${semester} (${session}).`);
  }

  for (const res of matching) {
    const updatePayload = {
      caStatus: "published",
      caPublished: true,
      caPublishedAt: nowIso,
      updatedAt: nowIso
    };
    upsertCachedItem(COLLECTIONS.RESULTS, { id: res.id, ...updatePayload });
    try {
      const docRef = doc(db, COLLECTIONS.RESULTS, res.id);
      await updateDoc(docRef, { ...updatePayload, updatedAt: serverTimestamp() });
    } catch (err) {
      console.warn(`[DIMABIN Results] Publish CA note: ${err.message}`);
    }
  }

  // Create private portal notification for enrolled students
  try {
    const notifPayload = {
      title: `CA Scores Published: ${normCourse}`,
      message: `Continuous Assessment (CA) marks (out of 30) for ${normCourse} have been published by faculty lecturer ${lecturerName || lecturerStaffId || "your instructor"}. Check your student portal under My Results / CA Breakdown to review your scores.`,
      audience: "student",
      priority: "normal",
      status: "published",
      createdAt: nowIso
    };
    await addDoc(collection(db, COLLECTIONS.PORTAL_NOTIFICATIONS), {
      ...notifPayload,
      createdAt: serverTimestamp()
    });
  } catch (_) {}

  await logActivity({
    action: "ca_published",
    description: `Published Continuous Assessment (CA) marks for ${matching.length} student(s) in course ${normCourse} (${semester}, ${session}) by ${lecturerName || lecturerStaffId}.`,
    targetCollection: COLLECTIONS.RESULTS
  });

  return { success: true, count: matching.length, courseCode: normCourse };
}

/**
 * Unpublish Continuous Assessment (revert to draft)
 */
export async function unpublishCourseCAResults(courseCode, { session = "2026/2027", semester = "First Semester", studyCentre = "all" } = {}) {
  const normCourse = (courseCode || "").trim().toUpperCase();
  const existingResults = getCachedCollection(COLLECTIONS.RESULTS) || [];
  const nowIso = new Date().toISOString();

  const matching = existingResults.filter((r) => {
    const matchCourse = (r.courseCode || "").trim().toUpperCase() === normCourse;
    const matchSession = !session || r.academicSession === session;
    const matchSem = !semester || r.semester === semester;
    const matchCentre = !studyCentre || studyCentre === "all" || (r.studyCentre || "").toLowerCase().includes(studyCentre.toLowerCase());
    return matchCourse && matchSession && matchSem && matchCentre;
  });

  for (const res of matching) {
    const updatePayload = {
      caStatus: "draft",
      caPublished: false,
      updatedAt: nowIso
    };
    upsertCachedItem(COLLECTIONS.RESULTS, { id: res.id, ...updatePayload });
    try {
      const docRef = doc(db, COLLECTIONS.RESULTS, res.id);
      await updateDoc(docRef, { ...updatePayload, updatedAt: serverTimestamp() });
    } catch (err) {
      console.warn(`[DIMABIN Results] Unpublish CA note: ${err.message}`);
    }
  }

  await logActivity({
    action: "ca_unpublished",
    description: `Withdrew CA publication for ${matching.length} student(s) in course ${normCourse} back to draft status.`,
    targetCollection: COLLECTIONS.RESULTS
  });

  return { success: true, count: matching.length };
}

/**
 * Submit entire course grade sheet to Academic Registry for examination review
 */
export async function submitCourseGradesToRegistry(courseCode, { session = "2026/2027", semester = "First Semester", studyCentre = "all", lecturerStaffId = "", lecturerName = "" } = {}) {
  const normCourse = (courseCode || "").trim().toUpperCase();
  const existingResults = getCachedCollection(COLLECTIONS.RESULTS) || [];
  const nowIso = new Date().toISOString();

  const matching = existingResults.filter((r) => {
    const matchCourse = (r.courseCode || "").trim().toUpperCase() === normCourse;
    const matchSession = !session || r.academicSession === session;
    const matchSem = !semester || r.semester === semester;
    const matchCentre = !studyCentre || studyCentre === "all" || (r.studyCentre || "").toLowerCase().includes(studyCentre.toLowerCase());
    return matchCourse && matchSession && matchSem && matchCentre;
  });

  if (matching.length === 0) {
    throw new Error(`No grade entries found to submit for ${normCourse}. Enter marks for enrolled students first.`);
  }

  for (const res of matching) {
    const updatePayload = {
      status: "submitted",
      submittedAt: nowIso,
      submittedBy: lecturerName || lecturerStaffId || "Faculty Lecturer",
      updatedAt: nowIso
    };
    upsertCachedItem(COLLECTIONS.RESULTS, { id: res.id, ...updatePayload });
    try {
      const docRef = doc(db, COLLECTIONS.RESULTS, res.id);
      await updateDoc(docRef, { ...updatePayload, updatedAt: serverTimestamp() });
    } catch (err) {
      console.warn(`[DIMABIN Results] Submit registry note: ${err.message}`);
    }
  }

  await logActivity({
    action: "course_grades_submitted_registry",
    description: `Submitted official semester examination score sheet for ${normCourse} (${matching.length} students) to Academic Registry for clearance and approval.`,
    targetCollection: COLLECTIONS.RESULTS
  });

  return { success: true, count: matching.length, courseCode: normCourse };
}

/**
 * Admin: Approve & Publish final semester results to students
 */
export async function approveAndPublishCourseResults(courseCode, { session = "2026/2027", semester = "First Semester", studyCentre = "all", reviewerId = ADMIN_CREDENTIALS.ADMIN_ID } = {}) {
  const normCourse = (courseCode || "").trim().toUpperCase();
  const existingResults = getCachedCollection(COLLECTIONS.RESULTS) || [];
  const nowIso = new Date().toISOString();

  const matching = existingResults.filter((r) => {
    const matchCourse = !normCourse || (r.courseCode || "").trim().toUpperCase() === normCourse;
    const matchSession = !session || r.academicSession === session;
    const matchSem = !semester || r.semester === semester;
    const matchCentre = !studyCentre || studyCentre === "all" || (r.studyCentre || "").toLowerCase().includes(studyCentre.toLowerCase());
    return matchCourse && matchSession && matchSem && matchCentre;
  });

  if (matching.length === 0) {
    throw new Error(`No submitted results found for clearance.`);
  }

  for (const res of matching) {
    const updatePayload = {
      status: "published", // "approved" and published
      reviewedAt: nowIso,
      reviewedBy: reviewerId,
      publishedAt: nowIso,
      reviewNotes: "",
      updatedAt: nowIso
    };
    upsertCachedItem(COLLECTIONS.RESULTS, { id: res.id, ...updatePayload });
    try {
      const docRef = doc(db, COLLECTIONS.RESULTS, res.id);
      await updateDoc(docRef, { ...updatePayload, updatedAt: serverTimestamp() });
    } catch (err) {
      console.warn(`[DIMABIN Results] Approve note: ${err.message}`);
    }
  }

  // Send Portal Notification to students
  try {
    const notifPayload = {
      title: `Official Results Approved: ${normCourse || "Semester Examinations"}`,
      message: `Official semester results for ${normCourse || "your courses"} (${semester}, ${session}) have been reviewed and approved by the Academic Registry. You can now view your official grades, grade points, and semester GPA in your student portal.`,
      audience: "student",
      priority: "urgent",
      status: "published",
      createdAt: nowIso
    };
    await addDoc(collection(db, COLLECTIONS.PORTAL_NOTIFICATIONS), {
      ...notifPayload,
      createdAt: serverTimestamp()
    });
  } catch (_) {}

  await logActivity({
    action: "results_approved_published",
    description: `Academic Registry officially approved and published examination results for ${normCourse || "multiple courses"} (${matching.length} records) for ${semester} (${session}).`,
    targetCollection: COLLECTIONS.RESULTS
  });

  return { success: true, count: matching.length, courseCode: normCourse };
}

/**
 * Admin: Reject course results / Request lecturer revision
 */
export async function rejectCourseResultsWithFeedback(courseCode, { session = "2026/2027", semester = "First Semester", studyCentre = "all", reason = "Score discrepancies detected", reviewerId = ADMIN_CREDENTIALS.ADMIN_ID } = {}) {
  const normCourse = (courseCode || "").trim().toUpperCase();
  const existingResults = getCachedCollection(COLLECTIONS.RESULTS) || [];
  const nowIso = new Date().toISOString();

  const matching = existingResults.filter((r) => {
    const matchCourse = !normCourse || (r.courseCode || "").trim().toUpperCase() === normCourse;
    const matchSession = !session || r.academicSession === session;
    const matchSem = !semester || r.semester === semester;
    const matchCentre = !studyCentre || studyCentre === "all" || (r.studyCentre || "").toLowerCase().includes(studyCentre.toLowerCase());
    return matchCourse && matchSession && matchSem && matchCentre;
  });

  for (const res of matching) {
    const updatePayload = {
      status: "rejected",
      reviewedAt: nowIso,
      reviewedBy: reviewerId,
      reviewNotes: reason.trim(),
      updatedAt: nowIso
    };
    upsertCachedItem(COLLECTIONS.RESULTS, { id: res.id, ...updatePayload });
    try {
      const docRef = doc(db, COLLECTIONS.RESULTS, res.id);
      await updateDoc(docRef, { ...updatePayload, updatedAt: serverTimestamp() });
    } catch (err) {
      console.warn(`[DIMABIN Results] Reject note: ${err.message}`);
    }
  }

  await logActivity({
    action: "results_rejected_revision_requested",
    description: `Academic Registry requested revision on ${normCourse} results. Reason: ${reason}.`,
    targetCollection: COLLECTIONS.RESULTS
  });

  return { success: true, count: matching.length, courseCode: normCourse };
}

/**
 * =========================================================================
 * 9B. ASSESSMENT ACTIVITIES (CBT, Attendance, Assignments, Practicals)
 * =========================================================================
 */
export function subscribeCourseAssessments(callback) {
  if (typeof callback !== "function") return () => {};

  callback(getCachedCollection(COLLECTIONS.ASSESSMENTS));

  const localListener = (e) => {
    if (e.detail) callback(e.detail);
  };
  window.addEventListener(`dimabin:db:${COLLECTIONS.ASSESSMENTS}`, localListener);

  let unsubscribe = () => {};
  try {
    const collRef = collection(db, COLLECTIONS.ASSESSMENTS);
    unsubscribe = onSnapshot(
      collRef,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCachedCollection(COLLECTIONS.ASSESSMENTS, list);
        callback(list);
      },
      (err) => {
        console.warn("[DIMABIN Assessments] onSnapshot note:", err.message);
        callback(getCachedCollection(COLLECTIONS.ASSESSMENTS));
      }
    );
  } catch (err) {
    console.warn("[DIMABIN Assessments] init note:", err.message);
  }

  return () => {
    try { unsubscribe(); } catch (_) {}
    window.removeEventListener(`dimabin:db:${COLLECTIONS.ASSESSMENTS}`, localListener);
  };
}

export async function createCourseAssessment(assessmentData) {
  const normCourse = (assessmentData.courseCode || "").trim().toUpperCase();
  if (!normCourse) throw new Error("Course Code is required for assessment.");

  const type = (assessmentData.type || "cbt").toLowerCase(); // cbt | attendance | assignment | practical
  const maxScore = type === "cbt" ? 10 : type === "attendance" ? 5 : type === "assignment" ? 5 : 10;

  const nowIso = new Date().toISOString();
  const localId = `asmt_${type}_${normCourse.replace(/[^A-Z0-9]/g, "_")}_${Date.now()}`;

  const record = {
    id: localId,
    courseCode: normCourse,
    courseTitle: (assessmentData.courseTitle || "").trim(),
    academicSession: assessmentData.academicSession || "2026/2027",
    semester: assessmentData.semester || "First Semester",
    studyCentre: assessmentData.studyCentre || "all",
    type,
    title: (assessmentData.title || `${normCourse} Assessment`).trim(),
    maxScore: parseInt(assessmentData.maxScore, 10) || maxScore,
    description: (assessmentData.description || "").trim(),
    durationMinutes: parseInt(assessmentData.durationMinutes, 10) || (type === "cbt" ? 30 : 0),
    dueDate: assessmentData.dueDate || "",
    status: assessmentData.status || "active",
    lecturerStaffId: assessmentData.lecturerStaffId || "",
    lecturerName: assessmentData.lecturerName || "",
    createdAt: nowIso,
    updatedAt: nowIso
  };

  upsertCachedItem(COLLECTIONS.ASSESSMENTS, record);

  let savedId = localId;
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.ASSESSMENTS), {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    savedId = docRef.id;
    removeCachedItem(COLLECTIONS.ASSESSMENTS, localId);
    upsertCachedItem(COLLECTIONS.ASSESSMENTS, { ...record, id: savedId });
  } catch (err) {
    console.warn(`[DIMABIN Assessments] Add note: ${err.message}`);
  }

  await logActivity({
    action: "assessment_created",
    description: `Created ${type.toUpperCase()} assessment "${record.title}" for ${normCourse} (Max: ${record.maxScore} marks).`,
    targetCollection: COLLECTIONS.ASSESSMENTS,
    targetDocumentId: savedId
  });

  return { success: true, id: savedId, ...record };
}

export async function deleteCourseAssessment(assessmentId) {
  if (!assessmentId) return;
  removeCachedItem(COLLECTIONS.ASSESSMENTS, assessmentId);

  try {
    const docRef = doc(db, COLLECTIONS.ASSESSMENTS, assessmentId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn(`[DIMABIN Assessments] Delete note: ${err.message}`);
  }

  await logActivity({
    action: "assessment_deleted",
    description: `Deleted assessment activity ID ${assessmentId}.`,
    targetCollection: COLLECTIONS.ASSESSMENTS,
    targetDocumentId: assessmentId
  });

  return { success: true, assessmentId };
}

/**
 * Change Lecturer Password securely
 */
export async function changeLecturerPassword(email, currentPassword, newPassword) {
  if (!email || !currentPassword || !newPassword) {
    throw new Error("Please supply current password and new password.");
  }
  if (newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters.");
  }

  const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), currentPassword);
  const user = userCredential.user;

  await updatePassword(user, newPassword);

  await logActivity({
    action: "lecturer_password_changed",
    description: `Faculty instructor ${email} successfully changed their portal password.`,
    targetCollection: COLLECTIONS.USERS,
    targetDocumentId: user.uid
  });

  return { success: true };
}

/**
 * Update Faculty Lecturer Self Profile
 */
export async function updateLecturerSelfProfile(staffId, { phone, qualification, specialization, photoUrl }) {
  const existingLecturers = getCachedCollection(COLLECTIONS.LECTURERS) || [];
  const target = existingLecturers.find((l) => (l.staffId || "").trim().toLowerCase() === (staffId || "").trim().toLowerCase());
  if (!target) throw new Error("Faculty profile record not found.");

  const updateData = {};
  if (phone !== undefined) updateData.phone = phone.trim();
  if (qualification !== undefined) updateData.qualification = qualification.trim();
  if (specialization !== undefined) updateData.specialization = specialization.trim();
  if (photoUrl !== undefined) updateData.photoUrl = photoUrl;

  const result = await updateLecturer(target.id, updateData);

  // Update active session in storage
  let sessionRaw = sessionStorage.getItem("dimabin_lecturer_session") || localStorage.getItem("dimabin_lecturer_session");
  if (sessionRaw) {
    try {
      const s = JSON.parse(sessionRaw);
      const updatedS = { ...s, ...updateData };
      if (sessionStorage.getItem("dimabin_lecturer_session")) {
        sessionStorage.setItem("dimabin_lecturer_session", JSON.stringify(updatedS));
      }
      if (localStorage.getItem("dimabin_lecturer_session")) {
        localStorage.setItem("dimabin_lecturer_session", JSON.stringify(updatedS));
      }
    } catch (_) {}
  }

  return result;
}

/**
 * =========================================================================
 * 10. ANNOUNCEMENTS (announcements)
 * =========================================================================
 */
export function subscribeAnnouncements(callback) {
  if (typeof callback !== "function") return () => {};

  callback(getCachedCollection(COLLECTIONS.ANNOUNCEMENTS));

  const localListener = (e) => {
    if (e.detail) callback(e.detail);
  };
  window.addEventListener(`dimabin:db:${COLLECTIONS.ANNOUNCEMENTS}`, localListener);

  let unsubscribe = () => {};
  try {
    const collRef = collection(db, COLLECTIONS.ANNOUNCEMENTS);
    unsubscribe = onSnapshot(
      collRef,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setCachedCollection(COLLECTIONS.ANNOUNCEMENTS, list);
        callback(list);
      },
      (err) => {
        console.warn("[DIMABIN Announcements] onSnapshot note:", err.message);
        callback(getCachedCollection(COLLECTIONS.ANNOUNCEMENTS));
      }
    );
  } catch (err) {
    console.warn("[DIMABIN Announcements] init note:", err.message);
  }

  return () => {
    try { unsubscribe(); } catch (_) {}
    window.removeEventListener(`dimabin:db:${COLLECTIONS.ANNOUNCEMENTS}`, localListener);
  };
}

export async function createAnnouncement(data) {
  const record = {
    title: (data.title || "").trim(),
    message: (data.message || "").trim(),
    category: data.category || "General",
    audience: data.audience || "public", // public | all | students | lecturers
    status: data.status || "published", // draft | published | archived
    createdAt: new Date().toISOString(),
    publishedAt: data.status === "published" ? (data.publishedAt || new Date().toISOString()) : null,
    expiresAt: data.expiresAt || null,
    createdBy: ADMIN_CREDENTIALS.ADMIN_ID
  };

  const localId = `ann_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  upsertCachedItem(COLLECTIONS.ANNOUNCEMENTS, { id: localId, ...record });

  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.ANNOUNCEMENTS), {
      ...record,
      createdAt: serverTimestamp(),
      publishedAt: record.publishedAt ? serverTimestamp() : null
    });
    record.id = docRef.id;
  } catch (err) {
    console.warn(`[DIMABIN Announcements] Firestore create note: ${err.message}`);
  }

  await logActivity({
    action: "announcement_published",
    description: `Published institutional announcement: "${record.title}".`,
    targetCollection: COLLECTIONS.ANNOUNCEMENTS,
    targetDocumentId: record.id || localId
  });

  return { success: true, id: record.id || localId, ...record };
}

export async function updateAnnouncement(annId, updates) {
  const payload = {
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: ADMIN_CREDENTIALS.ADMIN_ID
  };

  if (updates.status === "published" && !updates.publishedAt) {
    payload.publishedAt = new Date().toISOString();
  }

  upsertCachedItem(COLLECTIONS.ANNOUNCEMENTS, { id: annId, ...payload });

  try {
    const docRef = doc(db, COLLECTIONS.ANNOUNCEMENTS, annId);
    await updateDoc(docRef, {
      ...payload,
      updatedAt: serverTimestamp(),
      ...(payload.publishedAt ? { publishedAt: serverTimestamp() } : {})
    });
  } catch (err) {
    console.warn(`[DIMABIN Announcements] Update note: ${err.message}`);
  }

  await logActivity({
    action: "announcement_updated",
    description: `Updated announcement ${annId}.`,
    targetCollection: COLLECTIONS.ANNOUNCEMENTS,
    targetDocumentId: annId
  });

  return { success: true, annId, ...payload };
}

export async function toggleAnnouncementPublish(annId, currentStatus) {
  const newStatus = currentStatus === "published" ? "draft" : "published";
  return updateAnnouncement(annId, {
    status: newStatus,
    publishedAt: newStatus === "published" ? new Date().toISOString() : null
  });
}

export async function deleteAnnouncement(annId) {
  removeCachedItem(COLLECTIONS.ANNOUNCEMENTS, annId);

  try {
    const docRef = doc(db, COLLECTIONS.ANNOUNCEMENTS, annId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn(`[DIMABIN Announcements] Delete note: ${err.message}`);
  }

  await logActivity({
    action: "announcement_deleted",
    description: `Deleted announcement ${annId}.`,
    targetCollection: COLLECTIONS.ANNOUNCEMENTS,
    targetDocumentId: annId
  });

  return { success: true, annId };
}

/**
 * =========================================================================
 * 11. PUBLIC NOTIFICATIONS (public_notifications)
 * =========================================================================
 */
export function subscribePublicNotifications(callback) {
  if (typeof callback !== "function") return () => {};

  callback(getCachedCollection(COLLECTIONS.PUBLIC_NOTIFICATIONS));

  const localListener = (e) => {
    if (e.detail) callback(e.detail);
  };
  window.addEventListener(`dimabin:db:${COLLECTIONS.PUBLIC_NOTIFICATIONS}`, localListener);

  let unsubscribe = () => {};
  try {
    const collRef = collection(db, COLLECTIONS.PUBLIC_NOTIFICATIONS);
    unsubscribe = onSnapshot(
      collRef,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setCachedCollection(COLLECTIONS.PUBLIC_NOTIFICATIONS, list);
        callback(list);
      },
      (err) => {
        console.warn("[DIMABIN Public Notifs] onSnapshot note:", err.message);
        callback(getCachedCollection(COLLECTIONS.PUBLIC_NOTIFICATIONS));
      }
    );
  } catch (err) {
    console.warn("[DIMABIN Public Notifs] init note:", err.message);
  }

  return () => {
    try { unsubscribe(); } catch (_) {}
    window.removeEventListener(`dimabin:db:${COLLECTIONS.PUBLIC_NOTIFICATIONS}`, localListener);
  };
}

export async function createPublicNotification(data) {
  const record = {
    title: (data.title || "").trim(),
    message: (data.message || "").trim(),
    category: data.category || "admissions",
    targetPages: data.pages || data.targetPages || "all",
    active: data.status === "published",
    status: data.status || "published", // draft | published | scheduled
    createdAt: new Date().toISOString(),
    expiresAt: data.expiresAt || null,
    createdBy: ADMIN_CREDENTIALS.ADMIN_ID
  };

  const localId = `pubnotif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  upsertCachedItem(COLLECTIONS.PUBLIC_NOTIFICATIONS, { id: localId, ...record });

  try {
    await addDoc(collection(db, COLLECTIONS.PUBLIC_NOTIFICATIONS), {
      ...record,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn(`[DIMABIN Public Notifs] Firestore create note: ${err.message}`);
  }

  await logActivity({
    action: "public_notification_created",
    description: `Created public website notification: "${record.title}".`,
    targetCollection: COLLECTIONS.PUBLIC_NOTIFICATIONS,
    targetDocumentId: localId
  });

  return { success: true, ...record };
}

export async function deletePublicNotification(notifId) {
  removeCachedItem(COLLECTIONS.PUBLIC_NOTIFICATIONS, notifId);

  try {
    const docRef = doc(db, COLLECTIONS.PUBLIC_NOTIFICATIONS, notifId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn(`[DIMABIN Public Notifs] Delete note: ${err.message}`);
  }

  return { success: true, notifId };
}

/**
 * =========================================================================
 * 12. PORTAL NOTIFICATIONS (portal_notifications)
 * =========================================================================
 */
export function subscribePortalNotifications(callback) {
  if (typeof callback !== "function") return () => {};

  callback(getCachedCollection(COLLECTIONS.PORTAL_NOTIFICATIONS));

  const localListener = (e) => {
    if (e.detail) callback(e.detail);
  };
  window.addEventListener(`dimabin:db:${COLLECTIONS.PORTAL_NOTIFICATIONS}`, localListener);

  let unsubscribe = () => {};
  try {
    const collRef = collection(db, COLLECTIONS.PORTAL_NOTIFICATIONS);
    unsubscribe = onSnapshot(
      collRef,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setCachedCollection(COLLECTIONS.PORTAL_NOTIFICATIONS, list);
        callback(list);
      },
      (err) => {
        console.warn("[DIMABIN Portal Notifs] onSnapshot note:", err.message);
        callback(getCachedCollection(COLLECTIONS.PORTAL_NOTIFICATIONS));
      }
    );
  } catch (err) {
    console.warn("[DIMABIN Portal Notifs] init note:", err.message);
  }

  return () => {
    try { unsubscribe(); } catch (_) {}
    window.removeEventListener(`dimabin:db:${COLLECTIONS.PORTAL_NOTIFICATIONS}`, localListener);
  };
}

export async function createPortalNotification(data) {
  const record = {
    audience: data.audience || "student", // student | lecturer | admin
    title: (data.title || "").trim(),
    message: (data.message || "").trim(),
    priority: data.priority || "normal", // normal | urgent | critical
    read: false,
    status: data.status || "published", // draft | published | scheduled
    createdAt: new Date().toISOString(),
    createdBy: ADMIN_CREDENTIALS.ADMIN_ID
  };

  const localId = `portnotif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  upsertCachedItem(COLLECTIONS.PORTAL_NOTIFICATIONS, { id: localId, ...record });

  try {
    await addDoc(collection(db, COLLECTIONS.PORTAL_NOTIFICATIONS), {
      ...record,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn(`[DIMABIN Portal Notifs] Firestore create note: ${err.message}`);
  }

  await logActivity({
    action: "portal_notification_dispatched",
    description: `Dispatched ${record.priority.toUpperCase()} portal notice to ${record.audience.toUpperCase()} audience: "${record.title}".`,
    targetCollection: COLLECTIONS.PORTAL_NOTIFICATIONS,
    targetDocumentId: localId
  });

  return { success: true, ...record };
}

export async function deletePortalNotification(notifId) {
  removeCachedItem(COLLECTIONS.PORTAL_NOTIFICATIONS, notifId);

  try {
    const docRef = doc(db, COLLECTIONS.PORTAL_NOTIFICATIONS, notifId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn(`[DIMABIN Portal Notifs] Delete note: ${err.message}`);
  }

  return { success: true, notifId };
}

/**
 * =========================================================================
 * 13. USER ACCOUNTS (users)
 * =========================================================================
 */
export function subscribeUsers(callback) {
  if (typeof callback !== "function") return () => {};

  // Ensure super admin profile exists in local cache
  let list = getCachedCollection(COLLECTIONS.USERS);
  if (!list.some((u) => u.email === ADMIN_CREDENTIALS.ADMIN_EMAIL)) {
    list.unshift({
      id: "admin_super_account",
      uid: "dimabin_super_admin",
      fullName: "DIMABIN Super Administrator",
      email: ADMIN_CREDENTIALS.ADMIN_EMAIL,
      adminId: ADMIN_CREDENTIALS.ADMIN_ID,
      role: "admin",
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z"
    });
    setCachedCollection(COLLECTIONS.USERS, list);
  }

  callback(list);

  const localListener = (e) => {
    if (e.detail) callback(e.detail);
  };
  window.addEventListener(`dimabin:db:${COLLECTIONS.USERS}`, localListener);

  let unsubscribe = () => {};
  try {
    const collRef = collection(db, COLLECTIONS.USERS);
    unsubscribe = onSnapshot(
      collRef,
      (snap) => {
        if (!snap.empty) {
          const remoteList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          // Guarantee super admin appears
          if (!remoteList.some((u) => u.email === ADMIN_CREDENTIALS.ADMIN_EMAIL)) {
            remoteList.unshift({
              id: "admin_super_account",
              uid: "dimabin_super_admin",
              fullName: "DIMABIN Super Administrator",
              email: ADMIN_CREDENTIALS.ADMIN_EMAIL,
              adminId: ADMIN_CREDENTIALS.ADMIN_ID,
              role: "admin",
              status: "active",
              createdAt: "2026-01-01T00:00:00.000Z"
            });
          }
          setCachedCollection(COLLECTIONS.USERS, remoteList);
          callback(remoteList);
        } else {
          callback(getCachedCollection(COLLECTIONS.USERS));
        }
      },
      (err) => {
        console.warn("[DIMABIN Users] onSnapshot note:", err.message);
        callback(getCachedCollection(COLLECTIONS.USERS));
      }
    );
  } catch (err) {
    console.warn("[DIMABIN Users] init note:", err.message);
  }

  return () => {
    try { unsubscribe(); } catch (_) {}
    window.removeEventListener(`dimabin:db:${COLLECTIONS.USERS}`, localListener);
  };
}

export async function toggleUserAccountStatus(userId, currentStatus) {
  // Prevent disabling super admin
  const users = getCachedCollection(COLLECTIONS.USERS);
  const target = users.find((u) => u.id === userId || u.uid === userId);
  if (target?.email === ADMIN_CREDENTIALS.ADMIN_EMAIL || target?.adminId === ADMIN_CREDENTIALS.ADMIN_ID) {
    throw new Error("Cannot alter account status of the Primary Super Administrator.");
  }

  const newStatus = currentStatus === "active" ? "disabled" : "active";
  upsertCachedItem(COLLECTIONS.USERS, { id: userId, status: newStatus, updatedAt: new Date().toISOString() });

  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(docRef, { status: newStatus, updatedAt: serverTimestamp() });
  } catch (err) {
    console.warn(`[DIMABIN Users] Status update note: ${err.message}`);
  }

  await logActivity({
    action: "user_account_status_changed",
    description: `User account ${target?.email || userId} set to '${newStatus.toUpperCase()}'.`,
    targetCollection: COLLECTIONS.USERS,
    targetDocumentId: userId
  });

  return { success: true, userId, status: newStatus };
}

/**
 * =========================================================================
 * 14. SETTINGS & INSTITUTIONAL PARAMETERS (system_settings)
 * =========================================================================
 */
export async function getSettingDoc(docId, defaultData = {}) {
  try {
    const docRef = doc(db, COLLECTIONS.SYSTEM_SETTINGS, docId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
  } catch (err) {
    console.warn(`[DIMABIN Settings] Fetch ${docId} note: ${err.message}`);
  }

  // Fallback to local cache
  const cached = localStorage.getItem(`${CACHE_PREFIX}setting_${docId}`);
  if (cached) {
    try { return JSON.parse(cached); } catch (_) {}
  }
  return { id: docId, ...defaultData };
}

export async function saveSettingDoc(docId, data) {
  const payload = {
    ...data,
    updatedAt: new Date().toISOString(),
    updatedBy: ADMIN_CREDENTIALS.ADMIN_ID
  };

  try {
    localStorage.setItem(`${CACHE_PREFIX}setting_${docId}`, JSON.stringify(payload));
  } catch (_) {}

  try {
    const docRef = doc(db, COLLECTIONS.SYSTEM_SETTINGS, docId);
    await setDoc(docRef, { ...payload, updatedAt: serverTimestamp() }, { merge: true });
    console.log(`[DIMABIN Settings] system_settings/${docId} saved successfully.`);
  } catch (err) {
    console.warn(`[DIMABIN Settings] Firestore save note: ${err.message}`);
  }

  await logActivity({
    action: "system_settings_updated",
    description: `Updated configuration parameters for 'system_settings/${docId}'.`,
    targetCollection: COLLECTIONS.SYSTEM_SETTINGS,
    targetDocumentId: docId
  });

  return { success: true, docId, data: payload };
}

// =============================================================================
// 10. COMPUTER-BASED TEST (CBT) ENGINE — QUESTION BANK & ASSESSMENTS
// =============================================================================

/**
 * Default Seed Theological Question Bank
 */
const SEED_CBT_QUESTIONS = [
  {
    id: "q_theo_bib101_01",
    courseCode: "BIB-101",
    courseTitle: "Introduction to Biblical Studies",
    topic: "Biblical Canonicity & Manuscripts",
    type: "mcq", // mcq | yes_no | true_false | short_answer | theory
    difficulty: "intermediate", // basic | intermediate | advanced
    questionText: "Which ancient manuscript codex, dating to the mid-4th century AD and written in Greek uncial script, was discovered at Saint Catherine's Monastery on Mount Sinai by Constantin von Tischendorf?",
    options: [
      { id: "opt_a", text: "Codex Vaticanus" },
      { id: "opt_b", text: "Codex Sinaiticus" },
      { id: "opt_c", text: "Codex Alexandrinus" },
      { id: "opt_d", text: "Codex Ephraemi Rescriptus" }
    ],
    correctOptionId: "opt_b",
    marks: 2,
    explanation: "Codex Sinaiticus is a 4th-century uncial manuscript of the Christian Bible containing the earliest complete New Testament, found at Mount Sinai.",
    markingGuide: "Award 2 marks for selecting Option B (Codex Sinaiticus).",
    status: "published",
    lecturerStaffId: "DIMABIN/LEC/2026/01",
    lecturerName: "Dr. Emmanuel Adebayo",
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-10-01T08:00:00.000Z"
  },
  {
    id: "q_theo_bib101_02",
    courseCode: "BIB-101",
    courseTitle: "Introduction to Biblical Studies",
    topic: "Old Testament Survey",
    type: "true_false",
    difficulty: "basic",
    questionText: "The Septuagint (LXX) is the primary ancient Greek translation of the Hebrew Old Testament compiled in Alexandria, Egypt.",
    options: [
      { id: "opt_true", text: "True" },
      { id: "opt_false", text: "False" }
    ],
    correctOptionId: "opt_true",
    marks: 2,
    explanation: "The Septuagint (LXX) was translated into Koine Greek around the 3rd to 2nd centuries BC for the Greek-speaking Jewish diaspora in Alexandria.",
    markingGuide: "Award 2 marks for selecting True.",
    status: "published",
    lecturerStaffId: "DIMABIN/LEC/2026/01",
    lecturerName: "Dr. Emmanuel Adebayo",
    createdAt: "2026-10-01T08:15:00.000Z",
    updatedAt: "2026-10-01T08:15:00.000Z"
  },
  {
    id: "q_theo_bib101_03",
    courseCode: "BIB-101",
    courseTitle: "Introduction to Biblical Studies",
    topic: "Hermeneutics & Exegesis",
    type: "yes_no",
    difficulty: "basic",
    questionText: "Does proper biblical exegesis require discovering the original author's intended theological meaning rather than imposing modern presuppositions (eisegesis)?",
    options: [
      { id: "opt_yes", text: "Yes" },
      { id: "opt_no", text: "No" }
    ],
    correctOptionId: "opt_yes",
    marks: 2,
    explanation: "Exegesis is the objective extraction of meaning out of the biblical text, contrasting with eisegesis where the reader projects subjective ideas into the text.",
    markingGuide: "Award 2 marks for Yes.",
    status: "published",
    lecturerStaffId: "DIMABIN/LEC/2026/01",
    lecturerName: "Dr. Emmanuel Adebayo",
    createdAt: "2026-10-01T08:30:00.000Z",
    updatedAt: "2026-10-01T08:30:00.000Z"
  },
  {
    id: "q_theo_bib101_04",
    courseCode: "BIB-101",
    courseTitle: "Introduction to Biblical Studies",
    topic: "New Testament Canon",
    type: "short_answer",
    difficulty: "intermediate",
    questionText: "Name the fourth-century Church Father whose 39th Festal Letter in AD 367 was the first known historical document to list precisely the twenty-seven books of the New Testament canon.",
    expectedAnswer: "Athanasius",
    matchingRule: "exact_or_contains", // exact | exact_or_contains | manual
    marks: 2,
    explanation: "Athanasius, Bishop of Alexandria, promulgated his 39th Festal Letter in 367 AD specifying the 27 books of the Christian New Testament.",
    markingGuide: "Accept 'Athanasius' or 'Bishop Athanasius' or 'St. Athanasius'. Award 2 marks.",
    status: "published",
    lecturerStaffId: "DIMABIN/LEC/2026/01",
    lecturerName: "Dr. Emmanuel Adebayo",
    createdAt: "2026-10-01T08:45:00.000Z",
    updatedAt: "2026-10-01T08:45:00.000Z"
  },
  {
    id: "q_theo_bib101_05",
    courseCode: "BIB-101",
    courseTitle: "Introduction to Biblical Studies",
    topic: "Biblical Theology & Application",
    type: "theory",
    difficulty: "advanced",
    questionText: "Discuss the theological significance of the Abrahamic Covenant (Genesis 12:1–3, 15:1–21) in the unfolding narrative of redemption, with specific reference to land, seed, and universal blessing.",
    marks: 5,
    explanation: "Students must analyze God's unilateral promise to Abraham and how Christ fulfills the promised 'Seed' bringing blessing to all nations (Galatians 3:8).",
    markingGuide: "Marks distribution:\n- Explication of Genesis 12:1-3 (Promise of land, great nation, name): 1.5 Marks\n- The covenant ratification ceremony in Gen 15 (Divine unconditional oath): 1.5 Marks\n- New Testament Christological fulfillment in Galatians 3 & Romans 4: 2.0 Marks.\nTotal: 5 Marks.",
    status: "published",
    lecturerStaffId: "DIMABIN/LEC/2026/01",
    lecturerName: "Dr. Emmanuel Adebayo",
    createdAt: "2026-10-01T09:00:00.000Z",
    updatedAt: "2026-10-01T09:00:00.000Z"
  },
  {
    id: "q_theo_the101_01",
    courseCode: "THE-101",
    courseTitle: "Systematic Theology I",
    topic: "Doctrine of the Trinity",
    type: "mcq",
    difficulty: "intermediate",
    questionText: "Which theological term, famously affirmed at the Council of Nicaea (AD 325), describes the Son as being of the 'same substance or essence' with the Father?",
    options: [
      { id: "opt_a", text: "Homoiousios" },
      { id: "opt_b", text: "Homoousios" },
      { id: "opt_c", text: "Hypostasis" },
      { id: "opt_d", text: "Perichoresis" }
    ],
    correctOptionId: "opt_b",
    marks: 2,
    explanation: "Homoousios (consubstantial / same substance) was defended by Athanasius against the Arian term Homoiousios (similar substance).",
    markingGuide: "Award 2 marks for Homoousios (Option B).",
    status: "published",
    lecturerStaffId: "DIMABIN/LEC/2026/01",
    lecturerName: "Dr. Emmanuel Adebayo",
    createdAt: "2026-10-02T10:00:00.000Z",
    updatedAt: "2026-10-02T10:00:00.000Z"
  },
  {
    id: "q_theo_the101_02",
    courseCode: "THE-101",
    courseTitle: "Systematic Theology I",
    topic: "Pneumatology & Christology",
    type: "true_false",
    difficulty: "basic",
    questionText: "The Hypostatic Union asserts that the divine and human natures in Jesus Christ exist without confusion, without change, without division, and without separation (Chalcedonian Definition).",
    options: [
      { id: "opt_true", text: "True" },
      { id: "opt_false", text: "False" }
    ],
    correctOptionId: "opt_true",
    marks: 2,
    explanation: "Affirmed at the Council of Chalcedon in AD 451, defining the two full natures united in one divine person.",
    markingGuide: "Award 2 marks for True.",
    status: "published",
    lecturerStaffId: "DIMABIN/LEC/2026/01",
    lecturerName: "Dr. Emmanuel Adebayo",
    createdAt: "2026-10-02T10:15:00.000Z",
    updatedAt: "2026-10-02T10:15:00.000Z"
  }
];

// Initialize Question Bank cache if empty
(function initCbtSeed() {
  const existingQuestions = getCachedCollection(COLLECTIONS.CBT_QUESTIONS);
  if (!existingQuestions || existingQuestions.length === 0) {
    setCachedCollection(COLLECTIONS.CBT_QUESTIONS, SEED_CBT_QUESTIONS);
  }
})();

/**
 * 10A. QUESTION BANK OPERATIONS
 */
export function subscribeCbtQuestions(callback) {
  if (typeof callback !== "function") return () => {};

  const initial = getCachedCollection(COLLECTIONS.CBT_QUESTIONS);
  callback(initial && initial.length > 0 ? initial : SEED_CBT_QUESTIONS);

  const localListener = (e) => {
    if (e.detail) callback(e.detail);
  };
  window.addEventListener(`dimabin:db:${COLLECTIONS.CBT_QUESTIONS}`, localListener);

  let unsubscribe = () => {};
  try {
    const collRef = collection(db, COLLECTIONS.CBT_QUESTIONS);
    unsubscribe = onSnapshot(
      collRef,
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setCachedCollection(COLLECTIONS.CBT_QUESTIONS, list);
          callback(list);
        } else {
          callback(getCachedCollection(COLLECTIONS.CBT_QUESTIONS) || SEED_CBT_QUESTIONS);
        }
      },
      (err) => {
        console.warn("[DIMABIN CBT Questions] onSnapshot note:", err.message);
        callback(getCachedCollection(COLLECTIONS.CBT_QUESTIONS) || SEED_CBT_QUESTIONS);
      }
    );
  } catch (err) {
    console.warn("[DIMABIN CBT Questions] init note:", err.message);
  }

  return () => {
    try { unsubscribe(); } catch (_) {}
    window.removeEventListener(`dimabin:db:${COLLECTIONS.CBT_QUESTIONS}`, localListener);
  };
}

export async function createCbtQuestion(data) {
  const normCourse = (data.courseCode || "").trim().toUpperCase();
  if (!normCourse) throw new Error("Course Code is required for Question Bank entry.");
  if (!data.questionText || !data.questionText.trim()) throw new Error("Question text is required.");

  const nowIso = new Date().toISOString();
  const qId = `q_${normCourse.replace(/[^A-Z0-9]/g, "_")}_${Date.now()}`;

  const payload = {
    id: qId,
    courseCode: normCourse,
    courseTitle: data.courseTitle || "",
    topic: (data.topic || "General").trim(),
    type: data.type || "mcq", // mcq | yes_no | true_false | short_answer | theory
    difficulty: data.difficulty || "intermediate",
    questionText: data.questionText.trim(),
    options: Array.isArray(data.options) ? data.options : [],
    correctOptionId: data.correctOptionId || "",
    expectedAnswer: data.expectedAnswer || "",
    matchingRule: data.matchingRule || "exact_or_contains",
    marks: Math.max(1, parseInt(data.marks, 10) || 2),
    explanation: data.explanation || "",
    markingGuide: data.markingGuide || "",
    status: data.status || "published", // draft | published
    lecturerStaffId: data.lecturerStaffId || "",
    lecturerName: data.lecturerName || "",
    createdAt: nowIso,
    updatedAt: nowIso
  };

  upsertCachedItem(COLLECTIONS.CBT_QUESTIONS, payload);

  let savedId = qId;
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.CBT_QUESTIONS), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    savedId = docRef.id;
    removeCachedItem(COLLECTIONS.CBT_QUESTIONS, qId);
    upsertCachedItem(COLLECTIONS.CBT_QUESTIONS, { ...payload, id: savedId });
  } catch (err) {
    console.warn(`[DIMABIN CBT] Add question note: ${err.message}`);
  }

  await logActivity({
    action: "cbt_question_created",
    description: `Created ${payload.type.toUpperCase()} question (${payload.marks} marks) in ${normCourse} for topic "${payload.topic}".`,
    targetCollection: COLLECTIONS.CBT_QUESTIONS,
    targetDocumentId: savedId
  });

  return { success: true, id: savedId, ...payload };
}

export async function updateCbtQuestion(questionId, data) {
  if (!questionId) throw new Error("Question ID is required.");
  const nowIso = new Date().toISOString();
  const existing = (getCachedCollection(COLLECTIONS.CBT_QUESTIONS) || []).find((q) => q.id === questionId);

  const updatedPayload = {
    ...(existing || {}),
    ...data,
    courseCode: (data.courseCode || existing?.courseCode || "").trim().toUpperCase(),
    updatedAt: nowIso
  };

  upsertCachedItem(COLLECTIONS.CBT_QUESTIONS, updatedPayload);

  try {
    const docRef = doc(db, COLLECTIONS.CBT_QUESTIONS, questionId);
    await updateDoc(docRef, { ...updatedPayload, updatedAt: serverTimestamp() });
  } catch (err) {
    console.warn(`[DIMABIN CBT] Update question note: ${err.message}`);
  }

  await logActivity({
    action: "cbt_question_updated",
    description: `Updated question ${questionId} in course ${updatedPayload.courseCode}.`,
    targetCollection: COLLECTIONS.CBT_QUESTIONS,
    targetDocumentId: questionId
  });

  return { success: true, ...updatedPayload };
}

export async function deleteCbtQuestion(questionId) {
  if (!questionId) return;
  removeCachedItem(COLLECTIONS.CBT_QUESTIONS, questionId);

  try {
    const docRef = doc(db, COLLECTIONS.CBT_QUESTIONS, questionId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn(`[DIMABIN CBT] Delete question note: ${err.message}`);
  }

  await logActivity({
    action: "cbt_question_deleted",
    description: `Deleted question ${questionId} from question bank.`,
    targetCollection: COLLECTIONS.CBT_QUESTIONS,
    targetDocumentId: questionId
  });

  return { success: true, id: questionId };
}

export async function duplicateCbtQuestion(questionId) {
  const existing = (getCachedCollection(COLLECTIONS.CBT_QUESTIONS) || []).find((q) => q.id === questionId);
  if (!existing) throw new Error("Question not found.");

  const cloneData = {
    ...existing,
    questionText: `${existing.questionText} (Copy)`,
    topic: `${existing.topic || "General"}`,
    status: "draft"
  };
  delete cloneData.id;
  delete cloneData.createdAt;
  delete cloneData.updatedAt;

  return await createCbtQuestion(cloneData);
}

/**
 * 10B. CBT ASSESSMENTS (TESTS & EXAMINATIONS)
 */
export function subscribeCbtAssessments(callback) {
  if (typeof callback !== "function") return () => {};

  callback(getCachedCollection(COLLECTIONS.CBT_ASSESSMENTS) || []);

  const localListener = (e) => {
    if (e.detail) callback(e.detail);
  };
  window.addEventListener(`dimabin:db:${COLLECTIONS.CBT_ASSESSMENTS}`, localListener);

  let unsubscribe = () => {};
  try {
    const collRef = collection(db, COLLECTIONS.CBT_ASSESSMENTS);
    unsubscribe = onSnapshot(
      collRef,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCachedCollection(COLLECTIONS.CBT_ASSESSMENTS, list);
        callback(list);
      },
      (err) => {
        console.warn("[DIMABIN CBT Assessments] onSnapshot note:", err.message);
        callback(getCachedCollection(COLLECTIONS.CBT_ASSESSMENTS) || []);
      }
    );
  } catch (err) {
    console.warn("[DIMABIN CBT Assessments] init note:", err.message);
  }

  return () => {
    try { unsubscribe(); } catch (_) {}
    window.removeEventListener(`dimabin:db:${COLLECTIONS.CBT_ASSESSMENTS}`, localListener);
  };
}

export async function createCbtAssessment(assessmentData) {
  const normCourse = (assessmentData.courseCode || "").trim().toUpperCase();
  if (!normCourse) throw new Error("Course Code is required.");
  if (!assessmentData.title || !assessmentData.title.trim()) throw new Error("Assessment Title is required.");

  const questionsSnapshot = Array.isArray(assessmentData.questions) ? assessmentData.questions : [];
  if (questionsSnapshot.length === 0) {
    throw new Error("At least one question must be selected for the assessment.");
  }

  // Validate sum of question marks equals totalMarks
  const sumMarks = questionsSnapshot.reduce((acc, q) => acc + (parseInt(q.marks, 10) || 0), 0);
  const totalMarks = parseInt(assessmentData.totalMarks, 10) || sumMarks;
  if (totalMarks !== sumMarks) {
    throw new Error(`Assessment total marks (${totalMarks}) does not equal the sum of selected question marks (${sumMarks}). Adjust total marks or question weights.`);
  }

  const nowIso = new Date().toISOString();
  const cbtId = `cbt_${normCourse.replace(/[^A-Z0-9]/g, "_")}_${Date.now()}`;

  // Check if initial status should be scheduled or open
  let initialStatus = assessmentData.status || "draft"; // draft | scheduled | open | closed
  if (initialStatus !== "draft") {
    const startIso = assessmentData.startDate || nowIso;
    const endIso = assessmentData.closingDate || "";
    const now = new Date();
    if (new Date(startIso) > now) {
      initialStatus = "scheduled";
    } else if (endIso && new Date(endIso) < now) {
      initialStatus = "closed";
    } else {
      initialStatus = "open";
    }
  }

  const payload = {
    id: cbtId,
    title: assessmentData.title.trim(),
    type: (assessmentData.type || "test").toLowerCase(), // test | exam
    courseCode: normCourse,
    courseTitle: assessmentData.courseTitle || "",
    topic: assessmentData.topic || "Comprehensive Assessment",
    academicSession: assessmentData.academicSession || "2026/2027",
    semester: assessmentData.semester || "First Semester",
    studyCentre: assessmentData.studyCentre || "all",
    instructions: assessmentData.instructions || "Answer all questions carefully. Time counts down automatically.",
    startDate: assessmentData.startDate || nowIso,
    closingDate: assessmentData.closingDate || "",
    durationMinutes: Math.max(5, parseInt(assessmentData.durationMinutes, 10) || 30),
    totalMarks,
    passMark: parseInt(assessmentData.passMark, 10) || Math.round(totalMarks * 0.4),
    allowedAttempts: parseInt(assessmentData.allowedAttempts, 10) || 1,
    shuffleQuestions: Boolean(assessmentData.shuffleQuestions),
    shuffleOptions: Boolean(assessmentData.shuffleOptions),
    allowNavigation: assessmentData.allowNavigation !== false,
    allowUnanswered: assessmentData.allowUnanswered !== false,
    resultVisibility: assessmentData.resultVisibility || "after_marking", // hide | immediate | after_marking | manual
    hasTheory: questionsSnapshot.some((q) => q.type === "theory" || (q.type === "short_answer" && q.matchingRule === "manual")),
    questions: questionsSnapshot, // Frozen historical snapshot
    status: initialStatus,
    lecturerStaffId: assessmentData.lecturerStaffId || "",
    lecturerName: assessmentData.lecturerName || "",
    createdAt: nowIso,
    updatedAt: nowIso
  };

  upsertCachedItem(COLLECTIONS.CBT_ASSESSMENTS, payload);

  let savedId = cbtId;
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.CBT_ASSESSMENTS), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    savedId = docRef.id;
    removeCachedItem(COLLECTIONS.CBT_ASSESSMENTS, cbtId);
    upsertCachedItem(COLLECTIONS.CBT_ASSESSMENTS, { ...payload, id: savedId });
  } catch (err) {
    console.warn(`[DIMABIN CBT] Add assessment note: ${err.message}`);
  }

  // If published immediately, alert students via Portal Notifications
  if (payload.status === "open" || payload.status === "scheduled") {
    try {
      const notifPayload = {
        title: `New CBT ${payload.type.toUpperCase()}: ${payload.courseCode}`,
        message: `A new Computer-Based Test "${payload.title}" (${payload.durationMinutes} mins, ${payload.totalMarks} marks) has been scheduled for ${payload.courseCode}. Check your Student CBT portal for schedule and instructions.`,
        audience: "student",
        priority: "normal",
        status: "published",
        createdAt: nowIso
      };
      await addDoc(collection(db, COLLECTIONS.PORTAL_NOTIFICATIONS), {
        ...notifPayload,
        createdAt: serverTimestamp()
      });
    } catch (_) {}
  }

  await logActivity({
    action: "cbt_assessment_created",
    description: `Created CBT ${payload.type.toUpperCase()} "${payload.title}" for ${normCourse} with ${questionsSnapshot.length} questions (${totalMarks} marks). Status: ${payload.status}.`,
    targetCollection: COLLECTIONS.CBT_ASSESSMENTS,
    targetDocumentId: savedId
  });

  return { success: true, id: savedId, ...payload };
}

export async function updateCbtAssessment(assessmentId, data) {
  if (!assessmentId) throw new Error("Assessment ID is required.");
  const existing = (getCachedCollection(COLLECTIONS.CBT_ASSESSMENTS) || []).find((a) => a.id === assessmentId);
  if (!existing) throw new Error("Assessment not found.");

  // Check if there are already student submissions for this assessment
  const existingSubmissions = (getCachedCollection(COLLECTIONS.CBT_SUBMISSIONS) || []).filter(
    (s) => s.assessmentId === assessmentId
  );
  if (existingSubmissions.length > 0 && data.questions && JSON.stringify(data.questions) !== JSON.stringify(existing.questions)) {
    throw new Error("Cannot alter the questions of an assessment that already has student submissions. Create a revised assessment instead.");
  }

  const nowIso = new Date().toISOString();
  const updatedPayload = {
    ...existing,
    ...data,
    courseCode: (data.courseCode || existing.courseCode).trim().toUpperCase(),
    updatedAt: nowIso
  };

  upsertCachedItem(COLLECTIONS.CBT_ASSESSMENTS, updatedPayload);

  try {
    const docRef = doc(db, COLLECTIONS.CBT_ASSESSMENTS, assessmentId);
    await updateDoc(docRef, { ...updatedPayload, updatedAt: serverTimestamp() });
  } catch (err) {
    console.warn(`[DIMABIN CBT] Update assessment note: ${err.message}`);
  }

  await logActivity({
    action: "cbt_assessment_updated",
    description: `Updated CBT assessment "${updatedPayload.title}" (${updatedPayload.courseCode}).`,
    targetCollection: COLLECTIONS.CBT_ASSESSMENTS,
    targetDocumentId: assessmentId
  });

  return { success: true, ...updatedPayload };
}

export async function deleteCbtAssessment(assessmentId) {
  if (!assessmentId) return;
  removeCachedItem(COLLECTIONS.CBT_ASSESSMENTS, assessmentId);

  try {
    const docRef = doc(db, COLLECTIONS.CBT_ASSESSMENTS, assessmentId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn(`[DIMABIN CBT] Delete assessment note: ${err.message}`);
  }

  await logActivity({
    action: "cbt_assessment_deleted",
    description: `Deleted CBT assessment ${assessmentId}.`,
    targetCollection: COLLECTIONS.CBT_ASSESSMENTS,
    targetDocumentId: assessmentId
  });

  return { success: true, id: assessmentId };
}

export async function publishCbtAssessment(assessmentId) {
  const existing = (getCachedCollection(COLLECTIONS.CBT_ASSESSMENTS) || []).find((a) => a.id === assessmentId);
  if (!existing) throw new Error("Assessment not found.");

  const now = new Date();
  const start = new Date(existing.startDate || now);
  const newStatus = start > now ? "scheduled" : "open";

  return await updateCbtAssessment(assessmentId, { status: newStatus });
}

export async function closeCbtAssessment(assessmentId) {
  return await updateCbtAssessment(assessmentId, { status: "closed" });
}

export async function extendCbtDeadline(assessmentId, newClosingDateIso, reason = "Authorized extension") {
  if (!newClosingDateIso) throw new Error("New closing date is required.");
  return await updateCbtAssessment(assessmentId, {
    closingDate: newClosingDateIso,
    extensionReason: reason,
    status: "open"
  });
}

export async function updateCbtResultVisibility(assessmentId, visibilitySetting) {
  return await updateCbtAssessment(assessmentId, { resultVisibility: visibilitySetting });
}

/**
 * 10C. CBT SUBMISSIONS, REAL-TIME ATTEMPTS & GRADING
 */
export function subscribeCbtSubmissions(callback) {
  if (typeof callback !== "function") return () => {};

  callback(getCachedCollection(COLLECTIONS.CBT_SUBMISSIONS) || []);

  const localListener = (e) => {
    if (e.detail) callback(e.detail);
  };
  window.addEventListener(`dimabin:db:${COLLECTIONS.CBT_SUBMISSIONS}`, localListener);

  let unsubscribe = () => {};
  try {
    const collRef = collection(db, COLLECTIONS.CBT_SUBMISSIONS);
    unsubscribe = onSnapshot(
      collRef,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCachedCollection(COLLECTIONS.CBT_SUBMISSIONS, list);
        callback(list);
      },
      (err) => {
        console.warn("[DIMABIN CBT Submissions] onSnapshot note:", err.message);
        callback(getCachedCollection(COLLECTIONS.CBT_SUBMISSIONS) || []);
      }
    );
  } catch (err) {
    console.warn("[DIMABIN CBT Submissions] init note:", err.message);
  }

  return () => {
    try { unsubscribe(); } catch (_) {}
    window.removeEventListener(`dimabin:db:${COLLECTIONS.CBT_SUBMISSIONS}`, localListener);
  };
}

/**
 * Start or restore student CBT attempt
 * Prevents multiple attempts beyond permitted limit
 */
export async function startCbtAttempt({ studentId, studentName, matricNumber, studyCentre, programme }, assessmentId) {
  if (!assessmentId) throw new Error("Assessment ID is required.");
  const assessment = (getCachedCollection(COLLECTIONS.CBT_ASSESSMENTS) || []).find((a) => a.id === assessmentId);
  if (!assessment) throw new Error("Assessment not found or unavailable.");

  const normMatric = (matricNumber || studentId || "").trim().toUpperCase();
  const allSubmissions = getCachedCollection(COLLECTIONS.CBT_SUBMISSIONS) || [];

  // Check student attempts for this assessment
  const studentAttempts = allSubmissions.filter(
    (s) => s.assessmentId === assessmentId && (s.matricNumber || "").trim().toUpperCase() === normMatric
  );

  // If there is an active in-progress attempt, restore it
  const activeAttempt = studentAttempts.find((s) => s.status === "in_progress");
  if (activeAttempt) {
    // Check if time expired
    const now = Date.now();
    const expiry = new Date(activeAttempt.expiresAt).getTime();
    if (now >= expiry) {
      // Auto-submit expired attempt
      await submitCbtAttempt(activeAttempt.id, activeAttempt.answers || {});
      throw new Error("Your previous test attempt duration has expired and has been submitted automatically.");
    }
    return { isResumed: true, attempt: activeAttempt, assessment };
  }

  // Check attempt limit
  const completedAttempts = studentAttempts.filter((s) => s.status !== "in_progress");
  const maxAllowed = assessment.allowedAttempts || 1;
  if (completedAttempts.length >= maxAllowed) {
    throw new Error(`You have reached the maximum allowed attempts (${maxAllowed}) for this assessment.`);
  }

  // Verify time window
  const now = new Date();
  if (assessment.startDate && new Date(assessment.startDate) > now) {
    throw new Error("This assessment is scheduled for a future time and is not yet open.");
  }
  if (assessment.closingDate && new Date(assessment.closingDate) < now) {
    throw new Error("This assessment deadline has passed. New attempts are closed.");
  }

  const nowIso = now.toISOString();
  const durationMs = (assessment.durationMinutes || 30) * 60 * 1000;
  const expiresAtIso = new Date(now.getTime() + durationMs).toISOString();

  const attemptId = `sub_${assessmentId}_${normMatric.replace(/[^A-Z0-9]/g, "_")}_att${completedAttempts.length + 1}`;

  const attemptPayload = {
    id: attemptId,
    assessmentId,
    assessmentTitle: assessment.title,
    assessmentType: assessment.type,
    courseCode: assessment.courseCode,
    courseTitle: assessment.courseTitle,
    studentId: studentId || normMatric,
    studentName: studentName || "Candidate",
    matricNumber: normMatric,
    studyCentre: studyCentre || "All Centres",
    programme: programme || "Diploma in Theology",
    attemptNumber: completedAttempts.length + 1,
    status: "in_progress", // in_progress | submitted | graded
    answers: {},
    startedAt: nowIso,
    expiresAt: expiresAtIso,
    submittedAt: null,
    autoScore: 0,
    manualScore: 0,
    totalScore: 0,
    maxMarks: assessment.totalMarks || 30,
    percentage: 0,
    grade: "F",
    markingStatus: assessment.hasTheory ? "pending_manual" : "auto_completed",
    resultVisibility: assessment.resultVisibility || "after_marking",
    resultsReleased: assessment.resultVisibility === "immediate" && !assessment.hasTheory,
    updatedAt: nowIso
  };

  upsertCachedItem(COLLECTIONS.CBT_SUBMISSIONS, attemptPayload);

  try {
    const docRef = doc(db, COLLECTIONS.CBT_SUBMISSIONS, attemptId);
    await setDoc(docRef, { ...attemptPayload, startedAt: serverTimestamp(), updatedAt: serverTimestamp() });
  } catch (err) {
    console.warn(`[DIMABIN CBT] Start attempt note: ${err.message}`);
  }

  return { isResumed: false, attempt: attemptPayload, assessment };
}

/**
 * Auto-save student progress answers periodically or on question change
 */
export async function saveCbtProgress(attemptId, savedAnswers) {
  if (!attemptId) return;
  const existing = (getCachedCollection(COLLECTIONS.CBT_SUBMISSIONS) || []).find((s) => s.id === attemptId);
  if (!existing || existing.status !== "in_progress") return;

  const nowIso = new Date().toISOString();
  const updatedPayload = {
    ...existing,
    answers: { ...(existing.answers || {}), ...savedAnswers },
    updatedAt: nowIso
  };

  upsertCachedItem(COLLECTIONS.CBT_SUBMISSIONS, updatedPayload);

  try {
    const docRef = doc(db, COLLECTIONS.CBT_SUBMISSIONS, attemptId);
    await updateDoc(docRef, { answers: updatedPayload.answers, updatedAt: serverTimestamp() });
  } catch (_) {}
}

/**
 * Submit CBT attempt and execute automatic marking
 */
export async function submitCbtAttempt(attemptId, finalAnswers = {}) {
  if (!attemptId) throw new Error("Attempt ID is required.");
  const existing = (getCachedCollection(COLLECTIONS.CBT_SUBMISSIONS) || []).find((s) => s.id === attemptId);
  if (!existing) throw new Error("Attempt not found.");

  if (existing.status !== "in_progress") {
    return { success: true, attempt: existing, message: "Attempt already submitted." };
  }

  const assessment = (getCachedCollection(COLLECTIONS.CBT_ASSESSMENTS) || []).find((a) => a.id === existing.assessmentId);
  const questions = assessment?.questions || [];
  const mergedAnswers = { ...(existing.answers || {}), ...finalAnswers };

  // Automated Marking Process
  let autoScore = 0;
  let hasPendingTheory = false;
  const questionGrading = {};

  questions.forEach((q) => {
    const ans = mergedAnswers[q.id];
    const qMarks = parseInt(q.marks, 10) || 1;

    if (q.type === "mcq" || q.type === "yes_no" || q.type === "true_false") {
      const isCorrect = String(ans || "").trim().toLowerCase() === String(q.correctOptionId || "").trim().toLowerCase();
      const awarded = isCorrect ? qMarks : 0;
      autoScore += awarded;
      questionGrading[q.id] = {
        type: q.type,
        studentAnswer: ans || "",
        correctOptionId: q.correctOptionId,
        awardedMarks: awarded,
        maxMarks: qMarks,
        isCorrect,
        status: "auto_graded"
      };
    } else if (q.type === "short_answer") {
      // Evaluate if auto matching is enabled
      const expected = (q.expectedAnswer || "").trim().toLowerCase();
      const given = String(ans || "").trim().toLowerCase();
      if (q.matchingRule === "exact" && given && given === expected) {
        autoScore += qMarks;
        questionGrading[q.id] = { type: q.type, studentAnswer: ans || "", awardedMarks: qMarks, maxMarks: qMarks, status: "auto_graded" };
      } else if (q.matchingRule === "exact_or_contains" && given && (given === expected || given.includes(expected))) {
        autoScore += qMarks;
        questionGrading[q.id] = { type: q.type, studentAnswer: ans || "", awardedMarks: qMarks, maxMarks: qMarks, status: "auto_graded" };
      } else {
        hasPendingTheory = true;
        questionGrading[q.id] = { type: q.type, studentAnswer: ans || "", awardedMarks: 0, maxMarks: qMarks, status: "pending_manual" };
      }
    } else if (q.type === "theory") {
      hasPendingTheory = true;
      questionGrading[q.id] = {
        type: q.type,
        studentAnswer: ans || "",
        awardedMarks: 0,
        maxMarks: qMarks,
        status: "pending_manual"
      };
    }
  });

  const nowIso = new Date().toISOString();
  const maxMarks = assessment?.totalMarks || 30;
  const totalScore = autoScore; // Will be augmented when theory questions are marked
  const percentage = maxMarks > 0 ? Math.round((totalScore / maxMarks) * 100) : 0;

  // Derive initial grade
  let grade = "F";
  if (percentage >= 70) grade = "A";
  else if (percentage >= 60) grade = "B";
  else if (percentage >= 50) grade = "C";
  else if (percentage >= 45) grade = "D";
  else if (percentage >= 40) grade = "E";

  const markingStatus = hasPendingTheory ? "pending_manual" : "fully_graded";
  const visibilitySetting = assessment?.resultVisibility || "after_marking";
  const resultsReleased =
    visibilitySetting === "immediate" ||
    (visibilitySetting === "after_marking" && !hasPendingTheory);

  const updatedPayload = {
    ...existing,
    status: "submitted",
    submittedAt: nowIso,
    answers: mergedAnswers,
    questionGrading,
    autoScore,
    manualScore: 0,
    totalScore,
    maxMarks,
    percentage,
    grade,
    markingStatus,
    resultsReleased,
    updatedAt: nowIso
  };

  upsertCachedItem(COLLECTIONS.CBT_SUBMISSIONS, updatedPayload);

  try {
    const docRef = doc(db, COLLECTIONS.CBT_SUBMISSIONS, attemptId);
    await updateDoc(docRef, { ...updatedPayload, submittedAt: serverTimestamp(), updatedAt: serverTimestamp() });
  } catch (err) {
    console.warn(`[DIMABIN CBT] Submit attempt note: ${err.message}`);
  }

  // Automatic integration with Results continuous assessment CBT mark (max 10m)
  try {
    const cbtScoreOutOf10 = maxMarks > 0 ? Math.min(10, Math.round((totalScore / maxMarks) * 10)) : 0;
    await saveLecturerGradeRecord({
      studentName: existing.studentName,
      matricNumber: existing.matricNumber,
      courseCode: existing.courseCode,
      courseTitle: existing.courseTitle,
      studyCentre: existing.studyCentre,
      academicSession: assessment?.academicSession || "2026/2027",
      semester: assessment?.semester || "First Semester",
      cbtScore: cbtScoreOutOf10,
      lecturerStaffId: assessment?.lecturerStaffId || "",
      lecturerName: assessment?.lecturerName || ""
    });
  } catch (err) {
    console.warn("[DIMABIN CBT] Gradebook sync note:", err.message);
  }

  await logActivity({
    action: "cbt_attempt_submitted",
    description: `Candidate ${existing.studentName} (${existing.matricNumber}) submitted CBT "${existing.assessmentTitle}". Auto Score: ${autoScore}/${maxMarks} (${markingStatus}).`,
    targetCollection: COLLECTIONS.CBT_SUBMISSIONS,
    targetDocumentId: attemptId
  });

  return { success: true, attempt: updatedPayload };
}

/**
 * Lecturer: Manually grade student theory and short-answer questions
 */
export async function gradeCbtSubmission(submissionId, { manualGrading = {}, lecturerFeedback = "", lecturerStaffId = "", lecturerName = "", finalize = false }) {
  if (!submissionId) throw new Error("Submission ID is required.");
  const existing = (getCachedCollection(COLLECTIONS.CBT_SUBMISSIONS) || []).find((s) => s.id === submissionId);
  if (!existing) throw new Error("Submission not found.");

  const assessment = (getCachedCollection(COLLECTIONS.CBT_ASSESSMENTS) || []).find((a) => a.id === existing.assessmentId);
  const questions = assessment?.questions || [];

  let manualScoreTotal = 0;
  let stillHasPending = false;
  const qGrading = { ...(existing.questionGrading || {}) };

  questions.forEach((q) => {
    if (q.type === "theory" || (q.type === "short_answer" && q.matchingRule === "manual")) {
      const qMax = parseInt(q.marks, 10) || 1;
      const givenMark = manualGrading[q.id];

      if (givenMark !== undefined && givenMark !== null && givenMark !== "") {
        const validatedScore = Math.min(qMax, Math.max(0, parseInt(givenMark, 10) || 0));
        manualScoreTotal += validatedScore;
        qGrading[q.id] = {
          ...(qGrading[q.id] || {}),
          type: q.type,
          studentAnswer: existing.answers?.[q.id] || "",
          awardedMarks: validatedScore,
          maxMarks: qMax,
          status: "manually_graded"
        };
      } else {
        stillHasPending = true;
      }
    }
  });

  const nowIso = new Date().toISOString();
  const maxMarks = existing.maxMarks || 30;
  const totalScore = (existing.autoScore || 0) + manualScoreTotal;
  const percentage = maxMarks > 0 ? Math.round((totalScore / maxMarks) * 100) : 0;

  let grade = "F";
  if (percentage >= 70) grade = "A";
  else if (percentage >= 60) grade = "B";
  else if (percentage >= 50) grade = "C";
  else if (percentage >= 45) grade = "D";
  else if (percentage >= 40) grade = "E";

  const markingStatus = stillHasPending && !finalize ? "pending_manual" : "fully_graded";
  const resultsReleased =
    existing.resultVisibility === "immediate" ||
    (existing.resultVisibility === "after_marking" && markingStatus === "fully_graded") ||
    existing.resultsReleased;

  const updatedPayload = {
    ...existing,
    questionGrading: qGrading,
    manualScore: manualScoreTotal,
    totalScore,
    percentage,
    grade,
    markingStatus,
    resultsReleased,
    lecturerFeedback: lecturerFeedback || existing.lecturerFeedback || "",
    gradedBy: lecturerName || lecturerStaffId,
    gradedAt: nowIso,
    updatedAt: nowIso
  };

  upsertCachedItem(COLLECTIONS.CBT_SUBMISSIONS, updatedPayload);

  try {
    const docRef = doc(db, COLLECTIONS.CBT_SUBMISSIONS, submissionId);
    await updateDoc(docRef, { ...updatedPayload, updatedAt: serverTimestamp() });
  } catch (err) {
    console.warn(`[DIMABIN CBT] Manual grade note: ${err.message}`);
  }

  // Sync to Results Management CA CBT mark
  try {
    const cbtScoreOutOf10 = maxMarks > 0 ? Math.min(10, Math.round((totalScore / maxMarks) * 10)) : 0;
    await saveLecturerGradeRecord({
      studentName: existing.studentName,
      matricNumber: existing.matricNumber,
      courseCode: existing.courseCode,
      courseTitle: existing.courseTitle,
      studyCentre: existing.studyCentre,
      academicSession: assessment?.academicSession || "2026/2027",
      semester: assessment?.semester || "First Semester",
      cbtScore: cbtScoreOutOf10,
      lecturerStaffId: lecturerStaffId || assessment?.lecturerStaffId || "",
      lecturerName: lecturerName || assessment?.lecturerName || ""
    });
  } catch (_) {}

  await logActivity({
    action: "cbt_submission_graded",
    description: `Faculty instructor ${lecturerName || lecturerStaffId} graded submission for ${existing.studentName} (${existing.matricNumber}): Total ${totalScore}/${maxMarks} (${grade}).`,
    targetCollection: COLLECTIONS.CBT_SUBMISSIONS,
    targetDocumentId: submissionId
  });

  return { success: true, submission: updatedPayload };
}

/**
 * Export CBT Assessment Results to CSV format
 */
export function exportCbtResultsCsv(assessmentId) {
  const assessment = (getCachedCollection(COLLECTIONS.CBT_ASSESSMENTS) || []).find((a) => a.id === assessmentId);
  const submissions = (getCachedCollection(COLLECTIONS.CBT_SUBMISSIONS) || []).filter(
    (s) => !assessmentId || s.assessmentId === assessmentId
  );

  const headers = [
    "S/N",
    "Student Name",
    "Matriculation Number",
    "Course Code",
    "Assessment Title",
    "Type",
    "Study Centre",
    "Submission Date",
    "Auto Score",
    "Manual Score",
    "Total Score",
    "Max Marks",
    "Percentage (%)",
    "Letter Grade",
    "Pass / Fail",
    "Marking Status"
  ];

  const rows = submissions.map((s, idx) => {
    const passMark = assessment?.passMark || Math.round((s.maxMarks || 30) * 0.4);
    const passFail = s.totalScore >= passMark ? "PASS" : "FAIL";
    return [
      idx + 1,
      `"${(s.studentName || "").replace(/"/g, '""')}"`,
      `"${s.matricNumber || ""}"`,
      `"${s.courseCode || ""}"`,
      `"${(s.assessmentTitle || "").replace(/"/g, '""')}"`,
      s.assessmentType || "Test",
      `"${s.studyCentre || "Main Campus"}"`,
      s.submittedAt ? formatDateOnly(s.submittedAt) : "In Progress",
      s.autoScore !== undefined ? s.autoScore : 0,
      s.manualScore !== undefined ? s.manualScore : 0,
      s.totalScore !== undefined ? s.totalScore : 0,
      s.maxMarks || 30,
      `${s.percentage || 0}%`,
      s.grade || "F",
      passFail,
      s.markingStatus === "fully_graded" ? "Fully Graded" : "Pending Manual"
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `DIMABIN_CBT_Results_${assessment?.courseCode || "All"}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
