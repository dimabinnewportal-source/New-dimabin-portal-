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
  submitStudentCourseRegistration
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
