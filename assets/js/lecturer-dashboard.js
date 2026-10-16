/**
 * DIMABIN LECTURER PORTAL — FACULTY DASHBOARD CONTROLLER
 * Pure Vanilla JavaScript ES Module (Firebase Web SDK v12.19.0 CDN)
 *
 * Implements:
 * - Session verification & authoritative lecturer profile display
 * - Dynamic assigned course allocations from Firestore
 * - Enrolled student roster connected to real course registrations
 * - Interactive Continuous Assessment (30%) & Exam (70%) grade book
 * - Registry announcement circulars & real-time notices
 * - Audit log activity feed
 * - Account settings: password change, contact info update, photo update
 */

import { signOutUser } from "./firebase-users.js";
import {
  subscribeCourseAllocations,
  subscribeCourseRegistrations,
  subscribeResults,
  subscribeAnnouncements,
  subscribePortalNotifications,
  subscribeStudyCentres,
  subscribeActivityLogs,
  saveLecturerGradeRecord,
  publishCourseCAResults,
  unpublishCourseCAResults,
  submitCourseGradesToRegistry,
  subscribeCourseAssessments,
  createCourseAssessment,
  deleteCourseAssessment,
  subscribeCbtQuestions,
  createCbtQuestion,
  updateCbtQuestion,
  deleteCbtQuestion,
  duplicateCbtQuestion,
  subscribeCbtAssessments,
  createCbtAssessment,
  updateCbtAssessment,
  deleteCbtAssessment,
  publishCbtAssessment,
  closeCbtAssessment,
  extendCbtDeadline,
  updateCbtResultVisibility,
  subscribeCbtSubmissions,
  gradeCbtSubmission,
  exportCbtResultsCsv,
  changeLecturerPassword,
  updateLecturerSelfProfile,
  sendLecturerPasswordReset,
  formatDateTime,
  formatDateOnly
} from "./firebase-backend.js";

document.addEventListener("DOMContentLoaded", () => {
  // =========================================================================
  // 1. SESSION VERIFICATION & AUTHENTICATED PROFILE LOAD
  // =========================================================================
  let sessionRaw =
    sessionStorage.getItem("dimabin_lecturer_session") ||
    localStorage.getItem("dimabin_lecturer_session");
  let session = null;
  if (sessionRaw) {
    try {
      session = JSON.parse(sessionRaw);
    } catch (_) {}
  }

  if (!session || !session.staffId) {
    console.warn("[DIMABIN Lecturer Dashboard] No active faculty session. Redirecting to login...");
    window.location.href = "lecturer-login.html";
    return;
  }

  const staffId = session.staffId || "DIMABIN/FAC/2026/01";
  const normStaffId = staffId.trim().toLowerCase();
  const fullName = session.fullName || "Faculty Member";
  const normName = fullName.trim().toLowerCase();
  const dept = session.department || "Biblical Studies & Theology";
  const centre = session.studyCentre || "Abeokuta Main Campus";
  const email = session.email || "";
  const phone = session.phone || "";
  const qualification = session.qualification || "B.Th., M.Div.";
  const specialization = session.specialization || "General Biblical Studies";
  const photoUrl = session.photoUrl || "";

  // Derive initials for avatar
  const getInitials = (nameStr) => {
    return (nameStr || "")
      .split(" ")
      .filter((n) => !["rev.", "dr.", "pastor", "pst.", "evang.", "prophet", "bishop", "elder"].includes(n.toLowerCase()))
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "FM";
  };
  const initials = getInitials(fullName);

  // Helper to render avatar photo or initials
  const updateAvatarDisplays = (photoSrc) => {
    const avatarBoxes = [
      { id: "header-lecturer-avatar", isTextOnly: true },
      { id: "hero-avatar", isContainer: true },
      { id: "hero-avatar-initials", isTextOnly: true },
      { id: "lec-avatar-initials", isTextOnly: true },
      { id: "lec-banner-avatar", isContainer: true },
      { id: "prof-avatar-box", isContainer: true },
      { id: "prof-avatar-initials", isTextOnly: true }
    ];

    avatarBoxes.forEach(({ id, isTextOnly, isContainer }) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (photoSrc) {
        if (isTextOnly) {
          el.innerHTML = `<img src="${photoSrc}" alt="${fullName}" class="lec-avatar-img" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
          el.innerHTML = `<img src="${photoSrc}" alt="${fullName}" class="lec-avatar-img">`;
        }
      } else {
        el.innerHTML = `<span style="font-weight: 800;">${initials}</span>`;
      }
    });
  };

  updateAvatarDisplays(photoUrl);

  // Populate Header, Banner, Sidebar & Profile fields
  const safeSetText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  // Student-Portal-matching Topbar & Hero fields
  safeSetText("header-lecturer-name", fullName);
  safeSetText("header-lecturer-role", `${dept.split("&")[0].trim()} · ${staffId}`);
  safeSetText("header-study-centre", centre.split(",")[0]);
  safeSetText("hero-lecturer-name", fullName);
  safeSetText("hero-lecturer-id", staffId);
  safeSetText("hero-lecturer-department", `Department: ${dept}`);
  safeSetText("hero-lecturer-centre", `Study Centre: ${centre.split(",")[0]}`);
  safeSetText("hero-lecturer-session", "Session: 2026/2027");
  safeSetText("hero-academic-status", "Active");

  // Legacy & Sidebar bindings
  safeSetText("lec-sidebar-name", fullName);
  safeSetText("lec-sidebar-id", staffId);
  safeSetText("lec-banner-name", fullName);
  safeSetText("lec-banner-id", staffId);
  safeSetText("lec-banner-email", email || "faculty@dimabin.org");
  safeSetText("lec-banner-centre", centre);
  safeSetText("lec-topbar-centre-name", centre.split(",")[0]);
  safeSetText("card-centre-name", centre.split(",")[0]);
  safeSetText("stat-card-centre-name", centre.split(",")[0]);

  // Profile section elements
  safeSetText("prof-head-name", fullName);
  safeSetText("prof-head-dept", dept);
  safeSetText("prof-head-id", staffId);
  safeSetText("prof-head-centre", centre);
  safeSetText("prof-fullname", fullName);
  safeSetText("prof-staffid", staffId);
  safeSetText("prof-email", email || "Not specified");
  safeSetText("prof-phone", phone || "Not specified");
  safeSetText("prof-dept", dept);
  safeSetText("prof-qualification", qualification);
  safeSetText("prof-specialization", specialization);
  safeSetText("prof-centre", centre);

  // Pre-fill Settings inputs
  const inputPhone = document.getElementById("settings-phone");
  if (inputPhone) inputPhone.value = phone;
  const inputQual = document.getElementById("settings-qualification");
  if (inputQual) inputQual.value = qualification;
  const inputSpec = document.getElementById("settings-specialization");
  if (inputSpec) inputSpec.value = specialization;

  // =========================================================================
  // 2. NAVIGATION & TABS LOGIC
  // =========================================================================
  const navItems = document.querySelectorAll(".student-sidebar-nav .student-nav-item");
  const sections = document.querySelectorAll(".student-section");
  const breadcrumbCurrent = document.getElementById("lecturer-section-title");

  const sectionTitles = {
    dashboard: "Faculty Dashboard",
    "my-courses": "Assigned Courses",
    "my-students": "Enrolled Students Roster",
    assessments: "Grading & Assessments",
    cbt: "CBT Management & Examination Engine",
    announcements: "Academic Notices & Circulars",
    profile: "Faculty Profile",
    settings: "Account & Security Settings",
    support: "Academic Registry Support Desk"
  };

  const navigateTo = (targetSectionId) => {
    navItems.forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-section") === targetSectionId);
    });

    sections.forEach((sec) => {
      sec.classList.toggle("active", sec.id === `section-${targetSectionId}`);
    });

    if (breadcrumbCurrent) {
      breadcrumbCurrent.textContent = sectionTitles[targetSectionId] || "Faculty Dashboard";
    }

    // Close mobile drawer if open
    const sidebar = document.getElementById("student-sidebar") || document.getElementById("lecturer-sidebar");
    const overlay = document.getElementById("student-drawer-overlay") || document.getElementById("lecturer-drawer-overlay");
    if (sidebar) sidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
    document.body.style.overflow = "";

    // Scroll to top of content
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Expose global navigator
  window.dimabinLecturerPortal = {
    navigateTo
  };

  navItems.forEach((btn) => {
    btn.addEventListener("click", () => {
      const sectionId = btn.getAttribute("data-section");
      if (sectionId) navigateTo(sectionId);
    });
  });

  // Quick Action Buttons
  document.querySelectorAll("[data-action]").forEach((card) => {
    card.addEventListener("click", () => {
      const action = card.getAttribute("data-action");
      if (action === "jump-courses") navigateTo("my-courses");
      else if (action === "jump-students") navigateTo("my-students");
      else if (action === "jump-grades") navigateTo("assessments");
      else if (action === "jump-notices") navigateTo("announcements");
      else if (action === "jump-profile") navigateTo("profile");
      else if (action === "jump-settings") navigateTo("settings");
    });
  });

  const jumpToAllBtn = document.getElementById("btn-jump-to-all-courses");
  if (jumpToAllBtn) jumpToAllBtn.addEventListener("click", () => navigateTo("my-courses"));

  const jumpToNoticesBtn = document.getElementById("btn-jump-to-all-notices");
  if (jumpToNoticesBtn) jumpToNoticesBtn.addEventListener("click", () => navigateTo("announcements"));

  // Mobile Drawer Toggle
  const mobileToggle = document.getElementById("student-menu-toggle") || document.getElementById("lecturer-mobile-toggle");
  const sidebar = document.getElementById("student-sidebar") || document.getElementById("lecturer-sidebar");
  const overlay = document.getElementById("student-drawer-overlay") || document.getElementById("lecturer-drawer-overlay");

  if (mobileToggle && sidebar && overlay) {
    mobileToggle.addEventListener("click", () => {
      const isOpen = sidebar.classList.toggle("open");
      overlay.classList.toggle("open", isOpen);
      document.body.style.overflow = isOpen ? "hidden" : "";
    });
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("open");
      document.body.style.overflow = "";
    });
  }

  // Sign Out Handlers
  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (_) {}
    sessionStorage.removeItem("dimabin_lecturer_session");
    localStorage.removeItem("dimabin_lecturer_session");
    window.location.href = "lecturer-login.html";
  };

  ["btn-lecturer-logout", "sidebar-logout-btn", "nav-logout-btn"].forEach((btnId) => {
    const btn = document.getElementById(btnId);
    if (btn) btn.addEventListener("click", handleSignOut);
  });

  // =========================================================================
  // 3. REAL-TIME DATA STATE MANAGEMENT
  // =========================================================================
  let allAllocationsState = [];
  let allRegistrationsState = [];
  let allResultsState = [];
  let allAnnouncementsState = [];
  let allCentresState = [];
  let allAssessmentsState = [];
  let allCbtQuestionsState = [];
  let allCbtAssessmentsState = [];
  let allCbtSubmissionsState = [];

  // Match course allocations for this lecturer
  const isMyAllocation = (alloc) => {
    if (!alloc) return false;
    const isStatusActive = (alloc.status || "active").toLowerCase() !== "ended";
    if (!isStatusActive) return false;

    const aId = (alloc.lecturerId || "").trim().toLowerCase();
    const aName = (alloc.lecturerName || "").trim().toLowerCase();

    return (
      (aId && (aId === normStaffId || aId.includes(normStaffId) || normStaffId.includes(aId))) ||
      (aName && (aName === normName || aName.includes(normName) || normName.includes(aName)))
    );
  };

  // Compile genuine enrolled students across assigned courses
  const compileEnrolledStudents = (myAllocations, allRegistrations) => {
    const myCourseCodes = new Set(myAllocations.map((a) => (a.courseCode || "").trim().toUpperCase()));
    const myCourseIds = new Set(myAllocations.map((a) => a.courseId).filter(Boolean));

    const studentList = [];

    (allRegistrations || []).forEach((reg) => {
      const regCourses = reg.courses || [];
      regCourses.forEach((c) => {
        const cCode = (c.courseCode || "").trim().toUpperCase();
        const cId = c.courseId;
        const cLecId = (c.lecturerId || "").trim().toLowerCase();
        const cLecName = (c.lecturerName || "").trim().toLowerCase();

        const matchesCourse =
          myCourseCodes.has(cCode) ||
          (cId && myCourseIds.has(cId)) ||
          (cLecId && (cLecId === normStaffId || cLecId.includes(normStaffId))) ||
          (cLecName && (cLecName === normName || cLecName.includes(normName)));

        if (matchesCourse) {
          studentList.push({
            registrationId: reg.id || `${reg.studentUid}_${cCode}`,
            studentUid: reg.studentUid || reg.userId || "",
            studentName: reg.studentName || "Candidate",
            matricNumber: reg.studentId || reg.admissionNumber || "DIMABIN/STU/2026",
            studentEmail: reg.studentEmail || "",
            studentPhone: reg.studentPhone || "",
            studyCentre: reg.studyCentre || "Abeokuta Main Campus",
            programme: reg.programme || "Diploma in Theology (Dipl.Th.)",
            level: reg.level || "Diploma I",
            academicSession: reg.academicSession || "2026/2027",
            semester: reg.semester || "First Semester",
            courseCode: cCode,
            courseTitle: c.courseTitle || c.title || "Theological Study",
            creditUnits: c.creditUnits || 3,
            registrationStatus: reg.status || "registered"
          });
        }
      });
    });

    return studentList;
  };

  // Re-render all views whenever state updates
  const refreshAllViews = () => {
    const myAllocations = allAllocationsState.filter(isMyAllocation);
    const enrolledStudents = compileEnrolledStudents(myAllocations, allRegistrationsState);

    // 1. Overview Metrics Update
    const coursesCount = myAllocations.length;
    safeSetText("hero-courses-val", coursesCount);
    safeSetText("card-courses-val", coursesCount);
    safeSetText("stat-banner-courses", coursesCount);
    safeSetText("stat-card-courses", coursesCount);

    const uniqueStudents = new Set(enrolledStudents.map((s) => s.matricNumber));
    safeSetText("hero-students-val", uniqueStudents.size);
    safeSetText("card-students-val", uniqueStudents.size);
    safeSetText("stat-banner-students", uniqueStudents.size);
    safeSetText("stat-card-students", uniqueStudents.size);

    const uniqueCentres = new Set([
      centre,
      ...myAllocations.map((a) => a.studyCentre).filter(Boolean)
    ]);
    safeSetText("card-centres-val", uniqueCentres.size);
    safeSetText("stat-banner-centres", uniqueCentres.size);
    safeSetText("stat-card-centres", uniqueCentres.size);

    safeSetText("courses-total-badge", `${coursesCount} Allocated Courses`);
    safeSetText("roster-count-badge", `${enrolledStudents.length} Students Enrolled`);

    // 2. Render Courses
    renderCoursesView(myAllocations, enrolledStudents);

    // 3. Render Enrolled Students Roster
    renderRosterView(myAllocations, enrolledStudents);

    // 4. Update Course Select Options in Grade Book & Roster
    updateCourseSelects(myAllocations);

    // 5. Render Grade Book if course selected
    renderGradeBook(myAllocations, enrolledStudents, allResultsState);
  };

  // =========================================================================
  // 4. COURSES VIEW RENDERING
  // =========================================================================
  const overviewCoursesContainer = document.getElementById("overview-courses-container");
  const fullCoursesContainer = document.getElementById("full-courses-container");
  const courseSearchInput = document.getElementById("courses-search-input");
  const courseSemesterFilter = document.getElementById("courses-semester-filter");
  const courseCentreFilter = document.getElementById("courses-centre-filter");

  const renderCoursesView = (myAllocations, enrolledStudents) => {
    if (myAllocations.length === 0) {
      const emptyHtml = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--student-text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">📚</div>
          <strong style="color: var(--student-navy); font-size: 1rem; display: block;">No Courses Currently Assigned</strong>
          <p style="font-size: 0.875rem; margin-top: 0.25rem;">
            When the Academic Administrator assigns course allocations to your institutional staff ID (${staffId}), they will appear here automatically.
          </p>
        </div>
      `;
      if (overviewCoursesContainer) overviewCoursesContainer.innerHTML = emptyHtml;
      if (fullCoursesContainer) fullCoursesContainer.innerHTML = emptyHtml;
      return;
    }

    // Overview Cards Grid (first 4)
    if (overviewCoursesContainer) {
      overviewCoursesContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem;">
          ${myAllocations.slice(0, 4).map((alloc) => {
            const countForCourse = enrolledStudents.filter(
              (s) => s.courseCode === (alloc.courseCode || "").trim().toUpperCase()
            ).length;

            return `
              <div class="course-offering-card">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                    <span class="card-course-code">${alloc.courseCode || "THY-101"}</span>
                    <span class="faculty-badge badge-active">${alloc.semester || "First Semester"}</span>
                  </div>
                  <h4 class="card-course-title">${alloc.courseTitle || "Theological Study"}</h4>
                  <div class="card-course-meta">
                    <div class="meta-row">
                      <span style="font-weight: 600;">📍 Campus:</span>
                      <span>${alloc.studyCentre || centre}</span>
                    </div>
                    <div class="meta-row">
                      <span style="font-weight: 600;">👥 Students:</span>
                      <span style="font-weight: 700; color: var(--student-blue);">${countForCourse} registered</span>
                    </div>
                  </div>
                </div>
                <div style="padding-top: 0.75rem; border-top: 1px solid var(--student-border-subtle); display: flex; justify-content: space-between; align-items: center;">
                  <button type="button" class="btn btn-outline-blue btn-sm" style="font-size: 0.75rem; padding: 0.25rem 0.6rem;" onclick="window.viewCourseRoster('${alloc.courseCode}')">
                    View Roster
                  </button>
                  <button type="button" class="btn btn-primary btn-sm" style="font-size: 0.75rem; padding: 0.25rem 0.6rem; background: var(--student-navy);" onclick="window.openCourseGradeBook('${alloc.courseCode}')">
                    Grade Sheet →
                  </button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      `;
    }

    // Full Assigned Courses List with search and filtering
    if (fullCoursesContainer) {
      const q = (courseSearchInput?.value || "").trim().toLowerCase();
      const sem = courseSemesterFilter?.value || "all";
      const cen = courseCentreFilter?.value || "all";

      const filtered = myAllocations.filter((a) => {
        const matchQ =
          !q ||
          (a.courseCode || "").toLowerCase().includes(q) ||
          (a.courseTitle || "").toLowerCase().includes(q);
        const matchSem = sem === "all" || a.semester === sem;
        const matchCen =
          cen === "all" ||
          (a.studyCentre || "").toLowerCase().includes(cen.toLowerCase());
        return matchQ && matchSem && matchCen;
      });

      if (filtered.length === 0) {
        fullCoursesContainer.innerHTML = `
          <div style="text-align: center; padding: 2.5rem 1rem; color: var(--student-text-muted);">
            <p>No courses match your filter criteria.</p>
          </div>
        `;
        return;
      }

      fullCoursesContainer.innerHTML = `
        <div class="student-table-wrap">
          <table class="student-table">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Title</th>
                <th>Study Centre</th>
                <th>Semester</th>
                <th>Enrolled</th>
                <th>Session</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map((alloc) => {
                const countForCourse = enrolledStudents.filter(
                  (s) => s.courseCode === (alloc.courseCode || "").trim().toUpperCase()
                ).length;

                return `
                  <tr>
                    <td style="font-weight: 800; color: var(--student-blue);">${alloc.courseCode || "N/A"}</td>
                    <td style="font-weight: 600; color: var(--student-navy);">${alloc.courseTitle || "N/A"}</td>
                    <td style="color: var(--student-text-muted);">${alloc.studyCentre || "All Centres"}</td>
                    <td><span class="status-pill-badge badge-blue">${alloc.semester || "1st Sem"}</span></td>
                    <td style="font-weight: 700; color: var(--student-navy);">${countForCourse} students</td>
                    <td style="color: var(--student-text-muted);">${alloc.academicSession || "2026/2027"}</td>
                    <td style="text-align: right; white-space: nowrap;">
                      <button type="button" class="btn btn-outline-blue btn-sm" style="margin-right: 0.35rem;" onclick="window.viewCourseRoster('${alloc.courseCode}')">
                        Roster
                      </button>
                      <button type="button" class="btn btn-primary btn-sm" onclick="window.openCourseGradeBook('${alloc.courseCode}')">
                        Grade
                      </button>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      `;
    }
  };

  if (courseSearchInput) courseSearchInput.addEventListener("input", refreshAllViews);
  if (courseSemesterFilter) courseSemesterFilter.addEventListener("change", refreshAllViews);
  if (courseCentreFilter) courseCentreFilter.addEventListener("change", refreshAllViews);

  // Global window helpers for course card buttons
  window.viewCourseRoster = (courseCode) => {
    navigateTo("my-students");
    const sel = document.getElementById("roster-course-select");
    if (sel) {
      sel.value = courseCode;
      renderRosterView(
        allAllocationsState.filter(isMyAllocation),
        compileEnrolledStudents(allAllocationsState.filter(isMyAllocation), allRegistrationsState)
      );
    }
  };

  window.openCourseGradeBook = (courseCode) => {
    navigateTo("assessments");
    const sel = document.getElementById("gradebook-course-select");
    if (sel) {
      sel.value = courseCode;
      renderGradeBook(
        allAllocationsState.filter(isMyAllocation),
        compileEnrolledStudents(allAllocationsState.filter(isMyAllocation), allRegistrationsState),
        allResultsState
      );
    }
  };

  // =========================================================================
  // 5. ENROLLED STUDENTS ROSTER VIEW
  // =========================================================================
  const rosterContainer = document.getElementById("roster-table-container");
  const rosterCourseSelect = document.getElementById("roster-course-select");
  const rosterCentreSelect = document.getElementById("roster-centre-select");
  const rosterSearchInput = document.getElementById("roster-search-input");
  const printRosterBtn = document.getElementById("btn-print-roster");

  const renderRosterView = (myAllocations, enrolledStudents) => {
    if (!rosterContainer) return;

    if (enrolledStudents.length === 0) {
      rosterContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--student-text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">👥</div>
          <strong style="color: var(--student-navy); font-size: 1rem; display: block;">No Registered Students Found</strong>
          <p style="font-size: 0.875rem; margin-top: 0.25rem;">
            When students complete course registration for your assigned courses, their enrollment details and rosters will appear here automatically.
          </p>
        </div>
      `;
      return;
    }

    const selCourse = rosterCourseSelect?.value || "all";
    const selCentre = rosterCentreSelect?.value || "all";
    const q = (rosterSearchInput?.value || "").trim().toLowerCase();

    const filtered = enrolledStudents.filter((stu) => {
      const matchCourse = selCourse === "all" || stu.courseCode === selCourse;
      const matchCentre = selCentre === "all" || (stu.studyCentre || "").toLowerCase().includes(selCentre.toLowerCase());
      const matchQ =
        !q ||
        stu.studentName.toLowerCase().includes(q) ||
        stu.matricNumber.toLowerCase().includes(q) ||
        stu.programme.toLowerCase().includes(q);
      return matchCourse && matchCentre && matchQ;
    });

    if (filtered.length === 0) {
      rosterContainer.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--student-text-muted);">
          <p>No student records match the selected filters.</p>
        </div>
      `;
      return;
    }

    rosterContainer.innerHTML = `
      <div class="student-table-wrap">
        <table class="student-table">
          <thead>
            <tr>
              <th style="width: 45px;">#</th>
              <th>Candidate Name</th>
              <th>Matriculation / Student ID</th>
              <th>Assigned Course</th>
              <th>Programme &amp; Level</th>
              <th>Study Centre Base</th>
              <th>Grading Status</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((stu, idx) => {
              // Check if already graded in results collection
              const existingResult = allResultsState.find(
                (r) =>
                  (r.matricNumber || "").trim().toUpperCase() === stu.matricNumber.trim().toUpperCase() &&
                  (r.courseCode || "").trim().toUpperCase() === stu.courseCode.trim().toUpperCase()
              );

              let statusBadge = `<span class="status-pill-badge badge-gold">Pending Grading</span>`;
              if (existingResult) {
                if (existingResult.status === "approved" || existingResult.status === "published") {
                  statusBadge = `<span class="status-pill-badge badge-green">Approved (${existingResult.score}%)</span>`;
                } else if (existingResult.status === "submitted") {
                  statusBadge = `<span class="status-pill-badge badge-blue">Submitted (${existingResult.score}%)</span>`;
                } else {
                  statusBadge = `<span class="status-pill-badge badge-gold">Draft (${existingResult.score}%)</span>`;
                }
              }

              return `
                <tr>
                  <td style="color: var(--student-text-muted); font-weight: 700;">${idx + 1}</td>
                  <td>
                    <strong style="color: var(--student-navy); display: block;">${stu.studentName}</strong>
                    <span style="font-size: 0.75rem; color: var(--student-text-muted);">${stu.studentEmail || ""}</span>
                  </td>
                  <td style="font-weight: 700; color: var(--student-blue); font-family: monospace;">${stu.matricNumber}</td>
                  <td>
                    <span style="font-weight: 700; color: var(--student-navy);">${stu.courseCode}</span>
                    <span style="font-size: 0.75rem; color: var(--student-text-muted); display: block;">${stu.courseTitle}</span>
                  </td>
                  <td>
                    <span>${stu.programme}</span>
                    <span style="font-size: 0.75rem; color: var(--student-text-muted); display: block;">${stu.level}</span>
                  </td>
                  <td>${stu.studyCentre}</td>
                  <td>${statusBadge}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  };

  if (rosterCourseSelect) rosterCourseSelect.addEventListener("change", refreshAllViews);
  if (rosterCentreSelect) rosterCentreSelect.addEventListener("change", refreshAllViews);
  if (rosterSearchInput) rosterSearchInput.addEventListener("input", refreshAllViews);

  if (printRosterBtn) {
    printRosterBtn.addEventListener("click", () => {
      window.print();
    });
  }

  // =========================================================================
  // 6. CONTINUOUS ASSESSMENT (30M) & FINAL EXAMINATION (70M) RESULTS ENGINE
  // =========================================================================
  const gradebookCourseSelect = document.getElementById("gradebook-course-select");
  const gradebookAlert = document.getElementById("gradebook-alert");

  // Sub-Tab Switcher Elements
  const tabBtnCa = document.getElementById("tab-btn-ca");
  const tabBtnExam = document.getElementById("tab-btn-exam");
  const tabBtnActivities = document.getElementById("tab-btn-activities");
  const paneCa = document.getElementById("pane-ca");
  const paneExam = document.getElementById("pane-exam");
  const paneActivities = document.getElementById("pane-activities");

  // Grid Containers
  const caGridContainer = document.getElementById("ca-grid-container");
  const examGridContainer = document.getElementById("exam-grid-container");
  const courseActivitiesList = document.getElementById("course-activities-list");

  // Action Buttons
  const btnSaveCaDraft = document.getElementById("btn-save-ca-draft");
  const btnPublishCaStudents = document.getElementById("btn-publish-ca-students");
  const btnUnpublishCa = document.getElementById("btn-unpublish-ca");
  const btnSaveGradeDraft = document.getElementById("btn-save-grade-draft");
  const btnSubmitGradeRegistry = document.getElementById("btn-submit-grade-registry");
  const btnPrintExamBroadsheet = document.getElementById("btn-print-exam-broadsheet");
  const btnOpenAsmtModal = document.getElementById("btn-open-asmt-modal");
  const btnNewActivityBtn = document.getElementById("btn-new-activity-btn");

  let activeGradeSubTab = "ca"; // ca | exam | activities

  const switchGradeSubTab = (tabName) => {
    activeGradeSubTab = tabName;
    const tabs = [
      { id: "ca", btn: tabBtnCa, pane: paneCa },
      { id: "exam", btn: tabBtnExam, pane: paneExam },
      { id: "activities", btn: tabBtnActivities, pane: paneActivities }
    ];

    tabs.forEach((t) => {
      if (t.id === tabName) {
        if (t.btn) {
          t.btn.classList.add("active");
          t.btn.style.background = "var(--student-blue)";
          t.btn.style.color = "#FFFFFF";
          t.btn.style.border = "none";
        }
        if (t.pane) t.pane.style.display = "block";
      } else {
        if (t.btn) {
          t.btn.classList.remove("active");
          t.btn.style.background = "#F8FAFC";
          t.btn.style.color = "var(--student-navy)";
          t.btn.style.border = "1px solid var(--student-border)";
        }
        if (t.pane) t.pane.style.display = "none";
      }
    });

    // Re-render corresponding view
    const myAllocations = allAllocationsState.filter(isMyAllocation);
    const enrolledStudents = compileEnrolledStudents(myAllocations, allRegistrationsState);
    if (tabName === "ca") renderCAView(myAllocations, enrolledStudents, allResultsState);
    else if (tabName === "exam") renderExamView(myAllocations, enrolledStudents, allResultsState);
    else if (tabName === "activities") renderActivitiesView(myAllocations, allAssessmentsState);
  };

  if (tabBtnCa) tabBtnCa.addEventListener("click", () => switchGradeSubTab("ca"));
  if (tabBtnExam) tabBtnExam.addEventListener("click", () => switchGradeSubTab("exam"));
  if (tabBtnActivities) tabBtnActivities.addEventListener("click", () => switchGradeSubTab("activities"));

  const updateCourseSelects = (myAllocations) => {
    const currentVal = gradebookCourseSelect?.value || "";
    const rosterCurrentVal = rosterCourseSelect?.value || "all";
    const asmtFormCourse = document.getElementById("asmt-form-course");

    if (gradebookCourseSelect) {
      gradebookCourseSelect.innerHTML = `
        <option value="">-- Choose Assigned Course --</option>
        ${myAllocations.map((a) => `<option value="${a.courseCode}">${a.courseCode} — ${a.courseTitle} (${a.studyCentre || "All Centres"})</option>`).join("")}
      `;
      if (currentVal && myAllocations.some((a) => a.courseCode === currentVal)) {
        gradebookCourseSelect.value = currentVal;
      }
    }

    if (rosterCourseSelect) {
      rosterCourseSelect.innerHTML = `
        <option value="all">All Assigned Courses</option>
        ${myAllocations.map((a) => `<option value="${a.courseCode}">${a.courseCode} — ${a.courseTitle}</option>`).join("")}
      `;
      if (rosterCurrentVal) {
        rosterCourseSelect.value = rosterCurrentVal;
      }
    }

    if (asmtFormCourse) {
      asmtFormCourse.innerHTML = `
        <option value="">-- Select Course --</option>
        ${myAllocations.map((a) => `<option value="${a.courseCode}">${a.courseCode} — ${a.courseTitle}</option>`).join("")}
      `;
      if (currentVal && myAllocations.some((a) => a.courseCode === currentVal)) {
        asmtFormCourse.value = currentVal;
      }
    }
  };

  const getLetterAndRemarks = (totalScore) => {
    if (totalScore >= 70) return { grade: "A", gp: "5.0", remarks: "Distinction / Excellent" };
    if (totalScore >= 60) return { grade: "B", gp: "4.0", remarks: "Very Good" };
    if (totalScore >= 50) return { grade: "C", gp: "3.0", remarks: "Good" };
    if (totalScore >= 45) return { grade: "D", gp: "2.0", remarks: "Fair" };
    if (totalScore >= 40) return { grade: "E", gp: "1.0", remarks: "Pass" };
    return { grade: "F", gp: "0.0", remarks: "Fail" };
  };

  // -------------------------------------------------------------------------
  // 6A. RENDER CONTINUOUS ASSESSMENT (CA — 30 MARKS) VIEW
  // -------------------------------------------------------------------------
  const renderCAView = (myAllocations, enrolledStudents, allResults) => {
    if (!caGridContainer) return;
    const selectedCourseCode = gradebookCourseSelect?.value || "";

    if (!selectedCourseCode) {
      caGridContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--student-text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">📖</div>
          <strong style="color: var(--student-navy); font-size: 1rem; display: block;">Select a Course Offering Above</strong>
          <p style="font-size: 0.875rem; margin-top: 0.25rem;">
            Choose one of your assigned courses from the dropdown to load the registered student roster and enter Continuous Assessment marks.
          </p>
        </div>
      `;
      if (btnUnpublishCa) btnUnpublishCa.style.display = "none";
      return;
    }

    const studentsInCourse = enrolledStudents.filter(
      (s) => s.courseCode.toUpperCase() === selectedCourseCode.toUpperCase()
    );

    if (studentsInCourse.length === 0) {
      caGridContainer.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--student-text-muted);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">📋</div>
          <strong style="color: var(--student-navy); font-size: 1rem; display: block;">No Students Registered in ${selectedCourseCode}</strong>
          <p style="font-size: 0.875rem; margin-top: 0.25rem;">
            No candidates have completed course registration for this offering yet.
          </p>
        </div>
      `;
      if (btnUnpublishCa) btnUnpublishCa.style.display = "none";
      return;
    }

    // Check if CA has been published for this course offering
    const publishedCount = studentsInCourse.filter((stu) => {
      const res = allResults.find(
        (r) =>
          (r.matricNumber || "").trim().toUpperCase() === stu.matricNumber.trim().toUpperCase() &&
          (r.courseCode || "").trim().toUpperCase() === selectedCourseCode.toUpperCase()
      );
      return res && (res.caPublished || res.caStatus === "published");
    }).length;

    if (btnUnpublishCa) {
      btnUnpublishCa.style.display = publishedCount > 0 ? "inline-block" : "none";
    }

    caGridContainer.innerHTML = `
      <div class="grade-table-wrapper">
        <table class="grade-table" id="ca-entry-table">
          <thead>
            <tr>
              <th style="width: 45px;">#</th>
              <th>Student Name</th>
              <th>Matriculation ID</th>
              <th>Study Centre</th>
              <th style="text-align: center;">CBT Test<br><span style="font-size: 0.68rem; font-weight: normal; color: var(--student-blue);">(Max 10)</span></th>
              <th style="text-align: center;">Attendance<br><span style="font-size: 0.68rem; font-weight: normal; color: var(--student-blue);">(Max 5)</span></th>
              <th style="text-align: center;">Assignment<br><span style="font-size: 0.68rem; font-weight: normal; color: var(--student-blue);">(Max 5)</span></th>
              <th style="text-align: center;">Practical<br><span style="font-size: 0.68rem; font-weight: normal; color: var(--student-blue);">(Max 10)</span></th>
              <th style="text-align: center;">Total CA<br><span style="font-size: 0.68rem; font-weight: 800; color: #15803D;">(Max 30)</span></th>
              <th style="text-align: center;">CA Status</th>
            </tr>
          </thead>
          <tbody>
            ${studentsInCourse.map((stu, idx) => {
              const existingResult = allResults.find(
                (r) =>
                  (r.matricNumber || "").trim().toUpperCase() === stu.matricNumber.trim().toUpperCase() &&
                  (r.courseCode || "").trim().toUpperCase() === selectedCourseCode.toUpperCase()
              );

              const cbt = existingResult?.cbtScore !== undefined ? existingResult.cbtScore : "";
              const att = existingResult?.attendanceScore !== undefined ? existingResult.attendanceScore : "";
              const ass = existingResult?.assignmentScore !== undefined ? existingResult.assignmentScore : "";
              const pract = existingResult?.practicalScore !== undefined ? existingResult.practicalScore : "";
              const caTotal = existingResult?.caScore !== undefined ? existingResult.caScore : "";

              const isCaPub = existingResult && (existingResult.caPublished || existingResult.caStatus === "published");
              const statusPill = isCaPub
                ? `<span class="faculty-badge badge-active" title="Visible to student in student portal">✓ Published</span>`
                : `<span class="faculty-badge badge-draft">Draft</span>`;

              return `
                <tr data-student-name="${stu.studentName}" data-matric="${stu.matricNumber}" data-centre="${stu.studyCentre}" data-session="${stu.academicSession}" data-semester="${stu.semester}">
                  <td style="color: var(--student-text-muted); font-weight: 700;">${idx + 1}</td>
                  <td>
                    <strong style="color: var(--student-navy); display: block;">${stu.studentName}</strong>
                    <span style="font-size: 0.75rem; color: var(--student-text-muted);">${stu.programme}</span>
                  </td>
                  <td style="font-weight: 700; color: var(--student-blue); font-family: monospace;">${stu.matricNumber}</td>
                  <td style="font-size: 0.8125rem;">${stu.studyCentre}</td>
                  <td style="text-align: center;">
                    <input type="number" min="0" max="10" class="grade-score-input input-ca-cbt" value="${cbt}" placeholder="0–10">
                  </td>
                  <td style="text-align: center;">
                    <input type="number" min="0" max="5" class="grade-score-input input-ca-att" value="${att}" placeholder="0–5">
                  </td>
                  <td style="text-align: center;">
                    <input type="number" min="0" max="5" class="grade-score-input input-ca-ass" value="${ass}" placeholder="0–5">
                  </td>
                  <td style="text-align: center;">
                    <input type="number" min="0" max="10" class="grade-score-input input-ca-pract" value="${pract}" placeholder="0–10">
                  </td>
                  <td style="text-align: center; font-weight: 800; font-size: 1rem; color: #15803D;" class="cell-ca-total">
                    ${caTotal !== "" ? `${caTotal}/30` : "—"}
                  </td>
                  <td style="text-align: center;" class="cell-ca-status">
                    ${statusPill}
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;

    // Dynamic row calculation
    const table = document.getElementById("ca-entry-table");
    if (!table) return;

    table.querySelectorAll("tbody tr").forEach((row) => {
      const cbtIn = row.querySelector(".input-ca-cbt");
      const attIn = row.querySelector(".input-ca-att");
      const assIn = row.querySelector(".input-ca-ass");
      const practIn = row.querySelector(".input-ca-pract");
      const caTotalCell = row.querySelector(".cell-ca-total");

      const recalcCaRow = () => {
        let cbt = parseInt(cbtIn.value, 10);
        let att = parseInt(attIn.value, 10);
        let ass = parseInt(assIn.value, 10);
        let pract = parseInt(practIn.value, 10);

        if (isNaN(cbt) && isNaN(att) && isNaN(ass) && isNaN(pract)) {
          caTotalCell.textContent = "—";
          return;
        }

        // Clamp inputs
        if (cbt > 10) { cbt = 10; cbtIn.value = 10; }
        if (cbt < 0) { cbt = 0; cbtIn.value = 0; }
        if (att > 5) { att = 5; attIn.value = 5; }
        if (att < 0) { att = 0; attIn.value = 0; }
        if (ass > 5) { ass = 5; assIn.value = 5; }
        if (ass < 0) { ass = 0; assIn.value = 0; }
        if (pract > 10) { pract = 10; practIn.value = 10; }
        if (pract < 0) { pract = 0; practIn.value = 0; }

        const safeCbt = isNaN(cbt) ? 0 : cbt;
        const safeAtt = isNaN(att) ? 0 : att;
        const safeAss = isNaN(ass) ? 0 : ass;
        const safePract = isNaN(pract) ? 0 : pract;
        const totalCa = Math.min(30, safeCbt + safeAtt + safeAss + safePract);

        caTotalCell.innerHTML = `<strong>${totalCa}/30</strong>`;
      };

      if (cbtIn) cbtIn.addEventListener("input", recalcCaRow);
      if (attIn) attIn.addEventListener("input", recalcCaRow);
      if (assIn) assIn.addEventListener("input", recalcCaRow);
      if (practIn) practIn.addEventListener("input", recalcCaRow);
    });
  };

  // -------------------------------------------------------------------------
  // 6B. RENDER FINAL EXAMINATION (70 MARKS) & BROADSHEET VIEW
  // -------------------------------------------------------------------------
  const renderExamView = (myAllocations, enrolledStudents, allResults) => {
    if (!examGridContainer) return;
    const selectedCourseCode = gradebookCourseSelect?.value || "";

    if (!selectedCourseCode) {
      examGridContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--student-text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">📖</div>
          <strong style="color: var(--student-navy); font-size: 1rem; display: block;">Select a Course Offering Above</strong>
          <p style="font-size: 0.875rem; margin-top: 0.25rem;">
            Choose one of your assigned courses from the dropdown to load examination scores and registry submissions.
          </p>
        </div>
      `;
      return;
    }

    const studentsInCourse = enrolledStudents.filter(
      (s) => s.courseCode.toUpperCase() === selectedCourseCode.toUpperCase()
    );

    if (studentsInCourse.length === 0) {
      examGridContainer.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--student-text-muted);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">📋</div>
          <strong style="color: var(--student-navy); font-size: 1rem; display: block;">No Students Registered in ${selectedCourseCode}</strong>
          <p style="font-size: 0.875rem; margin-top: 0.25rem;">
            No candidates have completed course registration for this offering yet.
          </p>
        </div>
      `;
      return;
    }

    examGridContainer.innerHTML = `
      <div class="grade-table-wrapper">
        <table class="grade-table" id="exam-entry-table">
          <thead>
            <tr>
              <th style="width: 45px;">#</th>
              <th>Student Name</th>
              <th>Matriculation ID</th>
              <th style="text-align: center;">Total CA<br><span style="font-size: 0.68rem; font-weight: normal; color: var(--student-blue);">(Max 30)</span></th>
              <th style="text-align: center;">Exam Mark<br><span style="font-size: 0.68rem; font-weight: normal; color: var(--student-blue);">(Max 70)</span></th>
              <th style="text-align: center;">Final Total<br><span style="font-size: 0.68rem; font-weight: 800; color: var(--student-navy);">(100%)</span></th>
              <th style="text-align: center;">Grade</th>
              <th style="text-align: center;">GP</th>
              <th>Remarks</th>
              <th>Registry Status</th>
            </tr>
          </thead>
          <tbody>
            ${studentsInCourse.map((stu, idx) => {
              const existingResult = allResults.find(
                (r) =>
                  (r.matricNumber || "").trim().toUpperCase() === stu.matricNumber.trim().toUpperCase() &&
                  (r.courseCode || "").trim().toUpperCase() === selectedCourseCode.toUpperCase()
              );

              const caVal = existingResult?.caScore !== undefined ? existingResult.caScore : 0;
              const initialExam = existingResult?.examScore !== undefined ? existingResult.examScore : "";
              const initialTotal = existingResult?.score !== undefined ? existingResult.score : "";
              const initialGrade = existingResult ? existingResult.grade || "F" : "—";
              const initialGp = existingResult?.gradePoint !== undefined ? existingResult.gradePoint : "—";
              const initialRemarks = existingResult ? existingResult.remarks || "Pending Entry" : "Pending Entry";
              const statusVal = existingResult ? existingResult.status || "draft" : "draft";

              let statusBadge = `<span class="faculty-badge badge-draft">Draft</span>`;
              if (statusVal === "approved" || statusVal === "published") {
                statusBadge = `<span class="faculty-badge badge-active">Approved &amp; Published</span>`;
              } else if (statusVal === "submitted") {
                statusBadge = `<span class="faculty-badge badge-blue">Submitted to Registry</span>`;
              } else if (statusVal === "rejected") {
                statusBadge = `<span class="faculty-badge" style="background:#FEE2E2; color:#B91C1C; border:1px solid #FCA5A5;">Revision Requested</span>`;
              }

              const isLocked = statusVal === "approved" || statusVal === "published";

              return `
                <tr data-student-name="${stu.studentName}" data-matric="${stu.matricNumber}" data-centre="${stu.studyCentre}" data-session="${stu.academicSession}" data-semester="${stu.semester}" data-ca="${caVal}">
                  <td style="color: var(--student-text-muted); font-weight: 700;">${idx + 1}</td>
                  <td>
                    <strong style="color: var(--student-navy); display: block;">${stu.studentName}</strong>
                    <span style="font-size: 0.75rem; color: var(--student-text-muted);">${stu.programme}</span>
                  </td>
                  <td style="font-weight: 700; color: var(--student-blue); font-family: monospace;">${stu.matricNumber}</td>
                  <td style="text-align: center; font-weight: 700; color: #15803D;" class="cell-exam-ca">
                    ${caVal}/30
                  </td>
                  <td style="text-align: center;">
                    <input 
                      type="number" 
                      min="0" 
                      max="70" 
                      class="grade-score-input input-exam" 
                      value="${initialExam}" 
                      placeholder="0–70"
                      ${isLocked ? "disabled" : ""}
                    >
                  </td>
                  <td style="text-align: center; font-weight: 800; font-size: 0.95rem; color: var(--student-navy);" class="cell-total">
                    ${initialTotal !== "" ? `${initialTotal}%` : "—"}
                  </td>
                  <td style="text-align: center;" class="cell-grade">
                    ${initialTotal !== "" ? `<span class="grade-letter-pill ${initialGrade}">${initialGrade}</span>` : "—"}
                  </td>
                  <td style="text-align: center; font-weight: 700; font-size: 0.84rem; color: var(--student-navy);" class="cell-gp">
                    ${initialGp}
                  </td>
                  <td style="font-size: 0.8125rem; color: var(--student-text-muted);" class="cell-remarks">
                    ${initialRemarks}
                  </td>
                  <td class="cell-status">
                    ${statusBadge}
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;

    // Attach dynamic examination calculation listeners
    const table = document.getElementById("exam-entry-table");
    if (!table) return;

    table.querySelectorAll("tbody tr").forEach((row) => {
      const examInput = row.querySelector(".input-exam");
      const totalCell = row.querySelector(".cell-total");
      const gradeCell = row.querySelector(".cell-grade");
      const gpCell = row.querySelector(".cell-gp");
      const remarksCell = row.querySelector(".cell-remarks");
      const caVal = parseInt(row.getAttribute("data-ca"), 10) || 0;

      const recalcExamRow = () => {
        let exam = parseInt(examInput.value, 10);
        if (isNaN(exam)) {
          totalCell.textContent = "—";
          gradeCell.innerHTML = "—";
          gpCell.textContent = "—";
          remarksCell.textContent = "Pending Entry";
          return;
        }

        if (exam > 70) { exam = 70; examInput.value = 70; }
        if (exam < 0) { exam = 0; examInput.value = 0; }

        const safeExam = isNaN(exam) ? 0 : exam;
        const total = Math.min(100, caVal + safeExam);

        const { grade, gp, remarks } = getLetterAndRemarks(total);
        totalCell.textContent = `${total}%`;
        gradeCell.innerHTML = `<span class="grade-letter-pill ${grade}">${grade}</span>`;
        gpCell.textContent = gp;
        remarksCell.textContent = remarks;
      };

      if (examInput) examInput.addEventListener("input", recalcExamRow);
    });
  };

  // -------------------------------------------------------------------------
  // 6C. RENDER ASSESSMENT ACTIVITIES & CBT MANAGER VIEW
  // -------------------------------------------------------------------------
  const renderActivitiesView = (myAllocations, allAssessments) => {
    if (!courseActivitiesList) return;
    const selectedCourseCode = (gradebookCourseSelect?.value || "").trim().toUpperCase();

    if (!selectedCourseCode) {
      courseActivitiesList.innerHTML = `
        <div class="student-empty-box">
          <div class="student-empty-icon">🖥️</div>
          <div class="student-empty-text">Select a Course Offering Above</div>
          <div class="student-empty-sub">Choose an assigned course to view or create CBT tests, assignments, and practicals.</div>
        </div>
      `;
      return;
    }

    const filtered = (allAssessments || []).filter(
      (a) => (a.courseCode || "").trim().toUpperCase() === selectedCourseCode
    );

    if (filtered.length === 0) {
      courseActivitiesList.innerHTML = `
        <div class="student-empty-box">
          <div class="student-empty-icon">📝</div>
          <div class="student-empty-text">No Assessment Activities for ${selectedCourseCode}</div>
          <div class="student-empty-sub">
            Click "+ Create Assessment Activity" to configure CBT tests (max 10m), assignments (max 5m), attendance rubrics (max 5m), or practicals (max 10m).
          </div>
        </div>
      `;
      return;
    }

    courseActivitiesList.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 1.25rem;">
        ${filtered.map((item) => {
          const typeIcons = {
            cbt: "🖥️ CBT TEST",
            attendance: "📋 ATTENDANCE",
            assignment: "✍️ ASSIGNMENT",
            practical: "🔬 PRACTICAL"
          };
          const badgeClass = item.type === "cbt" ? "badge-blue" : item.type === "practical" ? "badge-purple" : "badge-green";

          return `
            <div class="course-offering-card" style="border-top: 3px solid var(--student-blue);">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <span class="faculty-badge ${badgeClass}">${typeIcons[item.type] || item.type.toUpperCase()}</span>
                  <span style="font-weight: 800; font-size: 0.8125rem; color: var(--student-navy);">${item.maxScore} Marks Max</span>
                </div>
                <h4 style="font-size: 1rem; font-weight: 700; color: var(--student-navy); margin-bottom: 0.4rem;">${item.title}</h4>
                <p style="font-size: 0.8125rem; color: var(--student-text-muted); line-height: 1.4; margin-bottom: 0.75rem;">
                  ${item.description || "No additional instructions provided."}
                </p>
                <div style="font-size: 0.75rem; color: var(--student-text-muted); display: flex; flex-direction: column; gap: 0.25rem;">
                  ${item.durationMinutes ? `<div>⏱️ <strong>Duration:</strong> ${item.durationMinutes} Minutes</div>` : ""}
                  ${item.dueDate ? `<div>📅 <strong>Deadline/Date:</strong> ${item.dueDate}</div>` : ""}
                  <div>🗓️ <strong>Created:</strong> ${formatDateOnly(item.createdAt)}</div>
                </div>
              </div>
              <div style="padding-top: 0.75rem; border-top: 1px solid var(--student-border-subtle); display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
                <button type="button" class="btn btn-outline-blue btn-sm" style="font-size: 0.75rem; padding: 0.25rem 0.6rem;" onclick="window.switchGradeSubTab('ca')">
                  Score in CA Sheet →
                </button>
                <button type="button" class="btn btn-sm" style="background:#FEE2E2; color:#B91C1C; border:1px solid #FECACA; font-size: 0.75rem; padding: 0.25rem 0.6rem;" onclick="window.deleteAssessmentActivity('${item.id}')">
                  Delete
                </button>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  };

  window.switchGradeSubTab = switchGradeSubTab;

  window.deleteAssessmentActivity = async (asmtId) => {
    if (!confirm("Are you sure you want to delete this assessment activity?")) return;
    try {
      await deleteCourseAssessment(asmtId);
      showGradebookAlert("Assessment activity deleted successfully.", "success");
    } catch (err) {
      showGradebookAlert(`Delete failed: ${err.message}`, "error");
    }
  };

  const renderGradeBook = (myAllocations, enrolledStudents, allResults) => {
    if (activeGradeSubTab === "ca") {
      renderCAView(myAllocations, enrolledStudents, allResults);
    } else if (activeGradeSubTab === "exam") {
      renderExamView(myAllocations, enrolledStudents, allResults);
    } else if (activeGradeSubTab === "activities") {
      renderActivitiesView(myAllocations, allAssessmentsState);
    }
  };

  if (gradebookCourseSelect) {
    gradebookCourseSelect.addEventListener("change", () => {
      const myAllocations = allAllocationsState.filter(isMyAllocation);
      const enrolledStudents = compileEnrolledStudents(myAllocations, allRegistrationsState);
      renderGradeBook(myAllocations, enrolledStudents, allResultsState);
    });
  }

  // -------------------------------------------------------------------------
  // 6D. SAVE & PUBLISH CONTINUOUS ASSESSMENT (CA)
  // -------------------------------------------------------------------------
  const handleSaveCA = async (publishToStudents) => {
    const selectedCourseCode = gradebookCourseSelect?.value;
    if (!selectedCourseCode) {
      showGradebookAlert("Please select an assigned course first.", "error");
      return;
    }

    const table = document.getElementById("ca-entry-table");
    if (!table) return;

    const rows = table.querySelectorAll("tbody tr");
    const myAllocations = allAllocationsState.filter(isMyAllocation);
    const courseObj = myAllocations.find((a) => a.courseCode === selectedCourseCode);

    const caEntriesToSave = [];

    rows.forEach((row) => {
      const cbtIn = row.querySelector(".input-ca-cbt");
      const attIn = row.querySelector(".input-ca-att");
      const assIn = row.querySelector(".input-ca-ass");
      const practIn = row.querySelector(".input-ca-pract");

      const cbtVal = cbtIn ? cbtIn.value.trim() : "";
      const attVal = attIn ? attIn.value.trim() : "";
      const assVal = assIn ? assIn.value.trim() : "";
      const practVal = practIn ? practIn.value.trim() : "";

      // Only process if at least one field has an entry or if publishing
      if (cbtVal !== "" || attVal !== "" || assVal !== "" || practVal !== "" || publishToStudents) {
        const studentName = row.getAttribute("data-student-name");
        const matricNumber = row.getAttribute("data-matric");
        const studyCentre = row.getAttribute("data-centre");
        const sessionVal = row.getAttribute("data-session") || "2026/2027";
        const semesterVal = row.getAttribute("data-semester") || "First Semester";

        caEntriesToSave.push({
          studentName,
          matricNumber,
          courseCode: selectedCourseCode,
          courseTitle: courseObj?.courseTitle || "Theological Study",
          creditUnits: courseObj?.creditUnits || 3,
          studyCentre,
          academicSession: sessionVal,
          semester: semesterVal,
          cbtScore: cbtVal !== "" ? parseInt(cbtVal, 10) : 0,
          attendanceScore: attVal !== "" ? parseInt(attVal, 10) : 0,
          assignmentScore: assVal !== "" ? parseInt(assVal, 10) : 0,
          practicalScore: practVal !== "" ? parseInt(practVal, 10) : 0,
          caPublished: publishToStudents,
          caStatus: publishToStudents ? "published" : "draft",
          lecturerStaffId: staffId,
          lecturerName: fullName
        });
      }
    });

    if (caEntriesToSave.length === 0) {
      showGradebookAlert("No Continuous Assessment marks have been entered. Enter marks before saving.", "error");
      return;
    }

    if (publishToStudents) {
      if (!confirm(`Publish Continuous Assessment marks directly to all ${caEntriesToSave.length} enrolled student(s) in ${selectedCourseCode}?\n\nEnrolled students will immediately be able to view their CBT, Attendance, Assignment, Practical, and Total CA marks in their Student Portal.`)) {
        return;
      }
    }

    const btn = publishToStudents ? btnPublishCaStudents : btnSaveCaDraft;
    const origHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span>Saving CA...</span>`;

    try {
      for (const entry of caEntriesToSave) {
        await saveLecturerGradeRecord(entry);
      }

      if (publishToStudents) {
        await publishCourseCAResults(selectedCourseCode, {
          session: "2026/2027",
          semester: "First Semester",
          studyCentre: "all",
          lecturerStaffId: staffId,
          lecturerName: fullName
        });

        showGradebookAlert(
          `✓ Success: Continuous Assessment (CA) scores published directly to ${caEntriesToSave.length} enrolled students for ${selectedCourseCode}. Enrolled students can now view their scores immediately.`,
          "success"
        );
      } else {
        showGradebookAlert(
          `✓ Draft CA scores saved for ${caEntriesToSave.length} students in ${selectedCourseCode}. You can continue editing or publish when ready.`,
          "success"
        );
      }
    } catch (err) {
      showGradebookAlert(`Failed to save CA scores: ${err.message}`, "error");
    } finally {
      btn.disabled = false;
      btn.innerHTML = origHtml;
    }
  };

  if (btnSaveCaDraft) btnSaveCaDraft.addEventListener("click", () => handleSaveCA(false));
  if (btnPublishCaStudents) btnPublishCaStudents.addEventListener("click", () => handleSaveCA(true));

  if (btnUnpublishCa) {
    btnUnpublishCa.addEventListener("click", async () => {
      const selectedCourseCode = gradebookCourseSelect?.value;
      if (!selectedCourseCode) return;
      if (!confirm(`Withdraw CA publication for ${selectedCourseCode}? Scores will revert to draft and become hidden from student view.`)) return;

      try {
        await unpublishCourseCAResults(selectedCourseCode, {
          session: "2026/2027",
          semester: "First Semester",
          studyCentre: "all"
        });
        showGradebookAlert(`Continuous Assessment for ${selectedCourseCode} reverted to draft status.`, "success");
      } catch (err) {
        showGradebookAlert(`Failed to unpublish CA: ${err.message}`, "error");
      }
    });
  }

  // -------------------------------------------------------------------------
  // 6E. SAVE & SUBMIT FINAL EXAMINATION (70 MARKS)
  // -------------------------------------------------------------------------
  const handleSaveGrades = async (targetStatus) => {
    const selectedCourseCode = gradebookCourseSelect?.value;
    if (!selectedCourseCode) {
      showGradebookAlert("Please select an assigned course first.", "error");
      return;
    }

    const table = document.getElementById("exam-entry-table");
    if (!table) return;

    const rows = table.querySelectorAll("tbody tr");
    const myAllocations = allAllocationsState.filter(isMyAllocation);
    const courseObj = myAllocations.find((a) => a.courseCode === selectedCourseCode);

    const gradeEntriesToSave = [];

    rows.forEach((row) => {
      const examInput = row.querySelector(".input-exam");
      if (!examInput) return;

      const examVal = examInput.value.trim();
      const caVal = parseInt(row.getAttribute("data-ca"), 10) || 0;

      // Only save if exam mark is provided or if submitted
      if (examVal !== "" || targetStatus === "submitted") {
        const studentName = row.getAttribute("data-student-name");
        const matricNumber = row.getAttribute("data-matric");
        const studyCentre = row.getAttribute("data-centre");
        const sessionVal = row.getAttribute("data-session") || "2026/2027";
        const semesterVal = row.getAttribute("data-semester") || "First Semester";

        gradeEntriesToSave.push({
          studentName,
          matricNumber,
          courseCode: selectedCourseCode,
          courseTitle: courseObj?.courseTitle || "Theological Study",
          creditUnits: courseObj?.creditUnits || 3,
          studyCentre,
          academicSession: sessionVal,
          semester: semesterVal,
          caScore: caVal,
          examScore: examVal !== "" ? parseInt(examVal, 10) : 0,
          status: targetStatus,
          lecturerStaffId: staffId,
          lecturerName: fullName
        });
      }
    });

    if (gradeEntriesToSave.length === 0) {
      showGradebookAlert("No examination marks have been entered yet. Enter exam marks before saving.", "error");
      return;
    }

    if (targetStatus === "submitted") {
      if (!confirm(`Submit final examination results for ${gradeEntriesToSave.length} students in ${selectedCourseCode} to the Academic Registry?\n\nNote: Submitted results will be reviewed and officially approved by the Academic Registry prior to semester publication.`)) {
        return;
      }
    }

    const btn = targetStatus === "submitted" ? btnSubmitGradeRegistry : btnSaveGradeDraft;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span>Saving...</span>`;

    try {
      for (const entry of gradeEntriesToSave) {
        await saveLecturerGradeRecord(entry);
      }

      const count = gradeEntriesToSave.length;
      if (targetStatus === "submitted") {
        await submitCourseGradesToRegistry(selectedCourseCode, {
          session: "2026/2027",
          semester: "First Semester",
          studyCentre: "all",
          lecturerStaffId: staffId,
          lecturerName: fullName
        });

        showGradebookAlert(
          `✓ Successfully submitted examination results for ${count} students in ${selectedCourseCode} to Academic Registry for verification and approval.`,
          "success"
        );
      } else {
        showGradebookAlert(
          `✓ Draft examination scores saved for ${count} students in ${selectedCourseCode}. You can return and complete editing anytime.`,
          "success"
        );
      }
    } catch (err) {
      showGradebookAlert(`Failed to save grades: ${err.message}`, "error");
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  };

  if (btnSaveGradeDraft) btnSaveGradeDraft.addEventListener("click", () => handleSaveGrades("draft"));
  if (btnSubmitGradeRegistry) btnSubmitGradeRegistry.addEventListener("click", () => handleSaveGrades("submitted"));

  if (btnPrintExamBroadsheet) {
    btnPrintExamBroadsheet.addEventListener("click", () => {
      window.print();
    });
  }

  // -------------------------------------------------------------------------
  // 6F. ASSESSMENT ACTIVITY CREATION MODAL HANDLERS
  // -------------------------------------------------------------------------
  const modalCreateAsmt = document.getElementById("modal-create-assessment");
  const formCreateAsmt = document.getElementById("form-create-assessment");
  const btnCloseAsmtModal = document.getElementById("btn-close-asmt-modal");
  const btnCancelAsmtModal = document.getElementById("btn-cancel-asmt-modal");
  const asmtFormType = document.getElementById("asmt-form-type");
  const asmtFormMax = document.getElementById("asmt-form-max");
  const wrapAsmtDuration = document.getElementById("wrap-asmt-duration");

  const openAsmtModal = () => {
    if (!modalCreateAsmt) return;
    const currentCourse = gradebookCourseSelect?.value || "";
    const asmtFormCourse = document.getElementById("asmt-form-course");
    if (asmtFormCourse && currentCourse) {
      asmtFormCourse.value = currentCourse;
    }
    modalCreateAsmt.style.display = "flex";
  };

  const closeAsmtModal = () => {
    if (!modalCreateAsmt) return;
    modalCreateAsmt.style.display = "none";
    if (formCreateAsmt) formCreateAsmt.reset();
  };

  if (btnOpenAsmtModal) btnOpenAsmtModal.addEventListener("click", openAsmtModal);
  if (btnNewActivityBtn) btnNewActivityBtn.addEventListener("click", openAsmtModal);
  if (btnCloseAsmtModal) btnCloseAsmtModal.addEventListener("click", closeAsmtModal);
  if (btnCancelAsmtModal) btnCancelAsmtModal.addEventListener("click", closeAsmtModal);

  if (asmtFormType && asmtFormMax) {
    asmtFormType.addEventListener("change", () => {
      const val = asmtFormType.value;
      if (val === "cbt") {
        asmtFormMax.value = 10;
        if (wrapAsmtDuration) wrapAsmtDuration.style.display = "block";
      } else if (val === "attendance") {
        asmtFormMax.value = 5;
        if (wrapAsmtDuration) wrapAsmtDuration.style.display = "none";
      } else if (val === "assignment") {
        asmtFormMax.value = 5;
        if (wrapAsmtDuration) wrapAsmtDuration.style.display = "none";
      } else if (val === "practical") {
        asmtFormMax.value = 10;
        if (wrapAsmtDuration) wrapAsmtDuration.style.display = "none";
      }
    });
  }

  if (formCreateAsmt) {
    formCreateAsmt.addEventListener("submit", async (e) => {
      e.preventDefault();
      const courseCode = document.getElementById("asmt-form-course")?.value;
      const type = document.getElementById("asmt-form-type")?.value || "cbt";
      const title = document.getElementById("asmt-form-title")?.value.trim();
      const maxScore = parseInt(document.getElementById("asmt-form-max")?.value, 10) || 10;
      const durationMinutes = parseInt(document.getElementById("asmt-form-duration")?.value, 10) || 30;
      const dueDate = document.getElementById("asmt-form-duedate")?.value || "";
      const description = document.getElementById("asmt-form-desc")?.value.trim() || "";

      if (!courseCode) {
        alert("Please select a target course offering.");
        return;
      }
      if (!title) {
        alert("Please provide an assessment title.");
        return;
      }

      const btnSubmit = document.getElementById("btn-submit-asmt-form");
      const origText = btnSubmit.textContent;
      btnSubmit.disabled = true;
      btnSubmit.textContent = "Creating...";

      try {
        await createCourseAssessment({
          courseCode,
          type,
          title,
          maxScore,
          durationMinutes,
          dueDate,
          description,
          lecturerStaffId: staffId,
          lecturerName: fullName
        });

        closeAsmtModal();
        showGradebookAlert(`✓ Assessment activity "${title}" created successfully for ${courseCode}.`, "success");
        switchGradeSubTab("activities");
      } catch (err) {
        alert(`Failed to create assessment: ${err.message}`);
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = origText;
      }
    });
  }

  const showGradebookAlert = (msg, type) => {
    if (!gradebookAlert) return;
    gradebookAlert.style.display = "block";
    if (type === "success") {
      gradebookAlert.style.background = "#DCFCE7";
      gradebookAlert.style.color = "#15803D";
      gradebookAlert.style.border = "1px solid #BBF7D0";
    } else {
      gradebookAlert.style.background = "#FEE2E2";
      gradebookAlert.style.color = "#B91C1C";
      gradebookAlert.style.border = "1px solid #FCA5A5";
    }
    gradebookAlert.textContent = msg;
    gradebookAlert.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  // =========================================================================
  // 7. REAL-TIME ANNOUNCEMENTS & NOTICES
  // =========================================================================
  const announcementsContainer = document.getElementById("announcements-container");
  const overviewNoticesContainer = document.getElementById("overview-notices-container");
  const noticesSearchInput = document.getElementById("notices-search-input");
  const noticesCategoryFilter = document.getElementById("notices-category-filter");

  const renderNotices = () => {
    if (!announcementsContainer) return;
    const notices = allAnnouncementsState || [];

    if (notices.length === 0) {
      const emptyHtml = `
        <div style="text-align: center; padding: 2rem; color: var(--student-text-muted);">
          <p>No circulars or official notices currently posted.</p>
        </div>
      `;
      announcementsContainer.innerHTML = emptyHtml;
      if (overviewNoticesContainer) overviewNoticesContainer.innerHTML = emptyHtml;
      return;
    }

    // Overview notices preview (first 3)
    if (overviewNoticesContainer) {
      overviewNoticesContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${notices.slice(0, 3).map((notice) => `
            <div style="padding: 0.75rem; background: var(--student-bg); border-left: 3px solid var(--student-blue); border-radius: var(--student-radius-sm);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                <strong style="color: var(--student-navy); font-size: 0.875rem;">${notice.title || "Academic Notice"}</strong>
                <span style="font-size: 0.72rem; color: var(--student-text-muted);">${formatDateOnly(notice.createdAt)}</span>
              </div>
              <p style="font-size: 0.8125rem; color: var(--student-text-main); line-height: 1.4; margin-bottom: 0.25rem;">
                ${(notice.message || "").substring(0, 140)}${(notice.message || "").length > 140 ? "..." : ""}
              </p>
            </div>
          `).join("")}
        </div>
      `;
    }

    // Full notices section with filtering
    const q = (noticesSearchInput?.value || "").trim().toLowerCase();
    const cat = noticesCategoryFilter?.value || "all";

    const filtered = notices.filter((n) => {
      const matchQ =
        !q ||
        (n.title || "").toLowerCase().includes(q) ||
        (n.message || "").toLowerCase().includes(q);
      const matchCat = cat === "all" || (n.category || "general").toLowerCase() === cat.toLowerCase();
      return matchQ && matchCat;
    });

    if (filtered.length === 0) {
      announcementsContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--student-text-muted);">
          <p>No circulars match your search.</p>
        </div>
      `;
      return;
    }

    announcementsContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${filtered.map((notice) => `
          <div style="background: var(--student-bg); border-left: 4px solid var(--student-blue); padding: 1.25rem; border-radius: var(--student-radius-sm); border: 1px solid var(--student-border-subtle);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
              <strong style="color: var(--student-navy); font-size: 1rem;">${notice.title || "Academic Circular"}</strong>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <span class="faculty-badge badge-blue">${notice.category || "Official"}</span>
                <span style="font-size: 0.75rem; color: var(--student-text-muted);">${formatDateTime(notice.createdAt)}</span>
              </div>
            </div>
            <p style="font-size: 0.9rem; color: var(--student-text-main); margin-bottom: 0.75rem; line-height: 1.55; white-space: pre-line;">
              ${notice.message || ""}
            </p>
            <div style="font-size: 0.75rem; color: var(--student-text-muted); display: flex; justify-content: space-between;">
              <span>Issued by: <strong>${notice.author || "Academic Registry"}</strong></span>
              <span>DIMABIN Academic Portal</span>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  };

  if (noticesSearchInput) noticesSearchInput.addEventListener("input", renderNotices);
  if (noticesCategoryFilter) noticesCategoryFilter.addEventListener("change", renderNotices);

  // =========================================================================
  // 8. AUDIT ACTIVITY LOG STREAM
  // =========================================================================
  const activityContainer = document.getElementById("dashboard-activity-container");

  const renderActivityFeed = (logs) => {
    if (!activityContainer) return;
    const myLogs = (logs || []).filter((log) => {
      const desc = (log.description || "").toLowerCase();
      const docId = (log.targetDocumentId || "").toLowerCase();
      return (
        docId === normStaffId ||
        desc.includes(normStaffId) ||
        desc.includes(normName) ||
        log.action === "lecturer_login" ||
        log.action === "grade_submitted_registry"
      );
    });

    if (myLogs.length === 0) {
      activityContainer.innerHTML = `
        <div style="text-align: center; padding: 1.5rem; color: var(--student-text-muted); font-size: 0.875rem;">
          No faculty portal activity recorded yet this session.
        </div>
      `;
      return;
    }

    activityContainer.innerHTML = `
      <div>
        ${myLogs.slice(0, 5).map((log) => `
          <div class="activity-stream-item">
            <div class="activity-icon-bubble">
              ${log.action.includes("login") ? "🔑" : log.action.includes("grade") ? "📝" : "📌"}
            </div>
            <div class="activity-content">
              <div class="activity-title">${log.description || "Faculty Activity Recorded"}</div>
              <div class="activity-time">${formatDateTime(log.timestamp || log.createdAt)}</div>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  };

  // =========================================================================
  // 9. PROFILE PHOTO UPLOAD
  // =========================================================================
  const photoInput = document.getElementById("prof-photo-input");
  if (photoInput) {
    photoInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file (PNG, JPG, JPEG).");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        alert("Image file size exceeds 2MB limit. Please select a smaller photo.");
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result;
        try {
          await updateLecturerSelfProfile(staffId, { photoUrl: dataUrl });
          updateAvatarDisplays(dataUrl);
          alert("✓ Profile photograph updated successfully.");
        } catch (err) {
          alert(`Failed to save photo: ${err.message}`);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // =========================================================================
  // 10. ACCOUNT & SECURITY SETTINGS CONTROLLERS
  // =========================================================================
  const formChangePassword = document.getElementById("form-change-password");
  const passAlert = document.getElementById("settings-password-alert");
  const btnResetEmail = document.getElementById("btn-request-reset-email");

  const showPassAlert = (msg, type) => {
    if (!passAlert) return;
    passAlert.style.display = "block";
    passAlert.style.background = type === "success" ? "#DCFCE7" : "#FEE2E2";
    passAlert.style.color = type === "success" ? "#15803D" : "#B91C1C";
    passAlert.style.border = type === "success" ? "1px solid #BBF7D0" : "1px solid #FCA5A5";
    passAlert.textContent = msg;
  };

  if (formChangePassword) {
    formChangePassword.addEventListener("submit", async (e) => {
      e.preventDefault();
      const curPass = document.getElementById("pass-current").value;
      const newPass = document.getElementById("pass-new").value;
      const confPass = document.getElementById("pass-confirm").value;

      if (newPass !== confPass) {
        showPassAlert("New password and confirm password do not match.", "error");
        return;
      }

      if (newPass.length < 6) {
        showPassAlert("New password must be at least 6 characters long.", "error");
        return;
      }

      const submitBtn = document.getElementById("btn-submit-change-password");
      submitBtn.disabled = true;
      submitBtn.textContent = "Updating Password...";

      try {
        await changeLecturerPassword(email, curPass, newPass);
        showPassAlert("✓ Password changed successfully! Use your new password on next login.", "success");
        formChangePassword.reset();
      } catch (err) {
        showPassAlert(err.message || "Failed to update password. Verify current credentials.", "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Update Password";
      }
    });
  }

  if (btnResetEmail) {
    btnResetEmail.addEventListener("click", async () => {
      if (!confirm(`Dispatch an official password reset link to your institutional email (${email})?`)) return;
      try {
        await sendLecturerPasswordReset(email);
        alert(`✓ Password reset email sent to ${email}. Check your inbox for instructions.`);
      } catch (err) {
        alert(`Reset request error: ${err.message}`);
      }
    });
  }

  // Profile Information Update
  const formUpdateProfile = document.getElementById("form-update-profile");
  const profileAlert = document.getElementById("settings-profile-alert");

  if (formUpdateProfile) {
    formUpdateProfile.addEventListener("submit", async (e) => {
      e.preventDefault();
      const updatedPhone = document.getElementById("settings-phone").value.trim();
      const updatedQual = document.getElementById("settings-qualification").value.trim();
      const updatedSpec = document.getElementById("settings-specialization").value.trim();

      const btn = document.getElementById("btn-submit-update-profile");
      btn.disabled = true;
      btn.textContent = "Saving Profile...";

      try {
        await updateLecturerSelfProfile(staffId, {
          phone: updatedPhone,
          qualification: updatedQual,
          specialization: updatedSpec
        });

        safeSetText("prof-phone", updatedPhone || "Not specified");
        safeSetText("prof-qualification", updatedQual);
        safeSetText("prof-specialization", updatedSpec);

        if (profileAlert) {
          profileAlert.style.display = "block";
          profileAlert.style.background = "#DCFCE7";
          profileAlert.style.color = "#15803D";
          profileAlert.style.border = "1px solid #BBF7D0";
          profileAlert.textContent = "✓ Faculty contact and specialization details updated successfully.";
        }
      } catch (err) {
        if (profileAlert) {
          profileAlert.style.display = "block";
          profileAlert.style.background = "#FEE2E2";
          profileAlert.style.color = "#B91C1C";
          profileAlert.style.border = "1px solid #FCA5A5";
          profileAlert.textContent = `Update failed: ${err.message}`;
        }
      } finally {
        btn.disabled = false;
        btn.textContent = "Save Changes";
      }
    });
  }
  // 10. COMPUTER-BASED TEST (CBT) ENGINE CONTROLLER
  // =========================================================================
  const initCbtEngineController = () => {
    const cbtAlertBanner = document.getElementById("cbt-alert-banner");
    const subnavButtons = document.querySelectorAll(".cbt-subnav-btn");
    const tabPanes = {
      dashboard: document.getElementById("cbt-pane-dashboard"),
      questions: document.getElementById("cbt-pane-questions"),
      create: document.getElementById("cbt-pane-create"),
      scheduled: document.getElementById("cbt-pane-scheduled"),
      live: document.getElementById("cbt-pane-live"),
      completed: document.getElementById("cbt-pane-completed"),
      submissions: document.getElementById("cbt-pane-submissions"),
      results: document.getElementById("cbt-pane-results"),
      settings: document.getElementById("cbt-pane-settings")
    };

    let activeCbtTab = "dashboard";
    let selectedPickerQuestionIds = new Set();
    let currentGradingSubmission = null;

    const showCbtAlert = (msg, type = "info") => {
      if (!cbtAlertBanner) return;
      cbtAlertBanner.style.display = "block";
      if (type === "success") {
        cbtAlertBanner.style.background = "#DCFCE7";
        cbtAlertBanner.style.color = "#15803D";
        cbtAlertBanner.style.border = "1px solid #BBF7D0";
      } else if (type === "error") {
        cbtAlertBanner.style.background = "#FEE2E2";
        cbtAlertBanner.style.color = "#B91C1C";
        cbtAlertBanner.style.border = "1px solid #FCA5A5";
      } else {
        cbtAlertBanner.style.background = "#EFF6FF";
        cbtAlertBanner.style.color = "var(--student-blue)";
        cbtAlertBanner.style.border = "1px solid #BFDBFE";
      }
      cbtAlertBanner.textContent = msg;
      cbtAlertBanner.scrollIntoView({ behavior: "smooth", block: "nearest" });
      setTimeout(() => {
        if (cbtAlertBanner) cbtAlertBanner.style.display = "none";
      }, 7000);
    };

    const switchCbtTab = (tabName) => {
      activeCbtTab = tabName;
      subnavButtons.forEach((btn) => {
        const isMatch = btn.getAttribute("data-cbt-tab") === tabName;
        btn.classList.toggle("active", isMatch);
      });

      Object.entries(tabPanes).forEach(([key, pane]) => {
        if (pane) pane.style.display = key === tabName ? "block" : "none";
      });

      refreshCbtViews();
    };

    window.cbtSwitchTab = switchCbtTab;

    subnavButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-cbt-tab");
        if (tab) switchCbtTab(tab);
      });
    });

    const quickCreateBtn = document.getElementById("btn-quick-create-test");
    const quickAddQBtn = document.getElementById("btn-quick-add-question");
    if (quickCreateBtn) quickCreateBtn.addEventListener("click", () => switchCbtTab("create"));
    if (quickAddQBtn) quickAddQBtn.addEventListener("click", () => {
      switchCbtTab("questions");
      openQuestionModal();
    });

    // Populate Course Select dropdowns across CBT tabs
    const refreshCbtCourseSelects = (myAllocations) => {
      const selects = [
        document.getElementById("qbank-filter-course"),
        document.getElementById("cbt-form-course"),
        document.getElementById("filter-scheduled-course"),
        document.getElementById("filter-completed-course"),
        document.getElementById("results-filter-course"),
        document.getElementById("cbt-q-course")
      ];

      selects.forEach((sel) => {
        if (!sel) return;
        const currentVal = sel.value;
        const isFilter = sel.id.includes("filter");
        const defaultOption = isFilter ? `<option value="all">All Assigned Courses</option>` : `<option value="">-- Choose Assigned Course --</option>`;

        sel.innerHTML = `
          ${defaultOption}
          ${myAllocations.map((a) => `<option value="${a.courseCode}">${a.courseCode} — ${a.courseTitle}</option>`).join("")}
        `;

        if (currentVal && myAllocations.some((a) => a.courseCode === currentVal)) {
          sel.value = currentVal;
        }
      });
    };

    // -----------------------------------------------------------------------
    // 10A. DASHBOARD TAB
    // -----------------------------------------------------------------------
    const renderCbtDashboard = () => {
      const myAllocations = allAllocationsState.filter(isMyAllocation);
      const myCourseCodes = new Set(myAllocations.map((a) => a.courseCode.toUpperCase()));

      // Filter data relevant to this lecturer
      const myQuestions = (allCbtQuestionsState || []).filter(
        (q) => myCourseCodes.has((q.courseCode || "").toUpperCase()) || q.lecturerStaffId === staffId
      );
      const myAssessments = (allCbtAssessmentsState || []).filter(
        (a) => myCourseCodes.has((a.courseCode || "").toUpperCase()) || a.lecturerStaffId === staffId
      );
      const myAssessmentIds = new Set(myAssessments.map((a) => a.id));

      const mySubmissions = (allCbtSubmissionsState || []).filter(
        (s) => myAssessmentIds.has(s.assessmentId) || myCourseCodes.has((s.courseCode || "").toUpperCase())
      );

      const enrolledStudents = compileEnrolledStudents(myAllocations, allRegistrationsState);
      const totalExpected = enrolledStudents.length;

      const now = new Date();
      let countScheduled = 0;
      let countActive = 0;
      let countCompleted = 0;

      myAssessments.forEach((a) => {
        const start = new Date(a.startDate || now);
        const end = a.closingDate ? new Date(a.closingDate) : null;
        if (a.status === "closed" || (end && end < now)) {
          countCompleted++;
        } else if (a.status === "scheduled" || start > now) {
          countScheduled++;
        } else {
          countActive++;
        }
      });

      const uniqueParticipatedMatrics = new Set(mySubmissions.map((s) => (s.matricNumber || "").toUpperCase()));
      const completedSubmissions = mySubmissions.filter((s) => s.status === "submitted" || s.status === "graded");
      const pendingMarking = mySubmissions.filter((s) => s.markingStatus === "pending_manual");
      const publishedResults = mySubmissions.filter((s) => s.resultsReleased === true);

      // DOM updates
      const setEl = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };

      setEl("stat-cbt-total-questions", myQuestions.length);
      setEl("stat-cbt-total-tests", myAssessments.length);
      setEl("stat-cbt-scheduled", countScheduled);
      setEl("stat-cbt-active", countActive);
      setEl("stat-cbt-completed", countCompleted);
      setEl("stat-cbt-expected-students", totalExpected);
      setEl("stat-cbt-completed-attempts", completedSubmissions.length);
      setEl("stat-cbt-unparticipated", Math.max(0, totalExpected - uniqueParticipatedMatrics.size));
      setEl("stat-cbt-pending-marking", pendingMarking.length);
      setEl("stat-cbt-published-results", publishedResults.length);

      // Badge pill indicators on sub-tabs
      setEl("cbt-badge-scheduled", countScheduled);
      setEl("cbt-badge-live", countActive);
      setEl("cbt-badge-completed", countCompleted);
      setEl("cbt-badge-pending-marking", pendingMarking.length);

      // Dashboard Preview Cards
      const dashUpcoming = document.getElementById("cbt-dash-upcoming-list");
      if (dashUpcoming) {
        const upcomingList = myAssessments.filter((a) => a.status === "scheduled" || new Date(a.startDate) > now);
        if (upcomingList.length === 0) {
          dashUpcoming.innerHTML = `<p style="font-size: 0.8125rem; color: var(--student-text-muted);">No upcoming assessments scheduled.</p>`;
        } else {
          dashUpcoming.innerHTML = upcomingList.slice(0, 3).map((a) => `
            <div style="padding: 0.65rem 0; border-bottom: 1px solid var(--student-border-subtle); display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="color: var(--student-navy); font-size: 0.875rem; display: block;">${a.title}</strong>
                <span style="font-size: 0.75rem; color: var(--student-text-muted);">${a.courseCode} · ${a.durationMinutes} mins · ${a.totalMarks} marks</span>
              </div>
              <span class="status-pill-badge badge-blue" style="font-size: 0.68rem;">Starts ${formatDateOnly(a.startDate)}</span>
            </div>
          `).join("");
        }
      }

      const dashActive = document.getElementById("cbt-dash-active-list");
      if (dashActive) {
        const activeList = myAssessments.filter((a) => {
          const start = new Date(a.startDate || now);
          const end = a.closingDate ? new Date(a.closingDate) : null;
          return a.status === "open" || (start <= now && (!end || end >= now) && a.status !== "closed");
        });

        if (activeList.length === 0) {
          dashActive.innerHTML = `<p style="font-size: 0.8125rem; color: var(--student-text-muted);">No assessments currently active.</p>`;
        } else {
          dashActive.innerHTML = activeList.slice(0, 3).map((a) => {
            const subsForThis = mySubmissions.filter((s) => s.assessmentId === a.id);
            return `
              <div style="padding: 0.65rem 0; border-bottom: 1px solid var(--student-border-subtle); display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong style="color: var(--student-navy); font-size: 0.875rem; display: block;">${a.title}</strong>
                  <span style="font-size: 0.75rem; color: #16A34A; font-weight: 700;">🟢 Live Session (${subsForThis.length} submitted)</span>
                </div>
                <button type="button" class="btn btn-sm btn-outline-navy" onclick="window.cbtSwitchTab('live')" style="font-size: 0.72rem; padding: 2px 8px;">Monitor</button>
              </div>
            `;
          }).join("");
        }
      }

      const dashSubmissions = document.getElementById("cbt-dash-submissions-list");
      if (dashSubmissions) {
        if (completedSubmissions.length === 0) {
          dashSubmissions.innerHTML = `<p style="font-size: 0.8125rem; color: var(--student-text-muted);">No student submissions received yet.</p>`;
        } else {
          dashSubmissions.innerHTML = completedSubmissions.slice(0, 3).map((s) => `
            <div style="padding: 0.65rem 0; border-bottom: 1px solid var(--student-border-subtle); display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="color: var(--student-navy); font-size: 0.875rem; display: block;">${s.studentName}</strong>
                <span style="font-size: 0.75rem; color: var(--student-text-muted);">${s.matricNumber} · ${s.courseCode} · ${s.totalScore}/${s.maxMarks}</span>
              </div>
              <span class="status-pill-badge ${s.markingStatus === 'pending_manual' ? 'badge-gold' : 'badge-green'}" style="font-size: 0.68rem;">
                ${s.markingStatus === 'pending_manual' ? 'Pending Theory' : 'Graded'}
              </span>
            </div>
          `).join("");
        }
      }
    };

    // -----------------------------------------------------------------------
    // 10B. QUESTION BANK TAB
    // -----------------------------------------------------------------------
    const renderQuestionBank = () => {
      const qbankContainer = document.getElementById("qbank-container");
      if (!qbankContainer) return;

      const myAllocations = allAllocationsState.filter(isMyAllocation);
      const myCourseCodes = new Set(myAllocations.map((a) => a.courseCode.toUpperCase()));

      const qSearch = (document.getElementById("qbank-search")?.value || "").trim().toLowerCase();
      const qCourse = (document.getElementById("qbank-filter-course")?.value || "all").toUpperCase();
      const qType = document.getElementById("qbank-filter-type")?.value || "all";
      const qDiff = document.getElementById("qbank-filter-difficulty")?.value || "all";

      let filtered = (allCbtQuestionsState || []).filter((q) => {
        const matchesCourse = qCourse === "ALL" || (q.courseCode || "").toUpperCase() === qCourse;
        const matchesType = qType === "all" || q.type === qType;
        const matchesDiff = qDiff === "all" || q.difficulty === qDiff;
        const matchesSearch = !qSearch ||
          (q.questionText || "").toLowerCase().includes(qSearch) ||
          (q.topic || "").toLowerCase().includes(qSearch) ||
          (q.courseCode || "").toLowerCase().includes(qSearch);
        return matchesCourse && matchesType && matchesDiff && matchesSearch;
      });

      if (filtered.length === 0) {
        qbankContainer.innerHTML = `
          <div class="student-empty-box" style="padding: 2.5rem 1rem;">
            <div class="student-empty-icon">📚</div>
            <div class="student-empty-text">No Questions Match Filter Criteria</div>
            <div class="student-empty-sub">Adjust your search or click "+ New Question" to add questions to your question bank.</div>
          </div>
        `;
        return;
      }

      const typeLabels = {
        mcq: `<span class="cbt-badge-type badge-mcq">Multiple Choice</span>`,
        yes_no: `<span class="cbt-badge-type badge-yesno">Yes / No</span>`,
        true_false: `<span class="cbt-badge-type badge-tf">True / False</span>`,
        short_answer: `<span class="cbt-badge-type badge-short">Short Answer</span>`,
        theory: `<span class="cbt-badge-type badge-theory">Theory / Essay</span>`
      };

      qbankContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${filtered.map((q, idx) => {
            let optionsPreview = "";
            if (q.type === "mcq" && Array.isArray(q.options)) {
              optionsPreview = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; margin: 0.5rem 0; font-size: 0.8125rem;">
                  ${q.options.map((opt) => `
                    <div style="padding: 0.35rem 0.6rem; border-radius: var(--student-radius-sm); border: 1px solid ${opt.id === q.correctOptionId ? '#86EFAC' : 'var(--student-border)'}; background: ${opt.id === q.correctOptionId ? '#F0FDF4' : '#FFFFFF'};">
                      ${opt.id === q.correctOptionId ? '✓ ' : '• '}<strong>${opt.id.toUpperCase().replace('OPT_', '')}:</strong> ${opt.text}
                    </div>
                  `).join("")}
                </div>
              `;
            } else if (q.type === "yes_no" || q.type === "true_false") {
              optionsPreview = `
                <div style="font-size: 0.8125rem; color: #166534; font-weight: 700; margin: 0.35rem 0;">
                  Correct Answer: ${q.correctOptionId === "opt_yes" || q.correctOptionId === "opt_true" ? "True / Yes" : "False / No"}
                </div>
              `;
            } else if (q.type === "short_answer") {
              optionsPreview = `
                <div style="font-size: 0.8125rem; color: var(--student-navy); margin: 0.35rem 0;">
                  <strong>Expected Answer:</strong> "${q.expectedAnswer || "Not configured"}" (${q.matchingRule === "manual" ? "Manual Evaluation Required" : "Auto-Marking Match Enabled"})
                </div>
              `;
            } else if (q.type === "theory") {
              optionsPreview = `
                <div style="font-size: 0.8125rem; color: #991B1B; margin: 0.35rem 0; background: #FEF2F2; padding: 0.45rem 0.75rem; border-radius: var(--student-radius-sm);">
                  <strong>Marking Guide:</strong> ${q.markingGuide || "Comprehensive theological analysis evaluated manually by lecturer."}
                </div>
              `;
            }

            return `
              <div class="cbt-item-card" style="border-left: 4px solid var(--student-blue);">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap;">
                    <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                      <span style="font-weight: 800; font-size: 0.8125rem; color: var(--student-text-muted);">#${idx + 1}</span>
                      <span class="status-pill-badge badge-blue" style="font-weight: 700;">${q.courseCode}</span>
                      <span style="font-size: 0.8125rem; color: var(--student-text-muted); font-weight: 600;">${q.topic || "General"}</span>
                      ${typeLabels[q.type] || q.type}
                      <span class="status-pill-badge" style="background:#F1F5F9; color:#475569; font-size: 0.68rem; text-transform: uppercase;">${q.difficulty || "Intermediate"}</span>
                    </div>
                    <div style="font-size: 0.875rem; font-weight: 800; color: #15803D; background: #DCFCE7; padding: 0.2rem 0.6rem; border-radius: var(--student-radius-sm);">
                      ${q.marks} Marks
                    </div>
                  </div>

                  <p style="font-size: 0.9375rem; font-weight: 600; color: var(--student-navy); line-height: 1.5; margin: 0.5rem 0;">
                    ${q.questionText}
                  </p>

                  ${optionsPreview}

                  ${q.explanation ? `
                    <div style="font-size: 0.75rem; color: var(--student-text-muted); margin-top: 0.35rem;">
                      💡 <em>${q.explanation}</em>
                    </div>
                  ` : ""}
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--student-border-subtle); padding-top: 0.75rem; margin-top: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
                  <span style="font-size: 0.72rem; color: var(--student-text-muted);">
                    Created: ${formatDateOnly(q.createdAt)} · Lecturer: ${q.lecturerName || "Faculty"}
                  </span>
                  <div style="display: flex; gap: 0.4rem;">
                    <button type="button" class="btn btn-outline-blue btn-sm" onclick="window.cbtEditQuestion('${q.id}')" style="font-size: 0.75rem; padding: 2px 8px;">
                      ✏️ Edit
                    </button>
                    <button type="button" class="btn btn-outline-navy btn-sm" onclick="window.cbtDuplicateQuestion('${q.id}')" style="font-size: 0.75rem; padding: 2px 8px;">
                      📑 Duplicate
                    </button>
                    <button type="button" class="btn btn-sm" style="background:#FEE2E2; color:#B91C1C; border:1px solid #FECACA; font-size: 0.75rem; padding: 2px 8px;" onclick="window.cbtDeleteQuestion('${q.id}')">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      `;
    };

    // Attach listeners to question bank filters
    const qSearchIn = document.getElementById("qbank-search");
    const qCourseFilter = document.getElementById("qbank-filter-course");
    const qTypeFilter = document.getElementById("qbank-filter-type");
    const qDiffFilter = document.getElementById("qbank-filter-difficulty");
    if (qSearchIn) qSearchIn.addEventListener("input", renderQuestionBank);
    if (qCourseFilter) qCourseFilter.addEventListener("change", renderQuestionBank);
    if (qTypeFilter) qTypeFilter.addEventListener("change", renderQuestionBank);
    if (qDiffFilter) qDiffFilter.addEventListener("change", renderQuestionBank);

    // -----------------------------------------------------------------------
    // 10C. CREATE & EDIT QUESTION MODAL
    // -----------------------------------------------------------------------
    const modalQ = document.getElementById("modal-cbt-question");
    const formQ = document.getElementById("form-cbt-question");
    const qTypeSelect = document.getElementById("cbt-q-type");
    const qOptionsContainer = document.getElementById("cbt-q-options-container");

    const renderDynamicOptions = (type, existingData = null) => {
      if (!qOptionsContainer) return;

      if (type === "mcq") {
        const opts = existingData?.options || [
          { id: "opt_a", text: "" },
          { id: "opt_b", text: "" },
          { id: "opt_c", text: "" },
          { id: "opt_d", text: "" }
        ];
        const correctId = existingData?.correctOptionId || "opt_a";

        qOptionsContainer.innerHTML = `
          <label class="student-form-label" style="margin-bottom: 0.5rem; display: block;">
            Answer Options (Select the correct option):
          </label>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${opts.map((opt, i) => `
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <input type="radio" name="mcq_correct" value="${opt.id}" ${opt.id === correctId ? "checked" : ""} required>
                <strong style="width: 25px; color: var(--student-navy);">${String.fromCharCode(65 + i)}:</strong>
                <input type="text" class="student-form-input mcq-option-text" data-opt-id="${opt.id}" value="${opt.text || ""}" placeholder="Option ${String.fromCharCode(65 + i)} text..." required style="flex: 1;">
              </div>
            `).join("")}
          </div>
        `;
      } else if (type === "yes_no") {
        const correctId = existingData?.correctOptionId || "opt_yes";
        qOptionsContainer.innerHTML = `
          <label class="student-form-label" style="margin-bottom: 0.5rem; display: block;">Correct Answer:</label>
          <div style="display: flex; gap: 1.5rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
              <input type="radio" name="yn_correct" value="opt_yes" ${correctId === "opt_yes" ? "checked" : ""}>
              <strong>Yes</strong>
            </label>
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
              <input type="radio" name="yn_correct" value="opt_no" ${correctId === "opt_no" ? "checked" : ""}>
              <strong>No</strong>
            </label>
          </div>
        `;
      } else if (type === "true_false") {
        const correctId = existingData?.correctOptionId || "opt_true";
        qOptionsContainer.innerHTML = `
          <label class="student-form-label" style="margin-bottom: 0.5rem; display: block;">Correct Answer:</label>
          <div style="display: flex; gap: 1.5rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
              <input type="radio" name="tf_correct" value="opt_true" ${correctId === "opt_true" ? "checked" : ""}>
              <strong>True</strong>
            </label>
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
              <input type="radio" name="tf_correct" value="opt_false" ${correctId === "opt_false" ? "checked" : ""}>
              <strong>False</strong>
            </label>
          </div>
        `;
      } else if (type === "short_answer") {
        const expected = existingData?.expectedAnswer || "";
        const rule = existingData?.matchingRule || "exact_or_contains";
        qOptionsContainer.innerHTML = `
          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1rem;">
            <div>
              <label class="student-form-label" for="cbt-q-expected-ans">Expected Answer / Key Terms *</label>
              <input type="text" class="student-form-input" id="cbt-q-expected-ans" value="${expected}" placeholder="e.g. Athanasius" required>
            </div>
            <div>
              <label class="student-form-label" for="cbt-q-rule">Evaluation Rule</label>
              <select class="student-form-select" id="cbt-q-rule">
                <option value="exact_or_contains" ${rule === "exact_or_contains" ? "selected" : ""}>Contains Keyword (Auto)</option>
                <option value="exact" ${rule === "exact" ? "selected" : ""}>Exact Match (Auto)</option>
                <option value="manual" ${rule === "manual" ? "selected" : ""}>Lecturer Manual Review</option>
              </select>
            </div>
          </div>
        `;
      } else if (type === "theory") {
        qOptionsContainer.innerHTML = `
          <div style="font-size: 0.8125rem; color: #991B1B; background: #FEF2F2; border: 1px solid #FECACA; padding: 0.75rem; border-radius: var(--student-radius-sm);">
            <strong>Theory / Essay Question Policy:</strong> Candidates will provide written paragraph responses. This question will require manual evaluation and score awarding by the lecturer before final results can be approved.
          </div>
        `;
      }
    };

    if (qTypeSelect) {
      qTypeSelect.addEventListener("change", () => {
        renderDynamicOptions(qTypeSelect.value);
      });
    }

    const openQuestionModal = (existingQuestion = null) => {
      if (!modalQ || !formQ) return;
      formQ.reset();

      const modalTitle = document.getElementById("modal-cbt-q-title");
      const qIdInput = document.getElementById("cbt-q-id");
      const qCourse = document.getElementById("cbt-q-course");
      const qTopic = document.getElementById("cbt-q-topic");
      const qType = document.getElementById("cbt-q-type");
      const qDiff = document.getElementById("cbt-q-difficulty");
      const qMarks = document.getElementById("cbt-q-marks");
      const qText = document.getElementById("cbt-q-text");
      const qGuide = document.getElementById("cbt-q-marking-guide");
      const qExpl = document.getElementById("cbt-q-explanation");

      if (existingQuestion) {
        if (modalTitle) modalTitle.textContent = "✏️ Edit Question in Question Bank";
        if (qIdInput) qIdInput.value = existingQuestion.id;
        if (qCourse) qCourse.value = existingQuestion.courseCode;
        if (qTopic) qTopic.value = existingQuestion.topic || "";
        if (qType) qType.value = existingQuestion.type || "mcq";
        if (qDiff) qDiff.value = existingQuestion.difficulty || "intermediate";
        if (qMarks) qMarks.value = existingQuestion.marks || 2;
        if (qText) qText.value = existingQuestion.questionText || "";
        if (qGuide) qGuide.value = existingQuestion.markingGuide || "";
        if (qExpl) qExpl.value = existingQuestion.explanation || "";
        renderDynamicOptions(existingQuestion.type || "mcq", existingQuestion);
      } else {
        if (modalTitle) modalTitle.textContent = "📚 Add Question to Question Bank";
        if (qIdInput) qIdInput.value = "";
        const selCourse = document.getElementById("qbank-filter-course")?.value;
        if (qCourse && selCourse && selCourse !== "all") qCourse.value = selCourse;
        renderDynamicOptions(qType?.value || "mcq");
      }

      modalQ.style.display = "flex";
    };

    const closeQuestionModal = () => {
      if (modalQ) modalQ.style.display = "none";
    };

    const btnOpenAddQ = document.getElementById("btn-open-add-q-modal");
    const btnCloseQ = document.getElementById("btn-close-cbt-q-modal");
    const btnCancelQ = document.getElementById("btn-cancel-cbt-q-modal");
    if (btnOpenAddQ) btnOpenAddQ.addEventListener("click", () => openQuestionModal());
    if (btnCloseQ) btnCloseQ.addEventListener("click", closeQuestionModal);
    if (btnCancelQ) btnCancelQ.addEventListener("click", closeQuestionModal);

    window.cbtEditQuestion = (qId) => {
      const q = (allCbtQuestionsState || []).find((item) => item.id === qId);
      if (q) openQuestionModal(q);
    };

    window.cbtDuplicateQuestion = async (qId) => {
      try {
        await duplicateCbtQuestion(qId);
        showCbtAlert("Question duplicated as draft successfully.", "success");
      } catch (err) {
        showCbtAlert(`Duplicate error: ${err.message}`, "error");
      }
    };

    window.cbtDeleteQuestion = async (qId) => {
      if (!confirm("Are you sure you want to permanently delete this question from your Question Bank?")) return;
      try {
        await deleteCbtQuestion(qId);
        showCbtAlert("Question deleted from question bank.", "success");
      } catch (err) {
        showCbtAlert(`Delete error: ${err.message}`, "error");
      }
    };

    if (formQ) {
      formQ.addEventListener("submit", async (e) => {
        e.preventDefault();
        const qId = document.getElementById("cbt-q-id")?.value;
        const courseCode = document.getElementById("cbt-q-course")?.value;
        const topic = document.getElementById("cbt-q-topic")?.value;
        const type = document.getElementById("cbt-q-type")?.value || "mcq";
        const difficulty = document.getElementById("cbt-q-difficulty")?.value || "intermediate";
        const marks = parseInt(document.getElementById("cbt-q-marks")?.value, 10) || 2;
        const questionText = document.getElementById("cbt-q-text")?.value;
        const markingGuide = document.getElementById("cbt-q-marking-guide")?.value || "";
        const explanation = document.getElementById("cbt-q-explanation")?.value || "";

        let options = [];
        let correctOptionId = "";
        let expectedAnswer = "";
        let matchingRule = "exact_or_contains";

        if (type === "mcq") {
          const optInputs = formQ.querySelectorAll(".mcq-option-text");
          const selectedRadio = formQ.querySelector("input[name='mcq_correct']:checked");
          if (!selectedRadio) {
            alert("Please select the correct MCQ option radio.");
            return;
          }
          correctOptionId = selectedRadio.value;
          optInputs.forEach((input) => {
            options.push({
              id: input.getAttribute("data-opt-id"),
              text: input.value.trim()
            });
          });
        } else if (type === "yes_no") {
          const selectedRadio = formQ.querySelector("input[name='yn_correct']:checked");
          correctOptionId = selectedRadio?.value || "opt_yes";
          options = [{ id: "opt_yes", text: "Yes" }, { id: "opt_no", text: "No" }];
        } else if (type === "true_false") {
          const selectedRadio = formQ.querySelector("input[name='tf_correct']:checked");
          correctOptionId = selectedRadio?.value || "opt_true";
          options = [{ id: "opt_true", text: "True" }, { id: "opt_false", text: "False" }];
        } else if (type === "short_answer") {
          expectedAnswer = (document.getElementById("cbt-q-expected-ans")?.value || "").trim();
          matchingRule = document.getElementById("cbt-q-rule")?.value || "exact_or_contains";
        }

        const myAllocations = allAllocationsState.filter(isMyAllocation);
        const courseObj = myAllocations.find((a) => a.courseCode === courseCode);

        const payload = {
          courseCode,
          courseTitle: courseObj?.courseTitle || "Theological Study",
          topic,
          type,
          difficulty,
          marks,
          questionText,
          options,
          correctOptionId,
          expectedAnswer,
          matchingRule,
          markingGuide,
          explanation,
          lecturerStaffId: staffId,
          lecturerName: fullName,
          status: "published"
        };

        const submitBtn = document.getElementById("btn-submit-cbt-q-form");
        const origText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Saving...";

        try {
          if (qId) {
            await updateCbtQuestion(qId, payload);
            showCbtAlert("Question updated successfully.", "success");
          } else {
            await createCbtQuestion(payload);
            showCbtAlert("Question saved to Question Bank successfully.", "success");
          }
          closeQuestionModal();
          renderQuestionBank();
        } catch (err) {
          alert(`Failed to save question: ${err.message}`);
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = origText;
        }
      });
    }

    // -----------------------------------------------------------------------
    // 10D. CREATE TEST OR EXAMINATION & QUESTION PICKER
    // -----------------------------------------------------------------------
    const modalPicker = document.getElementById("modal-cbt-picker");
    const pickerList = document.getElementById("picker-questions-list");
    const btnOpenPicker = document.getElementById("btn-open-q-picker");
    const btnClosePicker = document.getElementById("btn-close-cbt-picker");
    const btnCancelPicker = document.getElementById("btn-cancel-picker");
    const btnConfirmPicker = document.getElementById("btn-confirm-picker");
    const pickerSearchIn = document.getElementById("picker-search");
    const pickerTypeFilter = document.getElementById("picker-filter-type");
    const btnPickerSelectAll = document.getElementById("btn-picker-select-all");

    const updateMarksValidationStrip = () => {
      const selectedQuestions = (allCbtQuestionsState || []).filter((q) => selectedPickerQuestionIds.has(q.id));
      const count = selectedQuestions.length;
      const sumMarks = selectedQuestions.reduce((acc, q) => acc + (parseInt(q.marks, 10) || 0), 0);
      const totalRequired = parseInt(document.getElementById("cbt-form-total-marks")?.value, 10) || 10;

      const qCountEl = document.getElementById("cbt-summary-q-count");
      const marksSumEl = document.getElementById("cbt-summary-marks-sum");
      const validationStatusEl = document.getElementById("cbt-validation-status");
      const selectedCountBadge = document.getElementById("cbt-selected-count");

      if (qCountEl) qCountEl.textContent = `${count} Questions`;
      if (marksSumEl) marksSumEl.textContent = `${sumMarks} Marks`;
      if (selectedCountBadge) selectedCountBadge.textContent = count;

      if (validationStatusEl) {
        if (count === 0) {
          validationStatusEl.innerHTML = `<span class="status-pill-badge badge-gold">Awaiting Question Selection</span>`;
        } else if (sumMarks === totalRequired) {
          validationStatusEl.innerHTML = `<span class="status-pill-badge badge-green">✓ Marks Validated (${sumMarks}/${totalRequired})</span>`;
        } else {
          validationStatusEl.innerHTML = `<span class="status-pill-badge badge-red">⚠️ Mismatch: ${sumMarks} vs ${totalRequired} Target</span>`;
        }
      }

      // Render Selected Questions Preview
      const previewContainer = document.getElementById("cbt-selected-questions-preview");
      if (previewContainer) {
        if (count === 0) {
          previewContainer.innerHTML = `
            <div class="student-empty-box" style="padding: 1.5rem;">
              <div class="student-empty-icon">📖</div>
              <div class="student-empty-text">No questions selected yet.</div>
              <div class="student-empty-sub">Click "Select Questions from Bank" above to pick questions for this assessment.</div>
            </div>
          `;
        } else {
          previewContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 250px; overflow-y: auto;">
              ${selectedQuestions.map((q, idx) => `
                <div style="background: #FFFFFF; border: 1px solid var(--student-border); border-radius: var(--student-radius-sm); padding: 0.6rem 0.85rem; display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <strong style="color: var(--student-navy); font-size: 0.84rem;">${idx + 1}.</strong>
                    <span style="font-size: 0.84rem; color: var(--student-navy); font-weight: 600;">${q.questionText.substring(0, 80)}${q.questionText.length > 80 ? "..." : ""}</span>
                  </div>
                  <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <span class="status-pill-badge badge-blue" style="font-size: 0.68rem;">${q.type.toUpperCase()}</span>
                    <strong style="color: #16A34A; font-size: 0.84rem;">${q.marks}m</strong>
                    <button type="button" class="btn btn-sm" style="color: #DC2626; background: none; border: none; font-size: 1rem; cursor: pointer;" onclick="window.cbtRemoveSelectedQuestion('${q.id}')">&times;</button>
                  </div>
                </div>
              `).join("")}
            </div>
          `;
        }
      }
    };

    window.cbtRemoveSelectedQuestion = (qId) => {
      selectedPickerQuestionIds.delete(qId);
      updateMarksValidationStrip();
    };

    const renderPickerQuestionsList = () => {
      if (!pickerList) return;
      const targetCourse = (document.getElementById("cbt-form-course")?.value || "").toUpperCase();
      const pSearch = (pickerSearchIn?.value || "").trim().toLowerCase();
      const pType = pickerTypeFilter?.value || "all";

      let eligible = (allCbtQuestionsState || []).filter((q) => {
        const matchesCourse = !targetCourse || (q.courseCode || "").toUpperCase() === targetCourse;
        const matchesType = pType === "all" || q.type === pType;
        const matchesSearch = !pSearch || (q.questionText || "").toLowerCase().includes(pSearch);
        return matchesCourse && matchesType && matchesSearch;
      });

      if (eligible.length === 0) {
        pickerList.innerHTML = `<p style="padding: 1.5rem; text-align: center; color: var(--student-text-muted);">No questions found for ${targetCourse || "selected criteria"}. Add questions to Question Bank first.</p>`;
        return;
      }

      pickerList.innerHTML = eligible.map((q) => {
        const isChecked = selectedPickerQuestionIds.has(q.id);
        return `
          <label style="display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.6rem; border-bottom: 1px solid var(--student-border-subtle); cursor: pointer; background: ${isChecked ? '#EFF6FF' : 'transparent'};">
            <input type="checkbox" class="picker-q-checkbox" data-q-id="${q.id}" data-marks="${q.marks}" ${isChecked ? 'checked' : ''} style="margin-top: 3px;">
            <div style="flex: 1;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;">
                <div style="display: flex; gap: 0.4rem; align-items: center;">
                  <span class="status-pill-badge badge-blue" style="font-size: 0.65rem;">${q.courseCode}</span>
                  <span style="font-size: 0.72rem; color: var(--student-text-muted); font-weight: 600;">${q.type.toUpperCase()}</span>
                </div>
                <strong style="color: #16A34A; font-size: 0.8125rem;">${q.marks} Marks</strong>
              </div>
              <p style="font-size: 0.84rem; color: var(--student-navy); margin: 0; line-height: 1.4;">${q.questionText}</p>
            </div>
          </label>
        `;
      }).join("");

      // Wire checkboxes
      pickerList.querySelectorAll(".picker-q-checkbox").forEach((cb) => {
        cb.addEventListener("change", () => {
          const qId = cb.getAttribute("data-q-id");
          if (cb.checked) selectedPickerQuestionIds.add(qId);
          else selectedPickerQuestionIds.delete(qId);

          // Update picker footer
          const selectedQuestions = (allCbtQuestionsState || []).filter((q) => selectedPickerQuestionIds.has(q.id));
          const totalMarks = selectedQuestions.reduce((acc, q) => acc + (parseInt(q.marks, 10) || 0), 0);
          document.getElementById("picker-total-selected").textContent = `${selectedQuestions.length} Questions`;
          document.getElementById("picker-total-marks").textContent = `${totalMarks} Marks`;
        });
      });
    };

    if (btnOpenPicker) {
      btnOpenPicker.addEventListener("click", () => {
        const course = document.getElementById("cbt-form-course")?.value;
        if (!course) {
          alert("Please select a course offering first in the assessment form.");
          return;
        }
        renderPickerQuestionsList();
        modalPicker.style.display = "flex";
      });
    }

    if (btnClosePicker) btnClosePicker.addEventListener("click", () => modalPicker.style.display = "none");
    if (btnCancelPicker) btnCancelPicker.addEventListener("click", () => modalPicker.style.display = "none");
    if (btnConfirmPicker) {
      btnConfirmPicker.addEventListener("click", () => {
        modalPicker.style.display = "none";
        updateMarksValidationStrip();
      });
    }
    if (pickerSearchIn) pickerSearchIn.addEventListener("input", renderPickerQuestionsList);
    if (pickerTypeFilter) pickerTypeFilter.addEventListener("change", renderPickerQuestionsList);

    if (btnPickerSelectAll) {
      btnPickerSelectAll.addEventListener("click", () => {
        if (!pickerList) return;
        pickerList.querySelectorAll(".picker-q-checkbox").forEach((cb) => {
          cb.checked = true;
          selectedPickerQuestionIds.add(cb.getAttribute("data-q-id"));
        });
        const selectedQuestions = (allCbtQuestionsState || []).filter((q) => selectedPickerQuestionIds.has(q.id));
        const totalMarks = selectedQuestions.reduce((acc, q) => acc + (parseInt(q.marks, 10) || 0), 0);
        document.getElementById("picker-total-selected").textContent = `${selectedQuestions.length} Questions`;
        document.getElementById("picker-total-marks").textContent = `${totalMarks} Marks`;
      });
    }

    const formCreateCbt = document.getElementById("form-create-cbt");
    const totalMarksInput = document.getElementById("cbt-form-total-marks");
    if (totalMarksInput) totalMarksInput.addEventListener("input", updateMarksValidationStrip);

    const handleSaveAssessment = async (isPublish) => {
      const title = document.getElementById("cbt-form-title")?.value.trim();
      const type = document.getElementById("cbt-form-type")?.value || "test";
      const courseCode = document.getElementById("cbt-form-course")?.value;
      const topic = document.getElementById("cbt-form-topic")?.value.trim() || "Continuous Assessment";
      const studyCentre = document.getElementById("cbt-form-centre")?.value || "all";
      const instructions = document.getElementById("cbt-form-instructions")?.value.trim() || "";
      const startDate = document.getElementById("cbt-form-start")?.value;
      const closingDate = document.getElementById("cbt-form-closing")?.value;
      const durationMinutes = parseInt(document.getElementById("cbt-form-duration")?.value, 10) || 30;
      const totalMarks = parseInt(document.getElementById("cbt-form-total-marks")?.value, 10) || 10;
      const passMark = parseInt(document.getElementById("cbt-form-pass-mark")?.value, 10) || 4;
      const allowedAttempts = parseInt(document.getElementById("cbt-form-attempts")?.value, 10) || 1;
      const visibility = document.getElementById("cbt-form-visibility")?.value || "after_marking";

      const shuffleQuestions = document.getElementById("cbt-form-shuffle-q")?.checked !== false;
      const shuffleOptions = document.getElementById("cbt-form-shuffle-opt")?.checked !== false;
      const allowNavigation = document.getElementById("cbt-form-allow-nav")?.checked !== false;
      const allowUnanswered = document.getElementById("cbt-form-allow-unanswered")?.checked !== false;

      if (!title || !courseCode || !startDate || !closingDate) {
        alert("Please complete all required fields (Title, Course, Start Date, and Closing Date).");
        return;
      }

      const selectedQuestions = (allCbtQuestionsState || []).filter((q) => selectedPickerQuestionIds.has(q.id));
      if (selectedQuestions.length === 0) {
        alert("Please select at least one question from the Question Bank.");
        return;
      }

      const sumMarks = selectedQuestions.reduce((acc, q) => acc + (parseInt(q.marks, 10) || 0), 0);
      if (sumMarks !== totalMarks) {
        alert(`Assessment Total Marks (${totalMarks}) does not match the sum of selected question marks (${sumMarks}). Please adjust total marks or question selection.`);
        return;
      }

      const myAllocations = allAllocationsState.filter(isMyAllocation);
      const courseObj = myAllocations.find((a) => a.courseCode === courseCode);

      const payload = {
        title,
        type,
        courseCode,
        courseTitle: courseObj?.courseTitle || "Theological Study",
        topic,
        academicSession: "2026/2027",
        semester: "First Semester",
        studyCentre,
        instructions,
        startDate: new Date(startDate).toISOString(),
        closingDate: new Date(closingDate).toISOString(),
        durationMinutes,
        totalMarks,
        passMark,
        allowedAttempts,
        resultVisibility: visibility,
        shuffleQuestions,
        shuffleOptions,
        allowNavigation,
        allowUnanswered,
        questions: selectedQuestions,
        status: isPublish ? "open" : "draft",
        lecturerStaffId: staffId,
        lecturerName: fullName
      };

      try {
        await createCbtAssessment(payload);
        showCbtAlert(`✓ Assessment "${title}" ${isPublish ? "scheduled/published" : "saved as draft"} successfully!`, "success");
        if (formCreateCbt) formCreateCbt.reset();
        selectedPickerQuestionIds.clear();
        updateMarksValidationStrip();
        switchCbtTab(isPublish ? "scheduled" : "dashboard");
      } catch (err) {
        alert(`Error creating assessment: ${err.message}`);
      }
    };

    if (formCreateCbt) {
      formCreateCbt.addEventListener("submit", (e) => {
        e.preventDefault();
        handleSaveAssessment(true);
      });
    }

    const btnSaveDraftCbt = document.getElementById("btn-cbt-save-draft");
    if (btnSaveDraftCbt) {
      btnSaveDraftCbt.addEventListener("click", () => handleSaveAssessment(false));
    }

    // -----------------------------------------------------------------------
    // 10E. SCHEDULED, LIVE & COMPLETED TABS
    // -----------------------------------------------------------------------
    const renderScheduledCbt = () => {
      const container = document.getElementById("cbt-scheduled-container");
      if (!container) return;

      const myAllocations = allAllocationsState.filter(isMyAllocation);
      const myCourseCodes = new Set(myAllocations.map((a) => a.courseCode.toUpperCase()));
      const filterCourse = (document.getElementById("filter-scheduled-course")?.value || "all").toUpperCase();
      const now = new Date();

      const scheduled = (allCbtAssessmentsState || []).filter((a) => {
        const matchCourse = filterCourse === "ALL" || (a.courseCode || "").toUpperCase() === filterCourse;
        const isMine = myCourseCodes.has((a.courseCode || "").toUpperCase()) || a.lecturerStaffId === staffId;
        const isFuture = a.status === "scheduled" || (a.status !== "closed" && new Date(a.startDate) > now);
        return matchCourse && isMine && isFuture;
      });

      if (scheduled.length === 0) {
        container.innerHTML = `
          <div class="student-empty-box" style="grid-column: 1 / -1; padding: 2.5rem 1rem;">
            <div class="student-empty-icon">🗓️</div>
            <div class="student-empty-text">No Scheduled CBTs</div>
            <div class="student-empty-sub">Assessments with a future start date/time will appear here. Click "Create Test / Exam" to schedule a test.</div>
          </div>
        `;
        return;
      }

      container.innerHTML = scheduled.map((a) => `
        <div class="cbt-item-card" style="border-top: 4px solid var(--student-blue);">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span class="status-pill-badge badge-blue">${a.type.toUpperCase()}</span>
              <span class="status-pill-badge badge-gold">🗓️ Scheduled</span>
            </div>
            <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--student-navy); margin-bottom: 0.35rem;">${a.title}</h4>
            <div style="font-size: 0.8125rem; color: var(--student-text-muted); margin-bottom: 0.75rem;">
              <strong>${a.courseCode}</strong> · ${a.questions?.length || 0} Questions · ${a.totalMarks} Marks · ${a.durationMinutes} Mins
            </div>
            <div style="background: #F8FAFC; border: 1px solid var(--student-border-subtle); border-radius: var(--student-radius-sm); padding: 0.75rem; font-size: 0.75rem; color: var(--student-navy); margin-bottom: 0.75rem;">
              <div>📅 <strong>Starts:</strong> ${formatDateTime(a.startDate)}</div>
              <div>🏁 <strong>Closes:</strong> ${formatDateTime(a.closingDate)}</div>
              <div>📍 <strong>Scope:</strong> ${a.studyCentre === "all" ? "Institution-Wide" : a.studyCentre}</div>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--student-border-subtle); padding-top: 0.75rem; margin-top: 0.5rem;">
            <button type="button" class="btn btn-outline-blue btn-sm" onclick="alert('Assessment ID: ${a.id}\\n\\nInstructions:\\n${a.instructions || 'Standard examination instructions'}\\n\\nQuestions: ${a.questions?.length || 0}')">
              Preview
            </button>
            <button type="button" class="btn btn-sm" style="background:#FEE2E2; color:#B91C1C; border:1px solid #FECACA;" onclick="window.cbtCancelAssessment('${a.id}')">
              Cancel / Delete
            </button>
          </div>
        </div>
      `).join("");
    };

    const renderLiveCbt = () => {
      const container = document.getElementById("cbt-live-container");
      if (!container) return;

      const myAllocations = allAllocationsState.filter(isMyAllocation);
      const myCourseCodes = new Set(myAllocations.map((a) => a.courseCode.toUpperCase()));
      const now = new Date();

      const live = (allCbtAssessmentsState || []).filter((a) => {
        const isMine = myCourseCodes.has((a.courseCode || "").toUpperCase()) || a.lecturerStaffId === staffId;
        const start = new Date(a.startDate || now);
        const end = a.closingDate ? new Date(a.closingDate) : null;
        return isMine && a.status !== "closed" && a.status !== "draft" && start <= now && (!end || end >= now);
      });

      if (live.length === 0) {
        container.innerHTML = `
          <div class="student-empty-box" style="grid-column: 1 / -1; padding: 2.5rem 1rem;">
            <div class="student-empty-icon">🟢</div>
            <div class="student-empty-text">No Live Assessment Sessions Right Now</div>
            <div class="student-empty-sub">Assessments currently between their start and closing date/time will be actively monitored here.</div>
          </div>
        `;
        return;
      }

      container.innerHTML = live.map((a) => {
        const mySubmissions = (allCbtSubmissionsState || []).filter((s) => s.assessmentId === a.id);
        const submittedCount = mySubmissions.length;

        return `
          <div class="cbt-item-card" style="border-top: 4px solid #16A34A; box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.1);">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span class="status-pill-badge badge-green">🟢 ACTIVE SESSION</span>
                <span style="font-size: 0.75rem; font-weight: 800; color: #16A34A;">Live Now</span>
              </div>
              <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--student-navy); margin-bottom: 0.35rem;">${a.title}</h4>
              <div style="font-size: 0.8125rem; color: var(--student-text-muted); margin-bottom: 0.75rem;">
                <strong>${a.courseCode}</strong> · ${a.questions?.length || 0} Questions · ${a.totalMarks} Marks
              </div>

              <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: var(--student-radius-sm); padding: 0.75rem; margin-bottom: 0.75rem; font-size: 0.8125rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                  <span>Submissions Received:</span>
                  <strong style="color: #166534;">${submittedCount} Candidates</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>Closes At:</span>
                  <strong style="color: var(--student-navy); font-family: monospace;">${formatDateTime(a.closingDate)}</strong>
                </div>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--student-border-subtle); padding-top: 0.75rem; margin-top: 0.5rem; gap: 0.5rem;">
              <button type="button" class="btn btn-outline-blue btn-sm" onclick="window.cbtOpenExtendModal('${a.id}')">
                ⏱️ Extend Deadline
              </button>
              <button type="button" class="btn btn-sm" style="background:#FEE2E2; color:#B91C1C; border:1px solid #FECACA;" onclick="window.cbtCloseAssessment('${a.id}')">
                Close Early
              </button>
            </div>
          </div>
        `;
      }).join("");
    };

    const renderCompletedCbt = () => {
      const container = document.getElementById("cbt-completed-container");
      if (!container) return;

      const myAllocations = allAllocationsState.filter(isMyAllocation);
      const myCourseCodes = new Set(myAllocations.map((a) => a.courseCode.toUpperCase()));
      const now = new Date();

      const completed = (allCbtAssessmentsState || []).filter((a) => {
        const isMine = myCourseCodes.has((a.courseCode || "").toUpperCase()) || a.lecturerStaffId === staffId;
        const end = a.closingDate ? new Date(a.closingDate) : null;
        return isMine && (a.status === "closed" || (end && end < now));
      });

      if (completed.length === 0) {
        container.innerHTML = `
          <div class="student-empty-box" style="grid-column: 1 / -1; padding: 2.5rem 1rem;">
            <div class="student-empty-icon">🏁</div>
            <div class="student-empty-text">No Completed CBTs</div>
            <div class="student-empty-sub">Assessments past their closing deadline or closed by the examiner will appear here for archival review.</div>
          </div>
        `;
        return;
      }

      container.innerHTML = completed.map((a) => {
        const subs = (allCbtSubmissionsState || []).filter((s) => s.assessmentId === a.id);
        const avg = subs.length > 0 ? Math.round(subs.reduce((acc, s) => acc + (s.totalScore || 0), 0) / subs.length) : 0;

        return `
          <div class="cbt-item-card" style="border-top: 4px solid var(--student-navy);">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span class="status-pill-badge badge-gold">COMPLETED</span>
                <span style="font-size: 0.75rem; color: var(--student-text-muted);">${formatDateOnly(a.closingDate || a.createdAt)}</span>
              </div>
              <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--student-navy); margin-bottom: 0.35rem;">${a.title}</h4>
              <div style="font-size: 0.8125rem; color: var(--student-text-muted); margin-bottom: 0.75rem;">
                <strong>${a.courseCode}</strong> · ${a.questions?.length || 0} Questions · ${a.totalMarks} Marks
              </div>

              <div style="background: #F8FAFC; border: 1px solid var(--student-border-subtle); border-radius: var(--student-radius-sm); padding: 0.75rem; font-size: 0.8125rem; margin-bottom: 0.75rem;">
                <div style="display: flex; justify-content: space-between;">
                  <span>Total Submissions:</span>
                  <strong>${subs.length}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 0.25rem;">
                  <span>Cohort Average:</span>
                  <strong style="color: var(--student-blue);">${avg}/${a.totalMarks}</strong>
                </div>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--student-border-subtle); padding-top: 0.75rem; margin-top: 0.5rem;">
              <button type="button" class="btn btn-outline-blue btn-sm" onclick="window.cbtViewAssessmentResults('${a.id}')">
                View Broadsheet →
              </button>
              <button type="button" class="btn btn-primary btn-sm" onclick="window.cbtReleaseResults('${a.id}')">
                Release Results
              </button>
            </div>
          </div>
        `;
      }).join("");
    };

    window.cbtCancelAssessment = async (aId) => {
      if (!confirm("Are you sure you want to cancel and delete this scheduled assessment?")) return;
      try {
        await deleteCbtAssessment(aId);
        showCbtAlert("Assessment cancelled.", "success");
      } catch (err) {
        showCbtAlert(`Cancel error: ${err.message}`, "error");
      }
    };

    window.cbtCloseAssessment = async (aId) => {
      if (!confirm("Close this assessment early? Students who have not submitted will be automatically submitted.")) return;
      try {
        await closeCbtAssessment(aId);
        showCbtAlert("Assessment closed successfully.", "success");
      } catch (err) {
        showCbtAlert(`Close error: ${err.message}`, "error");
      }
    };

    window.cbtOpenExtendModal = (aId) => {
      const a = (allCbtAssessmentsState || []).find((item) => item.id === aId);
      const modalExtend = document.getElementById("modal-cbt-extend");
      const titleEl = document.getElementById("extend-modal-course-title");
      const idInput = document.getElementById("extend-cbt-id");

      if (titleEl && a) titleEl.textContent = `${a.courseCode} — ${a.title}`;
      if (idInput) idInput.value = aId;
      if (modalExtend) modalExtend.style.display = "flex";
    };

    const modalExtend = document.getElementById("modal-cbt-extend");
    const btnCancelExtend = document.getElementById("btn-cancel-extend");
    const formExtend = document.getElementById("form-cbt-extend");
    if (btnCancelExtend) btnCancelExtend.addEventListener("click", () => modalExtend.style.display = "none");
    if (formExtend) {
      formExtend.addEventListener("submit", async (e) => {
        e.preventDefault();
        const aId = document.getElementById("extend-cbt-id")?.value;
        const newClosing = document.getElementById("extend-new-closing")?.value;
        const reason = document.getElementById("extend-reason")?.value;

        try {
          await extendCbtDeadline(aId, new Date(newClosing).toISOString(), reason);
          modalExtend.style.display = "none";
          showCbtAlert("Assessment deadline extended successfully.", "success");
        } catch (err) {
          alert(`Failed to extend deadline: ${err.message}`);
        }
      });
    }

    window.cbtViewAssessmentResults = (aId) => {
      const resFilter = document.getElementById("results-filter-assessment");
      if (resFilter) resFilter.value = aId;
      switchCbtTab("results");
    };

    window.cbtReleaseResults = async (aId) => {
      if (!confirm("Release results for this assessment to candidate student portals?")) return;
      try {
        await updateCbtResultVisibility(aId, "immediate");
        showCbtAlert("Results released to students.", "success");
      } catch (err) {
        showCbtAlert(`Release error: ${err.message}`, "error");
      }
    };

    // -----------------------------------------------------------------------
    // 10F. STUDENT SUBMISSIONS & MANUAL THEORY MARKING
    // -----------------------------------------------------------------------
    const renderCbtSubmissions = () => {
      const tbody = document.getElementById("cbt-submissions-tbody");
      if (!tbody) return;

      const myAllocations = allAllocationsState.filter(isMyAllocation);
      const myCourseCodes = new Set(myAllocations.map((a) => a.courseCode.toUpperCase()));

      const sSearch = (document.getElementById("submissions-search")?.value || "").trim().toLowerCase();
      const sAsmt = document.getElementById("submissions-filter-assessment")?.value || "all";
      const sStatus = document.getElementById("submissions-filter-status")?.value || "all";

      // Populate assessment filter dropdown
      const asmtFilterSel = document.getElementById("submissions-filter-assessment");
      if (asmtFilterSel && asmtFilterSel.options.length <= 1) {
        const myAssessments = (allCbtAssessmentsState || []).filter(
          (a) => myCourseCodes.has((a.courseCode || "").toUpperCase()) || a.lecturerStaffId === staffId
        );
        asmtFilterSel.innerHTML = `
          <option value="all">All Assessments</option>
          ${myAssessments.map((a) => `<option value="${a.id}">${a.courseCode} — ${a.title}</option>`).join("")}
        `;
      }

      const filtered = (allCbtSubmissionsState || []).filter((s) => {
        const isMine = myCourseCodes.has((s.courseCode || "").toUpperCase()) || (allCbtAssessmentsState || []).some((a) => a.id === s.assessmentId && a.lecturerStaffId === staffId);
        const matchAsmt = sAsmt === "all" || s.assessmentId === sAsmt;
        const matchStatus = sStatus === "all" || s.markingStatus === sStatus;
        const matchSearch = !sSearch ||
          (s.studentName || "").toLowerCase().includes(sSearch) ||
          (s.matricNumber || "").toLowerCase().includes(sSearch) ||
          (s.courseCode || "").toLowerCase().includes(sSearch);
        return isMine && matchAsmt && matchStatus && matchSearch;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="11">
              <div class="student-empty-box">
                <div class="student-empty-icon">📝</div>
                <div class="student-empty-text">No Submissions Matching Criteria</div>
                <div class="student-empty-sub">When candidates submit answers to your CBTs, their attempts will appear here for grading.</div>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = filtered.map((s, idx) => `
        <tr>
          <td style="color: var(--student-text-muted); font-weight: 700;">${idx + 1}</td>
          <td>
            <strong style="color: var(--student-navy); display: block;">${s.studentName}</strong>
            <span style="font-size: 0.72rem; color: var(--student-text-muted);">${s.programme || "Diploma in Theology"}</span>
          </td>
          <td style="font-weight: 700; color: var(--student-blue); font-family: monospace;">${s.matricNumber}</td>
          <td><span class="status-pill-badge badge-blue" style="font-size: 0.72rem;">${s.courseCode}</span></td>
          <td style="font-size: 0.84rem; font-weight: 600;">${s.assessmentTitle}</td>
          <td style="text-align: center; font-weight: 700;">#${s.attemptNumber || 1}</td>
          <td style="text-align: center; color: #16A34A; font-weight: 700;">${s.autoScore !== undefined ? s.autoScore : 0}</td>
          <td style="text-align: center; color: var(--student-navy); font-weight: 700;">${s.manualScore !== undefined ? s.manualScore : 0}</td>
          <td style="text-align: center; font-weight: 800; font-size: 0.95rem; color: var(--student-navy);">
            ${s.totalScore !== undefined ? s.totalScore : 0}/${s.maxMarks || 30}
          </td>
          <td style="text-align: center;">
            <span class="status-pill-badge ${s.markingStatus === 'pending_manual' ? 'badge-gold' : 'badge-green'}">
              ${s.markingStatus === 'pending_manual' ? 'Pending Manual' : 'Fully Graded'}
            </span>
          </td>
          <td style="text-align: right;">
            <button type="button" class="btn btn-outline-blue btn-sm" onclick="window.cbtOpenGradingModal('${s.id}')" style="font-size: 0.75rem; font-weight: 700;">
              🔍 Open &amp; Grade
            </button>
          </td>
        </tr>
      `).join("");
    };

    const subSearchIn = document.getElementById("submissions-search");
    const subAsmtFilter = document.getElementById("submissions-filter-assessment");
    const subStatusFilter = document.getElementById("submissions-filter-status");
    if (subSearchIn) subSearchIn.addEventListener("input", renderCbtSubmissions);
    if (subAsmtFilter) subAsmtFilter.addEventListener("change", renderCbtSubmissions);
    if (subStatusFilter) subStatusFilter.addEventListener("change", renderCbtSubmissions);

    // -----------------------------------------------------------------------
    // 10G. MANUAL THEORY MARKING MODAL
    // -----------------------------------------------------------------------
    const modalGrading = document.getElementById("modal-cbt-grading");
    const btnCloseGrading = document.getElementById("btn-close-cbt-grading");
    const btnCancelGrading = document.getElementById("btn-cancel-grading");
    const btnSaveGradingProgress = document.getElementById("btn-save-grading-progress");
    const btnFinalizeGrading = document.getElementById("btn-finalize-grading");

    window.cbtOpenGradingModal = (submissionId) => {
      const s = (allCbtSubmissionsState || []).find((item) => item.id === submissionId);
      if (!s) return;
      currentGradingSubmission = s;

      const assessment = (allCbtAssessmentsState || []).find((a) => a.id === s.assessmentId);
      const questions = assessment?.questions || [];

      // Set header metadata
      document.getElementById("grading-student-name").textContent = s.studentName;
      document.getElementById("grading-matric-number").textContent = s.matricNumber;
      document.getElementById("grading-programme-centre").textContent = ` · ${s.courseCode} · ${s.assessmentTitle} (Attempt #${s.attemptNumber || 1})`;
      document.getElementById("grading-auto-score").textContent = `${s.autoScore || 0} Marks`;
      document.getElementById("grading-live-total").textContent = `${s.totalScore || 0}/${s.maxMarks || 30}`;
      document.getElementById("grading-feedback").value = s.lecturerFeedback || "";

      const qContainer = document.getElementById("grading-questions-container");
      if (qContainer) {
        qContainer.innerHTML = questions.map((q, idx) => {
          const gradingObj = s.questionGrading?.[q.id] || {};
          const studentAns = s.answers?.[q.id] || "";
          const isTheoryOrManual = q.type === "theory" || (q.type === "short_answer" && q.matchingRule === "manual");

          if (isTheoryOrManual) {
            const currentMark = gradingObj.awardedMarks !== undefined ? gradingObj.awardedMarks : "";
            return `
              <div style="background: #FFFFFF; border: 1.5px solid #FCD34D; border-radius: var(--student-radius-sm); padding: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <strong style="color: var(--student-navy); font-size: 0.9375rem;">Question ${idx + 1} (${q.type === 'theory' ? 'Theory / Essay' : 'Short Answer'})</strong>
                  <span style="font-weight: 800; color: #B45309; font-size: 0.8125rem;">Max Marks: ${q.marks}</span>
                </div>
                <p style="font-size: 0.875rem; color: var(--student-navy); font-weight: 600; margin-bottom: 0.75rem;">${q.questionText}</p>

                ${q.markingGuide ? `
                  <div style="background: #FEF3C7; border: 1px solid #FDE68A; padding: 0.5rem 0.75rem; border-radius: var(--student-radius-sm); font-size: 0.75rem; color: #92400E; margin-bottom: 0.75rem;">
                    <strong>Marking Guide:</strong> ${q.markingGuide}
                  </div>
                ` : ""}

                <div style="background: #F8FAFC; border: 1px solid var(--student-border); border-radius: var(--student-radius-sm); padding: 0.75rem; font-size: 0.84rem; color: var(--student-navy); margin-bottom: 0.75rem;">
                  <span style="font-size: 0.72rem; color: var(--student-text-muted); font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 0.25rem;">Candidate Written Response:</span>
                  <p style="margin: 0; line-height: 1.5; white-space: pre-wrap;">${studentAns || "<em style='color: #94A3B8;'>[No Answer Submitted]</em>"}</p>
                </div>

                <div style="display: flex; align-items: center; gap: 0.75rem; justify-content: flex-end;">
                  <label style="font-size: 0.8125rem; font-weight: 700; color: var(--student-navy);">Award Marks (0–${q.marks}):</label>
                  <input type="number" min="0" max="${q.marks}" class="grade-score-input input-theory-grade" data-q-id="${q.id}" data-max="${q.marks}" value="${currentMark}" placeholder="0–${q.marks}" style="width: 80px; text-align: center; font-weight: 800; font-size: 1rem;">
                </div>
              </div>
            `;
          } else {
            // Objective question preview
            const isCorrect = gradingObj.isCorrect;
            return `
              <div style="background: #FFFFFF; border: 1px solid var(--student-border); border-radius: var(--student-radius-sm); padding: 0.75rem 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                  <strong style="color: var(--student-navy); font-size: 0.875rem;">Question ${idx + 1} (${q.type.toUpperCase()})</strong>
                  <span class="status-pill-badge ${isCorrect ? 'badge-green' : 'badge-red'}" style="font-size: 0.68rem;">
                    ${isCorrect ? `✓ Correct (+${q.marks}m)` : `✗ Incorrect (0m)`}
                  </span>
                </div>
                <p style="font-size: 0.8125rem; color: var(--student-navy); margin-bottom: 0.35rem;">${q.questionText}</p>
                <div style="font-size: 0.75rem; color: var(--student-text-muted);">
                  Candidate Selected: <strong style="color: var(--student-navy);">${studentAns || "None"}</strong> | Correct Answer: <strong style="color: #16A34A;">${q.correctOptionId || q.expectedAnswer || "—"}</strong>
                </div>
              </div>
            `;
          }
        }).join("");

        // Attach dynamic score recalculation as lecturer types
        qContainer.querySelectorAll(".input-theory-grade").forEach((input) => {
          input.addEventListener("input", () => {
            let val = parseInt(input.value, 10);
            const max = parseInt(input.getAttribute("data-max"), 10) || 1;
            if (val > max) { val = max; input.value = max; }
            if (val < 0) { val = 0; input.value = 0; }

            let manualSum = 0;
            qContainer.querySelectorAll(".input-theory-grade").forEach((inp) => {
              const v = parseInt(inp.value, 10);
              if (!isNaN(v)) manualSum += v;
            });
            const newTotal = (s.autoScore || 0) + manualSum;
            document.getElementById("grading-live-total").textContent = `${newTotal}/${s.maxMarks || 30}`;
          });
        });
      }

      modalGrading.style.display = "flex";
    };

    const handleSaveGrading = async (finalize = false) => {
      if (!currentGradingSubmission) return;

      const manualGrading = {};
      const inputs = modalGrading.querySelectorAll(".input-theory-grade");
      inputs.forEach((inp) => {
        const qId = inp.getAttribute("data-q-id");
        manualGrading[qId] = inp.value !== "" ? parseInt(inp.value, 10) : "";
      });

      const feedback = document.getElementById("grading-feedback")?.value || "";

      try {
        await gradeCbtSubmission(currentGradingSubmission.id, {
          manualGrading,
          lecturerFeedback: feedback,
          lecturerStaffId: staffId,
          lecturerName: fullName,
          finalize
        });

        modalGrading.style.display = "none";
        showCbtAlert(`✓ Grade evaluation ${finalize ? "finalized & approved" : "saved"} for ${currentGradingSubmission.studentName}.`, "success");
        renderCbtSubmissions();
        renderCbtResults();
      } catch (err) {
        alert(`Grading failed: ${err.message}`);
      }
    };

    if (btnSaveGradingProgress) btnSaveGradingProgress.addEventListener("click", () => handleSaveGrading(false));
    if (btnFinalizeGrading) btnFinalizeGrading.addEventListener("click", () => handleSaveGrading(true));
    if (btnCloseGrading) btnCloseGrading.addEventListener("click", () => modalGrading.style.display = "none");
    if (btnCancelGrading) btnCancelGrading.addEventListener("click", () => modalGrading.style.display = "none");

    // -----------------------------------------------------------------------
    // 10H. RESULTS & PERFORMANCE TAB
    // -----------------------------------------------------------------------
    const renderCbtResults = () => {
      const tbody = document.getElementById("cbt-full-results-tbody");
      if (!tbody) return;

      const myAllocations = allAllocationsState.filter(isMyAllocation);
      const myCourseCodes = new Set(myAllocations.map((a) => a.courseCode.toUpperCase()));

      const rSearch = (document.getElementById("results-search")?.value || "").trim().toLowerCase();
      const rAsmt = document.getElementById("results-filter-assessment")?.value || "all";
      const rCourse = (document.getElementById("results-filter-course")?.value || "all").toUpperCase();

      // Populate assessment filter dropdown
      const asmtSel = document.getElementById("results-filter-assessment");
      if (asmtSel && asmtSel.options.length <= 1) {
        const myAssessments = (allCbtAssessmentsState || []).filter(
          (a) => myCourseCodes.has((a.courseCode || "").toUpperCase()) || a.lecturerStaffId === staffId
        );
        asmtSel.innerHTML = `
          <option value="all">All Assessments</option>
          ${myAssessments.map((a) => `<option value="${a.id}">${a.courseCode} — ${a.title}</option>`).join("")}
        `;
      }

      const filtered = (allCbtSubmissionsState || []).filter((s) => {
        const isMine = myCourseCodes.has((s.courseCode || "").toUpperCase()) || (allCbtAssessmentsState || []).some((a) => a.id === s.assessmentId && a.lecturerStaffId === staffId);
        const matchAsmt = rAsmt === "all" || s.assessmentId === rAsmt;
        const matchCourse = rCourse === "ALL" || (s.courseCode || "").toUpperCase() === rCourse;
        const matchSearch = !rSearch ||
          (s.studentName || "").toLowerCase().includes(rSearch) ||
          (s.matricNumber || "").toLowerCase().includes(rSearch);
        return isMine && matchAsmt && matchCourse && matchSearch;
      });

      // Statistics calculations
      const participants = filtered.length;
      let avgScore = 0;
      let highestScore = 0;
      let lowestScore = participants > 0 ? 100 : 0;

      if (participants > 0) {
        const scores = filtered.map((s) => s.percentage || 0);
        avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / participants);
        highestScore = Math.max(...scores);
        lowestScore = Math.min(...scores);
      }

      const setEl = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      setEl("res-stat-participants", participants);
      setEl("res-stat-avg", `${avgScore}%`);
      setEl("res-stat-high", `${highestScore}%`);
      setEl("res-stat-low", `${lowestScore}%`);

      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="16">
              <div class="student-empty-box">
                <div class="student-empty-icon">📈</div>
                <div class="student-empty-text">No Candidate Results Found</div>
                <div class="student-empty-sub">Submissions and scores will appear here once candidates take scheduled assessments.</div>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = filtered.map((s, idx) => {
        const asmt = (allCbtAssessmentsState || []).find((a) => a.id === s.assessmentId);
        const passMark = asmt?.passMark || Math.round((s.maxMarks || 30) * 0.4);
        const isPassed = (s.totalScore || 0) >= passMark;

        return `
          <tr>
            <td style="color: var(--student-text-muted); font-weight: 700;">${idx + 1}</td>
            <td>
              <strong style="color: var(--student-navy); display: block;">${s.studentName}</strong>
              <span style="font-size: 0.72rem; color: var(--student-text-muted);">${s.studyCentre || "Main Campus"}</span>
            </td>
            <td style="font-weight: 700; color: var(--student-blue); font-family: monospace;">${s.matricNumber}</td>
            <td><span class="status-pill-badge badge-blue" style="font-size: 0.72rem;">${s.courseCode}</span></td>
            <td style="font-size: 0.8125rem;">${s.assessmentTitle}</td>
            <td style="text-align: center; font-size: 0.75rem; text-transform: uppercase;">${s.assessmentType || "Test"}</td>
            <td style="text-align: center; font-weight: 700;">#${s.attemptNumber || 1}</td>
            <td style="text-align: center; color: #16A34A; font-weight: 700;">${s.autoScore !== undefined ? s.autoScore : 0}</td>
            <td style="text-align: center; font-weight: 700;">${s.manualScore !== undefined ? s.manualScore : 0}</td>
            <td style="text-align: center; font-weight: 800; font-size: 0.95rem; color: var(--student-navy);">${s.totalScore !== undefined ? s.totalScore : 0}</td>
            <td style="text-align: center; font-weight: 700; color: var(--student-text-muted);">${s.maxMarks || 30}</td>
            <td style="text-align: center; font-weight: 800; color: var(--student-blue);">${s.percentage || 0}%</td>
            <td style="text-align: center;"><span class="grade-letter-pill ${s.grade || 'F'}">${s.grade || 'F'}</span></td>
            <td style="text-align: center;">
              <span class="status-pill-badge ${isPassed ? 'badge-green' : 'badge-red'}" style="font-size: 0.68rem;">
                ${isPassed ? 'PASS' : 'FAIL'}
              </span>
            </td>
            <td style="text-align: center;">
              <span class="status-pill-badge ${s.markingStatus === 'pending_manual' ? 'badge-gold' : 'badge-green'}" style="font-size: 0.65rem;">
                ${s.markingStatus === 'pending_manual' ? 'Pending Manual' : 'Fully Graded'}
              </span>
            </td>
            <td style="text-align: center;">
              <span class="status-pill-badge ${s.resultsReleased ? 'badge-green' : 'badge-draft'}" style="font-size: 0.65rem;">
                ${s.resultsReleased ? 'Visible' : 'Hidden'}
              </span>
            </td>
          </tr>
        `;
      }).join("");
    };

    const resSearchIn = document.getElementById("results-search");
    const resAsmtFilter = document.getElementById("results-filter-assessment");
    const resCourseFilter = document.getElementById("results-filter-course");
    const btnExportCsv = document.getElementById("btn-export-cbt-csv");
    if (resSearchIn) resSearchIn.addEventListener("input", renderCbtResults);
    if (resAsmtFilter) resAsmtFilter.addEventListener("change", renderCbtResults);
    if (resCourseFilter) resCourseFilter.addEventListener("change", renderCbtResults);
    if (btnExportCsv) {
      btnExportCsv.addEventListener("click", () => {
        const asmtId = document.getElementById("results-filter-assessment")?.value;
        exportCbtResultsCsv(asmtId === "all" ? "" : asmtId);
      });
    }

    // -----------------------------------------------------------------------
    // 10I. CBT SETTINGS TAB
    // -----------------------------------------------------------------------
    const btnSaveCbtSettings = document.getElementById("btn-save-cbt-settings");
    if (btnSaveCbtSettings) {
      btnSaveCbtSettings.addEventListener("click", () => {
        const dur = document.getElementById("cbt-pref-duration")?.value;
        const max = document.getElementById("cbt-pref-max")?.value;
        const honor = document.getElementById("cbt-pref-honor")?.value;
        localStorage.setItem("dimabin_cbt_pref_dur", dur);
        localStorage.setItem("dimabin_cbt_pref_max", max);
        localStorage.setItem("dimabin_cbt_pref_honor", honor);
        showCbtAlert("CBT preferences saved successfully.", "success");
      });
    }

    // Master dispatcher for currently active CBT tab
    const refreshCbtViews = () => {
      const myAllocations = allAllocationsState.filter(isMyAllocation);
      refreshCbtCourseSelects(myAllocations);

      if (activeCbtTab === "dashboard") renderCbtDashboard();
      else if (activeCbtTab === "questions") renderQuestionBank();
      else if (activeCbtTab === "scheduled") renderScheduledCbt();
      else if (activeCbtTab === "live") renderLiveCbt();
      else if (activeCbtTab === "completed") renderCompletedCbt();
      else if (activeCbtTab === "submissions") renderCbtSubmissions();
      else if (activeCbtTab === "results") renderCbtResults();
    };

    return {
      refreshCbtViews,
      switchCbtTab
    };
  };

  const cbtEngine = initCbtEngineController();

  // =========================================================================
  // 11. SUBSCRIBE TO REAL-TIME FIRESTORE DATA COLLECTIONS
  // =========================================================================
  subscribeCourseAllocations((allocs) => {
    allAllocationsState = allocs || [];
    refreshAllViews();
  });

  subscribeCourseRegistrations((regs) => {
    allRegistrationsState = regs || [];
    refreshAllViews();
  });

  subscribeResults((results) => {
    allResultsState = results || [];
    refreshAllViews();
  });

  subscribeCourseAssessments((asmts) => {
    allAssessmentsState = asmts || [];
    const myAllocations = allAllocationsState.filter(isMyAllocation);
    if (activeGradeSubTab === "activities") {
      renderActivitiesView(myAllocations, allAssessmentsState);
    }
  });

  subscribeAnnouncements((notices) => {
    allAnnouncementsState = notices || [];
    renderNotices();
  });

  subscribePortalNotifications((pNotifs) => {
    if (pNotifs && pNotifs.length > 0) {
      // Merge with announcements
      const merged = [...allAnnouncementsState, ...pNotifs];
      allAnnouncementsState = merged;
      renderNotices();
    }
  });

  subscribeActivityLogs((logs) => {
    renderActivityFeed(logs);
  });

  subscribeStudyCentres((centres) => {
    allCentresState = centres || [];
    if (courseCentreFilter && centres.length > 0) {
      courseCentreFilter.innerHTML = `
        <option value="all">All Study Centres</option>
        ${centres.map((c) => `<option value="${c.name}">${c.name}</option>`).join("")}
      `;
    }
    if (rosterCentreSelect && centres.length > 0) {
      rosterCentreSelect.innerHTML = `
        <option value="all">All Study Centres</option>
        ${centres.map((c) => `<option value="${c.name}">${c.name}</option>`).join("")}
      `;
    }
  });
});
