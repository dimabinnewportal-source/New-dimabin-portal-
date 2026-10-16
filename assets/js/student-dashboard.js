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
  formatDateOnly,
  subscribeRegistrationSettings,
  getRegistrationSettings,
  subscribeCourses,
  subscribeCourseAllocations,
  subscribeCourseRegistrations,
  submitStudentCourseRegistration,
  subscribeCbtAssessments,
  subscribeCbtSubmissions,
  startCbtAttempt,
  saveCbtProgress,
  submitCbtAttempt,
  subscribeActiveAcademicSession,
  getActiveAcademicSession
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
  const activeSessData = getActiveAcademicSession();
  const session = activeSessData?.currentSession || profile.academicSession || "2026/2027";
  const studyCentre = profile.studyCentre || "Official Study Centre";
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
  const headerActiveSession = document.getElementById("header-active-session");
  if (headerActiveSession) headerActiveSession.textContent = `${session} ACADEMIC SESSION`;
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
 * Supports:
 * 1. Official Approved Semester Examination Results (100 Marks: CA 30 + Exam 70)
 * 2. Lecturer-Published Continuous Assessment (CA) Breakdown (30 Marks: CBT 10, Attendance 5, Assignment 5, Practical 10)
 * 3. Real-time GPA & Credit Unit computations
 */
function initStudentResults(studentProfile) {
  const dashResultsTbody = document.getElementById("dash-latest-results-tbody");
  const allResultsTbody = document.getElementById("student-all-results-tbody");
  const caBreakdownTbody = document.getElementById("student-ca-breakdown-tbody");

  // GPA Elements
  const gpaUnitsTotal = document.getElementById("stu-gpa-units-total");
  const gpaUnitsPassed = document.getElementById("stu-gpa-units-passed");
  const gpaVal = document.getElementById("stu-gpa-val");
  const gpaStanding = document.getElementById("stu-academic-standing");

  // Printable Slip Elements
  const printName = document.getElementById("print-res-name");
  const printMatric = document.getElementById("print-res-matric");
  const printProg = document.getElementById("print-res-programme");
  const printCentre = document.getElementById("print-res-centre");

  if (printName) printName.textContent = studentProfile.fullName || "-";
  if (printMatric) printMatric.textContent = studentProfile.studentId || studentProfile.admissionNumber || "-";
  if (printProg) printProg.textContent = studentProfile.programme || "-";
  if (printCentre) printCentre.textContent = studentProfile.studyCentre || "-";

  // Tab Switcher
  const btnTabExam = document.getElementById("btn-stu-tab-exam");
  const btnTabCa = document.getElementById("btn-stu-tab-ca");
  const paneExam = document.getElementById("stu-pane-exam");
  const paneCa = document.getElementById("stu-pane-ca");

  if (btnTabExam && btnTabCa) {
    btnTabExam.onclick = () => {
      btnTabExam.style.background = "var(--student-blue)";
      btnTabExam.style.color = "#FFFFFF";
      btnTabExam.style.border = "none";
      btnTabCa.style.background = "#FFFFFF";
      btnTabCa.style.color = "var(--student-navy)";
      btnTabCa.style.border = "1px solid var(--student-border)";
      if (paneExam) paneExam.style.display = "block";
      if (paneCa) paneCa.style.display = "none";
    };

    btnTabCa.onclick = () => {
      btnTabCa.style.background = "var(--student-blue)";
      btnTabCa.style.color = "#FFFFFF";
      btnTabCa.style.border = "none";
      btnTabExam.style.background = "#FFFFFF";
      btnTabExam.style.color = "var(--student-navy)";
      btnTabExam.style.border = "1px solid var(--student-border)";
      if (paneExam) paneExam.style.display = "none";
      if (paneCa) paneCa.style.display = "block";
    };
  }

  const studentReg = (studentProfile.studentId || studentProfile.admissionNumber || "").trim().toUpperCase();
  const studentName = (studentProfile.fullName || "").trim().toLowerCase();

  subscribeResults((rawResults) => {
    const list = rawResults || [];

    // Filter all records for this specific student
    const myAllRecords = list.filter((r) => {
      const rMatric = (r.matricNumber || "").trim().toUpperCase();
      const rName = (r.studentName || "").trim().toLowerCase();
      return (
        (studentReg && rMatric === studentReg) ||
        (studentName && rName === studentName)
      );
    });

    // 1. Official Semester Results (Must be approved / published by Admin)
    const officialResults = myAllRecords.filter((r) => {
      return r.status === "approved" || r.status === "published";
    });

    // 2. Continuous Assessment (CA) records (Published directly by Lecturer)
    const publishedCaRecords = myAllRecords.filter((r) => {
      return r.caPublished === true || r.caStatus === "published";
    });

    // Compute GPA and Units from official results
    let totalUnits = 0;
    let passedUnits = 0;
    let totalQualityPoints = 0;

    officialResults.forEach((res) => {
      const units = parseInt(res.creditUnits, 10) || 3;
      const gp = parseFloat(res.gradePoint !== undefined ? res.gradePoint : (res.gp || 0));
      totalUnits += units;
      totalQualityPoints += units * gp;
      if (gp > 0) passedUnits += units;
    });

    const calculatedGpa = totalUnits > 0 ? (totalQualityPoints / totalUnits).toFixed(2) : "0.00";

    if (gpaUnitsTotal) gpaUnitsTotal.textContent = totalUnits;
    if (gpaUnitsPassed) gpaUnitsPassed.textContent = passedUnits;
    if (gpaVal) gpaVal.textContent = calculatedGpa;

    if (gpaStanding) {
      const gpaNum = parseFloat(calculatedGpa);
      if (gpaNum >= 4.5) {
        gpaStanding.className = "status-pill-badge badge-green";
        gpaStanding.textContent = "ACADEMIC STANDING: FIRST CLASS HONOURS / DISTINCTION";
      } else if (gpaNum >= 3.5) {
        gpaStanding.className = "status-pill-badge badge-green";
        gpaStanding.textContent = "ACADEMIC STANDING: SECOND CLASS UPPER / EXCELLENT";
      } else if (gpaNum >= 2.4) {
        gpaStanding.className = "status-pill-badge badge-blue";
        gpaStanding.textContent = "ACADEMIC STANDING: GOOD STANDING";
      } else if (gpaNum > 0) {
        gpaStanding.className = "status-pill-badge badge-gold";
        gpaStanding.textContent = "ACADEMIC STANDING: PASS / ACADEMIC ADVISORY";
      } else {
        gpaStanding.className = "status-pill-badge badge-blue";
        gpaStanding.textContent = "ACADEMIC STANDING: IN PROGRESS";
      }
    }

    // Render Official Semester Examination Results Table
    if (officialResults.length === 0) {
      const emptyHtml = `
        <tr>
          <td colspan="9">
            <div class="student-empty-box">
              <div class="student-empty-icon">📋</div>
              <div class="student-empty-text">No final results have been approved yet.</div>
              <div class="student-empty-sub">Verified semester scores will appear here once approved by the Academic Registry. Check the CA Breakdown tab to see continuous assessment marks published by lecturers.</div>
            </div>
          </td>
        </tr>
      `;
      if (allResultsTbody) allResultsTbody.innerHTML = emptyHtml;
      if (dashResultsTbody) {
        dashResultsTbody.innerHTML = `
          <tr>
            <td colspan="6">
              <div class="student-empty-box">
                <div class="student-empty-icon">📋</div>
                <div class="student-empty-text">No final results published yet.</div>
                <div class="student-empty-sub">Approved examination grades will be posted here.</div>
              </div>
            </td>
          </tr>
        `;
      }
    } else {
      if (allResultsTbody) {
        allResultsTbody.innerHTML = officialResults.map((res) => {
          const ca = res.caScore !== undefined ? res.caScore : 0;
          const exam = res.examScore !== undefined ? res.examScore : 0;
          const total = res.score !== undefined ? res.score : (ca + exam);
          const units = res.creditUnits !== undefined ? res.creditUnits : 3;
          const grade = res.grade || "—";
          const gp = res.gradePoint !== undefined ? res.gradePoint : "—";
          const remarks = res.remarks || (total >= 40 ? "Pass" : "Fail");

          const gradeBadgeClass =
            grade === "A" ? "badge-green" :
            grade === "B" ? "badge-blue" :
            grade === "C" ? "badge-blue" :
            grade === "D" ? "badge-gold" :
            grade === "E" ? "badge-gold" : "badge-red";

          return `
            <tr>
              <td><strong style="color: var(--student-navy); font-family: monospace;">${res.courseCode || "THEO"}</strong></td>
              <td>${res.courseTitle || "Theological Study"}</td>
              <td style="text-align: center; font-weight: 700;">${units}</td>
              <td style="text-align: center; color: #15803D; font-weight: 700;">${ca}/30</td>
              <td style="text-align: center; color: var(--student-blue); font-weight: 700;">${exam}/70</td>
              <td style="text-align: center; font-weight: 800; font-size: 0.95rem; color: var(--student-navy);">${total}%</td>
              <td style="text-align: center;"><span class="status-pill-badge ${gradeBadgeClass}">${grade}</span></td>
              <td style="text-align: center; font-weight: 700; color: var(--student-navy);">${gp}</td>
              <td style="font-size: 0.8125rem; color: var(--student-text-muted);">${remarks}</td>
            </tr>
          `;
        }).join("");
      }

      if (dashResultsTbody) {
        dashResultsTbody.innerHTML = officialResults.slice(0, 4).map((res) => `
          <tr>
            <td><strong>${res.courseCode || "THEO"}</strong></td>
            <td>${res.courseTitle || "Theological Study"}</td>
            <td><strong style="color: var(--student-navy);">${res.score !== undefined ? res.score : "N/A"}%</strong></td>
            <td><span class="status-pill-badge ${res.grade === "A" ? "badge-green" : res.grade === "B" ? "badge-blue" : "badge-gold"}">${res.grade || "N/A"}</span></td>
            <td>${res.semester || "First Semester"}</td>
            <td>${res.academicSession || "2026/2027"}</td>
          </tr>
        `).join("");
      }
    }

    // Render Continuous Assessment (CA) Breakdown Table
    if (caBreakdownTbody) {
      if (publishedCaRecords.length === 0) {
        caBreakdownTbody.innerHTML = `
          <tr>
            <td colspan="9">
              <div class="student-empty-box">
                <div class="student-empty-icon">📝</div>
                <div class="student-empty-text">No Continuous Assessment Published Yet</div>
                <div class="student-empty-sub">When your course lecturers publish Continuous Assessment marks (CBT, Attendance, Assignments, Practicals), they will appear here immediately.</div>
              </div>
            </td>
          </tr>
        `;
      } else {
        caBreakdownTbody.innerHTML = publishedCaRecords.map((res) => {
          const cbt = res.cbtScore !== undefined ? res.cbtScore : 0;
          const att = res.attendanceScore !== undefined ? res.attendanceScore : 0;
          const ass = res.assignmentScore !== undefined ? res.assignmentScore : 0;
          const prac = res.practicalScore !== undefined ? res.practicalScore : 0;
          const totalCa = res.caScore !== undefined ? res.caScore : (cbt + att + ass + prac);
          const lecturer = res.lecturerName || "Course Faculty";

          return `
            <tr>
              <td><strong style="color: var(--student-navy); font-family: monospace;">${res.courseCode || "THEO"}</strong></td>
              <td>${res.courseTitle || "Theological Study"}</td>
              <td style="font-size: 0.8125rem; color: var(--student-text-muted);">${lecturer}</td>
              <td style="text-align: center; font-weight: 700; color: var(--student-blue);">${cbt}/10</td>
              <td style="text-align: center; font-weight: 700; color: var(--student-blue);">${att}/5</td>
              <td style="text-align: center; font-weight: 700; color: var(--student-blue);">${ass}/5</td>
              <td style="text-align: center; font-weight: 700; color: var(--student-blue);">${prac}/10</td>
              <td style="text-align: center; font-weight: 800; font-size: 1rem; color: #15803D;">${totalCa}/30</td>
              <td style="text-align: center;">
                <span class="status-pill-badge badge-green">✓ Published by Lecturer</span>
              </td>
            </tr>
          `;
        }).join("");
      }
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
 * Real-Time Student Course Registration Controller
 * Full 3-Semester Workflow with Central Registration Window & Multi-Centre Independence
 */
function initStudentCourseRegistration(studentProfile, userUid) {
  if (!studentProfile) return;

  const uid = userUid || studentProfile.uid || studentProfile.id;
  const session = (studentProfile.academicSession || "2026/2027").trim();
  const studentCentre = (studentProfile.studyCentre || "Abeokuta Main Campus").trim();
  let activeSemester = "First Semester";
  let isEditingExisting = false;

  // Data cache
  let regSettingsList = [];
  let coursesList = [];
  let allocationsList = [];
  let registrationsList = [];

  // DOM Elements
  const cardTitle = document.getElementById("student-reg-card-title");
  const centreBadge = document.getElementById("student-reg-centre-badge");
  const sessionBadge = document.getElementById("student-reg-session-badge");
  const liveStatusBadge = document.getElementById("student-reg-live-status-badge");

  const closedPane = document.getElementById("student-reg-closed-pane");
  const closedHeading = document.getElementById("student-reg-closed-heading");
  const closedMessage = document.getElementById("student-reg-closed-message");

  const formPane = document.getElementById("student-reg-form-pane");
  const openSemText = document.getElementById("student-reg-open-sem-text");
  const selectedCountEl = document.getElementById("student-selected-courses-count");
  const selectedCreditsEl = document.getElementById("student-selected-credits-count");
  const maxCreditsLimitEl = document.getElementById("student-max-credits-limit");
  const selectAllBtn = document.getElementById("btn-student-select-all");
  const clearAllBtn = document.getElementById("btn-student-clear-all");
  const coursesTbody = document.getElementById("student-courses-tbody");
  const coursesTable = document.getElementById("student-courses-select-table");
  const noCoursesEmpty = document.getElementById("student-no-courses-available");
  const submitErrorEl = document.getElementById("student-submit-error");
  const submitBtn = document.getElementById("btn-submit-course-reg");
  const submitBtnText = document.getElementById("btn-submit-course-reg-text");

  const slipPane = document.getElementById("student-reg-slip-pane");
  const slipName = document.getElementById("slip-student-name");
  const slipId = document.getElementById("slip-student-id");
  const slipCentre = document.getElementById("slip-study-centre");
  const slipProg = document.getElementById("slip-programme");
  const slipTerm = document.getElementById("slip-term");
  const slipStatus = document.getElementById("slip-status-badge");
  const slipCoursesTbody = document.getElementById("slip-courses-tbody");
  const slipTotalUnits = document.getElementById("slip-total-units");
  const slipDate = document.getElementById("slip-submitted-date");
  const slipRemarks = document.getElementById("slip-remarks-note");
  const modifyBtn = document.getElementById("btn-modify-reg-selection");

  // Ledger Elements
  const ledgerTbody = document.getElementById("student-ledger-tbody");
  const ledgerPill = document.getElementById("ledger-total-credits-pill");

  if (centreBadge) centreBadge.textContent = studentCentre;
  if (sessionBadge) sessionBadge.textContent = session;

  function updateSelectedCount() {
    if (!coursesTbody) return;
    const checkedBoxes = coursesTbody.querySelectorAll(".course-reg-checkbox:checked");
    let count = 0;
    let units = 0;
    checkedBoxes.forEach((cb) => {
      count++;
      units += parseInt(cb.getAttribute("data-credits") || 3, 10);
    });
    if (selectedCountEl) selectedCountEl.textContent = count;
    if (selectedCreditsEl) selectedCreditsEl.textContent = units;

    if (submitErrorEl) {
      const setting = getRegistrationSettings(session, activeSemester);
      if (setting.maxCredits && units > setting.maxCredits) {
        submitErrorEl.textContent = `Warning: Selected units (${units}) exceeds the recommended maximum of ${setting.maxCredits} units.`;
        submitErrorEl.style.display = "block";
      } else {
        submitErrorEl.style.display = "none";
      }
    }
  }

  function renderView() {
    if (cardTitle) {
      cardTitle.textContent = `Institutional Course Registration — ${activeSemester} ${session}`;
    }

    // 1. Check if student already has a registration for (activeSemester, session)
    const currentReg = registrationsList.find((r) => {
      const isUser = r.studentUid === uid || r.userId === uid || (studentProfile.studentId && (r.studentId === studentProfile.studentId || r.admissionNumber === studentProfile.studentId));
      const matchSess = (r.academicSession || "2026/2027").trim() === session;
      const matchSem = (r.semester || "First Semester").trim() === activeSemester;
      return isUser && matchSess && matchSem;
    });

    // Authoritative registration setting for this session and semester
    const setting = getRegistrationSettings(session, activeSemester);
    const isOpen = Boolean(setting.isOpen);

    if (currentReg && !isEditingExisting) {
      // Show Slip Pane
      if (closedPane) closedPane.style.display = "none";
      if (formPane) formPane.style.display = "none";
      if (slipPane) slipPane.style.display = "block";

      const regStatus = currentReg.status || "submitted";
      let statusBadgeClass = "badge-blue";
      let statusLabel = "SUBMITTED TO REGISTRY";
      if (regStatus === "approved") {
        statusBadgeClass = "badge-green";
        statusLabel = "REGISTRATION APPROVED";
      } else if (regStatus === "returned") {
        statusBadgeClass = "badge-gold";
        statusLabel = "RETURNED FOR CORRECTION";
      } else if (regStatus === "rejected") {
        statusBadgeClass = "badge-red";
        statusLabel = "REGISTRATION REJECTED";
      } else if (regStatus === "resubmitted") {
        statusBadgeClass = "badge-blue";
        statusLabel = "RESUBMITTED TO REGISTRY";
      }

      if (liveStatusBadge) {
        liveStatusBadge.textContent = `● ${statusLabel}`;
        liveStatusBadge.className = `status-pill-badge ${statusBadgeClass}`;
      }

      if (slipName) slipName.textContent = currentReg.studentName || studentProfile.fullName || "DIMABIN Student";
      if (slipId) slipId.textContent = currentReg.studentId || currentReg.admissionNumber || studentProfile.studentId || "N/A";
      if (slipCentre) slipCentre.textContent = currentReg.studyCentre || studentCentre;
      if (slipProg) slipProg.textContent = currentReg.programme || studentProfile.programme || "Diploma in Theology (Dipl.Th.)";
      if (slipTerm) slipTerm.textContent = `${currentReg.semester} (${currentReg.academicSession})`;
      if (slipStatus) {
        slipStatus.innerHTML = `<span class="status-pill-badge ${statusBadgeClass}">${statusLabel}</span>`;
      }
      if (slipTotalUnits) slipTotalUnits.textContent = `${currentReg.totalCredits || 0} Units`;
      if (slipDate) slipDate.textContent = formatDateOnly(currentReg.submittedAt || currentReg.updatedAt || new Date().toISOString());
      if (slipRemarks) {
        slipRemarks.textContent = currentReg.reviewNotes ? `Registry Note: ${currentReg.reviewNotes}` : "";
      }

      if (slipCoursesTbody) {
        const courses = Array.isArray(currentReg.courses) ? currentReg.courses : [];
        if (courses.length === 0) {
          slipCoursesTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--student-text-muted);">No enrolled courses recorded.</td></tr>`;
        } else {
          slipCoursesTbody.innerHTML = courses
            .map((c) => `
              <tr>
                <td><strong style="color: var(--student-blue);">${c.courseCode}</strong></td>
                <td><strong>${c.courseTitle}</strong></td>
                <td style="text-align: center;"><span class="status-pill-badge badge-blue">${c.creditUnits} Units</span></td>
                <td>${c.lecturerName || "To be announced (TBA)"}</td>
              </tr>
            `)
            .join("");
        }
      }

      // Configure modify button
      if (modifyBtn) {
        if (regStatus === "approved") {
          modifyBtn.style.display = "none";
        } else {
          modifyBtn.style.display = "inline-flex";
          modifyBtn.onclick = () => {
            isEditingExisting = true;
            renderView();
          };
        }
      }

    } else {
      // Student has NOT registered (or is actively editing)
      if (slipPane) slipPane.style.display = "none";

      if (!isOpen) {
        // Closed state
        if (formPane) formPane.style.display = "none";
        if (closedPane) closedPane.style.display = "block";

        if (liveStatusBadge) {
          liveStatusBadge.textContent = "● REGISTRATION CLOSED";
          liveStatusBadge.className = "status-pill-badge badge-gold";
        }

        if (closedHeading) {
          closedHeading.textContent = `Course Registration Closed for ${activeSemester}`;
        }
        if (closedMessage) {
          closedMessage.textContent =
            setting.notes ||
            `Course registration is currently closed for your academic session and semester. Please check the academic calendar or contact the administration.`;
        }

      } else {
        // Open state
        if (closedPane) closedPane.style.display = "none";
        if (formPane) formPane.style.display = "block";

        if (liveStatusBadge) {
          liveStatusBadge.textContent = "● REGISTRATION OPEN";
          liveStatusBadge.className = "status-pill-badge badge-green";
        }

        if (openSemText) openSemText.textContent = `${activeSemester} (${session})`;
        if (maxCreditsLimitEl) maxCreditsLimitEl.textContent = setting.maxCredits || 24;

        // Central courses for this session & semester
        const eligibleCourses = coursesList.filter((c) => {
          const matchSess = (c.academicSession || "2026/2027").trim() === session;
          const matchSem = (c.semester || "First Semester").trim() === activeSemester;
          const isActive = c.status !== "inactive";
          return matchSess && matchSem && isActive;
        });

        if (eligibleCourses.length === 0) {
          if (coursesTable) coursesTable.style.display = "none";
          if (noCoursesEmpty) noCoursesEmpty.style.display = "block";
          if (submitBtn) submitBtn.style.display = "none";
        } else {
          if (coursesTable) coursesTable.style.display = "table";
          if (noCoursesEmpty) noCoursesEmpty.style.display = "none";
          if (submitBtn) submitBtn.style.display = "inline-flex";

          const previouslyRegisteredIds = currentReg && Array.isArray(currentReg.courseIds)
            ? currentReg.courseIds
            : [];

          if (coursesTbody) {
            coursesTbody.innerHTML = eligibleCourses
              .map((c) => {
                const normCode = (c.courseCode || "").trim().toUpperCase();
                // Check allocation for student's study centre, then central
                const centreAlloc = allocationsList.find((a) => {
                  const matchCode = (a.courseCode || "").trim().toUpperCase() === normCode || a.courseId === c.id;
                  const matchSem = a.semester === activeSemester;
                  const matchSess = (a.academicSession || "2026/2027").trim() === session;
                  const matchCentre = (a.studyCentre || "").trim().toLowerCase() === studentCentre.toLowerCase();
                  return matchCode && matchSem && matchSess && matchCentre && a.status !== "ended";
                });

                const generalAlloc = allocationsList.find((a) => {
                  const matchCode = (a.courseCode || "").trim().toUpperCase() === normCode || a.courseId === c.id;
                  const matchSem = a.semester === activeSemester;
                  const matchSess = (a.academicSession || "2026/2027").trim() === session;
                  return matchCode && matchSem && matchSess && a.status !== "ended";
                });

                const alloc = centreAlloc || generalAlloc;
                const lecturerName = alloc
                  ? alloc.lecturerName
                  : (c.lecturerName || "To be announced (TBA)");

                const isChecked = previouslyRegisteredIds.includes(c.id) || previouslyRegisteredIds.length === 0;

                return `
                  <tr>
                    <td style="text-align: center;">
                      <input type="checkbox" class="course-reg-checkbox" value="${c.id}" data-credits="${c.creditUnits || c.creditUnit || 3}" ${isChecked ? "checked" : ""} style="width: 18px; height: 18px; cursor: pointer;">
                    </td>
                    <td><strong style="color: var(--student-navy);">${c.courseCode}</strong></td>
                    <td>
                      <div style="font-weight: 700; color: var(--student-navy);">${c.title || c.courseTitle}</div>
                      ${c.description ? `<div style="font-size: 0.75rem; color: var(--student-text-muted);">${c.description}</div>` : ""}
                    </td>
                    <td><span class="status-pill-badge badge-blue">${c.creditUnits || c.creditUnit || 3} Units</span></td>
                    <td><span style="font-size: 0.8125rem; font-weight: 600;">${lecturerName}</span></td>
                    <td><span style="font-size: 0.78rem; color: var(--student-text-muted);">${c.department || "Biblical Studies"}</span></td>
                  </tr>
                `;
              })
              .join("");

            // Add checkbox event listeners
            coursesTbody.querySelectorAll(".course-reg-checkbox").forEach((cb) => {
              cb.addEventListener("change", updateSelectedCount);
            });

            updateSelectedCount();
          }
        }
      }
    }

    renderLedger();
  }

  function renderLedger() {
    if (!ledgerTbody) return;

    // Find all student's registrations across all semesters
    const myRegs = registrationsList.filter((r) => {
      return r.studentUid === uid || r.userId === uid || (studentProfile.studentId && (r.studentId === studentProfile.studentId || r.admissionNumber === studentProfile.studentId));
    });

    let allRegisteredCourses = [];
    myRegs.forEach((r) => {
      if (Array.isArray(r.courses)) {
        r.courses.forEach((c) => {
          allRegisteredCourses.push({
            ...c,
            semester: r.semester,
            academicSession: r.academicSession,
            status: r.status
          });
        });
      }
    });

    if (allRegisteredCourses.length === 0) {
      ledgerTbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="student-empty-box">
              <div class="student-empty-icon">📑</div>
              <div class="student-empty-text">Zero records in current ledger.</div>
              <div class="student-empty-sub">Registered courses will appear here once submitted.</div>
            </div>
          </td>
        </tr>
      `;
      if (ledgerPill) ledgerPill.textContent = "0 Total Units";
      return;
    }

    const totalLedgerUnits = allRegisteredCourses.reduce((acc, c) => acc + (parseInt(c.creditUnits, 10) || 0), 0);
    if (ledgerPill) ledgerPill.textContent = `${totalLedgerUnits} Total Units`;

    ledgerTbody.innerHTML = allRegisteredCourses
      .map((c) => `
        <tr>
          <td><strong style="color: var(--student-blue);">${c.courseCode}</strong></td>
          <td><strong>${c.courseTitle}</strong></td>
          <td><span class="status-pill-badge badge-blue">${c.creditUnits} Units</span></td>
          <td>${c.semester}</td>
          <td>${c.academicSession}</td>
          <td>${c.lecturerName || "To be announced (TBA)"}</td>
          <td>
            <span class="status-pill-badge ${c.status === "approved" ? "badge-green" : "badge-blue"}">
              ${(c.status || "SUBMITTED").toUpperCase()}
            </span>
          </td>
        </tr>
      `)
      .join("");
  }

  // Semester Switcher Tabs
  document.querySelectorAll(".student-sem-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const sem = tab.getAttribute("data-sem");
      if (!sem) return;
      activeSemester = sem;
      isEditingExisting = false;

      document.querySelectorAll(".student-sem-tab").forEach((t) => {
        if (t === tab) {
          t.classList.add("active");
          t.style.background = "var(--student-blue)";
          t.style.color = "#fff";
          t.style.borderColor = "var(--student-blue)";
        } else {
          t.classList.remove("active");
          t.style.background = "#fff";
          t.style.color = "#475569";
          t.style.borderColor = "#CBD5E1";
        }
      });

      renderView();
    });
  });

  // Select All & Clear All Buttons
  if (selectAllBtn) {
    selectAllBtn.addEventListener("click", () => {
      if (!coursesTbody) return;
      coursesTbody.querySelectorAll(".course-reg-checkbox").forEach((cb) => {
        cb.checked = true;
      });
      updateSelectedCount();
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      if (!coursesTbody) return;
      coursesTbody.querySelectorAll(".course-reg-checkbox").forEach((cb) => {
        cb.checked = false;
      });
      updateSelectedCount();
    });
  }

  // Submit Course Registration Button
  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      if (!coursesTbody) return;
      const checkedBoxes = Array.from(coursesTbody.querySelectorAll(".course-reg-checkbox:checked"));
      const selectedIds = checkedBoxes.map((cb) => cb.value);

      if (selectedIds.length === 0) {
        if (submitErrorEl) {
          submitErrorEl.textContent = "Please select at least one course to complete your registration.";
          submitErrorEl.style.display = "block";
        }
        alert("Please select at least one course before submitting.");
        return;
      }

      submitBtn.disabled = true;
      if (submitBtnText) submitBtnText.textContent = "Submitting Registration to Registry...";
      if (submitErrorEl) submitErrorEl.style.display = "none";

      try {
        await submitStudentCourseRegistration({
          studentUid: uid,
          studentProfile,
          academicSession: session,
          semester: activeSemester,
          selectedCourseIds: selectedIds
        });

        isEditingExisting = false;
        alert("Your course registration has been submitted successfully to the Academic Registry!");
        renderView();
      } catch (err) {
        console.error("[DIMABIN Registration Error]:", err);
        if (submitErrorEl) {
          submitErrorEl.textContent = `Submission Error: ${err.message}`;
          submitErrorEl.style.display = "block";
        }
        alert(`Failed to submit course registration: ${err.message}`);
      } finally {
        submitBtn.disabled = false;
        if (submitBtnText) submitBtnText.textContent = "CONFIRM & SUBMIT COURSE REGISTRATION";
      }
    });
  }

  // Real-time Subscriptions
  subscribeRegistrationSettings((settings) => {
    regSettingsList = settings || [];
    renderView();
  });

  subscribeCourses((courses) => {
    coursesList = courses || [];
    renderView();
  });

  subscribeCourseAllocations((allocs) => {
    allocationsList = allocs || [];
    renderView();
  });

  subscribeCourseRegistrations((regs) => {
    registrationsList = regs || [];
    renderView();
  });
}

/**
 * =============================================================================
 * STUDENT COMPUTER-BASED TEST (CBT) EXAMINATION ENGINE CONTROLLER
 * =============================================================================
 */
export function initStudentCbt(studentProfile, uid) {
  if (!studentProfile) return;

  const studentName = studentProfile.fullName || studentProfile.name || "Student Candidate";
  const matricNumber = (studentProfile.matricNumber || studentProfile.admissionNumber || studentProfile.studentId || "").trim().toUpperCase();
  const studyCentre = studentProfile.studyCentre || "Main Campus";
  const programme = studentProfile.programme || "Diploma in Theology";

  // DOM Elements
  const countActiveEl = document.getElementById("stu-cbt-count-active");
  const countUpcomingEl = document.getElementById("stu-cbt-count-upcoming");
  const countCompletedEl = document.getElementById("stu-cbt-count-completed");
  const avgScoreEl = document.getElementById("stu-cbt-avg-score");
  const cardsContainer = document.getElementById("stu-cbt-cards-container");
  const searchInput = document.getElementById("stu-cbt-search");
  const courseFilter = document.getElementById("stu-cbt-course-filter");
  const typeFilter = document.getElementById("stu-cbt-type-filter");
  const statusTabs = document.querySelectorAll(".stu-cbt-tab-btn");

  // Briefing Modal Elements
  const modalBriefing = document.getElementById("modal-stu-cbt-briefing");
  const briefingTitle = document.getElementById("briefing-test-title");
  const briefingTypePill = document.getElementById("briefing-type-pill");
  const briefingCourseMeta = document.getElementById("briefing-course-meta");
  const briefingDuration = document.getElementById("briefing-duration");
  const briefingQCount = document.getElementById("briefing-questions-count");
  const briefingTotalMarks = document.getElementById("briefing-total-marks");
  const briefingAttempts = document.getElementById("briefing-allowed-attempts");
  const briefingHonorCheck = document.getElementById("cbt-briefing-honor-check");
  const btnLaunchExam = document.getElementById("btn-launch-cbt-exam");
  const btnCloseBriefing = document.getElementById("btn-close-briefing");
  const btnCancelBriefing = document.getElementById("btn-cancel-briefing");

  // Runner Overlay Elements
  const runnerOverlay = document.getElementById("modal-stu-cbt-runner");
  const runnerCourseBadge = document.getElementById("runner-course-badge");
  const runnerTitle = document.getElementById("runner-assessment-title");
  const timerBox = document.getElementById("stu-exam-timer-box");
  const timerDisplay = document.getElementById("stu-exam-timer-display");
  const candidateNameBadge = document.getElementById("runner-candidate-name");
  const candidateMatricBadge = document.getElementById("runner-candidate-matric");
  const cheatAlertBanner = document.getElementById("stu-exam-cheat-alert");
  const cheatViolationCountEl = document.getElementById("cheat-violation-count");

  // Question Runner Elements
  const qNumBadge = document.getElementById("runner-q-num-badge");
  const qTypeBadge = document.getElementById("runner-q-type-badge");
  const qMarksBadge = document.getElementById("runner-q-marks-badge");
  const saveIndicator = document.getElementById("runner-save-indicator");
  const questionTextEl = document.getElementById("stu-exam-question-text");
  const optionsContainer = document.getElementById("stu-exam-options-container");
  const prevQBtn = document.getElementById("btn-exam-prev-q");
  const nextQBtn = document.getElementById("btn-exam-next-q");
  const clearQBtn = document.getElementById("btn-exam-clear-q");
  const flagQBtn = document.getElementById("btn-exam-flag-q");
  const finishExamBtn = document.getElementById("btn-finish-cbt-exam");
  const sidebarSubmitBtn = document.getElementById("btn-sidebar-submit-cbt");

  // Palette Elements
  const paletteGrid = document.getElementById("stu-exam-palette-grid");
  const paletteCountAnswered = document.getElementById("palette-count-answered");
  const paletteCountUnanswered = document.getElementById("palette-count-unanswered");
  const paletteCountFlagged = document.getElementById("palette-count-flagged");

  // Confirm Submit Modal
  const modalConfirm = document.getElementById("modal-stu-cbt-confirm-submit");
  const confirmSummaryText = document.getElementById("submit-confirm-summary-text");
  const confirmUnansweredWarn = document.getElementById("submit-unanswered-warning");
  const btnBackToExam = document.getElementById("btn-back-to-exam");
  const btnFinalConfirm = document.getElementById("btn-final-confirm-submit");

  // Receipt Modal
  const modalReceipt = document.getElementById("modal-stu-cbt-receipt");
  const receiptCandidateName = document.getElementById("receipt-candidate-name");
  const receiptMatric = document.getElementById("receipt-matric-number");
  const receiptCourse = document.getElementById("receipt-course-code");
  const receiptTimestamp = document.getElementById("receipt-timestamp");
  const receiptAttemptId = document.getElementById("receipt-attempt-id");
  const receiptScoreContainer = document.getElementById("receipt-score-container");
  const receiptTotalScore = document.getElementById("receipt-total-score");
  const receiptPercentage = document.getElementById("receipt-percentage-badge");
  const receiptGrade = document.getElementById("receipt-grade-badge");
  const receiptPassFail = document.getElementById("receipt-passfail-badge");
  const receiptTheoryNotice = document.getElementById("receipt-theory-notice");
  const btnCloseReceipt = document.getElementById("btn-close-cbt-receipt");

  // Review Modal
  const modalReview = document.getElementById("modal-stu-cbt-review");
  const reviewTestType = document.getElementById("review-test-type");
  const reviewTestTitle = document.getElementById("review-test-title");
  const reviewTestMeta = document.getElementById("review-test-meta");
  const reviewScore = document.getElementById("review-summary-score");
  const reviewPercent = document.getElementById("review-summary-percent");
  const reviewGrade = document.getElementById("review-summary-grade");
  const reviewMarkingStatus = document.getElementById("review-marking-status");
  const reviewFeedbackBox = document.getElementById("review-feedback-box");
  const reviewFeedbackText = document.getElementById("review-feedback-text");
  const reviewQuestionsList = document.getElementById("review-questions-list");
  const btnCloseReview = document.getElementById("btn-close-review");
  const btnDoneReview = document.getElementById("btn-done-review");

  // State Variables
  let allAssessments = [];
  let allSubmissions = [];
  let activeFilterTab = "available";
  let activeBriefingAssessment = null;

  // Active Runner State
  let currentAttempt = null;
  let activeExam = null;
  let activeQuestions = [];
  let currentQIndex = 0;
  let currentAnswers = {};
  let flaggedQuestionSet = new Set();
  let timerIntervalId = null;
  let integrityViolations = 0;
  let isSubmitting = false;

  // 1. Status Filter Tabs
  statusTabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.getAttribute("data-filter");
      if (!filter) return;
      activeFilterTab = filter;
      statusTabs.forEach((b) => {
        const isMatch = b === btn;
        b.classList.toggle("btn-primary", isMatch);
        b.classList.toggle("btn-outline-blue", !isMatch);
        b.classList.toggle("active", isMatch);
      });
      renderAssessmentsView();
    });
  });

  if (searchInput) searchInput.addEventListener("input", renderAssessmentsView);
  if (courseFilter) courseFilter.addEventListener("change", renderAssessmentsView);
  if (typeFilter) typeFilter.addEventListener("change", renderAssessmentsView);

  // 2. Render Assessments Grid & Stat Counts
  function renderAssessmentsView() {
    if (!cardsContainer) return;

    const myMatric = matricNumber;
    const now = new Date();

    // Student's own submissions
    const mySubmissions = allSubmissions.filter(
      (s) => (s.matricNumber || "").trim().toUpperCase() === myMatric
    );

    // Active in-progress submission if any
    const activeInProgressSubmission = mySubmissions.find((s) => s.status === "in_progress");

    // Filter assessments applicable to this student
    const cohortAssessments = allAssessments.filter((a) => {
      const matchCentre = !a.studyCentre || a.studyCentre === "all" || a.studyCentre.toLowerCase() === studyCentre.toLowerCase();
      return matchCentre;
    });

    // Populate course select filter options dynamically
    if (courseFilter && courseFilter.options.length <= 1) {
      const uniqueCourses = Array.from(new Set(cohortAssessments.map((a) => a.courseCode).filter(Boolean)));
      uniqueCourses.forEach((code) => {
        const opt = document.createElement("option");
        opt.value = code;
        opt.textContent = code;
        courseFilter.appendChild(opt);
      });
    }

    // Counts
    let activeCount = 0;
    let upcomingCount = 0;
    let completedCount = 0;
    let totalScoreSum = 0;
    let maxScoreSum = 0;

    cohortAssessments.forEach((a) => {
      const sub = mySubmissions.find((s) => s.assessmentId === a.id);
      const isCompleted = sub && sub.status !== "in_progress";
      const start = a.startDate ? new Date(a.startDate) : now;
      const end = a.closingDate ? new Date(a.closingDate) : null;
      const isPast = end && end < now;
      const isFuture = start > now;

      if (isCompleted) {
        completedCount++;
        totalScoreSum += sub.totalScore || 0;
        maxScoreSum += sub.maxMarks || 30;
      } else if (!isPast && !isFuture && (a.status === "open" || a.status === "scheduled")) {
        activeCount++;
      } else if (isFuture) {
        upcomingCount++;
      }
    });

    if (countActiveEl) countActiveEl.textContent = activeCount;
    if (countUpcomingEl) countUpcomingEl.textContent = upcomingCount;
    if (countCompletedEl) countCompletedEl.textContent = completedCount;
    if (avgScoreEl) {
      if (maxScoreSum > 0) {
        const pct = Math.round((totalScoreSum / maxScoreSum) * 100);
        avgScoreEl.textContent = `${pct}%`;
      } else {
        avgScoreEl.textContent = "—";
      }
    }

    // Apply Filter Tab, Search & Dropdown criteria
    const qSearch = (searchInput?.value || "").toLowerCase().trim();
    const selCourse = courseFilter?.value || "all";
    const selType = typeFilter?.value || "all";

    const filtered = cohortAssessments.filter((a) => {
      // Search
      if (qSearch) {
        const matchTitle = (a.title || "").toLowerCase().includes(qSearch);
        const matchCourse = (a.courseCode || "").toLowerCase().includes(qSearch);
        const matchTopic = (a.topic || "").toLowerCase().includes(qSearch);
        if (!matchTitle && !matchCourse && !matchTopic) return false;
      }

      // Course dropdown
      if (selCourse !== "all" && a.courseCode !== selCourse) return false;

      // Type dropdown
      if (selType !== "all" && (a.type || "test").toLowerCase() !== selType.toLowerCase()) return false;

      const sub = mySubmissions.find((s) => s.assessmentId === a.id);
      const isCompleted = sub && sub.status !== "in_progress";
      const start = a.startDate ? new Date(a.startDate) : now;
      const end = a.closingDate ? new Date(a.closingDate) : null;
      const isPast = end && end < now;
      const isFuture = start > now;

      if (activeFilterTab === "available") {
        return !isCompleted && !isPast && !isFuture && (a.status === "open" || a.status === "scheduled");
      }
      if (activeFilterTab === "upcoming") {
        return !isCompleted && (isFuture || a.status === "scheduled");
      }
      if (activeFilterTab === "completed") {
        return isCompleted;
      }
      return true; // "all"
    });

    if (filtered.length === 0) {
      cardsContainer.innerHTML = `
        <div class="student-empty-box" style="grid-column: 1 / -1; padding: 3rem 1.5rem;">
          <div class="student-empty-icon">🖥️</div>
          <div class="student-empty-text">No assessments found for this filter.</div>
          <div class="student-empty-sub">
            Tests and examinations for your registered courses and study centre cohort will be listed here when opened by faculty instructors.
          </div>
        </div>
      `;
      return;
    }

    cardsContainer.innerHTML = filtered
      .map((a) => {
        const sub = mySubmissions.find((s) => s.assessmentId === a.id);
        const isInProgress = sub && sub.status === "in_progress";
        const isCompleted = sub && sub.status !== "in_progress";
        const start = a.startDate ? new Date(a.startDate) : now;
        const end = a.closingDate ? new Date(a.closingDate) : null;
        const isPast = end && end < now;
        const isFuture = start > now;

        const isExam = (a.type || "").toLowerCase() === "exam";
        const typeBadge = isExam
          ? `<span class="cbt-pill-type cbt-pill-exam">SEMESTER EXAM (70 MARKS)</span>`
          : `<span class="cbt-pill-type cbt-pill-test">CA TEST (10 MARKS)</span>`;

        let cardBorderClass = "active-open";
        let actionBtnHtml = "";

        if (isInProgress) {
          cardBorderClass = "active-open";
          actionBtnHtml = `
            <button type="button" class="btn btn-primary btn-resume-test" data-id="${a.id}" style="width: 100%; font-weight: 800; background: #2563EB; border-color: #1D4ED8;">
              ⏱️ Resume Assessment in Progress
            </button>
          `;
        } else if (isCompleted) {
          cardBorderClass = "closed-done";
          actionBtnHtml = `
            <button type="button" class="btn btn-outline-blue btn-review-result" data-sub-id="${sub.id}" data-id="${a.id}" style="width: 100%; font-weight: 700;">
              📑 View Score &amp; Evaluation
            </button>
          `;
        } else if (isFuture) {
          cardBorderClass = "scheduled-future";
          actionBtnHtml = `
            <button type="button" class="btn btn-outline-blue" disabled style="width: 100%; font-weight: 700; opacity: 0.65; cursor: not-allowed;">
              ⏳ Scheduled · Opens ${formatDateOnly(a.startDate)}
            </button>
          `;
        } else if (isPast) {
          cardBorderClass = "closed-done";
          actionBtnHtml = `
            <button type="button" class="btn btn-outline-blue" disabled style="width: 100%; font-weight: 700; opacity: 0.65; cursor: not-allowed;">
              🔒 Deadline Concluded
            </button>
          `;
        } else {
          // Open & ready
          cardBorderClass = "active-open";
          actionBtnHtml = `
            <button type="button" class="btn btn-primary btn-start-test" data-id="${a.id}" style="width: 100%; font-weight: 800; background: #16A34A; border-color: #15803D;">
              🚀 Start Assessment
            </button>
          `;
        }

        const scoreSummaryHtml = isCompleted
          ? `<div style="margin-top: 0.5rem; display: flex; justify-content: space-between; align-items: center; background: #EFF6FF; border-radius: 6px; padding: 0.5rem 0.75rem;">
               <span style="font-size: 0.75rem; color: var(--student-blue); font-weight: 700;">Your Achieved Mark:</span>
               <strong style="color: var(--student-navy); font-size: 0.95rem;">${sub.totalScore || 0} / ${sub.maxMarks || a.totalMarks || 30} (${sub.percentage || 0}%) · Grade ${sub.grade || "F"}</strong>
             </div>`
          : "";

        return `
          <div class="cbt-assessment-card ${cardBorderClass}">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; gap: 0.5rem;">
                <span class="status-pill-badge badge-blue" style="font-weight: 800;">${a.courseCode}</span>
                ${typeBadge}
              </div>

              <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--student-navy); margin-bottom: 0.35rem; line-height: 1.35;">
                ${a.title}
              </h4>
              <p style="font-size: 0.8125rem; color: var(--student-text-muted); margin-bottom: 0.75rem; line-height: 1.4;">
                ${a.topic || a.courseTitle || "Theological Curriculum Assessment"}
              </p>

              <div class="cbt-meta-row">
                <div class="cbt-meta-item">
                  <span style="color: var(--student-text-muted);">Duration:</span>
                  <strong>${a.durationMinutes || 30} Minutes</strong>
                </div>
                <div class="cbt-meta-item">
                  <span style="color: var(--student-text-muted);">Questions:</span>
                  <strong>${(a.questions || []).length} Items</strong>
                </div>
                <div class="cbt-meta-item">
                  <span style="color: var(--student-text-muted);">Maximum Score:</span>
                  <strong>${a.totalMarks || 10} Marks</strong>
                </div>
                <div class="cbt-meta-item">
                  <span style="color: var(--student-text-muted);">Closing Date:</span>
                  <strong>${a.closingDate ? formatDateOnly(a.closingDate) : "Open"}</strong>
                </div>
              </div>

              ${scoreSummaryHtml}
            </div>

            <div style="margin-top: 1.25rem;">
              ${actionBtnHtml}
            </div>
          </div>
        `;
      })
      .join("");

    // Attach Start / Resume triggers
    cardsContainer.querySelectorAll(".btn-start-test, .btn-resume-test").forEach((btn) => {
      btn.addEventListener("click", () => {
        const testId = btn.getAttribute("data-id");
        openPreTestBriefing(testId);
      });
    });

    // Attach Review triggers
    cardsContainer.querySelectorAll(".btn-review-result").forEach((btn) => {
      btn.addEventListener("click", () => {
        const subId = btn.getAttribute("data-sub-id");
        const testId = btn.getAttribute("data-id");
        openTestReviewModal(subId, testId);
      });
    });
  }

  // 3. Pre-Test Briefing Modal
  function openPreTestBriefing(testId) {
    const test = allAssessments.find((a) => a.id === testId);
    if (!test) return;

    activeBriefingAssessment = test;
    if (briefingTitle) briefingTitle.textContent = test.title;
    if (briefingTypePill) {
      briefingTypePill.textContent = (test.type || "test").toUpperCase() === "EXAM" ? "SEMESTER EXAMINATION" : "CONTINUOUS ASSESSMENT";
    }
    if (briefingCourseMeta) {
      briefingCourseMeta.textContent = `${test.courseCode} · ${test.courseTitle || "Divine Mandate Bible Institute"}`;
    }
    if (briefingDuration) briefingDuration.textContent = `${test.durationMinutes || 30} Mins`;
    if (briefingQCount) briefingQCount.textContent = `${(test.questions || []).length} Questions`;
    if (briefingTotalMarks) briefingTotalMarks.textContent = `${test.totalMarks || 10} Marks`;
    if (briefingAttempts) briefingAttempts.textContent = `${test.allowedAttempts || 1} Attempt Allowed`;

    if (briefingHonorCheck) briefingHonorCheck.checked = false;
    if (btnLaunchExam) btnLaunchExam.disabled = true;

    if (modalBriefing) modalBriefing.style.display = "flex";
  }

  if (briefingHonorCheck && btnLaunchExam) {
    briefingHonorCheck.addEventListener("change", () => {
      btnLaunchExam.disabled = !briefingHonorCheck.checked;
    });
  }

  const closeBriefingModal = () => {
    if (modalBriefing) modalBriefing.style.display = "none";
    activeBriefingAssessment = null;
  };

  if (btnCloseBriefing) btnCloseBriefing.addEventListener("click", closeBriefingModal);
  if (btnCancelBriefing) btnCancelBriefing.addEventListener("click", closeBriefingModal);

  // 4. Launch CBT Examination Runner
  if (btnLaunchExam) {
    btnLaunchExam.addEventListener("click", async () => {
      if (!activeBriefingAssessment) return;
      const test = activeBriefingAssessment;

      btnLaunchExam.disabled = true;
      btnLaunchExam.textContent = "Verifying Credentials & Launching...";

      try {
        const result = await startCbtAttempt(
          {
            studentId: uid,
            studentName,
            matricNumber,
            studyCentre,
            programme
          },
          test.id
        );

        closeBriefingModal();
        startExamRunnerSession(result.attempt, result.assessment);
      } catch (err) {
        alert(`Assessment Launch Error: ${err.message}`);
        console.error("[DIMABIN CBT Launch]", err);
      } finally {
        if (btnLaunchExam) {
          btnLaunchExam.disabled = false;
          btnLaunchExam.textContent = "🚀 I am Ready — Launch Assessment";
        }
      }
    });
  }

  // 5. Active Exam Session Controller
  function startExamRunnerSession(attempt, assessment) {
    currentAttempt = attempt;
    activeExam = assessment;
    activeQuestions = assessment.questions || [];

    if (activeQuestions.length === 0) {
      alert("Error: This assessment contains no questions. Please notify your course lecturer.");
      return;
    }

    currentQIndex = 0;
    currentAnswers = { ...(attempt.answers || {}) };
    flaggedQuestionSet = new Set();
    integrityViolations = 0;
    isSubmitting = false;

    // Load any locally cached draft answers
    try {
      const localDraft = localStorage.getItem(`dimabin_cbt_answers_${attempt.id}`);
      if (localDraft) {
        const parsed = JSON.parse(localDraft);
        currentAnswers = { ...currentAnswers, ...parsed };
      }
    } catch (_) {}

    // Populate runner header
    if (runnerCourseBadge) runnerCourseBadge.textContent = `${assessment.courseCode} · ${assessment.courseTitle || ""}`;
    if (runnerTitle) runnerTitle.textContent = assessment.title;
    if (candidateNameBadge) candidateNameBadge.textContent = studentName;
    if (candidateMatricBadge) candidateMatricBadge.textContent = matricNumber;

    if (cheatAlertBanner) cheatAlertBanner.style.display = "none";

    // Open runner modal
    if (runnerOverlay) {
      runnerOverlay.classList.add("active");
      document.body.style.overflow = "hidden";
    }

    // Initialize Timer
    initExamCountdown(attempt.expiresAt);

    // Initialize Anti-Cheat Listeners
    initAntiCheatMonitor();

    // Render palette and first question
    renderPaletteGrid();
    renderCurrentQuestion();
  }

  // Countdown Timer
  function initExamCountdown(expiresAtIso) {
    if (timerIntervalId) clearInterval(timerIntervalId);

    const expiryTime = new Date(expiresAtIso).getTime();

    const updateTimerTick = () => {
      const now = Date.now();
      const remainingMs = expiryTime - now;

      if (remainingMs <= 0) {
        clearInterval(timerIntervalId);
        if (timerDisplay) timerDisplay.textContent = "00:00";
        if (timerBox) {
          timerBox.classList.remove("timer-warning");
          timerBox.classList.add("timer-critical");
        }
        alert("⏱️ Time has expired! Concluding assessment and submitting your responses to the registry.");
        executeFinalSubmit();
        return;
      }

      const totalSec = Math.floor(remainingMs / 1000);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

      if (timerDisplay) timerDisplay.textContent = formatted;

      if (timerBox) {
        if (mins < 1) {
          timerBox.classList.remove("timer-warning");
          timerBox.classList.add("timer-critical");
        } else if (mins < 5) {
          timerBox.classList.add("timer-warning");
          timerBox.classList.remove("timer-critical");
        } else {
          timerBox.classList.remove("timer-warning");
          timerBox.classList.remove("timer-critical");
        }
      }
    };

    updateTimerTick();
    timerIntervalId = setInterval(updateTimerTick, 1000);
  }

  // Anti-Cheat Window / Tab Monitoring
  function initAntiCheatMonitor() {
    const handleIntegrityIncident = () => {
      if (!runnerOverlay || !runnerOverlay.classList.contains("active") || isSubmitting) return;

      integrityViolations++;
      if (cheatViolationCountEl) cheatViolationCountEl.textContent = integrityViolations;
      if (cheatAlertBanner) cheatAlertBanner.style.display = "block";

      // Save violation count
      saveCbtProgress(currentAttempt.id, {
        _integrityViolations: integrityViolations,
        _lastViolationAt: new Date().toISOString()
      });
    };

    window.addEventListener("blur", handleIntegrityIncident);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) handleIntegrityIncident();
    });
  }

  // Render Current Question View
  function renderCurrentQuestion() {
    const q = activeQuestions[currentQIndex];
    if (!q) return;

    if (qNumBadge) qNumBadge.textContent = `Question ${currentQIndex + 1} of ${activeQuestions.length}`;
    if (qTypeBadge) {
      const typeLabels = {
        mcq: "Multiple Choice",
        yes_no: "Yes / No",
        true_false: "True / False",
        short_answer: "Short Answer",
        theory: "Theory / Essay"
      };
      qTypeBadge.textContent = typeLabels[q.type] || "Question";
    }
    if (qMarksBadge) qMarksBadge.textContent = `${q.marks || 2} Marks`;

    if (questionTextEl) questionTextEl.textContent = q.questionText || "Question text unavailable.";

    if (flagQBtn) {
      const isFlagged = flaggedQuestionSet.has(q.id);
      flagQBtn.textContent = isFlagged ? "🚩 Flagged" : "🏳️ Flag for Review";
      flagQBtn.style.background = isFlagged ? "#FEF3C7" : "transparent";
      flagQBtn.style.color = isFlagged ? "#B45309" : "";
    }

    // Render Options / Inputs based on Type
    renderQuestionOptions(q);

    // Update Navigation Buttons
    if (prevQBtn) prevQBtn.disabled = currentQIndex === 0;
    if (nextQBtn) nextQBtn.textContent = currentQIndex === activeQuestions.length - 1 ? "Review Palette →" : "Next →";

    updatePaletteState();
  }

  // Render Option Inputs
  function renderQuestionOptions(q) {
    if (!optionsContainer) return;
    optionsContainer.innerHTML = "";

    const userVal = currentAnswers[q.id];

    if (q.type === "mcq") {
      const opts = q.options || [];
      optionsContainer.innerHTML = opts
        .map((opt) => {
          const isChecked = userVal === opt.id;
          return `
            <label class="cbt-option-item ${isChecked ? "selected" : ""}" data-opt-id="${opt.id}">
              <input type="radio" name="cbt_q_${q.id}" class="cbt-option-radio" value="${opt.id}" ${isChecked ? "checked" : ""}>
              <span style="font-size: 0.95rem; line-height: 1.45;">${opt.text}</span>
            </label>
          `;
        })
        .join("");

      optionsContainer.querySelectorAll(".cbt-option-item").forEach((item) => {
        item.addEventListener("click", () => {
          const optId = item.getAttribute("data-opt-id");
          recordAnswer(q.id, optId);
          optionsContainer.querySelectorAll(".cbt-option-item").forEach((el) => el.classList.remove("selected"));
          item.classList.add("selected");
          const radio = item.querySelector("input[type='radio']");
          if (radio) radio.checked = true;
        });
      });
    } else if (q.type === "true_false" || q.type === "yes_no") {
      const isTF = q.type === "true_false";
      const val1 = isTF ? "opt_true" : "opt_yes";
      const val2 = isTF ? "opt_false" : "opt_no";
      const label1 = isTF ? "True" : "Yes";
      const label2 = isTF ? "False" : "No";

      optionsContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; max-width: 450px;">
          <button type="button" class="btn ${userVal === val1 ? "btn-primary" : "btn-outline-blue"} btn-binary-choice" data-val="${val1}" style="font-weight: 800; padding: 1rem; font-size: 1.1rem;">
            ${label1}
          </button>
          <button type="button" class="btn ${userVal === val2 ? "btn-primary" : "btn-outline-blue"} btn-binary-choice" data-val="${val2}" style="font-weight: 800; padding: 1rem; font-size: 1.1rem;">
            ${label2}
          </button>
        </div>
      `;

      optionsContainer.querySelectorAll(".btn-binary-choice").forEach((b) => {
        b.addEventListener("click", () => {
          const chosen = b.getAttribute("data-val");
          recordAnswer(q.id, chosen);
          optionsContainer.querySelectorAll(".btn-binary-choice").forEach((btnEl) => {
            btnEl.classList.remove("btn-primary");
            btnEl.classList.add("btn-outline-blue");
          });
          b.classList.remove("btn-outline-blue");
          b.classList.add("btn-primary");
        });
      });
    } else if (q.type === "short_answer") {
      optionsContainer.innerHTML = `
        <div style="max-width: 600px;">
          <label style="display: block; font-size: 0.8125rem; font-weight: 700; color: var(--student-navy); margin-bottom: 0.5rem;">
            Your Answer (Word or Short Phrase):
          </label>
          <input type="text" class="student-form-input" id="cbt-short-input" value="${userVal || ""}" placeholder="Enter concise answer..." style="width: 100%; font-size: 1rem; padding: 0.75rem 1rem;">
        </div>
      `;

      const input = document.getElementById("cbt-short-input");
      if (input) {
        input.addEventListener("input", () => {
          recordAnswer(q.id, input.value.trim());
        });
      }
    } else if (q.type === "theory") {
      optionsContainer.innerHTML = `
        <div>
          <label style="display: block; font-size: 0.8125rem; font-weight: 700; color: var(--student-navy); margin-bottom: 0.5rem;">
            Exegesis / Theological Response:
          </label>
          <textarea class="student-form-input" id="cbt-theory-input" rows="8" placeholder="Type your structured theological response here..." style="width: 100%; font-size: 0.95rem; line-height: 1.5; padding: 0.85rem 1rem;">${userVal || ""}</textarea>
          <div style="display: flex; justify-content: flex-end; font-size: 0.75rem; color: var(--student-text-muted); margin-top: 0.35rem;" id="cbt-theory-word-count">
            Words: ${(userVal || "").split(/\s+/).filter(Boolean).length}
          </div>
        </div>
      `;

      const textarea = document.getElementById("cbt-theory-input");
      const wordCountEl = document.getElementById("cbt-theory-word-count");
      if (textarea) {
        textarea.addEventListener("input", () => {
          recordAnswer(q.id, textarea.value);
          const words = textarea.value.split(/\s+/).filter(Boolean).length;
          if (wordCountEl) wordCountEl.textContent = `Words: ${words}`;
        });
      }
    }
  }

  // Record Answer & Trigger Auto-Save
  let saveDebounceTimer = null;
  function recordAnswer(questionId, val) {
    if (!val || String(val).trim() === "") {
      delete currentAnswers[questionId];
    } else {
      currentAnswers[questionId] = val;
    }

    if (saveIndicator) {
      saveIndicator.innerHTML = `<span>⏳</span><span>Saving...</span>`;
      saveIndicator.style.color = "#D97706";
    }

    // Cache locally immediately
    try {
      localStorage.setItem(`dimabin_cbt_answers_${currentAttempt.id}`, JSON.stringify(currentAnswers));
    } catch (_) {}

    // Debounced sync to Firestore
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(async () => {
      try {
        await saveCbtProgress(currentAttempt.id, currentAnswers);
        if (saveIndicator) {
          saveIndicator.innerHTML = `<span>💾</span><span>Saved</span>`;
          saveIndicator.style.color = "#16A34A";
        }
      } catch (_) {}
    }, 600);

    updatePaletteState();
  }

  // Clear Answer
  if (clearQBtn) {
    clearQBtn.addEventListener("click", () => {
      const q = activeQuestions[currentQIndex];
      if (!q) return;
      delete currentAnswers[q.id];
      recordAnswer(q.id, "");
      renderCurrentQuestion();
    });
  }

  // Flag Question Toggle
  if (flagQBtn) {
    flagQBtn.addEventListener("click", () => {
      const q = activeQuestions[currentQIndex];
      if (!q) return;
      if (flaggedQuestionSet.has(q.id)) {
        flaggedQuestionSet.delete(q.id);
      } else {
        flaggedQuestionSet.add(q.id);
      }
      renderCurrentQuestion();
    });
  }

  // Previous & Next Buttons
  if (prevQBtn) {
    prevQBtn.addEventListener("click", () => {
      if (currentQIndex > 0) {
        currentQIndex--;
        renderCurrentQuestion();
      }
    });
  }

  if (nextQBtn) {
    nextQBtn.addEventListener("click", () => {
      if (currentQIndex < activeQuestions.length - 1) {
        currentQIndex++;
        renderCurrentQuestion();
      } else {
        // At last question, prompt submit review
        promptSubmitConfirmation();
      }
    });
  }

  // Render Question Palette Grid
  function renderPaletteGrid() {
    if (!paletteGrid) return;
    paletteGrid.innerHTML = activeQuestions
      .map((q, idx) => `
        <button type="button" class="cbt-palette-btn" data-idx="${idx}" id="pal-btn-${idx}">
          ${idx + 1}
        </button>
      `)
      .join("");

    paletteGrid.querySelectorAll(".cbt-palette-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-idx"), 10);
        if (!isNaN(idx)) {
          currentQIndex = idx;
          renderCurrentQuestion();
        }
      });
    });

    updatePaletteState();
  }

  // Update Palette Styling & Summary Counts
  function updatePaletteState() {
    let answered = 0;
    let flagged = 0;

    activeQuestions.forEach((q, idx) => {
      const btn = document.getElementById(`pal-btn-${idx}`);
      if (!btn) return;

      const isCurrent = idx === currentQIndex;
      const hasAnswer = currentAnswers[q.id] !== undefined && String(currentAnswers[q.id]).trim() !== "";
      const isFlagged = flaggedQuestionSet.has(q.id);

      if (hasAnswer) answered++;
      if (isFlagged) flagged++;

      btn.className = "cbt-palette-btn";
      if (isCurrent) btn.classList.add("current");
      if (hasAnswer) btn.classList.add("answered");
      if (isFlagged) btn.classList.add("flagged");
    });

    const unanswered = activeQuestions.length - answered;
    if (paletteCountAnswered) paletteCountAnswered.textContent = answered;
    if (paletteCountUnanswered) paletteCountUnanswered.textContent = unanswered;
    if (paletteCountFlagged) paletteCountFlagged.textContent = flagged;
  }

  // 6. Submit Confirmation Dialog
  const promptSubmitConfirmation = () => {
    let answered = 0;
    activeQuestions.forEach((q) => {
      if (currentAnswers[q.id] !== undefined && String(currentAnswers[q.id]).trim() !== "") {
        answered++;
      }
    });
    const unanswered = activeQuestions.length - answered;

    if (confirmSummaryText) {
      confirmSummaryText.textContent = `You have answered ${answered} of ${activeQuestions.length} questions (${unanswered} unanswered).`;
    }

    if (confirmUnansweredWarn) {
      confirmUnansweredWarn.style.display = unanswered > 0 ? "block" : "none";
    }

    if (modalConfirm) modalConfirm.style.display = "flex";
  };

  if (finishExamBtn) finishExamBtn.addEventListener("click", promptSubmitConfirmation);
  if (sidebarSubmitBtn) sidebarSubmitBtn.addEventListener("click", promptSubmitConfirmation);

  if (btnBackToExam) {
    btnBackToExam.addEventListener("click", () => {
      if (modalConfirm) modalConfirm.style.display = "none";
    });
  }

  if (btnFinalConfirm) {
    btnFinalConfirm.addEventListener("click", () => {
      if (modalConfirm) modalConfirm.style.display = "none";
      executeFinalSubmit();
    });
  }

  // Execute Submission
  async function executeFinalSubmit() {
    if (isSubmitting || !currentAttempt) return;
    isSubmitting = true;

    // Stop timer
    if (timerIntervalId) clearInterval(timerIntervalId);

    try {
      const res = await submitCbtAttempt(currentAttempt.id, currentAnswers);

      // Clean local storage cache
      try {
        localStorage.removeItem(`dimabin_cbt_answers_${currentAttempt.id}`);
      } catch (_) {}

      // Close Runner Overlay
      if (runnerOverlay) {
        runnerOverlay.classList.remove("active");
        document.body.style.overflow = "";
      }

      // Open Receipt Modal
      openSubmissionReceipt(res.attempt || currentAttempt, activeExam);
    } catch (err) {
      alert(`Submission Note: ${err.message}`);
      console.error("[DIMABIN CBT Submit]", err);
    } finally {
      isSubmitting = false;
      renderAssessmentsView();
    }
  }

  // 7. Submission Receipt Modal
  function openSubmissionReceipt(attempt, assessment) {
    if (receiptCandidateName) receiptCandidateName.textContent = studentName;
    if (receiptMatric) receiptMatric.textContent = matricNumber;
    if (receiptCourse) receiptCourse.textContent = `${assessment?.courseCode || attempt.courseCode || ""} · ${assessment?.title || attempt.assessmentTitle || ""}`;
    if (receiptTimestamp) receiptTimestamp.textContent = new Date().toLocaleString();
    if (receiptAttemptId) receiptAttemptId.textContent = attempt.id;

    const hasTheory = assessment?.hasTheory;
    const isReleased = attempt.resultsReleased || assessment?.resultVisibility === "immediate";

    if (isReleased) {
      if (receiptScoreContainer) receiptScoreContainer.style.display = "block";
      if (receiptTotalScore) receiptTotalScore.textContent = `${attempt.totalScore || 0} / ${attempt.maxMarks || 30}`;
      if (receiptPercentage) receiptPercentage.textContent = `${attempt.percentage || 0}%`;
      if (receiptGrade) receiptGrade.textContent = `Grade ${attempt.grade || "F"}`;
      if (receiptPassFail) {
        const passed = (attempt.percentage || 0) >= 40;
        receiptPassFail.textContent = passed ? "PASSED" : "FAILED";
        receiptPassFail.className = `status-pill-badge ${passed ? "badge-green" : "badge-red"}`;
      }
      if (receiptTheoryNotice) {
        receiptTheoryNotice.style.display = hasTheory ? "block" : "none";
      }
    } else {
      if (receiptScoreContainer) {
        receiptScoreContainer.innerHTML = `
          <div style="font-size: 0.95rem; font-weight: 700; color: var(--student-navy); margin-bottom: 0.35rem;">
            Assessment Received for Academic Evaluation
          </div>
          <p style="font-size: 0.8125rem; color: var(--student-text-muted); margin: 0;">
            Objective marking is logged. Results will be published to your student portal upon faculty instructor evaluation and grading sign-off.
          </p>
        `;
      }
    }

    if (modalReceipt) modalReceipt.style.display = "flex";
  }

  if (btnCloseReceipt) {
    btnCloseReceipt.addEventListener("click", () => {
      if (modalReceipt) modalReceipt.style.display = "none";
      renderAssessmentsView();
    });
  }

  // 8. Result Review Modal (Detailed Question by Question)
  function openTestReviewModal(submissionId, assessmentId) {
    const sub = allSubmissions.find((s) => s.id === submissionId);
    const assessment = allAssessments.find((a) => a.id === assessmentId);
    if (!sub || !assessment) return;

    if (reviewTestType) reviewTestType.textContent = (assessment.type || "test").toUpperCase() === "EXAM" ? "SEMESTER EXAMINATION" : "CONTINUOUS ASSESSMENT";
    if (reviewTestTitle) reviewTestTitle.textContent = `${assessment.title} — Detailed Evaluation`;
    if (reviewTestMeta) reviewTestMeta.textContent = `${assessment.courseCode} · ${assessment.courseTitle || ""}`;

    if (reviewScore) reviewScore.textContent = `${sub.totalScore || 0} / ${sub.maxMarks || 30}`;
    if (reviewPercent) reviewPercent.textContent = `${sub.percentage || 0}%`;
    if (reviewGrade) reviewGrade.textContent = `Grade ${sub.grade || "F"}`;
    if (reviewMarkingStatus) {
      const isGraded = sub.markingStatus === "fully_graded";
      reviewMarkingStatus.textContent = isGraded ? "Fully Graded" : "Pending Manual Evaluation";
      reviewMarkingStatus.className = `status-pill-badge ${isGraded ? "badge-green" : "badge-gold"}`;
    }

    if (sub.lecturerFeedback && reviewFeedbackBox && reviewFeedbackText) {
      reviewFeedbackBox.style.display = "block";
      reviewFeedbackText.textContent = sub.lecturerFeedback;
    } else if (reviewFeedbackBox) {
      reviewFeedbackBox.style.display = "none";
    }

    // Render questions review
    if (reviewQuestionsList) {
      const questions = assessment.questions || [];
      const answers = sub.answers || {};
      const qGrading = sub.questionGrading || {};

      reviewQuestionsList.innerHTML = questions
        .map((q, idx) => {
          const userAns = answers[q.id];
          const gradeInfo = qGrading[q.id] || {};
          const isCorrect = gradeInfo.isCorrect;
          const score = gradeInfo.score !== undefined ? gradeInfo.score : (isCorrect ? q.marks : 0);

          let ansDisplay = "—";
          let correctDisplay = "";

          if (q.type === "mcq") {
            const chosenOpt = (q.options || []).find((o) => o.id === userAns);
            ansDisplay = chosenOpt ? chosenOpt.text : `<span style="color:#DC2626;">No answer selected</span>`;
            const correctOpt = (q.options || []).find((o) => o.id === q.correctOptionId);
            correctDisplay = correctOpt ? correctOpt.text : "";
          } else if (q.type === "true_false" || q.type === "yes_no") {
            ansDisplay = userAns === "opt_true" || userAns === "opt_yes" ? (q.type === "true_false" ? "True" : "Yes") : (q.type === "true_false" ? "False" : "No");
            correctDisplay = q.correctOptionId === "opt_true" || q.correctOptionId === "opt_yes" ? (q.type === "true_false" ? "True" : "Yes") : (q.type === "true_false" ? "False" : "No");
          } else {
            ansDisplay = userAns || `<span style="color:#DC2626;">No answer submitted</span>`;
            correctDisplay = q.expectedAnswer || "";
          }

          const badgeColor = isCorrect ? "#DCFCE7; color: #166534; border: 1px solid #86EFAC;" : "#FEE2E2; color: #991B1B; border: 1px solid #FCA5A5;";
          const badgeText = isCorrect ? "✓ Correct" : (q.type === "theory" ? "Theory Evaluated" : "✕ Incorrect");

          return `
            <div style="background: #F8FAFC; border: 1px solid var(--student-border); border-radius: var(--student-radius-sm); padding: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
                <strong style="color: var(--student-navy); font-size: 0.95rem;">Question ${idx + 1} (${q.marks} Marks)</strong>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                  <span style="font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700; background: ${badgeColor};">
                    ${badgeText}
                  </span>
                  <strong style="font-size: 0.9rem; color: var(--student-blue);">${score} / ${q.marks}</strong>
                </div>
              </div>

              <p style="font-size: 0.9rem; color: var(--student-text-main); margin-bottom: 0.75rem; font-weight: 600; line-height: 1.45;">
                ${q.questionText}
              </p>

              <div style="font-size: 0.84rem; margin-bottom: 0.5rem;">
                <span style="color: var(--student-text-muted); font-weight: 700;">Your Response:</span>
                <div style="margin-top: 0.2rem; color: var(--student-navy); font-weight: 600;">${ansDisplay}</div>
              </div>

              ${correctDisplay ? `
                <div style="font-size: 0.84rem; color: #166534; margin-bottom: 0.5rem;">
                  <span style="font-weight: 700;">Correct Institutional Answer:</span>
                  <div style="margin-top: 0.2rem; font-weight: 600;">${correctDisplay}</div>
                </div>
              ` : ""}

              ${q.explanation ? `
                <div style="font-size: 0.8125rem; color: var(--student-text-muted); background: #FFFFFF; border-left: 3px solid var(--student-blue); padding: 0.5rem 0.75rem; border-radius: 4px; margin-top: 0.5rem;">
                  <strong>Theological Context:</strong> ${q.explanation}
                </div>
              ` : ""}
            </div>
          `;
        })
        .join("");
    }

    if (modalReview) modalReview.style.display = "flex";
  }

  const closeReviewModal = () => {
    if (modalReview) modalReview.style.display = "none";
  };

  if (btnCloseReview) btnCloseReview.addEventListener("click", closeReviewModal);
  if (btnDoneReview) btnDoneReview.addEventListener("click", closeReviewModal);

  // 9. Subscribe to Real-Time CBT Data
  subscribeCbtAssessments((asmts) => {
    allAssessments = asmts || [];
    renderAssessmentsView();
  });

  subscribeCbtSubmissions((subs) => {
    allSubmissions = subs || [];
    renderAssessmentsView();
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
    initStudentCourseRegistration(localSession, localSession.uid || localSession.id);
    initStudentCbt(localSession, localSession.uid || localSession.id);
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
      initStudentCourseRegistration(profile, user.uid);
      initStudentCbt(profile, user.uid);
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

  // 6. Real-time authoritative session synchronization
  subscribeActiveAcademicSession((sessData) => {
    if (sessData && sessData.currentSession) {
      const activeSess = sessData.currentSession;
      const headerActive = document.getElementById("header-active-session");
      if (headerActive) headerActive.textContent = `${activeSess} ACADEMIC SESSION`;
      const heroSess = document.getElementById("hero-student-session");
      if (heroSess) heroSess.textContent = `Session: ${activeSess}`;
      const regBadge = document.getElementById("student-reg-session-badge");
      if (regBadge) regBadge.textContent = activeSess;
      const regCard = document.getElementById("reg-card-session");
      if (regCard) regCard.textContent = activeSess;
    }
  });
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
