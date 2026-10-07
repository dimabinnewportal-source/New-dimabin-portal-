/**
 * DIMABIN STUDENT PORTAL — DASHBOARD CONTROLLER
 * Pure Vanilla JavaScript ES Module (Firebase Web SDK v12.19.0 CDN)
 *
 * Implements:
 * 1. Access Control verification on load (Firebase Auth + active student check)
 * 2. Real Firestore student profile retrieval (students/{uid} or users/{uid})
 * 3. Loading of student's personal published results
 * 4. Private student notifications (filtered by audience === "student")
 * 5. Navigation section switching
 * 6. Responsive mobile drawer controls
 * 7. Secure sign out
 */

import { auth, onAuthStateChange } from "./firebase-users.js";
import {
  getStudentProfile,
  studentLogout,
  STUDENT_SESSION_KEY
} from "./firebase-student-auth.js";
import {
  subscribeResults,
  subscribePortalNotifications,
  formatDateOnly
} from "./firebase-backend.js";

let activeStudentProfile = null;

/**
 * Navigate between dashboard sections
 */
export function navigateToSection(sectionId) {
  if (!sectionId) return;

  // 1. Hide all sections
  document.querySelectorAll(".student-section").forEach((sec) => {
    sec.classList.remove("active");
  });

  // 2. Show target section
  const target = document.getElementById(`section-${sectionId}`);
  if (target) {
    target.classList.add("active");
  } else {
    const fallback = document.getElementById("section-dashboard");
    if (fallback) fallback.classList.add("active");
  }

  // 3. Update sidebar active item
  document.querySelectorAll(".student-nav-item[data-section]").forEach((item) => {
    if (item.getAttribute("data-section") === sectionId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // 4. Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });

  // 5. Close mobile drawer
  closeMobileDrawer();
}

/**
 * Mobile Drawer Controls
 */
export function openMobileDrawer() {
  const sidebar = document.getElementById("student-sidebar");
  const overlay = document.getElementById("student-drawer-overlay");
  if (sidebar && overlay) {
    sidebar.classList.add("open");
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }
}

export function closeMobileDrawer() {
  const sidebar = document.getElementById("student-sidebar");
  const overlay = document.getElementById("student-drawer-overlay");
  if (sidebar && overlay) {
    sidebar.classList.remove("open");
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }
}

/**
 * Populate Profile Data into DOM
 */
function renderStudentProfile(profile) {
  activeStudentProfile = profile;
  const fullName = profile.fullName || "DIMABIN Student";
  const studentId = profile.studentId || profile.admissionNumber || "DIMABIN/STU/2026/001";
  const programme = profile.programme || "Diploma in Theology (Dipl.Th.)";
  const department = profile.department || "Theological Studies";
  const level = profile.level || "Diploma I";
  const session = profile.academicSession || "2026/2027";
  const studyCentre = profile.studyCentre || "Goshen Central Campus, Abeokuta";
  const email = profile.email || "";
  const phone = profile.phone || "N/A";
  const cgpa = profile.cgpa !== null && profile.cgpa !== undefined ? String(profile.cgpa) : "N/A";

  // Initials for avatar
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("") || "ST";

  // Top Header
  const headerAvatar = document.getElementById("header-student-avatar");
  const headerName = document.getElementById("header-student-name");
  const headerRole = document.getElementById("header-student-role");
  if (headerAvatar) headerAvatar.textContent = initials;
  if (headerName) headerName.textContent = fullName;
  if (headerRole) headerRole.textContent = `${level} · ${studentId}`;

  // Hero Card
  const heroAvatar = document.getElementById("hero-avatar");
  const heroName = document.getElementById("hero-student-name");
  const heroId = document.getElementById("hero-student-id");
  const heroLevel = document.getElementById("hero-student-level");
  const heroDept = document.getElementById("hero-student-department");
  const heroSession = document.getElementById("hero-student-session");
  const heroCgpa = document.getElementById("hero-cgpa-val");

  if (heroAvatar) heroAvatar.textContent = initials;
  if (heroName) heroName.textContent = fullName;
  if (heroId) heroId.textContent = studentId;
  if (heroLevel) heroLevel.textContent = `Level: ${level}`;
  if (heroDept) heroDept.textContent = `Department: ${department}`;
  if (heroSession) heroSession.textContent = `Session: ${session}`;
  if (heroCgpa) heroCgpa.textContent = cgpa;

  // Metric Cards
  const cardCgpa = document.getElementById("card-cgpa-val");
  const cardLevel = document.getElementById("card-level-val");
  if (cardCgpa) cardCgpa.textContent = cgpa;
  if (cardLevel) cardLevel.textContent = level;

  // Academic Snapshot
  const snapProg = document.getElementById("snap-programme");
  const snapDept = document.getElementById("snap-department");
  const snapCentre = document.getElementById("snap-study-centre");
  const snapEntry = document.getElementById("snap-entry-session");
  const snapGrad = document.getElementById("snap-graduation");

  if (snapProg) snapProg.textContent = programme;
  if (snapDept) snapDept.textContent = department;
  if (snapCentre) snapCentre.textContent = studyCentre;
  if (snapEntry) snapEntry.textContent = profile.entrySession || session;
  if (snapGrad) snapGrad.textContent = profile.projectedGraduation || "2028";

  // Full Profile Section
  const profFullname = document.getElementById("prof-fullname");
  const profId = document.getElementById("prof-student-id");
  const profEmail = document.getElementById("prof-email");
  const profPhone = document.getElementById("prof-phone");
  const profProg = document.getElementById("prof-programme");
  const profDept = document.getElementById("prof-department");
  const profLevel = document.getElementById("prof-level");
  const profCentre = document.getElementById("prof-study-centre");

  if (profFullname) profFullname.textContent = fullName;
  if (profId) profId.textContent = studentId;
  if (profEmail) profEmail.textContent = email;
  if (profPhone) profPhone.textContent = phone;
  if (profProg) profProg.textContent = programme;
  if (profDept) profDept.textContent = department;
  if (profLevel) profLevel.textContent = level;
  if (profCentre) profCentre.textContent = studyCentre;
}

/**
 * Connect Student Results from Firestore
 * Filter strictly by student identity (matricNumber or fullName)
 */
function initStudentResults(studentProfile) {
  const dashResultsTbody = document.getElementById("dash-latest-results-tbody");
  const allResultsTbody = document.getElementById("student-all-results-tbody");

  const studentReg = (studentProfile.studentId || studentProfile.admissionNumber || "").toUpperCase();
  const studentName = (studentProfile.fullName || "").toLowerCase();

  subscribeResults((rawResults) => {
    const list = rawResults || [];

    // Filter only results that are PUBLISHED / APPROVED and belong to THIS student
    const studentResults = list.filter((r) => {
      const isApproved = r.status === "approved" || r.status === "published";
      if (!isApproved) return false;

      const rMatric = (r.matricNumber || "").toUpperCase();
      const rName = (r.studentName || "").toLowerCase();

      return (
        (studentReg && rMatric === studentReg) ||
        (studentName && rName === studentName)
      );
    });

    const renderRow = (res) => `
      <tr>
        <td><strong>${res.courseCode || "THEO"}</strong></td>
        <td>${res.courseTitle || "Theological Study"}</td>
        <td><strong style="color: var(--student-navy);">${res.score !== undefined ? res.score : "N/A"}%</strong></td>
        <td><span class="status-pill-badge ${res.grade === "A" ? "badge-green" : res.grade === "B" ? "badge-blue" : "badge-gold"}">${res.grade || "N/A"}</span></td>
        <td>${res.semester || "First Semester"}</td>
        <td>${res.academicSession || "2026/2027"}</td>
      </tr>
    `;

    if (studentResults.length === 0) {
      const emptyHtml = `
        <tr>
          <td colspan="6">
            <div class="student-empty-box">
              <div class="student-empty-icon">📋</div>
              <div class="student-empty-text">No results have been published yet.</div>
              <div class="student-empty-sub">Verified scores will appear here once published by the Academic Registry.</div>
            </div>
          </td>
        </tr>
      `;
      if (dashResultsTbody) dashResultsTbody.innerHTML = emptyHtml;
      if (allResultsTbody) allResultsTbody.innerHTML = emptyHtml;
    } else {
      const rowsHtml = studentResults.map(renderRow).join("");
      if (dashResultsTbody) dashResultsTbody.innerHTML = studentResults.slice(0, 4).map(renderRow).join("");
      if (allResultsTbody) allResultsTbody.innerHTML = rowsHtml;
    }
  });
}

/**
 * Connect Private Student Notifications from Firestore (Audience: student only)
 */
function initStudentNotifications() {
  const notifContainer = document.getElementById("student-notifications-list");
  const notifDot = document.getElementById("header-notif-dot");

  subscribePortalNotifications((rawNotifs) => {
    const list = rawNotifs || [];

    // Only portal notifications marked for students or all
    const studentNotifs = list.filter((n) => {
      const aud = (n.audience || "student").toLowerCase();
      const isPublished = n.status === "published" || !n.status;
      return isPublished && (aud === "student" || aud === "all");
    });

    if (notifDot) {
      notifDot.style.display = studentNotifs.length > 0 ? "block" : "none";
    }

    if (notifContainer) {
      if (studentNotifs.length === 0) {
        notifContainer.innerHTML = `
          <div class="student-empty-box">
            <div class="student-empty-icon">🔔</div>
            <div class="student-empty-text">No student notifications at this moment.</div>
            <div class="student-empty-sub">Private notices, course announcements, and clearance memos will appear here.</div>
          </div>
        `;
      } else {
        notifContainer.innerHTML = studentNotifs
          .map((n) => `
            <div class="student-content-card" style="margin-bottom: 1rem; border-left: 4px solid var(--student-blue);">
              <div class="student-card-body" style="padding: 1.25rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
                  <span class="status-pill-badge ${n.priority === "urgent" || n.priority === "critical" ? "badge-red" : "badge-blue"}">
                    ${(n.priority || "NORMAL").toUpperCase()} NOTICE
                  </span>
                  <span style="font-size: 0.75rem; color: var(--student-text-muted);">
                    ${formatDateOnly(n.createdAt)}
                  </span>
                </div>
                <h4 style="font-size: 1rem; font-weight: 700; color: var(--student-navy); margin-bottom: 0.35rem;">
                  ${n.title || "Institutional Notice"}
                </h4>
                <p style="font-size: 0.84rem; color: var(--student-text-muted); line-height: 1.5;">
                  ${n.message || ""}
                </p>
              </div>
            </div>
          `)
          .join("");
      }
    }
  });
}

/**
 * Access Control Initialization
 */
export async function initStudentDashboard() {
  console.log("[DIMABIN Student Dashboard] Verifying authentication...");

  // 1. Check local session cache for immediate hydration
  let localSession = null;
  try {
    const raw = sessionStorage.getItem(STUDENT_SESSION_KEY) || localStorage.getItem(STUDENT_SESSION_KEY);
    if (raw) localSession = JSON.parse(raw);
  } catch (_) {}

  if (localSession) {
    renderStudentProfile(localSession);
  }

  // 2. Listen to real Firebase Authentication
  onAuthStateChange(async (user) => {
    if (!user) {
      console.warn("[DIMABIN Student Dashboard] No authenticated user detected. Redirecting to student-login.html...");
      sessionStorage.removeItem(STUDENT_SESSION_KEY);
      localStorage.removeItem(STUDENT_SESSION_KEY);
      window.location.href = "student-login.html";
      return;
    }

    try {
      console.log("[DIMABIN Student Dashboard] Firebase user authenticated:", user.email, "UID:", user.uid);
      const profile = await getStudentProfile(user.uid, user.email);

      if (!profile || profile.status === "disabled") {
        console.warn("[DIMABIN Student Dashboard] Account is not an active student.");
        alert("Access Denied: Your account is not authorized as an active DIMABIN student.");
        await studentLogout();
        return;
      }

      renderStudentProfile(profile);
      initStudentResults(profile);
      initStudentNotifications();
    } catch (err) {
      console.error("[DIMABIN Student Dashboard] Profile initialization error:", err);
    }
  });

  // 3. Navigation Listeners
  document.querySelectorAll(".student-nav-item[data-section]").forEach((item) => {
    item.addEventListener("click", () => {
      const sec = item.getAttribute("data-section");
      navigateToSection(sec);
    });
  });

  // 4. Mobile Drawer Triggers
  const menuToggle = document.getElementById("student-menu-toggle");
  const overlay = document.getElementById("student-drawer-overlay");
  if (menuToggle) menuToggle.addEventListener("click", openMobileDrawer);
  if (overlay) overlay.addEventListener("click", closeMobileDrawer);

  // 5. Logout Buttons
  const navLogout = document.getElementById("nav-logout-btn");
  const sidebarLogout = document.getElementById("sidebar-logout-btn");
  if (navLogout) navLogout.addEventListener("click", studentLogout);
  if (sidebarLogout) sidebarLogout.addEventListener("click", studentLogout);
}

// Global exposure for inline triggers
if (typeof window !== "undefined") {
  window.dimabinStudentPortal = {
    navigateToSection,
    openMobileDrawer,
    closeMobileDrawer,
    studentLogout
  };
}

// Auto-run on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initStudentDashboard);
} else {
  initStudentDashboard();
}
