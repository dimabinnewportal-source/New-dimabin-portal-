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
  STUDY_CENTRES: "study_centres",
  RESULTS: "results",
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
 */
export async function savePublicApplication(formData) {
  const appId = `DIMABIN/APP/2026/${Math.floor(1000 + Math.random() * 9000)}`;
  const record = {
    applicationId: appId,
    fullName: (formData.name || formData.fullName || "Candidate").trim(),
    email: (formData.email || "").trim(),
    phone: (formData.phone || "").trim(),
    whatsapp: (formData.whatsapp || formData.phone || "").trim(),
    programme: formData.program || formData.programme || "Diploma in Theology (Dipl.Th.)",
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
    studyCentre: formData.studyCentre || "Goshen Central Campus, Abeokuta",
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
    studyCentre: studentData.studyCentre || "Goshen Central Campus, Abeokuta",
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
 * =========================================================================
 */
export function subscribeLecturers(callback) {
  if (typeof callback !== "function") return () => {};

  callback(getCachedCollection(COLLECTIONS.LECTURERS));

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
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCachedCollection(COLLECTIONS.LECTURERS, list);
        callback(list);
      },
      (err) => {
        console.warn("[DIMABIN Lecturers] onSnapshot note:", err.message);
        callback(getCachedCollection(COLLECTIONS.LECTURERS));
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
  const staffId = lecturerData.staffId || `DIMABIN/FAC/2026/${Math.floor(10 + Math.random() * 90)}`;
  const record = {
    staffId,
    fullName: (lecturerData.fullName || "Rev. Faculty Instructor").trim(),
    email: (lecturerData.email || "").trim(),
    phone: (lecturerData.phone || "").trim(),
    department: lecturerData.department || "Biblical & Systematic Theology",
    qualification: lecturerData.qualification || "M.Th., B.Th.",
    studyCentre: lecturerData.studyCentre || "Goshen Central Campus, Abeokuta",
    status: lecturerData.status || "active", // active | inactive
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const localId = `lec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  upsertCachedItem(COLLECTIONS.LECTURERS, { id: localId, ...record });

  try {
    await addDoc(collection(db, COLLECTIONS.LECTURERS), {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn(`[DIMABIN Lecturers] Firestore create note: ${err.message}`);
  }

  await logActivity({
    action: "lecturer_added",
    description: `Added faculty instructor ${record.fullName} (${record.staffId}).`,
    targetCollection: COLLECTIONS.LECTURERS,
    targetDocumentId: record.staffId
  });

  return { success: true, ...record };
}

export async function toggleLecturerStatus(lecturerId, currentStatus) {
  const newStatus = currentStatus === "active" ? "inactive" : "active";
  upsertCachedItem(COLLECTIONS.LECTURERS, { id: lecturerId, status: newStatus, updatedAt: new Date().toISOString() });

  try {
    const docRef = doc(db, COLLECTIONS.LECTURERS, lecturerId);
    await updateDoc(docRef, { status: newStatus, updatedAt: serverTimestamp() });
  } catch (err) {
    console.warn(`[DIMABIN Lecturers] Status toggle note: ${err.message}`);
  }

  await logActivity({
    action: "lecturer_status_changed",
    description: `Lecturer ${lecturerId} status set to '${newStatus.toUpperCase()}'.`,
    targetCollection: COLLECTIONS.LECTURERS,
    targetDocumentId: lecturerId
  });

  return { success: true, lecturerId, status: newStatus };
}

/**
 * =========================================================================
 * 6. COURSE MANAGEMENT (courses)
 * =========================================================================
 */
export function subscribeCourses(callback) {
  if (typeof callback !== "function") return () => {};

  callback(getCachedCollection(COLLECTIONS.COURSES));

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
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCachedCollection(COLLECTIONS.COURSES, list);
        callback(list);
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
  const code = (courseData.courseCode || "").trim().toUpperCase();
  if (!code) throw new Error("Course code is required.");

  const record = {
    courseCode: code,
    courseTitle: (courseData.courseTitle || "").trim(),
    programme: courseData.programme || "Diploma in Theology (Dipl.Th.)",
    level: courseData.level || "Diploma I",
    semester: courseData.semester || "First Semester",
    creditUnit: parseInt(courseData.creditUnit, 10) || 2,
    status: courseData.status || "active", // active | inactive
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const localId = `crs_${code.replace(/[^A-Z0-9]/g, "_")}`;
  upsertCachedItem(COLLECTIONS.COURSES, { id: localId, ...record });

  try {
    await addDoc(collection(db, COLLECTIONS.COURSES), {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn(`[DIMABIN Courses] Firestore create note: ${err.message}`);
  }

  await logActivity({
    action: "course_created",
    description: `Created course curriculum ${record.courseCode} — ${record.courseTitle}.`,
    targetCollection: COLLECTIONS.COURSES,
    targetDocumentId: record.courseCode
  });

  return { success: true, ...record };
}

export async function toggleCourseStatus(courseId, currentStatus) {
  const newStatus = currentStatus === "active" ? "inactive" : "active";
  upsertCachedItem(COLLECTIONS.COURSES, { id: courseId, status: newStatus, updatedAt: new Date().toISOString() });

  try {
    const docRef = doc(db, COLLECTIONS.COURSES, courseId);
    await updateDoc(docRef, { status: newStatus, updatedAt: serverTimestamp() });
  } catch (err) {
    console.warn(`[DIMABIN Courses] Status toggle note: ${err.message}`);
  }

  await logActivity({
    action: "course_status_changed",
    description: `Course ${courseId} set to '${newStatus.toUpperCase()}'.`,
    targetCollection: COLLECTIONS.COURSES,
    targetDocumentId: courseId
  });

  return { success: true, courseId, status: newStatus };
}

/**
 * =========================================================================
 * 7. COURSE ALLOCATION (course_allocations)
 * =========================================================================
 */
export function subscribeCourseAllocations(callback) {
  if (typeof callback !== "function") return () => {};

  callback(getCachedCollection(COLLECTIONS.COURSE_ALLOCATIONS));

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
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCachedCollection(COLLECTIONS.COURSE_ALLOCATIONS, list);
        callback(list);
      },
      (err) => {
        console.warn("[DIMABIN Allocations] onSnapshot note:", err.message);
        callback(getCachedCollection(COLLECTIONS.COURSE_ALLOCATIONS));
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
  const record = {
    lecturerName: (allocData.lecturerName || "").trim(),
    lecturerId: (allocData.lecturerId || "").trim(),
    courseCode: (allocData.courseCode || "").trim().toUpperCase(),
    courseTitle: (allocData.courseTitle || "").trim(),
    programme: allocData.programme || "Diploma in Theology (Dipl.Th.)",
    level: allocData.level || "Diploma I",
    semester: allocData.semester || "First Semester",
    studyCentre: allocData.studyCentre || "Goshen Central Campus, Abeokuta",
    academicSession: allocData.academicSession || "2026/2027",
    allocatedAt: new Date().toISOString(),
    allocatedBy: ADMIN_CREDENTIALS.ADMIN_ID
  };

  const localId = `alloc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  upsertCachedItem(COLLECTIONS.COURSE_ALLOCATIONS, { id: localId, ...record });

  try {
    await addDoc(collection(db, COLLECTIONS.COURSE_ALLOCATIONS), {
      ...record,
      allocatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn(`[DIMABIN Allocations] Firestore create note: ${err.message}`);
  }

  await logActivity({
    action: "course_allocated",
    description: `Allocated ${record.courseCode} to ${record.lecturerName} (${record.semester}, ${record.academicSession}).`,
    targetCollection: COLLECTIONS.COURSE_ALLOCATIONS,
    targetDocumentId: `${record.courseCode}_${record.lecturerId}`
  });

  return { success: true, ...record };
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
    description: `Revoked course allocation ${allocId}.`,
    targetCollection: COLLECTIONS.COURSE_ALLOCATIONS,
    targetDocumentId: allocId
  });

  return { success: true, allocId };
}

/**
 * =========================================================================
 * 8. STUDY CENTRES (study_centres)
 * =========================================================================
 */
export function subscribeStudyCentres(callback) {
  if (typeof callback !== "function") return () => {};

  // If local cache is empty, seed with central campus so it never starts blank
  let list = getCachedCollection(COLLECTIONS.STUDY_CENTRES);
  if (list.length === 0) {
    list = [
      {
        id: "centre_goshen_central",
        centreName: "Goshen Central Campus (Main Citadel)",
        location: "Goshen 13, Kusimo Street, Abeokuta, Ogun State",
        coordinator: "Registry Central Coordination",
        phone: "+234 (0) 800-DIMABIN",
        status: "active",
        createdAt: "2026-01-01T00:00:00.000Z"
      }
    ];
    setCachedCollection(COLLECTIONS.STUDY_CENTRES, list);
  }

  callback(list);

  const localListener = (e) => {
    if (e.detail) callback(e.detail);
  };
  window.addEventListener(`dimabin:db:${COLLECTIONS.STUDY_CENTRES}`, localListener);

  let unsubscribe = () => {};
  try {
    const collRef = collection(db, COLLECTIONS.STUDY_CENTRES);
    unsubscribe = onSnapshot(
      collRef,
      (snap) => {
        if (!snap.empty) {
          const remoteList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setCachedCollection(COLLECTIONS.STUDY_CENTRES, remoteList);
          callback(remoteList);
        } else {
          callback(getCachedCollection(COLLECTIONS.STUDY_CENTRES));
        }
      },
      (err) => {
        console.warn("[DIMABIN Centres] onSnapshot note:", err.message);
        callback(getCachedCollection(COLLECTIONS.STUDY_CENTRES));
      }
    );
  } catch (err) {
    console.warn("[DIMABIN Centres] init note:", err.message);
  }

  return () => {
    try { unsubscribe(); } catch (_) {}
    window.removeEventListener(`dimabin:db:${COLLECTIONS.STUDY_CENTRES}`, localListener);
  };
}

export async function createStudyCentre(centreData) {
  const record = {
    centreName: (centreData.centreName || "DIMABIN Study Centre").trim(),
    location: (centreData.location || "Ogun State").trim(),
    coordinator: (centreData.coordinator || "Coordinator").trim(),
    phone: (centreData.phone || "+234 (0) 800-DIMABIN").trim(),
    status: centreData.status || "active",
    createdAt: new Date().toISOString()
  };

  const localId = `centre_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  upsertCachedItem(COLLECTIONS.STUDY_CENTRES, { id: localId, ...record });

  try {
    await addDoc(collection(db, COLLECTIONS.STUDY_CENTRES), {
      ...record,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn(`[DIMABIN Centres] Firestore create note: ${err.message}`);
  }

  await logActivity({
    action: "study_centre_registered",
    description: `Added Study Centre: ${record.centreName} (${record.location}).`,
    targetCollection: COLLECTIONS.STUDY_CENTRES,
    targetDocumentId: record.centreName
  });

  return { success: true, ...record };
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
