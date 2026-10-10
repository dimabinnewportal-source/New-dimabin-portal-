/**
 * DIMABIN LECTURER PORTAL — FACULTY DASHBOARD CONTROLLER
 * Pure Vanilla JavaScript ES Module (Firebase Web SDK v12.19.0 CDN)
 */

import { signOutUser } from "./firebase-users.js";
import {
  subscribeCourseAllocations,
  subscribeAnnouncements,
  getLecturerAssignments,
  COLLECTIONS
} from "./firebase-backend.js";

document.addEventListener("DOMContentLoaded", () => {
  // 1. Session Verification
  let sessionRaw = sessionStorage.getItem("dimabin_lecturer_session") || localStorage.getItem("dimabin_lecturer_session");
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

  // 2. Populate Faculty Header & Profile
  const fullName = session.fullName || "Faculty Member";
  const staffId = session.staffId || "DIMABIN/FAC/2026/01";
  const dept = session.department || "Biblical Studies & Theology";
  const centre = session.studyCentre || "Goshen Central Campus, Abeokuta";
  const email = session.email || "";
  const phone = session.phone || "";
  const qualification = session.qualification || "B.Th., M.Div.";
  const specialization = session.specialization || "General Biblical Studies";

  // Initials for avatar
  const initials = fullName
    .split(" ")
    .filter((n) => !["rev.", "dr.", "pastor", "pst.", "evang.", "prophet"].includes(n.toLowerCase()))
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "DR";

  const elAvatar = document.getElementById("lec-avatar-initials");
  if (elAvatar) elAvatar.textContent = initials;

  const elSidebarName = document.getElementById("lec-sidebar-name");
  if (elSidebarName) elSidebarName.textContent = fullName;

  const elSidebarId = document.getElementById("lec-sidebar-id");
  if (elSidebarId) elSidebarId.textContent = staffId;

  const elBannerName = document.getElementById("lec-banner-name");
  if (elBannerName) elBannerName.textContent = fullName;

  const elTopbarCentreName = document.getElementById("lec-topbar-centre-name");
  if (elTopbarCentreName) elTopbarCentreName.textContent = centre.split(",")[0];

  const elCardCentre = document.getElementById("stat-card-centre");
  if (elCardCentre) elCardCentre.textContent = centre;

  const elCardDept = document.getElementById("stat-card-dept");
  if (elCardDept) elCardDept.textContent = dept;

  // Profile section elements
  const elProfName = document.getElementById("prof-fullname");
  if (elProfName) elProfName.textContent = fullName;
  const elProfStaffId = document.getElementById("prof-staffid");
  if (elProfStaffId) elProfStaffId.textContent = staffId;
  const elProfEmail = document.getElementById("prof-email");
  if (elProfEmail) elProfEmail.textContent = email;
  const elProfPhone = document.getElementById("prof-phone");
  if (elProfPhone) elProfPhone.textContent = phone || "Not specified";
  const elProfDept = document.getElementById("prof-dept");
  if (elProfDept) elProfDept.textContent = dept;
  const elProfQual = document.getElementById("prof-qualification");
  if (elProfQual) elProfQual.textContent = qualification;
  const elProfSpec = document.getElementById("prof-specialization");
  if (elProfSpec) elProfSpec.textContent = specialization;
  const elProfCentre = document.getElementById("prof-centre");
  if (elProfCentre) elProfCentre.textContent = centre;

  // 3. Section Navigation
  const navItems = document.querySelectorAll(".student-sidebar-nav .student-nav-item");
  const sections = document.querySelectorAll(".student-section");
  const breadcrumbCurrent = document.getElementById("lecturer-section-title");

  const navigateTo = (targetSectionId) => {
    navItems.forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-section") === targetSectionId);
    });

    sections.forEach((sec) => {
      sec.classList.toggle("active", sec.id === `section-${targetSectionId}`);
    });

    if (breadcrumbCurrent) {
      const activeBtn = Array.from(navItems).find((btn) => btn.getAttribute("data-section") === targetSectionId);
      breadcrumbCurrent.textContent = activeBtn ? activeBtn.querySelector("span")?.textContent || "Dashboard" : "Dashboard";
    }

    // Close mobile drawer if open
    const sidebar = document.getElementById("lecturer-sidebar");
    const overlay = document.getElementById("lecturer-drawer-overlay");
    if (sidebar) sidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
  };

  navItems.forEach((btn) => {
    btn.addEventListener("click", () => {
      const sectionId = btn.getAttribute("data-section");
      if (sectionId) navigateTo(sectionId);
    });
  });

  const jumpToAllBtn = document.getElementById("btn-jump-to-all-courses");
  if (jumpToAllBtn) {
    jumpToAllBtn.addEventListener("click", () => navigateTo("my-courses"));
  }

  // Mobile Drawer Toggle
  const mobileToggle = document.getElementById("lecturer-mobile-toggle");
  const sidebar = document.getElementById("lecturer-sidebar");
  const overlay = document.getElementById("lecturer-drawer-overlay");

  if (mobileToggle && sidebar && overlay) {
    mobileToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      overlay.classList.toggle("open");
    });
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("open");
    });
  }

  // 4. Logout Handler
  const logoutBtn = document.getElementById("btn-lecturer-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await signOutUser();
      } catch (_) {}
      sessionStorage.removeItem("dimabin_lecturer_session");
      localStorage.removeItem("dimabin_lecturer_session");
      window.location.href = "lecturer-login.html";
    });
  }

  // 5. Real-Time Course Allocations Synchronization
  const overviewContainer = document.getElementById("overview-courses-container");
  const fullContainer = document.getElementById("full-courses-container");
  const assessmentsContainer = document.getElementById("assessments-course-list");
  const statBannerCourses = document.getElementById("stat-banner-courses");
  const statCardCourses = document.getElementById("stat-card-courses");
  const statBannerCentres = document.getElementById("stat-banner-centres");

  const renderAssignedCourses = (allAllocations) => {
    const normStaffId = staffId.trim().toLowerCase();
    const myAllocations = (allAllocations || []).filter((a) => {
      const allocLecturer = (a.lecturerId || "").trim().toLowerCase();
      const isStatusActive = (a.status || "active").toLowerCase() !== "ended";
      return isStatusActive && (allocLecturer === normStaffId || allocLecturer.includes(normStaffId) || normStaffId.includes(allocLecturer));
    });

    const coursesCount = myAllocations.length;
    if (statBannerCourses) statBannerCourses.textContent = coursesCount;
    if (statCardCourses) statCardCourses.textContent = coursesCount;

    const uniqueCentres = new Set(myAllocations.map((a) => a.studyCentre || centre));
    if (statBannerCentres) statBannerCentres.textContent = Math.max(1, uniqueCentres.size);

    if (myAllocations.length === 0) {
      const emptyHtml = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--student-text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">📚</div>
          <strong style="color: var(--student-navy); font-size: 1rem; display: block;">No Courses Currently Assigned</strong>
          <p style="font-size: 0.875rem; margin-top: 0.25rem;">
            When the Academic Administrator assigns course offerings to your institutional staff ID (${staffId}), they will appear here automatically.
          </p>
        </div>
      `;
      if (overviewContainer) overviewContainer.innerHTML = emptyHtml;
      if (fullContainer) fullContainer.innerHTML = emptyHtml;
      if (assessmentsContainer) assessmentsContainer.innerHTML = emptyHtml;
      return;
    }

    // Render Overview List (Compact Cards Grid)
    const cardsHtml = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem;">
        ${myAllocations
          .map(
            (alloc) => `
          <div class="course-offering-card">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                <span class="card-course-code">${alloc.courseCode || "THY-101"}</span>
                <span class="faculty-badge badge-active">${alloc.semester || "Trimester 1"}</span>
              </div>
              <h4 class="card-course-title">${alloc.courseTitle || "Theological Study"}</h4>
              <div class="card-course-meta">
                <div class="meta-row">
                  <span style="font-weight: 600;">📍 Campus:</span>
                  <span>${alloc.studyCentre || centre}</span>
                </div>
                <div class="meta-row">
                  <span style="font-weight: 600;">📅 Session:</span>
                  <span>${alloc.academicSession || "2026/2027"}</span>
                </div>
              </div>
            </div>
            <div style="padding-top: 0.75rem; border-top: 1px solid var(--student-border-subtle); display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.75rem; color: var(--student-text-muted);">Assigned Instructor</span>
              <span class="faculty-badge badge-blue">Teaching</span>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;

    if (overviewContainer) overviewContainer.innerHTML = cardsHtml;

    // Render Full Courses Section Table
    const tableHtml = `
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
          <thead>
            <tr style="border-bottom: 2px solid var(--student-border); text-align: left; color: var(--student-text-muted); font-size: 0.75rem; text-transform: uppercase;">
              <th style="padding: 0.75rem 1rem;">Course Code</th>
              <th style="padding: 0.75rem 1rem;">Course Title</th>
              <th style="padding: 0.75rem 1rem;">Study Centre</th>
              <th style="padding: 0.75rem 1rem;">Term / Semester</th>
              <th style="padding: 0.75rem 1rem;">Academic Session</th>
              <th style="padding: 0.75rem 1rem;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${myAllocations
              .map(
                (alloc) => `
              <tr style="border-bottom: 1px solid var(--student-border-subtle);">
                <td style="padding: 0.85rem 1rem; font-weight: 700; color: var(--student-blue);">${alloc.courseCode || "N/A"}</td>
                <td style="padding: 0.85rem 1rem; font-weight: 600; color: var(--student-navy);">${alloc.courseTitle || "N/A"}</td>
                <td style="padding: 0.85rem 1rem; color: var(--student-text-muted);">${alloc.studyCentre || "Goshen Central Campus"}</td>
                <td style="padding: 0.85rem 1rem;">${alloc.semester || "First Semester"}</td>
                <td style="padding: 0.85rem 1rem;">${alloc.academicSession || "2026/2027"}</td>
                <td style="padding: 0.85rem 1rem;">
                  <span class="faculty-badge badge-active">${(alloc.status || "active").toUpperCase()}</span>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
    if (fullContainer) fullContainer.innerHTML = tableHtml;

    // Render Assessment Cards
    const assessHtml = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.25rem;">
        ${myAllocations
          .map(
            (alloc) => `
          <div class="student-content-card" style="padding: 1.25rem; border: 1px solid var(--student-border);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
              <span class="card-course-code">${alloc.courseCode}</span>
              <span class="faculty-badge badge-gold">Open for Grading</span>
            </div>
            <h4 style="font-size: 1rem; font-weight: 700; color: var(--student-navy); margin-bottom: 0.25rem;">${alloc.courseTitle}</h4>
            <p style="font-size: 0.8125rem; color: var(--student-text-muted); margin-bottom: 1rem;">Campus: ${alloc.studyCentre}</p>
            <div style="background: var(--student-bg); padding: 0.75rem; border-radius: var(--student-radius-sm); font-size: 0.8125rem; margin-bottom: 1rem;">
              <div>Continuous Assessment (CA): <strong>30%</strong></div>
              <div>End-of-Term Examination: <strong>70%</strong></div>
            </div>
            <button type="button" class="btn btn-outline-blue btn-sm" style="width: 100%;" onclick="alert('Grade upload for ${alloc.courseCode} (${alloc.studyCentre}) will synchronize with the Academic Registry on term close.');">
              Open Grade Sheet
            </button>
          </div>
        `
          )
          .join("")}
      </div>
    `;
    if (assessmentsContainer) assessmentsContainer.innerHTML = assessHtml;
  };

  // Subscribe to Course Allocations in real time
  subscribeCourseAllocations((allocs) => {
    renderAssignedCourses(allocs);
  });

  // 6. Announcements Subscription
  const announcementsContainer = document.getElementById("announcements-container");
  subscribeAnnouncements((notices) => {
    if (!announcementsContainer) return;
    if (!notices || notices.length === 0) {
      announcementsContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--student-text-muted);">
          <p>No new circulars or notices posted at this time.</p>
        </div>
      `;
      return;
    }

    announcementsContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${notices
          .map(
            (notice) => `
          <div style="background: var(--student-bg); border-left: 4px solid var(--student-blue); padding: 1.15rem; border-radius: var(--student-radius-sm);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; flex-wrap: wrap;">
              <strong style="color: var(--student-navy); font-size: 0.95rem;">${notice.title || "Academic Notice"}</strong>
              <span style="font-size: 0.75rem; color: var(--student-text-muted);">${notice.createdAt ? new Date(notice.createdAt).toLocaleDateString() : ""}</span>
            </div>
            <p style="font-size: 0.875rem; color: var(--student-text-main); margin-bottom: 0.5rem; line-height: 1.5;">${notice.message || ""}</p>
            <span style="font-size: 0.72rem; color: var(--student-text-muted); text-transform: uppercase; font-weight: 600;">Category: ${notice.category || "General"}</span>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  });
});
