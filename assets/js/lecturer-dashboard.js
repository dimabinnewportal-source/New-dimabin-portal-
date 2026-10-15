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
        btn.textContent = "Save Profile Details";
      }
    });
  }

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
