/**
 * DIMABIN ADMINISTRATOR DASHBOARD — COMMAND CENTRE CONTROLLER
 * Pure Vanilla JavaScript ES Module (Zero Framework Dependencies)
 * Reuses existing Firebase Foundation & Authentication Modules.
 */

import { auth, signOutUser, onAuthStateChange } from "./firebase-users.js";
import {
  getAdmissionSettings,
  updateAdmissionSettings,
  subscribeAdmissionSettings,
  formatAuditDateTime,
  formatAdmissionDate,
  DEFAULT_ADMISSION_SETTINGS
} from "./firebase-admissions.js";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementPublish,
  subscribeAnnouncements,
  formatDateOnly,
  subscribeCourses,
  createCourse,
  updateCourse,
  setCourseStatus,
  toggleCourseStatus,
  deleteCoursePermanently,
  checkCourseDependencies,
  normalizeCourseCode,
  subscribeCourseAllocations,
  assignCourseOffering,
  reassignCourseAllocation,
  endCourseAllocation,
  deleteCourseAllocation,
  subscribeLecturers,
  createLecturer,
  updateLecturer,
  setLecturerStatus,
  refreshLecturerDashboardData
} from "./firebase-backend.js";

// Canonical Administrator Credentials
export const ADMIN_CONFIG = Object.freeze({
  ADMIN_ID: "DIMABIN/ADM/2026/01",
  ADMIN_EMAIL: "dimabinnewportal@gmail.com",
  ROLE: "SUPER ADMINISTRATOR",
  SESSION: "2026/2027",
  SEMESTER: "First Semester"
});

/**
 * TASK 11 — FUTURE NOTIFICATION DATA MODELS
 * Prepared structures for upcoming Firestore integration phases
 */
export function createPublicNotificationModel({ title, message, status = "draft", createdBy = ADMIN_CONFIG.ADMIN_ID }) {
  return {
    id: `pub_${Date.now()}`,
    type: "public",
    audience: "public",
    title: title || "",
    message: message || "",
    status, // draft | scheduled | published | archived
    createdAt: new Date().toISOString(),
    publishedAt: status === "published" ? new Date().toISOString() : null,
    expiresAt: null,
    createdBy
  };
}

export function createPortalNotificationModel({ audience, title, message, status = "draft", createdBy = ADMIN_CONFIG.ADMIN_ID }) {
  return {
    id: `port_${Date.now()}`,
    type: "portal",
    audience: audience || "student", // student | lecturer | admin
    title: title || "",
    message: message || "",
    status, // draft | scheduled | published | archived
    createdAt: new Date().toISOString(),
    publishedAt: status === "published" ? new Date().toISOString() : null,
    expiresAt: null,
    createdBy
  };
}

/**
 * Navigation Section Switcher
 * @param {string} sectionId - Target section ID
 */
export function navigateToSection(sectionId) {
  if (!sectionId) return;

  // 1. Hide all sections
  const allSections = document.querySelectorAll(".admin-section");
  allSections.forEach((sec) => sec.classList.remove("active"));

  // 2. Show target section
  const targetSection = document.getElementById(`section-${sectionId}`);
  if (targetSection) {
    targetSection.classList.add("active");
  } else {
    // Fallback to dashboard
    const dash = document.getElementById("section-dashboard");
    if (dash) dash.classList.add("active");
  }

  // 3. Update sidebar active item
  const allNavItems = document.querySelectorAll(".nav-item");
  allNavItems.forEach((btn) => {
    if (btn.getAttribute("data-section") === sectionId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // 4. Update Header Breadcrumb/Title
  const headerSectionName = document.getElementById("header-current-section");
  if (headerSectionName) {
    const formattedTitle = sectionId
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    headerSectionName.textContent = formattedTitle;
  }

  // 5. Scroll to top of main content
  window.scrollTo({ top: 0, behavior: "smooth" });

  // 6. Close mobile drawer if open
  closeMobileDrawer();
}

/**
 * Mobile Drawer Controls
 */
export function openMobileDrawer() {
  const sidebar = document.getElementById("admin-sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (sidebar && overlay) {
    sidebar.classList.add("open");
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }
}

export function closeMobileDrawer() {
  const sidebar = document.getElementById("admin-sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (sidebar && overlay) {
    sidebar.classList.remove("open");
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }
}

/**
 * Handle Administrator Sign Out
 */
export async function handleAdminSignOut() {
  console.log("[DIMABIN Dashboard] Initiating administrator sign-out...");
  try {
    sessionStorage.removeItem("dimabin_admin_session");
    localStorage.removeItem("dimabin_admin_session");
    await signOutUser();
    console.log("[DIMABIN Dashboard] Firebase signOut complete and session cleared.");
  } catch (err) {
    console.warn("[DIMABIN Dashboard] Sign out warning:", err.message);
  } finally {
    console.log("[DIMABIN Dashboard] Navigating to admin-login.html");
    window.location.href = "admin-login.html";
  }
}

/**
 * Setup Tab Switching inside Notification Sections
 */
function initNotificationTabs() {
  const tabContainers = document.querySelectorAll(".notif-tab-nav");

  tabContainers.forEach((nav) => {
    const buttons = nav.querySelectorAll(".notif-tab-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetTabId = btn.getAttribute("data-tab");
        const parentSection = btn.closest(".admin-section");
        if (!parentSection) return;

        // Reset buttons in this tab nav
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        // Switch panes
        const panes = parentSection.querySelectorAll(".notif-tab-pane");
        panes.forEach((pane) => {
          if (pane.id === targetTabId) {
            pane.classList.add("active");
          } else {
            pane.classList.remove("active");
          }
        });
      });
    });
  });
}

/**
 * Initialize Dashboard DOM Event Listeners
 */
export function initDashboard() {
  // 1. Sidebar Nav Click Handlers
  const navItems = document.querySelectorAll(".nav-item[data-section]");
  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const section = item.getAttribute("data-section");
      navigateToSection(section);
    });
  });

  // 2. Mobile Drawer Triggers
  const toggleBtn = document.getElementById("sidebar-toggle-btn");
  const closeBtn = document.getElementById("sidebar-close-btn");
  const overlay = document.getElementById("sidebar-overlay");

  if (toggleBtn) toggleBtn.addEventListener("click", openMobileDrawer);
  if (closeBtn) closeBtn.addEventListener("click", closeMobileDrawer);
  if (overlay) overlay.addEventListener("click", closeMobileDrawer);

  // 3. Quick Commands Click Handlers
  const quickCmdBtns = document.querySelectorAll(".cmd-btn[data-target-section]");
  quickCmdBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target-section");
      navigateToSection(target);
    });
  });

  // 4. Sign Out Buttons (Header and Sidebar)
  const headerSignOut = document.getElementById("header-signout-btn");
  const sidebarSignOut = document.getElementById("sidebar-signout-btn");

  if (headerSignOut) headerSignOut.addEventListener("click", handleAdminSignOut);
  if (sidebarSignOut) sidebarSignOut.addEventListener("click", handleAdminSignOut);

  // 5. Initialize Notification Sub-Tabs
  initNotificationTabs();

  // 6. Validate authenticated session & listen to Firebase Auth state
  console.log("[DIMABIN Dashboard] Stage 1: Initializing Administrator Command Centre...");

  let storedAdminSession = null;
  try {
    const raw = sessionStorage.getItem("dimabin_admin_session") || localStorage.getItem("dimabin_admin_session");
    if (raw) {
      storedAdminSession = JSON.parse(raw);
      console.log("[DIMABIN Dashboard] Stage 2: Stored administrator session validated:", {
        uid: storedAdminSession.uid,
        email: storedAdminSession.email,
        adminId: storedAdminSession.adminId,
        fullName: storedAdminSession.fullName,
        role: storedAdminSession.role
      });

      const headerEmailEl = document.getElementById("header-admin-email");
      if (headerEmailEl && storedAdminSession.email) {
        headerEmailEl.textContent = storedAdminSession.email;
      }
    } else {
      console.log("[DIMABIN Dashboard] Stage 2: No stored session found in storage; awaiting Firebase Auth listener confirmation...");
    }
  } catch (parseErr) {
    console.warn("[DIMABIN Dashboard] Session parse warning:", parseErr.message);
  }

  onAuthStateChange((user) => {
    const userEmailEl = document.getElementById("header-admin-email");

    if (user && user.email) {
      console.log("[DIMABIN Dashboard] Stage 3: Firebase Auth session active for:", user.email, "UID:", user.uid);
      if (userEmailEl) userEmailEl.textContent = user.email;

      // Ensure session in storage stays synchronized with active Firebase user
      if (!storedAdminSession) {
        const syncedSession = {
          uid: user.uid,
          email: user.email,
          adminId: ADMIN_CONFIG.ADMIN_ID,
          fullName: "DIMABIN Super Administrator",
          role: "admin",
          authenticatedAt: new Date().toISOString()
        };
        try {
          sessionStorage.setItem("dimabin_admin_session", JSON.stringify(syncedSession));
          console.log("[DIMABIN Dashboard] Stage 4: Admin session synchronized to sessionStorage.");
        } catch (_) {}
      }
    } else {
      console.log("[DIMABIN Dashboard] Stage 3: Firebase Auth indicates no active persistent user or user signed out.");
    }
  });

  // 7. Announcement / Public Notification Manager (Integrated with Firestore "announcements" collection)
  initAdminAnnouncementsManager();

  // 8. ADMISSION AVAILABILITY & SESSION MANAGEMENT CONTROLLER (Phase 1)
  initAdmissionManagement();

  // 9. COURSE MANAGEMENT SYSTEM CONTROLLER (Three-Semester Academic System)
  initCourseManagement();

  // 10. COURSE ALLOCATION MODULE CONTROLLER (Multi-Centre Scoped Offering Assignments & Audit)
  initCourseAllocation();

  // 11. LECTURER MANAGEMENT MODULE CONTROLLER (Faculty Directory & Multi-Assignment Tracking)
  initLecturerManagement();
}

/**
 * Initialize Admin Announcements Management
 * Connects the "form-create-public-notif" to the Firestore "announcements" collection
 * and renders Active, Scheduled, and Archived/Draft lists with Publish/Unpublish/Delete controls.
 */
export function initAdminAnnouncementsManager() {
  const publicNotifForm = document.getElementById("form-create-public-notif");
  const feedback = document.getElementById("pub-notif-feedback");
  const activePane = document.getElementById("pub-tab-active");
  const scheduledPane = document.getElementById("pub-tab-scheduled");
  const archivedPane = document.getElementById("pub-tab-archived");

  const activeTabBtn = document.querySelector('.notif-tab-btn[data-tab="pub-tab-active"]');
  const scheduledTabBtn = document.querySelector('.notif-tab-btn[data-tab="pub-tab-scheduled"]');
  const archivedTabBtn = document.querySelector('.notif-tab-btn[data-tab="pub-tab-archived"]');

  if (publicNotifForm) {
    publicNotifForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const titleInput = document.getElementById("pub-notif-title");
      const categoryInput = document.getElementById("pub-notif-category");
      const statusInput = document.getElementById("pub-notif-status");
      const messageInput = document.getElementById("pub-notif-message");

      const title = titleInput?.value?.trim();
      const message = messageInput?.value?.trim();
      const category = categoryInput?.options[categoryInput.selectedIndex]?.text || "Institutional Announcement";
      const status = statusInput?.value || "published";

      if (!title || !message) {
        if (feedback) {
          feedback.style.display = "block";
          feedback.style.background = "#FEE2E2";
          feedback.style.color = "#B91C1C";
          feedback.style.borderColor = "#FECACA";
          feedback.textContent = "Please provide both a title and message for the announcement.";
        }
        return;
      }

      try {
        const submitBtn = publicNotifForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        await createAnnouncement({
          title,
          message,
          category,
          audience: "public",
          status: status === "draft" ? "draft" : status === "scheduled" ? "scheduled" : "published"
        });

        if (feedback) {
          feedback.style.display = "block";
          feedback.style.background = "#DCFCE7";
          feedback.style.color = "#15803D";
          feedback.style.borderColor = "#BBF7D0";
          feedback.textContent = `✓ Announcement "${title}" ${status === "published" ? "published live to the public website!" : "saved as " + status + "."}`;
          setTimeout(() => { feedback.style.display = "none"; }, 6000);
        }

        publicNotifForm.reset();
      } catch (err) {
        if (feedback) {
          feedback.style.display = "block";
          feedback.style.background = "#FEE2E2";
          feedback.style.color = "#B91C1C";
          feedback.textContent = `Error publishing announcement: ${err.message}`;
        }
      } finally {
        const submitBtn = publicNotifForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // Subscribe to real-time announcements from Firestore and populate tabs
  subscribeAnnouncements((announcements) => {
    const list = announcements || [];

    const activeList = list.filter((a) => a.status === "published");
    const scheduledList = list.filter((a) => a.status === "scheduled");
    const archivedList = list.filter((a) => a.status === "draft" || a.status === "archived");

    if (activeTabBtn) activeTabBtn.textContent = `Active Public Notifications (${activeList.length})`;
    if (scheduledTabBtn) scheduledTabBtn.textContent = `Scheduled Notifications (${scheduledList.length})`;
    if (archivedTabBtn) archivedTabBtn.textContent = `Drafts & Archived (${archivedList.length})`;

    const renderCard = (ann) => {
      const isPublished = ann.status === "published";
      const dateStr = formatDateOnly(ann.publishedAt || ann.createdAt);
      return `
        <div class="content-card" style="margin-bottom: 1rem; border-left: 4px solid ${isPublished ? "var(--admin-success)" : "var(--admin-gold)"};" data-ann-id="${ann.id}">
          <div style="padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 260px;">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
                <span class="placeholder-tag" style="background: ${isPublished ? "var(--admin-success-bg)" : "#FEF3C7"}; color: ${isPublished ? "var(--admin-success)" : "#92400E"}; font-size: 0.7rem;">
                  ${(ann.status || "draft").toUpperCase()}
                </span>
                <span style="font-size: 0.75rem; color: var(--admin-text-muted);">${ann.category || "General"}</span>
                <span style="font-size: 0.75rem; color: var(--admin-text-muted);">· ${dateStr}</span>
              </div>
              <h4 style="font-size: 1rem; font-weight: 700; color: var(--admin-navy); margin-bottom: 0.5rem;">${ann.title || "Untitled Announcement"}</h4>
              <p style="font-size: 0.8125rem; color: var(--admin-text-muted); line-height: 1.5;">${ann.message || ""}</p>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <button type="button" class="btn-card-action ann-toggle-btn" data-id="${ann.id}" data-current-status="${ann.status || "published"}">
                ${isPublished ? "Unpublish (Move to Draft)" : "Publish to Website"}
              </button>
              <button type="button" class="btn-card-action ann-delete-btn" data-id="${ann.id}" style="color: #DC2626; border-color: #FCA5A5;">
                Delete
              </button>
            </div>
          </div>
        </div>
      `;
    };

    if (activePane) {
      if (activeList.length === 0) {
        activePane.innerHTML = `
          <div class="empty-state-box">
            <div class="empty-icon">📢</div>
            <div class="empty-state-text">No active public notifications.</div>
            <div class="empty-state-sub">Create and publish an announcement to display it live on the public website Notice Board.</div>
          </div>
        `;
      } else {
        activePane.innerHTML = activeList.map(renderCard).join("");
      }
    }

    if (scheduledPane) {
      if (scheduledList.length === 0) {
        scheduledPane.innerHTML = `
          <div class="empty-state-box">
            <div class="empty-icon">⏱️</div>
            <div class="empty-state-text">No scheduled public notifications.</div>
            <div class="empty-state-sub">Announcements set with a future release date will appear here.</div>
          </div>
        `;
      } else {
        scheduledPane.innerHTML = scheduledList.map(renderCard).join("");
      }
    }

    if (archivedPane) {
      if (archivedList.length === 0) {
        archivedPane.innerHTML = `
          <div class="empty-state-box">
            <div class="empty-icon">📦</div>
            <div class="empty-state-text">No drafts or archived announcements.</div>
            <div class="empty-state-sub">Unpublished drafts or archived notices will be listed here.</div>
          </div>
        `;
      } else {
        archivedPane.innerHTML = archivedList.map(renderCard).join("");
      }
    }

    // Attach actions
    document.querySelectorAll(".ann-toggle-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const annId = btn.getAttribute("data-id");
        const curr = btn.getAttribute("data-current-status");
        btn.disabled = true;
        try {
          await toggleAnnouncementPublish(annId, curr);
        } catch (err) {
          console.warn("Toggle publish error:", err);
        }
      });
    });

    document.querySelectorAll(".ann-delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const annId = btn.getAttribute("data-id");
        if (confirm("Are you sure you want to delete this announcement?")) {
          btn.disabled = true;
          try {
            await deleteAnnouncement(annId);
          } catch (err) {
            console.warn("Delete announcement error:", err);
          }
        }
      });
    });
  });

  const portalNotifForm = document.getElementById("form-create-portal-notif");
  if (portalNotifForm) {
    portalNotifForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.getElementById("portal-notif-title")?.value;
      const audience = document.getElementById("portal-notif-audience")?.value;
      const feedbackEl = document.getElementById("portal-notif-feedback");
      if (feedbackEl) {
        feedbackEl.style.display = "block";
        feedbackEl.textContent = `Notification '${title || "Notice"}' validated for '${audience?.toUpperCase()}' audience.`;
        setTimeout(() => { feedbackEl.style.display = "none"; }, 5000);
      }
      portalNotifForm.reset();
    });
  }
}

/**
 * Initialize Admission Management System
 */
let activeAdmissionSettings = { ...DEFAULT_ADMISSION_SETTINGS };

export function initAdmissionManagement() {
  console.log("[DIMABIN Dashboard] Initializing Admission Management Controller...");

  const radioOpen = document.getElementById("radio-status-open");
  const radioClosed = document.getElementById("radio-status-closed");
  const sessionInput = document.getElementById("adm-academic-session");
  const openDateInput = document.getElementById("adm-opening-date");
  const closeDateInput = document.getElementById("adm-closing-date");
  const updatedByInput = document.getElementById("adm-updated-by");
  const feedbackBox = document.getElementById("admission-settings-feedback");
  const form = document.getElementById("form-admission-settings");
  const quickToggleBtn = document.getElementById("btn-quick-toggle-status");

  // Form submission feedback helper
  const showFeedback = (type, message) => {
    if (!feedbackBox) return;
    feedbackBox.style.display = "block";
    if (type === "success") {
      feedbackBox.style.background = "#DCFCE7";
      feedbackBox.style.color = "#15803D";
      feedbackBox.style.border = "1px solid #BBF7D0";
    } else {
      feedbackBox.style.background = "#FEE2E2";
      feedbackBox.style.color = "#B91C1C";
      feedbackBox.style.border = "1px solid #FECACA";
    }
    feedbackBox.innerHTML = `<strong>${type === "success" ? "✓" : "⚠️"}</strong> ${message}`;
    setTimeout(() => {
      if (feedbackBox) feedbackBox.style.display = "none";
    }, 6000);
  };

  // Render admission state across dashboard elements
  const syncDashboardUI = (settings) => {
    activeAdmissionSettings = settings;
    const isOpen = Boolean(settings.isOpen);
    const session = settings.academicSession || "2026/2027";
    const closingDate = settings.closingDate || "2026-11-30";
    const openingDate = settings.openingDate || "2026-01-15";
    const auditTime = formatAuditDateTime(settings.updatedAt);
    const updatedBy = settings.updatedBy || ADMIN_CONFIG.ADMIN_ID;

    // 1. Overview Session Strip
    const sessionBadge = document.getElementById("dash-academic-session-badge");
    const admStatusBadge = document.getElementById("dash-admission-status-badge");
    if (sessionBadge) sessionBadge.textContent = session;
    if (admStatusBadge) {
      if (isOpen) {
        admStatusBadge.className = "session-strip-badge adm-open";
        admStatusBadge.textContent = "● OPEN";
      } else {
        admStatusBadge.className = "session-strip-badge adm-closed";
        admStatusBadge.textContent = "● CLOSED";
      }
    }

    // 2. Admission Control Live Banner
    const liveDot = document.getElementById("control-live-dot");
    const liveTitle = document.getElementById("control-live-status-title");
    const liveTag = document.getElementById("control-live-status-tag");
    const liveDesc = document.getElementById("control-live-status-desc");

    if (liveDot) {
      liveDot.className = `status-indicator-dot ${isOpen ? "open" : "closed"}`;
    }
    if (liveTitle) {
      liveTitle.textContent = isOpen ? "ADMISSIONS CURRENTLY OPEN" : "ADMISSIONS CURRENTLY CLOSED";
      liveTitle.style.color = isOpen ? "var(--admin-navy)" : "#DC2626";
    }
    if (liveTag) {
      if (isOpen) {
        liveTag.textContent = "ACTIVE INTAKE";
        liveTag.style.color = "var(--admin-success)";
        liveTag.style.background = "var(--admin-success-bg)";
        liveTag.style.borderColor = "#86EFAC";
      } else {
        liveTag.textContent = "INTAKE CONCLUDED";
        liveTag.style.color = "#DC2626";
        liveTag.style.background = "#FEE2E2";
        liveTag.style.borderColor = "#FCA5A5";
      }
    }
    if (liveDesc) {
      liveDesc.textContent = isOpen
        ? "The online application portal on admissions.html is accepting new candidate submissions."
        : "The online application portal on admissions.html is locked with an official registry closure notice.";
    }

    // 3. Form Input Values (do not overwrite while user is editing if activeElement is one of them)
    if (document.activeElement !== sessionInput && sessionInput) sessionInput.value = session;
    if (document.activeElement !== openDateInput && openDateInput) openDateInput.value = formatAdmissionDate(openingDate);
    if (document.activeElement !== closeDateInput && closeDateInput) closeDateInput.value = formatAdmissionDate(closingDate);
    if (updatedByInput) updatedByInput.value = updatedBy;

    if (radioOpen && radioClosed) {
      if (isOpen) {
        radioOpen.checked = true;
      } else {
        radioClosed.checked = true;
      }
    }

    // 4. Audit Metadata display
    const auditTimeEl = document.getElementById("audit-timestamp");
    const auditByEl = document.getElementById("audit-updated-by");
    if (auditTimeEl) auditTimeEl.textContent = auditTime;
    if (auditByEl) auditByEl.textContent = updatedBy;

    // 5. Applications Section Header Strip
    const appSectionDot = document.getElementById("app-section-status-dot");
    const appSectionText = document.getElementById("app-section-status-text");
    const appSectionSession = document.getElementById("app-section-session-text");
    const appSectionDeadline = document.getElementById("app-section-deadline-text");

    if (appSectionDot) appSectionDot.className = `status-indicator-dot ${isOpen ? "open" : "closed"}`;
    if (appSectionText) {
      appSectionText.textContent = isOpen ? "OPEN (Accepting Applications)" : "CLOSED (Intake Paused)";
      appSectionText.style.color = isOpen ? "var(--admin-success)" : "#DC2626";
    }
    if (appSectionSession) appSectionSession.textContent = session;
    if (appSectionDeadline) appSectionDeadline.textContent = formatAdmissionDate(closingDate);
  };

  // Subscribe to real-time admission updates from Firestore & local channel
  subscribeAdmissionSettings(syncDashboardUI);

  // Form Submit Handler
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById("btn-save-admission-settings");
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.style.opacity = "0.7";
      }

      try {
        const isOpen = radioOpen ? radioOpen.checked : true;
        const academicSession = sessionInput?.value?.trim() || "2026/2027";
        const openingDate = openDateInput?.value || "2026-01-15";
        const closingDate = closeDateInput?.value || "2026-11-30";
        const updatedBy = ADMIN_CONFIG.ADMIN_ID;

        const result = await updateAdmissionSettings({
          isOpen,
          academicSession,
          openingDate,
          closingDate,
          updatedBy
        });

        showFeedback("success", result.message);
      } catch (err) {
        console.error("[DIMABIN Admissions] Save error:", err);
        showFeedback("error", `Failed to save admission settings: ${err.message}`);
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.style.opacity = "1";
        }
      }
    });
  }

  // Quick Toggle Button Handler
  if (quickToggleBtn) {
    quickToggleBtn.addEventListener("click", async () => {
      try {
        const newIsOpen = !activeAdmissionSettings.isOpen;
        if (radioOpen && radioClosed) {
          if (newIsOpen) radioOpen.checked = true;
          else radioClosed.checked = true;
        }

        const result = await updateAdmissionSettings({
          ...activeAdmissionSettings,
          isOpen: newIsOpen,
          updatedBy: ADMIN_CONFIG.ADMIN_ID
        });

        showFeedback(
          "success",
          `Admission status toggled to ${newIsOpen ? "OPEN" : "CLOSED"}. ${result.message}`
        );
      } catch (err) {
        showFeedback("error", `Quick toggle warning: ${err.message}`);
      }
    });
  }
}

/**
 * =========================================================================
 * 15. GLOBAL ADMIN TOAST NOTIFICATION HELPER
 * =========================================================================
 */
export function showAdminToast(type, message) {
  const container = document.getElementById("admin-toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `admin-toast toast-${type === "error" ? "error" : type === "warning" ? "warning" : "success"}`;

  const icon = type === "error" ? "⚠️" : type === "warning" ? "🔔" : "✓";
  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.5rem;">
      <span style="font-size: 1rem;">${icon}</span>
      <span>${message}</span>
    </div>
    <button type="button" class="admin-toast-close" aria-label="Close notification">&times;</button>
  `;

  const closeBtn = toast.querySelector(".admin-toast-close");
  const dismiss = () => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(16px)";
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  };

  if (closeBtn) closeBtn.addEventListener("click", dismiss);
  setTimeout(dismiss, 4500);

  container.appendChild(toast);
}

/**
 * =========================================================================
 * 16. COURSE MANAGEMENT SYSTEM CONTROLLER
 * Full 3-Semester Academic System with Dynamic Filtering, CRUD & Dependency Safety
 * =========================================================================
 */
export function initCourseManagement() {
  console.log("[DIMABIN Dashboard] Initializing 3-Semester Course Management Controller...");

  // State
  let allCourses = [];
  let pendingStatusCourse = null;
  let pendingDeleteCourse = null;

  const filters = {
    search: "",
    session: "all",
    semester: "all",
    status: "all",
    centre: "all",
    department: "all",
    sort: "code-asc"
  };

  // Header and Session Badges
  const sessionBadge = document.getElementById("courses-active-session-badge");
  const semesterBadge = document.getElementById("courses-active-semester-badge");
  const countPill = document.getElementById("courses-count-pill");
  const filterSummary = document.getElementById("courses-filter-summary");

  // Summary Stat Elements
  const statTotal = document.getElementById("stat-courses-total");
  const statActive = document.getElementById("stat-courses-active");
  const statInactive = document.getElementById("stat-courses-inactive");
  const statSem1 = document.getElementById("stat-courses-sem1");
  const statSem2 = document.getElementById("stat-courses-sem2");
  const statSem3 = document.getElementById("stat-courses-sem3");

  // Filter Elements
  const searchInput = document.getElementById("course-search-input");
  const sessionSelect = document.getElementById("filter-course-session");
  const semesterSelect = document.getElementById("filter-course-semester");
  const statusSelect = document.getElementById("filter-course-status");
  const centreSelect = document.getElementById("filter-course-centre");
  const deptSelect = document.getElementById("filter-course-dept");
  const sortSelect = document.getElementById("filter-course-sort");
  const resetBtn = document.getElementById("btn-reset-course-filters");

  // Table Elements
  const tbody = document.getElementById("courses-table-tbody");
  const loadingEl = document.getElementById("courses-table-loading");
  const emptyEl = document.getElementById("courses-table-empty");
  const errorEl = document.getElementById("courses-table-error");
  const emptyHeading = document.getElementById("courses-empty-heading");

  // Header Buttons
  const listViewBtn = document.getElementById("btn-course-list-view");
  const addCourseBtn = document.getElementById("btn-open-add-course");

  // Add / Edit Modal Elements
  const modalForm = document.getElementById("modal-course-form");
  const modalFormTitle = document.getElementById("modal-course-form-title");
  const formEntry = document.getElementById("form-course-entry");
  const formAlert = document.getElementById("course-form-alert");
  const inputId = document.getElementById("course-form-id");
  const inputCode = document.getElementById("course-form-code");
  const inputCredit = document.getElementById("course-form-credit");
  const inputTitle = document.getElementById("course-form-title");
  const inputSession = document.getElementById("course-form-session");
  const inputSemester = document.getElementById("course-form-semester");
  const inputDept = document.getElementById("course-form-department");
  const inputProg = document.getElementById("course-form-programme");
  const inputLevel = document.getElementById("course-form-level");
  const inputCentre = document.getElementById("course-form-centre");
  const inputStatus = document.getElementById("course-form-status");
  const inputPrereqs = document.getElementById("course-form-prereqs");
  const inputDesc = document.getElementById("course-form-desc");
  const saveBtn = document.getElementById("btn-save-course");
  const saveSpinner = document.getElementById("course-save-spinner");
  const saveBtnText = document.getElementById("course-save-btn-text");
  const cancelFormBtn = document.getElementById("btn-cancel-course");
  const closeFormModalBtn = document.getElementById("btn-close-course-modal");

  // Status Modal Elements
  const modalStatus = document.getElementById("modal-course-status-confirm");
  const statusPromptText = document.getElementById("status-modal-prompt-text");
  const statusCourseInfo = document.getElementById("status-modal-course-info");
  const statusCourseMeta = document.getElementById("status-modal-course-meta");
  const confirmStatusBtn = document.getElementById("btn-confirm-course-status");
  const cancelStatusBtn = document.getElementById("btn-cancel-course-status");
  const closeStatusModalBtn = document.getElementById("btn-close-status-modal");

  // Delete Modal Elements
  const modalDelete = document.getElementById("modal-course-delete-confirm");
  const deleteCourseTitle = document.getElementById("delete-modal-course-title");
  const deleteCourseMeta = document.getElementById("delete-modal-course-meta");
  const deleteDepBlock = document.getElementById("course-delete-dependency-block");
  const deleteDepMsg = document.getElementById("course-delete-dependency-msg");
  const confirmDeleteBtn = document.getElementById("btn-confirm-course-delete");
  const cancelDeleteBtn = document.getElementById("btn-cancel-course-delete");
  const closeDeleteModalBtn = document.getElementById("btn-close-delete-modal");

  // Helpers to Open / Close Modals
  const openModal = (m) => {
    if (!m) return;
    m.style.display = "flex";
    m.classList.add("open");
    m.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeModal = (m) => {
    if (!m) return;
    m.style.display = "none";
    m.classList.remove("open");
    m.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  // Close modals on overlay backdrop click
  [modalForm, modalStatus, modalDelete].forEach((overlay) => {
    if (overlay) {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeModal(overlay);
      });
    }
  });

  if (closeFormModalBtn) closeFormModalBtn.addEventListener("click", () => closeModal(modalForm));
  if (cancelFormBtn) cancelFormBtn.addEventListener("click", () => closeModal(modalForm));
  if (closeStatusModalBtn) closeStatusModalBtn.addEventListener("click", () => closeModal(modalStatus));
  if (cancelStatusBtn) cancelStatusBtn.addEventListener("click", () => closeModal(modalStatus));
  if (closeDeleteModalBtn) closeDeleteModalBtn.addEventListener("click", () => closeModal(modalDelete));
  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", () => closeModal(modalDelete));

  // Update Summary Statistics (Dynamically from Real Records)
  const updateStats = () => {
    const total = allCourses.length;
    const active = allCourses.filter((c) => c.status === "active").length;
    const inactive = allCourses.filter((c) => c.status === "inactive").length;
    const sem1 = allCourses.filter((c) => (c.semester || "").toLowerCase().includes("first")).length;
    const sem2 = allCourses.filter((c) => (c.semester || "").toLowerCase().includes("second")).length;
    const sem3 = allCourses.filter((c) => (c.semester || "").toLowerCase().includes("third")).length;

    if (statTotal) statTotal.textContent = total;
    if (statActive) statActive.textContent = active;
    if (statInactive) statInactive.textContent = inactive;
    if (statSem1) statSem1.textContent = sem1;
    if (statSem2) statSem2.textContent = sem2;
    if (statSem3) statSem3.textContent = sem3;
  };

  // Render Table
  const renderTable = () => {
    if (!tbody) return;

    // Filter
    let list = allCourses.filter((c) => {
      // 1. Search Query (code, title, department)
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const code = (c.courseCode || "").toLowerCase();
        const title = (c.title || c.courseTitle || "").toLowerCase();
        const dept = (c.department || "").toLowerCase();
        if (!code.includes(q) && !title.includes(q) && !dept.includes(q)) {
          return false;
        }
      }

      // 2. Academic Session
      if (filters.session !== "all" && c.academicSession !== filters.session) {
        return false;
      }

      // 3. Semester (First, Second, Third)
      if (filters.semester !== "all" && c.semester !== filters.semester) {
        return false;
      }

      // 4. Status
      if (filters.status !== "all" && c.status !== filters.status) {
        return false;
      }

      // 5. Study Centre
      if (filters.centre !== "all" && c.studyCentre !== filters.centre) {
        return false;
      }

      // 6. Department
      if (filters.department !== "all" && c.department !== filters.department) {
        return false;
      }

      return true;
    });

    // Sort
    list.sort((a, b) => {
      const aCode = (a.courseCode || "").toUpperCase();
      const bCode = (b.courseCode || "").toUpperCase();
      const aTitle = (a.title || a.courseTitle || "").toUpperCase();
      const bTitle = (b.title || b.courseTitle || "").toUpperCase();

      switch (filters.sort) {
        case "code-asc":
          return aCode.localeCompare(bCode);
        case "code-desc":
          return bCode.localeCompare(aCode);
        case "title-asc":
          return aTitle.localeCompare(bTitle);
        case "title-desc":
          return bTitle.localeCompare(aTitle);
        default:
          return aCode.localeCompare(bCode);
      }
    });

    // Update Counter & Summary
    if (countPill) countPill.textContent = `${list.length} Course${list.length === 1 ? "" : "s"}`;
    if (filterSummary) {
      const activeFilters = [];
      if (filters.search) activeFilters.push(`search: "${filters.search}"`);
      if (filters.semester !== "all") activeFilters.push(filters.semester);
      if (filters.session !== "all") activeFilters.push(filters.session);
      if (filters.status !== "all") activeFilters.push(filters.status);
      if (filters.department !== "all") activeFilters.push(filters.department);
      if (filters.centre !== "all") activeFilters.push(filters.centre);

      filterSummary.textContent = activeFilters.length > 0 ? `Filtered by ${activeFilters.join(" · ")}` : "Showing all courses";
    }

    if (list.length === 0) {
      tbody.innerHTML = "";
      if (emptyEl) {
        emptyEl.style.display = "block";
        if (emptyHeading) {
          emptyHeading.textContent = allCourses.length === 0 ? "No courses catalogued in the system." : "No courses found for the selected filters.";
        }
      }
      return;
    }

    if (emptyEl) emptyEl.style.display = "none";

    const rowsHtml = list
      .map((c) => {
        const title = c.title || c.courseTitle || "Untitled Course";
        const code = c.courseCode || "N/A";
        const dept = c.department || "Biblical Studies & Theology";
        const prog = c.programme || "Diploma in Theology (Dipl.Th.)";
        const level = c.level ? `${c.level} Lvl` : "100 Lvl";
        const sem = c.semester || "First Semester";
        const units = c.creditUnits || c.creditUnit || 3;
        const centre = c.studyCentre || "Goshen Central Campus, Abeokuta";
        const isActive = c.status === "active";

        const semClass = sem.includes("Second") ? "sem-2" : sem.includes("Third") ? "sem-3" : "sem-1";

        return `
        <tr data-course-id="${c.id}">
          <td>
            <strong style="color: var(--primary-blue); font-size: 0.875rem;">${code}</strong>
          </td>
          <td>
            <div style="font-weight: 700; color: var(--dark-navy);">${title}</div>
            ${c.description ? `<div style="font-size: 0.72rem; color: var(--admin-text-muted); max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${c.description}</div>` : ""}
          </td>
          <td><span style="color: var(--admin-text-main);">${dept}</span></td>
          <td><span style="font-size: 0.75rem; color: var(--admin-text-muted);">${prog}</span></td>
          <td><span class="badge-credit-pill">${level}</span></td>
          <td><span class="badge-semester-tag ${semClass}">${sem}</span></td>
          <td><span class="badge-credit-pill" style="font-weight: 800; color: var(--primary-blue);">${units} Units</span></td>
          <td><span style="font-size: 0.75rem; color: var(--admin-text-muted);">${centre}</span></td>
          <td>
            <span class="${isActive ? "badge-course-active" : "badge-course-inactive"}">
              ${isActive ? "● Active" : "○ Inactive"}
            </span>
          </td>
          <td>
            <div class="course-actions-cell">
              <!-- Edit -->
              <button type="button" class="btn-course-action btn-course-edit action-edit-course" data-id="${c.id}" title="Edit Course Parameters">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </button>

              <!-- Activate / Deactivate -->
              <button type="button" class="btn-course-action ${isActive ? "btn-course-deactivate" : "btn-course-activate"} action-toggle-course-status" data-id="${c.id}" data-action="${isActive ? "deactivate" : "activate"}" title="${isActive ? "Deactivate Course" : "Activate Course"}">
                ${
                  isActive
                    ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      Deactivate`
                    : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      Activate`
                }
              </button>

              <!-- Permanently Delete -->
              <button type="button" class="btn-course-action btn-course-delete action-delete-course" data-id="${c.id}" title="Permanently Delete Course">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
      })
      .join("");

    tbody.innerHTML = rowsHtml;

    // Attach row action listeners
    attachRowListeners();
  };

  // Row Action Listeners
  const attachRowListeners = () => {
    // 1. Edit
    tbody.querySelectorAll(".action-edit-course").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const course = allCourses.find((c) => c.id === id);
        if (!course) return;
        openEditCourseModal(course);
      });
    });

    // 2. Status Toggle (Activate / Deactivate)
    tbody.querySelectorAll(".action-toggle-course-status").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const action = btn.getAttribute("data-action");
        const course = allCourses.find((c) => c.id === id);
        if (!course) return;
        openStatusConfirmModal(course, action);
      });
    });

    // 3. Delete Permanently
    tbody.querySelectorAll(".action-delete-course").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const course = allCourses.find((c) => c.id === id);
        if (!course) return;
        openDeleteConfirmModal(course);
      });
    });
  };

  // Open Add Course Modal
  const openAddCourseModal = () => {
    if (!modalForm || !formEntry) return;
    formEntry.reset();
    if (formAlert) {
      formAlert.style.display = "none";
      formAlert.className = "course-modal-feedback";
    }
    if (inputId) inputId.value = "";
    if (modalFormTitle) modalFormTitle.textContent = "Add New Course";
    if (saveBtnText) saveBtnText.textContent = "Save Course";

    // Default configuration
    if (inputSession) inputSession.value = ADMIN_CONFIG.SESSION || "2026/2027";
    if (inputSemester) inputSemester.value = "First Semester";
    if (inputCredit) inputCredit.value = "3";
    if (inputStatus) inputStatus.value = "active";
    if (inputLevel) inputLevel.value = "100";
    if (inputDept) inputDept.value = "Biblical Studies & Theology";
    if (inputProg) inputProg.value = "Diploma in Theology (Dipl.Th.)";
    if (inputCentre) inputCentre.value = "Goshen Central Campus, Abeokuta";

    openModal(modalForm);
  };

  // Open Edit Course Modal
  const openEditCourseModal = (course) => {
    if (!modalForm || !formEntry) return;
    formEntry.reset();
    if (formAlert) {
      formAlert.style.display = "none";
      formAlert.className = "course-modal-feedback";
    }
    if (modalFormTitle) modalFormTitle.textContent = `Edit Course: ${course.courseCode}`;
    if (saveBtnText) saveBtnText.textContent = "Update Course";

    if (inputId) inputId.value = course.id;
    if (inputCode) inputCode.value = course.courseCode || "";
    if (inputTitle) inputTitle.value = course.title || course.courseTitle || "";
    if (inputCredit) inputCredit.value = course.creditUnits || course.creditUnit || 3;
    if (inputSession) inputSession.value = course.academicSession || "2026/2027";
    if (inputSemester) inputSemester.value = course.semester || "First Semester";
    if (inputDept) inputDept.value = course.department || "Biblical Studies & Theology";
    if (inputProg) inputProg.value = course.programme || "Diploma in Theology (Dipl.Th.)";
    if (inputLevel) inputLevel.value = course.level || "100";
    if (inputCentre) inputCentre.value = course.studyCentre || "Goshen Central Campus, Abeokuta";
    if (inputStatus) inputStatus.value = course.status || "active";
    if (inputDesc) inputDesc.value = course.description || "";

    if (inputPrereqs) {
      const p = Array.isArray(course.prerequisiteCourseIds) ? course.prerequisiteCourseIds.join(", ") : course.prerequisiteCourseIds || "";
      inputPrereqs.value = p;
    }

    openModal(modalForm);
  };

  // Open Status Confirmation Modal
  const openStatusConfirmModal = (course, action) => {
    pendingStatusCourse = { course, action };
    const isActivating = action === "activate";

    const modalTitle = document.getElementById("modal-status-confirm-title");
    if (modalTitle) modalTitle.textContent = isActivating ? "Activate Course" : "Deactivate Course";

    if (statusPromptText) {
      statusPromptText.textContent = isActivating
        ? `Are you sure you want to ACTIVATE this course for enrollment?`
        : `Are you sure you want to DEACTIVATE this course?`;
    }

    if (statusCourseInfo) {
      statusCourseInfo.textContent = `${course.courseCode} — ${course.title || course.courseTitle}`;
    }

    if (statusCourseMeta) {
      statusCourseMeta.textContent = `${course.semester} · ${course.academicSession} · ${course.department}`;
    }

    if (confirmStatusBtn) {
      confirmStatusBtn.textContent = isActivating ? "Confirm Activate" : "Confirm Deactivate";
      confirmStatusBtn.style.background = isActivating ? "#16A34A" : "#D97706";
    }

    openModal(modalStatus);
  };

  // Open Delete Confirmation Modal
  const openDeleteConfirmModal = async (course) => {
    pendingDeleteCourse = course;

    if (deleteCourseTitle) {
      deleteCourseTitle.textContent = `${course.courseCode} — ${course.title || course.courseTitle}`;
    }

    if (deleteCourseMeta) {
      deleteCourseMeta.textContent = `Academic Session: ${course.academicSession} · Semester: ${course.semester} · Dept: ${course.department}`;
    }

    // Check dependencies
    const depCheck = await checkCourseDependencies(course.courseCode, course.id);
    if (depCheck.hasDependencies) {
      if (deleteDepBlock) deleteDepBlock.style.display = "flex";
      if (deleteDepMsg) {
        deleteDepMsg.textContent = `This course is actively referenced by ${depCheck.references.join(
          ", "
        )}. Permanent deletion is disabled to prevent academic transcript corruption. Please DEACTIVATE the course instead.`;
      }
      if (confirmDeleteBtn) {
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.style.opacity = "0.5";
        confirmDeleteBtn.textContent = "Deletion Blocked";
      }
    } else {
      if (deleteDepBlock) deleteDepBlock.style.display = "none";
      if (confirmDeleteBtn) {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.style.opacity = "1";
        confirmDeleteBtn.textContent = "Permanently Delete Course";
      }
    }

    openModal(modalDelete);
  };

  // Save Form Handler (Add or Update)
  if (saveBtn && formEntry) {
    saveBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const id = inputId?.value?.trim();
      const code = normalizeCourseCode(inputCode?.value);
      const title = (inputTitle?.value || "").trim();
      const credits = parseInt(inputCredit?.value, 10);
      const session = (inputSession?.value || "2026/2027").trim();
      const semester = (inputSemester?.value || "First Semester").trim();
      const dept = (inputDept?.value || "Biblical Studies & Theology").trim();
      const prog = (inputProg?.value || "Diploma in Theology (Dipl.Th.)").trim();
      const level = (inputLevel?.value || "100").trim();
      const centre = (inputCentre?.value || "Goshen Central Campus, Abeokuta").trim();
      const status = inputStatus?.value === "inactive" ? "inactive" : "active";
      const desc = (inputDesc?.value || "").trim();
      const prereqs = (inputPrereqs?.value || "").trim();

      // Clear alerts
      if (formAlert) {
        formAlert.style.display = "none";
        formAlert.className = "course-modal-feedback";
      }

      // Validations
      if (!code) {
        showFormAlert("Please enter a valid Course Code (e.g. THY-101).");
        inputCode?.focus();
        return;
      }

      if (!title) {
        showFormAlert("Please enter a Course Title.");
        inputTitle?.focus();
        return;
      }

      if (isNaN(credits) || credits <= 0) {
        showFormAlert("Please enter valid positive Credit Units (min 1).");
        inputCredit?.focus();
        return;
      }

      if (!session) {
        showFormAlert("Please select or enter the Academic Session.");
        inputSession?.focus();
        return;
      }

      if (!["First Semester", "Second Semester", "Third Semester"].includes(semester)) {
        showFormAlert("Semester must be First Semester, Second Semester, or Third Semester.");
        inputSemester?.focus();
        return;
      }

      // Prevent duplicate double submission
      saveBtn.disabled = true;
      if (saveSpinner) saveSpinner.style.display = "inline-block";

      try {
        const payload = {
          courseCode: code,
          title,
          courseTitle: title,
          description: desc,
          department: dept,
          programme: prog,
          level,
          academicSession: session,
          semester,
          creditUnits: credits,
          creditUnit: credits,
          studyCentre: centre,
          status,
          prerequisiteCourseIds: prereqs
        };

        if (id) {
          // UPDATE
          await updateCourse(id, payload);
          showAdminToast("success", "Course updated successfully.");
        } else {
          // CREATE
          await createCourse(payload);
          showAdminToast("success", "Course saved successfully.");
        }

        closeModal(modalForm);
      } catch (err) {
        console.error("[DIMABIN Courses] Save Error:", err);
        showFormAlert(err.message || "Failed to save course. Please check inputs and try again.");
      } finally {
        saveBtn.disabled = false;
        if (saveSpinner) saveSpinner.style.display = "none";
      }
    });
  }

  const showFormAlert = (msg) => {
    if (!formAlert) return;
    formAlert.textContent = msg;
    formAlert.className = "course-modal-feedback error";
    formAlert.style.display = "block";
  };

  // Confirm Status Change Handler
  if (confirmStatusBtn) {
    confirmStatusBtn.addEventListener("click", async () => {
      if (!pendingStatusCourse) return;
      const { course, action } = pendingStatusCourse;
      const newStatus = action === "activate" ? "active" : "inactive";

      confirmStatusBtn.disabled = true;
      try {
        await setCourseStatus(course.id, newStatus);
        showAdminToast("success", "Course status updated successfully.");
        closeModal(modalStatus);
      } catch (err) {
        showAdminToast("error", `Failed to update status: ${err.message}`);
      } finally {
        confirmStatusBtn.disabled = false;
        pendingStatusCourse = null;
      }
    });
  }

  // Confirm Permanent Deletion Handler
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async () => {
      if (!pendingDeleteCourse) return;
      const course = pendingDeleteCourse;

      confirmDeleteBtn.disabled = true;
      try {
        await deleteCoursePermanently(course.id);
        showAdminToast("success", "Course permanently deleted.");
        closeModal(modalDelete);
      } catch (err) {
        showAdminToast("error", err.message);
      } finally {
        confirmDeleteBtn.disabled = false;
        pendingDeleteCourse = null;
      }
    });
  }

  // Filter Event Listeners
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        filters.search = e.target.value.trim();
        renderTable();
      }, 250);
    });
  }

  if (sessionSelect) {
    sessionSelect.addEventListener("change", (e) => {
      filters.session = e.target.value;
      renderTable();
    });
  }

  if (semesterSelect) {
    semesterSelect.addEventListener("change", (e) => {
      filters.semester = e.target.value;
      renderTable();
    });
  }

  if (statusSelect) {
    statusSelect.addEventListener("change", (e) => {
      filters.status = e.target.value;
      renderTable();
    });
  }

  if (centreSelect) {
    centreSelect.addEventListener("change", (e) => {
      filters.centre = e.target.value;
      renderTable();
    });
  }

  if (deptSelect) {
    deptSelect.addEventListener("change", (e) => {
      filters.department = e.target.value;
      renderTable();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      filters.sort = e.target.value;
      renderTable();
    });
  }

  // Reset Filters Handler
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      filters.search = "";
      filters.session = "all";
      filters.semester = "all";
      filters.status = "all";
      filters.centre = "all";
      filters.department = "all";
      filters.sort = "code-asc";

      if (searchInput) searchInput.value = "";
      if (sessionSelect) sessionSelect.value = "all";
      if (semesterSelect) semesterSelect.value = "all";
      if (statusSelect) statusSelect.value = "all";
      if (centreSelect) centreSelect.value = "all";
      if (deptSelect) deptSelect.value = "all";
      if (sortSelect) sortSelect.value = "code-asc";

      renderTable();
      showAdminToast("success", "Filters reset to all courses.");
    });
  }

  // Header Buttons
  if (addCourseBtn) {
    addCourseBtn.addEventListener("click", openAddCourseModal);
  }

  if (listViewBtn) {
    listViewBtn.addEventListener("click", () => {
      const tableCard = document.getElementById("course-table-card");
      if (tableCard) tableCard.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // Subscribe to Real-Time Courses from Firestore / Local Cache
  if (loadingEl) loadingEl.style.display = "block";
  subscribeCourses((courses) => {
    if (loadingEl) loadingEl.style.display = "none";
    allCourses = courses || [];

    // Dynamically populate session dropdown if new sessions exist
    if (sessionSelect) {
      const existingSessions = new Set(["all", "2026/2027", "2025/2026", "2024/2025"]);
      allCourses.forEach((c) => {
        if (c.academicSession && !existingSessions.has(c.academicSession)) {
          existingSessions.add(c.academicSession);
          const opt = document.createElement("option");
          opt.value = c.academicSession;
          opt.textContent = c.academicSession;
          sessionSelect.appendChild(opt);
        }
      });
    }

    // Sync session and semester summary strip
    if (sessionBadge) {
      sessionBadge.textContent = ADMIN_CONFIG.SESSION || "2026/2027";
    }
    if (semesterBadge) {
      semesterBadge.textContent = ADMIN_CONFIG.SEMESTER || "First Semester";
    }

    updateStats();
    renderTable();
  });
}

/**
 * =========================================================================
 * 17. COURSE ALLOCATION MODULE CONTROLLER
 * Multi-Centre Scoped Offering Assignments, Lecturer Visibility & Audit Trail
 * =========================================================================
 */
export function initCourseAllocation() {
  console.log("[DIMABIN Dashboard] Initializing Course Allocation Controller...");

  // State
  let catalogCourses = [];
  let allocations = [];
  let lecturers = [];
  let currentOfferings = [];
  let pendingReassignAlloc = null;
  let pendingEndAlloc = null;
  let isWorkloadView = false;

  const filters = {
    search: "",
    session: "all",
    semester: "all",
    centre: "all",
    status: "all",
    sort: "code-asc"
  };

  // Header & Badges
  const sessionBadge = document.getElementById("alloc-active-session-badge");
  const semesterBadge = document.getElementById("alloc-active-semester-badge");
  const countPill = document.getElementById("alloc-count-pill");
  const filterSummary = document.getElementById("alloc-filter-summary");
  const headingText = document.getElementById("alloc-card-heading");

  // Summary Stat Counters
  const statTotal = document.getElementById("stat-alloc-total");
  const statAssigned = document.getElementById("stat-alloc-assigned");
  const statAvailable = document.getElementById("stat-alloc-available");
  const statReassigned = document.getElementById("stat-alloc-reassigned");
  const statInactive = document.getElementById("stat-alloc-inactive");
  const statLecturers = document.getElementById("stat-alloc-lecturers");

  // Filter Elements
  const searchInput = document.getElementById("alloc-search-input");
  const sessionSelect = document.getElementById("filter-alloc-session");
  const semesterSelect = document.getElementById("filter-alloc-semester");
  const centreSelect = document.getElementById("filter-alloc-centre");
  const statusSelect = document.getElementById("filter-alloc-status");
  const sortSelect = document.getElementById("filter-alloc-sort");
  const resetBtn = document.getElementById("btn-reset-alloc-filters");

  // View Switchers
  const toggleWorkloadBtn = document.getElementById("btn-toggle-workload-view");
  const toggleWorkloadText = document.getElementById("btn-toggle-workload-text");
  const tableContainer = document.getElementById("alloc-table-container");
  const workloadContainer = document.getElementById("alloc-workload-container");
  const workloadGrid = document.getElementById("faculty-workload-grid");

  // Table Elements
  const tbody = document.getElementById("allocations-table-tbody");
  const loadingEl = document.getElementById("allocations-table-loading");
  const emptyEl = document.getElementById("allocations-table-empty");
  const emptyHeading = document.getElementById("alloc-empty-heading");

  // Assign Modal Elements
  const modalAssign = document.getElementById("modal-assign-lecturer");
  const openAssignBtn = document.getElementById("btn-open-assign-modal");
  const closeAssignBtn = document.getElementById("btn-close-assign-modal");
  const cancelAssignBtn = document.getElementById("btn-cancel-assign-modal");
  const confirmAssignBtn = document.getElementById("btn-confirm-assign-offering");
  const formAssign = document.getElementById("form-assign-offering");
  const assignAlert = document.getElementById("assign-modal-alert");
  const assignCourseSelect = document.getElementById("assign-modal-course-select");
  const assignCentreSelect = document.getElementById("assign-modal-centre-select");
  const assignSessionSelect = document.getElementById("assign-modal-session-select");
  const assignSemesterSelect = document.getElementById("assign-modal-semester-select");
  const assignLecturerSelect = document.getElementById("assign-modal-lecturer-select");
  const assignNotes = document.getElementById("assign-modal-notes");
  const assignSpinner = document.getElementById("assign-save-spinner");

  // Reassign Modal Elements
  const modalReassign = document.getElementById("modal-reassign-lecturer");
  const closeReassignBtn = document.getElementById("btn-close-reassign-modal");
  const cancelReassignBtn = document.getElementById("btn-cancel-reassign-modal");
  const confirmReassignBtn = document.getElementById("btn-confirm-reassign-offering");
  const formReassign = document.getElementById("form-reassign-offering");
  const reassignAlert = document.getElementById("reassign-modal-alert");
  const reassignAllocId = document.getElementById("reassign-alloc-id");
  const reassignCourseTitle = document.getElementById("reassign-modal-course-title");
  const reassignCourseMeta = document.getElementById("reassign-modal-course-meta");
  const reassignCurrentLecturer = document.getElementById("reassign-modal-current-lecturer");
  const reassignLecturerSelect = document.getElementById("reassign-modal-lecturer-select");
  const reassignReason = document.getElementById("reassign-modal-reason");
  const reassignNotes = document.getElementById("reassign-modal-notes");
  const reassignSpinner = document.getElementById("reassign-save-spinner");

  // End Allocation Modal Elements
  const modalEnd = document.getElementById("modal-end-allocation");
  const closeEndBtn = document.getElementById("btn-close-end-modal");
  const cancelEndBtn = document.getElementById("btn-cancel-end-modal");
  const confirmEndBtn = document.getElementById("btn-confirm-end-allocation");
  const endAllocId = document.getElementById("end-alloc-id");
  const endModalTitle = document.getElementById("end-alloc-modal-title");
  const endModalMeta = document.getElementById("end-alloc-modal-meta");
  const endModalLecturer = document.getElementById("end-alloc-modal-lecturer");
  const endReason = document.getElementById("end-alloc-reason");

  // History Modal Elements
  const modalHistory = document.getElementById("modal-allocation-history");
  const closeHistoryBtn = document.getElementById("btn-close-history-modal");
  const closeHistoryBtnFooter = document.getElementById("btn-close-history-btn");
  const historyCode = document.getElementById("history-modal-course-code");
  const historyTitle = document.getElementById("history-modal-course-title");
  const historyCentre = document.getElementById("history-modal-centre-info");
  const historyCurrent = document.getElementById("history-modal-current-block");
  const historyTimeline = document.getElementById("history-modal-timeline-list");

  // Quick Add Lecturer Modal Elements
  const modalQuickLec = document.getElementById("modal-add-lecturer-quick");
  const openQuickLecBtn = document.getElementById("btn-open-quick-add-lecturer");
  const closeQuickLecBtn = document.getElementById("btn-close-quick-lec-modal");
  const cancelQuickLecBtn = document.getElementById("btn-cancel-quick-lec-modal");
  const saveQuickLecBtn = document.getElementById("btn-save-quick-lecturer");
  const formQuickLec = document.getElementById("form-quick-add-lecturer");
  const quickLecAlert = document.getElementById("quick-lec-alert");
  const quickStaffId = document.getElementById("quick-lecturer-staff-id");
  const quickName = document.getElementById("quick-lecturer-name");
  const quickEmail = document.getElementById("quick-lecturer-email");
  const quickDept = document.getElementById("quick-lecturer-dept");
  const quickQual = document.getElementById("quick-lecturer-qual");
  const quickCentre = document.getElementById("quick-lecturer-centre");
  const quickSpinner = document.getElementById("quick-lec-spinner");

  // Modal helpers
  const openModal = (m) => {
    if (!m) return;
    m.style.display = "flex";
    m.classList.add("open");
    m.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeModal = (m) => {
    if (!m) return;
    m.style.display = "none";
    m.classList.remove("open");
    m.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  [modalAssign, modalReassign, modalEnd, modalHistory, modalQuickLec].forEach((overlay) => {
    if (overlay) {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeModal(overlay);
      });
    }
  });

  if (closeAssignBtn) closeAssignBtn.addEventListener("click", () => closeModal(modalAssign));
  if (cancelAssignBtn) cancelAssignBtn.addEventListener("click", () => closeModal(modalAssign));
  if (closeReassignBtn) closeReassignBtn.addEventListener("click", () => closeModal(modalReassign));
  if (cancelReassignBtn) cancelReassignBtn.addEventListener("click", () => closeModal(modalReassign));
  if (closeEndBtn) closeEndBtn.addEventListener("click", () => closeModal(modalEnd));
  if (cancelEndBtn) cancelEndBtn.addEventListener("click", () => closeModal(modalEnd));
  if (closeHistoryBtn) closeHistoryBtn.addEventListener("click", () => closeModal(modalHistory));
  if (closeHistoryBtnFooter) closeHistoryBtnFooter.addEventListener("click", () => closeModal(modalHistory));
  if (closeQuickLecBtn) closeQuickLecBtn.addEventListener("click", () => closeModal(modalQuickLec));
  if (cancelQuickLecBtn) cancelQuickLecBtn.addEventListener("click", () => closeModal(modalQuickLec));

  // Populate Select Dropdowns
  const populateLecturerDropdowns = () => {
    [assignLecturerSelect, reassignLecturerSelect].forEach((sel) => {
      if (!sel) return;
      const currentVal = sel.value;
      sel.innerHTML = `<option value="">-- Select Verified Faculty Instructor --</option>`;
      lecturers.forEach((lec) => {
        const opt = document.createElement("option");
        opt.value = lec.staffId;
        opt.textContent = `${lec.fullName} (${lec.staffId}) — ${lec.department || "Faculty"}`;
        sel.appendChild(opt);
      });
      if (currentVal) sel.value = currentVal;
    });
  };

  const populateCourseDropdown = () => {
    if (!assignCourseSelect) return;
    const currentVal = assignCourseSelect.value;
    assignCourseSelect.innerHTML = `<option value="">-- Select Academic Course Module --</option>`;
    catalogCourses.forEach((crs) => {
      const opt = document.createElement("option");
      opt.value = crs.courseCode;
      opt.textContent = `[${crs.courseCode}] ${crs.title || crs.courseTitle} (${crs.semester || "First Semester"})`;
      assignCourseSelect.appendChild(opt);
    });
    if (currentVal) assignCourseSelect.value = currentVal;
  };

  // Re-calculate Offerings dynamically from real Firestore records
  const calculateOfferings = () => {
    const offeringsMap = new Map();

    // 1. From catalog courses: include primary study centre offering
    catalogCourses.forEach((c) => {
      const code = normalizeCourseCode(c.courseCode);
      if (!code) return;
      const centre = (c.studyCentre || "Goshen Central Campus, Abeokuta").trim();
      const session = (c.academicSession || ADMIN_CONFIG.SESSION || "2026/2027").trim();
      const semester = (c.semester || "First Semester").trim();
      const key = `${code}__${centre}__${session}__${semester}`;

      offeringsMap.set(key, {
        courseCode: code,
        courseTitle: c.title || c.courseTitle || code,
        studyCentre: centre,
        academicSession: session,
        semester,
        department: c.department || "Biblical Studies & Theology",
        programme: c.programme || "Diploma in Theology (Dipl.Th.)",
        level: c.level || "100",
        creditUnits: c.creditUnits || c.creditUnit || 3,
        isCourseInactive: c.status === "inactive"
      });
    });

    // 2. Also register any offering from the actual allocations collection
    allocations.forEach((a) => {
      const code = normalizeCourseCode(a.courseCode);
      if (!code) return;
      const centre = (a.studyCentre || "Goshen Central Campus, Abeokuta").trim();
      const session = (a.academicSession || "2026/2027").trim();
      const semester = (a.semester || "First Semester").trim();
      const key = `${code}__${centre}__${session}__${semester}`;

      if (!offeringsMap.has(key)) {
        const matchedCourse = catalogCourses.find((c) => normalizeCourseCode(c.courseCode) === code);
        offeringsMap.set(key, {
          courseCode: code,
          courseTitle: a.courseTitle || (matchedCourse ? matchedCourse.title || matchedCourse.courseTitle : code),
          studyCentre: centre,
          academicSession: session,
          semester,
          department: matchedCourse ? matchedCourse.department : "Theology & Ministry",
          programme: a.programme || (matchedCourse ? matchedCourse.programme : "Diploma in Theology"),
          level: a.level || (matchedCourse ? matchedCourse.level : "100"),
          creditUnits: matchedCourse ? matchedCourse.creditUnits || matchedCourse.creditUnit : 3,
          isCourseInactive: matchedCourse ? matchedCourse.status === "inactive" : false
        });
      }
    });

    // 3. For every offering, evaluate status strictly against active Firestore allocations
    const computedList = [];
    offeringsMap.forEach((offering) => {
      const { courseCode, studyCentre, academicSession, semester, isCourseInactive } = offering;

      // Find active allocation for this EXACT offering (multi-centre independent)
      const matchingAlloc = allocations.find((a) => {
        return (
          normalizeCourseCode(a.courseCode) === courseCode &&
          (a.studyCentre || "").trim() === studyCentre &&
          (a.academicSession || "").trim() === academicSession &&
          (a.semester || "").trim() === semester &&
          a.status !== "ended"
        );
      });

      let status = "available";
      let statusLabel = "Available";
      let assignedLecturer = null;

      if (isCourseInactive) {
        status = "inactive";
        statusLabel = "Inactive";
      } else if (matchingAlloc) {
        if (matchingAlloc.status === "reassigned" || (matchingAlloc.assignmentHistory && matchingAlloc.assignmentHistory.length > 0)) {
          status = "reassigned";
          statusLabel = "Reassigned";
        } else {
          status = "assigned";
          statusLabel = "Assigned";
        }
        assignedLecturer = {
          name: matchingAlloc.lecturerName,
          staffId: matchingAlloc.lecturerId
        };
      } else {
        status = "available";
        statusLabel = "Available";
      }

      computedList.push({
        ...offering,
        status,
        statusLabel,
        assignedLecturer,
        allocation: matchingAlloc || null
      });
    });

    currentOfferings = computedList;
  };

  // Update Summary Statistics
  const updateStats = () => {
    const total = currentOfferings.length;
    const assigned = currentOfferings.filter((o) => o.status === "assigned").length;
    const available = currentOfferings.filter((o) => o.status === "available").length;
    const reassigned = currentOfferings.filter((o) => o.status === "reassigned").length;
    const inactive = currentOfferings.filter((o) => o.status === "inactive").length;
    const facultyCount = lecturers.length;

    if (statTotal) statTotal.textContent = total;
    if (statAssigned) statAssigned.textContent = assigned;
    if (statAvailable) statAvailable.textContent = available;
    if (statReassigned) statReassigned.textContent = reassigned;
    if (statInactive) statInactive.textContent = inactive;
    if (statLecturers) statLecturers.textContent = facultyCount;
  };

  // Render Table
  const renderTable = () => {
    if (!tbody) return;

    // Filter
    let list = currentOfferings.filter((o) => {
      // 1. Search Query
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const code = (o.courseCode || "").toLowerCase();
        const title = (o.courseTitle || "").toLowerCase();
        const lecName = o.assignedLecturer ? o.assignedLecturer.name.toLowerCase() : "";
        const lecId = o.assignedLecturer ? o.assignedLecturer.staffId.toLowerCase() : "";
        if (!code.includes(q) && !title.includes(q) && !lecName.includes(q) && !lecId.includes(q)) {
          return false;
        }
      }

      // 2. Session
      if (filters.session !== "all" && o.academicSession !== filters.session) {
        return false;
      }

      // 3. Semester
      if (filters.semester !== "all" && o.semester !== filters.semester) {
        return false;
      }

      // 4. Study Centre (Multi-centre scoped)
      if (filters.centre !== "all" && o.studyCentre !== filters.centre) {
        return false;
      }

      // 5. Status
      if (filters.status !== "all" && o.status !== filters.status) {
        return false;
      }

      return true;
    });

    // Sort
    list.sort((a, b) => {
      switch (filters.sort) {
        case "code-asc":
          return (a.courseCode || "").localeCompare(b.courseCode || "");
        case "code-desc":
          return (b.courseCode || "").localeCompare(a.courseCode || "");
        case "status-assigned":
          return (a.status === "assigned" ? 0 : 1) - (b.status === "assigned" ? 0 : 1);
        case "status-available":
          return (a.status === "available" ? 0 : 1) - (b.status === "available" ? 0 : 1);
        case "centre-asc":
          return (a.studyCentre || "").localeCompare(b.studyCentre || "");
        default:
          return (a.courseCode || "").localeCompare(b.courseCode || "");
      }
    });

    // Counter & Summary
    if (countPill) countPill.textContent = `${list.length} Offering${list.length === 1 ? "" : "s"}`;
    if (filterSummary) {
      const activeFilters = [];
      if (filters.search) activeFilters.push(`search: "${filters.search}"`);
      if (filters.centre !== "all") activeFilters.push(filters.centre);
      if (filters.semester !== "all") activeFilters.push(filters.semester);
      if (filters.session !== "all") activeFilters.push(filters.session);
      if (filters.status !== "all") activeFilters.push(`status: ${filters.status}`);

      filterSummary.textContent = activeFilters.length > 0 ? `Filtered by ${activeFilters.join(" · ")}` : "Showing all course offerings";
    }

    if (list.length === 0) {
      tbody.innerHTML = "";
      if (emptyEl) {
        emptyEl.style.display = "block";
        if (emptyHeading) {
          emptyHeading.textContent = currentOfferings.length === 0 ? "No course offerings catalogued in the system." : "No course offerings found for the selected filters.";
        }
      }
      return;
    }

    if (emptyEl) emptyEl.style.display = "none";

    const rowsHtml = list
      .map((o) => {
        const code = o.courseCode;
        const title = o.courseTitle;
        const centre = o.studyCentre;
        const session = o.academicSession;
        const semester = o.semester;
        const isAssigned = o.status === "assigned";
        const isReassigned = o.status === "reassigned";
        const isAvailable = o.status === "available";

        // Status Badge HTML
        let badgeHtml = "";
        if (isAssigned) {
          badgeHtml = `<span class="badge-alloc-status badge-alloc-assigned">● Assigned</span>`;
        } else if (isReassigned) {
          badgeHtml = `<span class="badge-alloc-status badge-alloc-reassigned">↻ Reassigned</span>`;
        } else if (isAvailable) {
          badgeHtml = `<span class="badge-alloc-status badge-alloc-available">○ Available</span>`;
        } else {
          badgeHtml = `<span class="badge-alloc-status badge-alloc-inactive">⊘ Inactive</span>`;
        }

        // Assigned Lecturer HTML
        let lecturerHtml = "";
        if (o.assignedLecturer) {
          lecturerHtml = `
            <div class="lecturer-cell-wrap">
              <div class="lecturer-cell-name">${o.assignedLecturer.name}</div>
              <div class="lecturer-cell-id">${o.assignedLecturer.staffId}</div>
            </div>
          `;
        } else {
          lecturerHtml = `
            <div class="unassigned-cell-text">
              <span class="unassigned-cell-dot">○</span> Not Assigned
            </div>
          `;
        }

        // Actions HTML
        let actionsHtml = "";
        if (isAvailable) {
          actionsHtml = `
            <button type="button" class="btn-alloc-action btn-alloc-assign action-assign-offering" 
              data-code="${code}" 
              data-title="${title}" 
              data-centre="${centre}" 
              data-session="${session}" 
              data-semester="${semester}" 
              title="Assign verified faculty instructor">
              + Assign
            </button>
          `;
        } else if (isAssigned || isReassigned) {
          const allocId = o.allocation ? o.allocation.id : "";
          actionsHtml = `
            <div class="alloc-actions-cell">
              <button type="button" class="btn-alloc-action btn-alloc-reassign action-reassign-offering" 
                data-id="${allocId}" 
                title="Transfer to another faculty instructor">
                Transfer
              </button>
              <button type="button" class="btn-alloc-action btn-alloc-end action-end-offering" 
                data-id="${allocId}" 
                title="End current assignment and release offering">
                End
              </button>
              <button type="button" class="btn-alloc-action btn-alloc-history action-view-history" 
                data-id="${allocId}" 
                title="View full assignment history and audit logs">
                History
              </button>
            </div>
          `;
        } else {
          actionsHtml = `<span style="font-size: 0.72rem; color: #9CA3AF;">Course Inactive</span>`;
        }

        const semClass = semester.includes("Second") ? "sem-2" : semester.includes("Third") ? "sem-3" : "sem-1";

        return `
          <tr data-offering-key="${code}__${centre}__${session}__${semester}">
            <td><strong style="color: var(--primary-blue); font-size: 0.875rem;">${code}</strong></td>
            <td>
              <div style="font-weight: 700; color: var(--dark-navy);">${title}</div>
              <div style="font-size: 0.72rem; color: var(--admin-text-muted);">${o.department}</div>
            </td>
            <td>
              <span style="font-size: 0.78rem; color: var(--admin-text-main); font-weight: 600;">
                📍 ${centre}
              </span>
            </td>
            <td><span class="badge-credit-pill">${session}</span></td>
            <td><span class="badge-semester-tag ${semClass}">${semester}</span></td>
            <td>${lecturerHtml}</td>
            <td>${badgeHtml}</td>
            <td style="text-align: right;">${actionsHtml}</td>
          </tr>
        `;
      })
      .join("");

    tbody.innerHTML = rowsHtml;
    attachAllocationRowListeners();
  };

  // Render Faculty Workload Overview
  const renderFacultyWorkload = () => {
    if (!workloadGrid) return;

    if (lecturers.length === 0) {
      workloadGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--admin-text-muted);">
          No faculty instructors catalogued yet. Use "Add Lecturer (+)" to register an instructor.
        </div>
      `;
      return;
    }

    const cardsHtml = lecturers
      .map((lec) => {
        // Collect all active/reassigned offerings taught by this lecturer
        const activeAllocs = allocations.filter((a) => {
          return a.lecturerId === lec.staffId && a.status !== "ended";
        });

        // Collect distinct study centres
        const assignedCentres = new Set();
        activeAllocs.forEach((a) => {
          if (a.studyCentre) assignedCentres.add(a.studyCentre);
        });

        const centrePillsHtml = Array.from(assignedCentres)
          .map((c) => `<span class="workload-centre-tag">📍 ${c}</span>`)
          .join("");

        const coursesListHtml =
          activeAllocs.length > 0
            ? activeAllocs
                .map((a) => {
                  return `
                  <div class="workload-course-item">
                    <div>
                      <span class="workload-course-code">${a.courseCode}</span>
                      <span style="color: var(--dark-navy); margin-left: 4px;">${a.courseTitle || ""}</span>
                      <div style="font-size: 0.6875rem; color: var(--admin-text-muted);">${a.studyCentre} · ${a.semester}</div>
                    </div>
                    <span class="badge-alloc-status ${a.status === "reassigned" ? "badge-alloc-reassigned" : "badge-alloc-assigned"}" style="font-size: 0.65rem; padding: 0.15rem 0.45rem;">
                      ${a.status === "reassigned" ? "Reassigned" : "Assigned"}
                    </span>
                  </div>
                `;
                })
                .join("")
            : `<div style="font-size: 0.75rem; color: #9CA3AF; font-style: italic; padding: 0.5rem 0;">No active course offerings assigned currently.</div>`;

        return `
          <div class="workload-card" data-staff-id="${lec.staffId}">
            <div class="workload-card-header">
              <div>
                <div class="workload-lecturer-name">${lec.fullName}</div>
                <div class="workload-lecturer-dept">${lec.qualification || ""} · ${lec.department || "Faculty"}</div>
                <div style="font-size: 0.72rem; color: var(--primary-blue); font-weight: 700; margin-top: 2px;">
                  Staff ID: ${lec.staffId}
                </div>
              </div>
              <span class="workload-stat-pill">
                ${activeAllocs.length} Course${activeAllocs.length === 1 ? "" : "s"}
              </span>
            </div>

            <div style="margin-bottom: 0.5rem;">
              <div style="font-size: 0.72rem; font-weight: 700; color: var(--admin-text-muted); text-transform: uppercase; margin-bottom: 0.35rem;">Assigned Campuses:</div>
              <div class="workload-centre-tags">
                ${centrePillsHtml || '<span style="font-size: 0.72rem; color: #9CA3AF;">None yet</span>'}
              </div>
            </div>

            <div>
              <div style="font-size: 0.72rem; font-weight: 700; color: var(--admin-text-muted); text-transform: uppercase; margin-bottom: 0.35rem;">Teaching Offerings:</div>
              <div class="workload-courses-list">
                ${coursesListHtml}
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    workloadGrid.innerHTML = cardsHtml;
  };

  // Row Action Listeners
  const attachAllocationRowListeners = () => {
    // 1. Assign Offering
    tbody.querySelectorAll(".action-assign-offering").forEach((btn) => {
      btn.addEventListener("click", () => {
        const code = btn.getAttribute("data-code");
        const centre = btn.getAttribute("data-centre");
        const session = btn.getAttribute("data-session");
        const semester = btn.getAttribute("data-semester");

        openAssignModalWithPreFill({ code, centre, session, semester });
      });
    });

    // 2. Reassign / Transfer Offering
    tbody.querySelectorAll(".action-reassign-offering").forEach((btn) => {
      btn.addEventListener("click", () => {
        const allocId = btn.getAttribute("data-id");
        const alloc = allocations.find((a) => a.id === allocId);
        if (!alloc) return;
        openReassignModal(alloc);
      });
    });

    // 3. End Assignment
    tbody.querySelectorAll(".action-end-offering").forEach((btn) => {
      btn.addEventListener("click", () => {
        const allocId = btn.getAttribute("data-id");
        const alloc = allocations.find((a) => a.id === allocId);
        if (!alloc) return;
        openEndAllocationModal(alloc);
      });
    });

    // 4. View History / Details
    tbody.querySelectorAll(".action-view-history").forEach((btn) => {
      btn.addEventListener("click", () => {
        const allocId = btn.getAttribute("data-id");
        const alloc = allocations.find((a) => a.id === allocId);
        if (!alloc) return;
        openHistoryModal(alloc);
      });
    });
  };

  // Open Assign Modal
  const openAssignModalWithPreFill = (preFill = {}) => {
    if (!modalAssign || !formAssign) return;
    formAssign.reset();
    if (assignAlert) assignAlert.style.display = "none";

    populateCourseDropdown();
    populateLecturerDropdowns();

    if (preFill.code && assignCourseSelect) assignCourseSelect.value = preFill.code;
    if (preFill.centre && assignCentreSelect) assignCentreSelect.value = preFill.centre;
    if (preFill.session && assignSessionSelect) assignSessionSelect.value = preFill.session;
    if (preFill.semester && assignSemesterSelect) assignSemesterSelect.value = preFill.semester;

    openModal(modalAssign);
  };

  // Open Reassign Modal
  const openReassignModal = (alloc) => {
    if (!modalReassign || !formReassign) return;
    pendingReassignAlloc = alloc;
    formReassign.reset();
    if (reassignAlert) reassignAlert.style.display = "none";

    populateLecturerDropdowns();

    if (reassignAllocId) reassignAllocId.value = alloc.id;
    if (reassignCourseTitle) reassignCourseTitle.textContent = `${alloc.courseCode} — ${alloc.courseTitle || ""}`;
    if (reassignCourseMeta) reassignCourseMeta.textContent = `${alloc.studyCentre} · ${alloc.semester} (${alloc.academicSession})`;
    if (reassignCurrentLecturer) reassignCurrentLecturer.textContent = `Currently Assigned: ${alloc.lecturerName} (${alloc.lecturerId})`;

    openModal(modalReassign);
  };

  // Open End Allocation Modal
  const openEndAllocationModal = (alloc) => {
    if (!modalEnd) return;
    pendingEndAlloc = alloc;
    if (endAllocId) endAllocId.value = alloc.id;
    if (endModalTitle) endModalTitle.textContent = `${alloc.courseCode} — ${alloc.courseTitle || ""}`;
    if (endModalMeta) endModalMeta.textContent = `${alloc.studyCentre} · ${alloc.semester} (${alloc.academicSession})`;
    if (endModalLecturer) endModalLecturer.textContent = `Assigned Instructor: ${alloc.lecturerName} (${alloc.lecturerId})`;
    if (endReason) endReason.value = "";

    openModal(modalEnd);
  };

  // Open History Modal
  const openHistoryModal = (alloc) => {
    if (!modalHistory) return;

    if (historyCode) historyCode.textContent = alloc.courseCode;
    if (historyTitle) historyTitle.textContent = alloc.courseTitle || "Course Offering";
    if (historyCentre) historyCentre.textContent = `${alloc.studyCentre} · ${alloc.semester} (${alloc.academicSession})`;

    if (historyCurrent) {
      historyCurrent.innerHTML = `
        <div style="font-weight: 800; font-size: 0.9375rem; color: var(--dark-navy);">${alloc.lecturerName}</div>
        <div style="font-size: 0.75rem; color: var(--primary-blue); font-weight: 700; margin-top: 2px;">Institutional Staff ID: ${alloc.lecturerId}</div>
        <div style="font-size: 0.75rem; color: var(--admin-text-muted); margin-top: 4px;">Assigned Date: ${alloc.allocatedAt ? new Date(alloc.allocatedAt).toLocaleDateString() : "Active"}</div>
        ${alloc.notes ? `<div style="font-size: 0.75rem; color: #166534; margin-top: 4px;">Scope Notes: ${alloc.notes}</div>` : ""}
      `;
    }

    if (historyTimeline) {
      const historyList = alloc.assignmentHistory || [];
      if (historyList.length === 0) {
        historyTimeline.innerHTML = `
          <div style="font-size: 0.8125rem; color: var(--admin-text-muted); font-style: italic; padding: 0.75rem 0;">
            No prior transfers recorded. This instructor is the initial verified assignee.
          </div>
        `;
      } else {
        historyTimeline.innerHTML = historyList
          .map((h, idx) => {
            return `
            <div class="history-timeline-item">
              <div class="history-timeline-meta">
                <span style="font-weight: 700; color: var(--dark-navy);">Previous Assignee #${historyList.length - idx}</span>
                <span>Term Concluded: ${h.endedAt ? new Date(h.endedAt).toLocaleDateString() : "Archived"}</span>
              </div>
              <div style="font-weight: 800; color: #1E3A8A; font-size: 0.875rem;">${h.lecturerName} (${h.lecturerId})</div>
              <div style="font-size: 0.75rem; color: var(--admin-text-main); margin-top: 3px;">
                <strong>Transfer Reason:</strong> ${h.reason || "Trimester faculty reallocation"}
              </div>
            </div>
          `;
          })
          .join("");
      }
    }

    openModal(modalHistory);
  };

  // Quick Add Lecturer Modal trigger
  if (openQuickLecBtn) {
    openQuickLecBtn.addEventListener("click", () => {
      if (!modalQuickLec || !formQuickLec) return;
      formQuickLec.reset();
      if (quickLecAlert) quickLecAlert.style.display = "none";
      if (quickStaffId) {
        const nextNum = Math.floor(10 + Math.random() * 90);
        quickStaffId.value = `DIMABIN/FAC/2026/${nextNum}`;
      }
      openModal(modalQuickLec);
    });
  }

  // Save Quick Lecturer Handler
  if (saveQuickLecBtn && formQuickLec) {
    saveQuickLecBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const staffId = (quickStaffId?.value || "").trim();
      const name = (quickName?.value || "").trim();
      const email = (quickEmail?.value || "").trim();
      const dept = (quickDept?.value || "Biblical Studies & Theology").trim();
      const qual = (quickQual?.value || "").trim();
      const centre = (quickCentre?.value || "Goshen Central Campus, Abeokuta").trim();

      if (!staffId || !name) {
        if (quickLecAlert) {
          quickLecAlert.textContent = "Please provide both Staff ID and Full Name.";
          quickLecAlert.className = "course-modal-feedback error";
          quickLecAlert.style.display = "block";
        }
        return;
      }

      saveQuickLecBtn.disabled = true;
      if (quickSpinner) quickSpinner.style.display = "inline-block";

      try {
        await createLecturer({ staffId, fullName: name, email, department: dept, qualification: qual, studyCentre: centre, status: "active" });
        showAdminToast("success", `Faculty member ${name} (${staffId}) registered successfully.`);
        closeModal(modalQuickLec);
      } catch (err) {
        if (quickLecAlert) {
          quickLecAlert.textContent = err.message || "Failed to register faculty member.";
          quickLecAlert.className = "course-modal-feedback error";
          quickLecAlert.style.display = "block";
        }
      } finally {
        saveQuickLecBtn.disabled = false;
        if (quickSpinner) quickSpinner.style.display = "none";
      }
    });
  }

  // Confirm Assign Offering Handler
  if (confirmAssignBtn && formAssign) {
    confirmAssignBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const code = (assignCourseSelect?.value || "").trim();
      const centre = (assignCentreSelect?.value || "").trim();
      const session = (assignSessionSelect?.value || "2026/2027").trim();
      const semester = (assignSemesterSelect?.value || "First Semester").trim();
      const lecturerStaffId = (assignLecturerSelect?.value || "").trim();
      const notes = (assignNotes?.value || "").trim();

      if (!code) {
        showAssignAlert("Please select a Course Module to assign.");
        return;
      }
      if (!lecturerStaffId) {
        showAssignAlert("Please select a verified Faculty Instructor.");
        return;
      }

      const lecturerObj = lecturers.find((l) => l.staffId === lecturerStaffId);
      const lecturerName = lecturerObj ? lecturerObj.fullName : lecturerStaffId;
      const matchedCourse = catalogCourses.find((c) => normalizeCourseCode(c.courseCode) === normalizeCourseCode(code));
      const title = matchedCourse ? matchedCourse.title || matchedCourse.courseTitle : code;

      confirmAssignBtn.disabled = true;
      if (assignSpinner) assignSpinner.style.display = "inline-block";

      try {
        await assignCourseOffering({
          courseCode: code,
          courseTitle: title,
          studyCentre: centre,
          academicSession: session,
          semester,
          lecturerId: lecturerStaffId,
          lecturerName,
          programme: matchedCourse ? matchedCourse.programme : "Diploma in Theology",
          level: matchedCourse ? matchedCourse.level : "100",
          notes
        });

        showAdminToast("success", `Course [${code}] at ${centre} successfully assigned to ${lecturerName}.`);
        closeModal(modalAssign);
      } catch (err) {
        showAssignAlert(err.message || "Failed to complete course allocation.");
      } finally {
        confirmAssignBtn.disabled = false;
        if (assignSpinner) assignSpinner.style.display = "none";
      }
    });
  }

  const showAssignAlert = (msg) => {
    if (!assignAlert) return;
    assignAlert.textContent = msg;
    assignAlert.className = "course-modal-feedback error";
    assignAlert.style.display = "block";
  };

  // Confirm Reassign Offering Handler
  if (confirmReassignBtn && formReassign) {
    confirmReassignBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!pendingReassignAlloc) return;

      const allocId = pendingReassignAlloc.id;
      const newStaffId = (reassignLecturerSelect?.value || "").trim();
      const reason = (reassignReason?.value || "").trim();
      const notes = (reassignNotes?.value || "").trim();

      if (!newStaffId) {
        showReassignAlert("Please select a new Faculty Instructor.");
        return;
      }
      if (!reason) {
        showReassignAlert("Please provide a reason for the transfer (required for audit records).");
        return;
      }

      const newLecturerObj = lecturers.find((l) => l.staffId === newStaffId);
      const newLecturerName = newLecturerObj ? newLecturerObj.fullName : newStaffId;

      confirmReassignBtn.disabled = true;
      if (reassignSpinner) reassignSpinner.style.display = "inline-block";

      try {
        await reassignCourseAllocation(allocId, {
          newLecturerId: newStaffId,
          newLecturerName,
          reason,
          notes
        });

        showAdminToast("success", `Course offering transferred to ${newLecturerName}. Previous assignment history preserved.`);
        closeModal(modalReassign);
      } catch (err) {
        showReassignAlert(err.message || "Failed to transfer course allocation.");
      } finally {
        confirmReassignBtn.disabled = false;
        if (reassignSpinner) reassignSpinner.style.display = "none";
        pendingReassignAlloc = null;
      }
    });
  }

  const showReassignAlert = (msg) => {
    if (!reassignAlert) return;
    reassignAlert.textContent = msg;
    reassignAlert.className = "course-modal-feedback error";
    reassignAlert.style.display = "block";
  };

  // Confirm End Allocation Handler
  if (confirmEndBtn) {
    confirmEndBtn.addEventListener("click", async () => {
      if (!pendingEndAlloc) return;
      const allocId = pendingEndAlloc.id;
      const reason = (endReason?.value || "").trim();

      confirmEndBtn.disabled = true;
      try {
        await endCourseAllocation(allocId, { reason });
        showAdminToast("success", `Course assignment concluded. Offering is now Available.`);
        closeModal(modalEnd);
      } catch (err) {
        showAdminToast("error", err.message || "Failed to end course allocation.");
      } finally {
        confirmEndBtn.disabled = false;
        pendingEndAlloc = null;
      }
    });
  }

  // Open Assign Modal Button
  if (openAssignBtn) {
    openAssignBtn.addEventListener("click", () => openAssignModalWithPreFill());
  }

  // Toggle Workload View
  if (toggleWorkloadBtn) {
    toggleWorkloadBtn.addEventListener("click", () => {
      isWorkloadView = !isWorkloadView;
      if (isWorkloadView) {
        if (tableContainer) tableContainer.style.display = "none";
        if (workloadContainer) workloadContainer.style.display = "block";
        if (toggleWorkloadText) toggleWorkloadText.textContent = "Offerings Table View";
        if (headingText) headingText.textContent = "Faculty Workload & Account Registry";
        renderFacultyWorkload();
      } else {
        if (tableContainer) tableContainer.style.display = "block";
        if (workloadContainer) workloadContainer.style.display = "none";
        if (toggleWorkloadText) toggleWorkloadText.textContent = "Faculty Workload View";
        if (headingText) headingText.textContent = "Course Offering Allocations";
        renderTable();
      }
    });
  }

  // Filter Listeners
  if (searchInput) {
    let debounce;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        filters.search = e.target.value.trim();
        renderTable();
      }, 250);
    });
  }

  if (sessionSelect) {
    sessionSelect.addEventListener("change", (e) => {
      filters.session = e.target.value;
      renderTable();
    });
  }

  if (semesterSelect) {
    semesterSelect.addEventListener("change", (e) => {
      filters.semester = e.target.value;
      renderTable();
    });
  }

  if (centreSelect) {
    centreSelect.addEventListener("change", (e) => {
      filters.centre = e.target.value;
      renderTable();
    });
  }

  if (statusSelect) {
    statusSelect.addEventListener("change", (e) => {
      filters.status = e.target.value;
      renderTable();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      filters.sort = e.target.value;
      renderTable();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      filters.search = "";
      filters.session = "all";
      filters.semester = "all";
      filters.centre = "all";
      filters.status = "all";
      filters.sort = "code-asc";

      if (searchInput) searchInput.value = "";
      if (sessionSelect) sessionSelect.value = "all";
      if (semesterSelect) semesterSelect.value = "all";
      if (centreSelect) centreSelect.value = "all";
      if (statusSelect) statusSelect.value = "all";
      if (sortSelect) sortSelect.value = "code-asc";

      renderTable();
      showAdminToast("success", "Allocation filters reset to all course offerings.");
    });
  }

  // Subscriptions to Real-time Collections
  if (loadingEl) loadingEl.style.display = "block";

  const refreshAll = () => {
    if (loadingEl) loadingEl.style.display = "none";
    populateCourseDropdown();
    populateLecturerDropdowns();
    calculateOfferings();
    updateStats();

    if (sessionBadge) sessionBadge.textContent = ADMIN_CONFIG.SESSION || "2026/2027";
    if (semesterBadge) semesterBadge.textContent = ADMIN_CONFIG.SEMESTER || "First Semester";

    if (isWorkloadView) {
      renderFacultyWorkload();
    } else {
      renderTable();
    }
  };

  subscribeCourses((crsList) => {
    catalogCourses = crsList || [];
    refreshAll();
  });

  subscribeCourseAllocations((allocList) => {
    allocations = allocList || [];
    refreshAll();
  });

  subscribeLecturers((lecList) => {
    lecturers = lecList || [];
    refreshAll();
  });
}

/**
 * =========================================================================
 * 18. LECTURER MANAGEMENT MODULE CONTROLLER
 * Institutional Faculty Directory, Single-Identity Rule, Dynamic Allocations & Audit
 * =========================================================================
 */
export function initLecturerManagement() {
  console.log("[DIMABIN Dashboard] Initializing Lecturer Management Controller...");

  // State
  let lecturersList = [];
  let allocationsList = [];
  let activeLecturerForModal = null;

  // Filter State
  const filters = {
    search: "",
    department: "all",
    status: "all",
    centre: "all",
    sort: "name-asc"
  };

  // Table DOM Elements
  const tbody = document.getElementById("lecturers-table-tbody");
  const loadingEl = document.getElementById("lecturers-table-loading");
  const emptyEl = document.getElementById("lecturers-table-empty");
  const emptyHeading = document.getElementById("lec-empty-heading");
  const errorEl = document.getElementById("lecturers-table-error");
  const countPill = document.getElementById("lec-count-pill");
  const filterSummary = document.getElementById("lec-filter-summary");

  // Summary Stat DOM Elements
  const statTotal = document.getElementById("stat-lec-total");
  const statActive = document.getElementById("stat-lec-active");
  const statInactive = document.getElementById("stat-lec-inactive");
  const statAssigned = document.getElementById("stat-lec-assigned");
  const statMultiCentre = document.getElementById("stat-lec-multi-centre");
  const statAllocCount = document.getElementById("stat-lec-alloc-count");

  // Filter Input DOM Elements
  const searchInput = document.getElementById("filter-lec-search");
  const deptFilter = document.getElementById("filter-lec-dept");
  const statusFilter = document.getElementById("filter-lec-status");
  const centreFilter = document.getElementById("filter-lec-centre");
  const sortFilter = document.getElementById("filter-lec-sort");
  const resetFiltersBtn = document.getElementById("btn-reset-lec-filters");

  // Navigation / Action Buttons
  const gotoAllocationsBtn = document.getElementById("btn-goto-allocations-from-lec");
  const openAddLecturerBtn = document.getElementById("btn-open-add-lecturer") || document.getElementById("btn-open-add-lecturer-modal") || document.querySelector(".btn-open-add-lecturer");
  const quickAddLecBtn = document.getElementById("btn-open-quick-add-lecturer");

  // Add Modal Elements
  const addModal = document.getElementById("modal-add-lecturer-profile");
  const addForm = document.getElementById("form-add-lecturer-profile");
  const addAlert = document.getElementById("add-lec-modal-alert");
  const btnCloseAddModal = document.getElementById("btn-close-add-lec-modal");
  const btnCancelAddModal = document.getElementById("btn-cancel-add-lec-modal");
  const btnConfirmAddModal = document.getElementById("btn-confirm-add-lecturer");
  const btnAutoGenStaffId = document.getElementById("btn-auto-gen-staff-id");
  const addSpinner = document.getElementById("add-lec-spinner");
  const addBtnText = document.getElementById("add-lec-btn-text");

  // Edit Modal Elements
  const editModal = document.getElementById("modal-edit-lecturer-profile");
  const editForm = document.getElementById("form-edit-lecturer-profile");
  const editAlert = document.getElementById("edit-lec-modal-alert");
  const btnCloseEditModal = document.getElementById("btn-close-edit-lec-modal");
  const btnCancelEditModal = document.getElementById("btn-cancel-edit-lec-modal");
  const btnConfirmEditModal = document.getElementById("btn-confirm-edit-lecturer");
  const editSpinner = document.getElementById("edit-lec-spinner");
  const editBtnText = document.getElementById("edit-lec-btn-text");

  // View Profile Modal Elements
  const viewModal = document.getElementById("modal-view-lecturer-profile");
  const btnCloseViewModal = document.getElementById("btn-close-view-lec-modal");
  const btnCloseViewBtn = document.getElementById("btn-close-view-lec-btn");
  const btnEditFromViewBtn = document.getElementById("btn-edit-from-view-lec-btn");
  const btnViewAllAllocsBtn = document.getElementById("btn-view-all-assignments-btn");

  // View Assignments Modal Elements
  const allocsModal = document.getElementById("modal-view-lecturer-assignments");
  const btnCloseAllocsModal = document.getElementById("btn-close-allocs-lec-modal");
  const btnCloseAllocsBtn = document.getElementById("btn-close-allocs-lec-btn");
  const btnGotoAllocsFromModal = document.getElementById("btn-goto-allocations-from-modal");

  // Toggle Status Modal Elements
  const toggleModal = document.getElementById("modal-toggle-lecturer-status");
  const btnCloseToggleModal = document.getElementById("btn-close-toggle-lec-modal");
  const btnCancelToggleModal = document.getElementById("btn-cancel-toggle-lec-modal");
  const btnConfirmToggle = document.getElementById("btn-confirm-toggle-status");

  // Helper: Get active allocations for a lecturer dynamically from allocationsList
  const getActiveAllocations = (lecturer) => {
    if (!lecturer) return [];
    const staffId = (lecturer.staffId || "").trim().toLowerCase();
    const id = (lecturer.id || "").trim().toLowerCase();
    const name = (lecturer.fullName || "").trim().toLowerCase();

    return (allocationsList || []).filter((a) => {
      const aStatus = (a.status || "").toLowerCase();
      if (aStatus !== "active" && aStatus !== "assigned" && aStatus !== "reassigned") return false;

      const aLecId = (a.lecturerId || "").trim().toLowerCase();
      const aLecName = (a.lecturerName || "").trim().toLowerCase();

      return (staffId && aLecId === staffId) || (id && aLecId === id) || (name && aLecName === name);
    });
  };

  // Helper: Get unique study centres where lecturer is actively assigned
  const getAssignedCentres = (lecturer) => {
    const activeAllocs = getActiveAllocations(lecturer);
    const centres = new Set();
    activeAllocs.forEach((a) => {
      if (a.studyCentre) centres.add(a.studyCentre);
    });
    return Array.from(centres);
  };

  // Helper: Compute next sequential staff ID (e.g. DIMABIN/FAC/2026/06)
  const computeNextStaffId = () => {
    const currentYear = new Date().getFullYear();
    let maxNum = 0;
    lecturersList.forEach((l) => {
      const match = (l.staffId || "").match(/\/FAC\/(?:\d{4})\/(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    const nextSeq = String(maxNum + 1).padStart(2, "0");
    return `DIMABIN/FAC/${currentYear}/${nextSeq}`;
  };

  // Update Summary Statistics Cards
  const updateStats = () => {
    const total = lecturersList.length;
    const active = lecturersList.filter((l) => (l.accountStatus || l.status || "active") === "active").length;
    const inactive = lecturersList.filter((l) => (l.accountStatus || l.status || "active") === "inactive").length;

    let teachingCount = 0;
    let multiCentreCount = 0;
    let totalActiveAllocCount = 0;

    lecturersList.forEach((l) => {
      const activeAllocs = getActiveAllocations(l);
      if (activeAllocs.length > 0) {
        teachingCount++;
        totalActiveAllocCount += activeAllocs.length;
      }
      const centres = getAssignedCentres(l);
      if (centres.length >= 2) {
        multiCentreCount++;
      }
    });

    if (statTotal) statTotal.textContent = total;
    if (statActive) statActive.textContent = active;
    if (statInactive) statInactive.textContent = inactive;
    if (statAssigned) statAssigned.textContent = teachingCount;
    if (statMultiCentre) statMultiCentre.textContent = multiCentreCount;
    if (statAllocCount) statAllocCount.textContent = totalActiveAllocCount;
  };

  // Render Table
  const renderTable = () => {
    if (!tbody) return;

    // Filter
    let list = lecturersList.filter((l) => {
      // 1. Search Query
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const staffId = (l.staffId || "").toLowerCase();
        const name = (l.fullName || "").toLowerCase();
        const email = (l.email || "").toLowerCase();
        const phone = (l.phone || "").toLowerCase();
        const dept = (l.department || "").toLowerCase();
        const spec = (l.specialization || "").toLowerCase();
        if (!staffId.includes(q) && !name.includes(q) && !email.includes(q) && !phone.includes(q) && !dept.includes(q) && !spec.includes(q)) {
          return false;
        }
      }

      // 2. Department
      if (filters.department !== "all" && (l.department || "") !== filters.department) {
        return false;
      }

      // 3. Status
      const accStatus = (l.accountStatus || l.status || "active").toLowerCase();
      if (filters.status !== "all" && accStatus !== filters.status) {
        return false;
      }

      // 4. Study Centre (Checks either primary base OR assigned teaching centres)
      if (filters.centre !== "all") {
        const base = l.studyCentre || "";
        const assignedCentres = getAssignedCentres(l);
        if (base !== filters.centre && !assignedCentres.includes(filters.centre)) {
          return false;
        }
      }

      return true;
    });

    // Sort
    list.sort((a, b) => {
      switch (filters.sort) {
        case "name-asc":
          return (a.fullName || "").localeCompare(b.fullName || "");
        case "name-desc":
          return (b.fullName || "").localeCompare(a.fullName || "");
        case "id-asc":
          return (a.staffId || "").localeCompare(b.staffId || "");
        case "courses-desc": {
          const countA = getActiveAllocations(a).length;
          const countB = getActiveAllocations(b).length;
          return countB - countA;
        }
        case "status-active": {
          const stA = (a.accountStatus || a.status || "active") === "active" ? 0 : 1;
          const stB = (b.accountStatus || b.status || "active") === "active" ? 0 : 1;
          return stA - stB;
        }
        default:
          return (a.fullName || "").localeCompare(b.fullName || "");
      }
    });

    // Update Counts & Description
    if (countPill) countPill.textContent = `${list.length} Faculty Member${list.length === 1 ? "" : "s"}`;
    if (filterSummary) {
      const activeTags = [];
      if (filters.search) activeTags.push(`"${filters.search}"`);
      if (filters.department !== "all") activeTags.push(filters.department);
      if (filters.status !== "all") activeTags.push(`Status: ${filters.status}`);
      if (filters.centre !== "all") activeTags.push(filters.centre);
      filterSummary.textContent = activeTags.length > 0 ? `Filtered by ${activeTags.join(" · ")}` : "Showing all faculty records";
    }

    if (list.length === 0) {
      tbody.innerHTML = "";
      if (emptyEl) {
        emptyEl.style.display = "block";
        if (emptyHeading) {
          emptyHeading.textContent = lecturersList.length === 0 ? "No faculty members registered in system." : "No faculty records match your criteria.";
        }
      }
      return;
    }

    if (emptyEl) emptyEl.style.display = "none";

    const rowsHtml = list
      .map((lec) => {
        const id = lec.id;
        const staffId = lec.staffId || "N/A";
        const name = lec.fullName || "Unnamed Faculty";
        const email = lec.email || "—";
        const phone = lec.phone || "—";
        const dept = lec.department || "General Theology";
        const accStatus = (lec.accountStatus || lec.status || "active").toLowerCase();
        const isActive = accStatus === "active";

        const activeAllocs = getActiveAllocations(lec);
        const assignedCentres = getAssignedCentres(lec);

        // Course load badge HTML
        let courseLoadHtml = "";
        if (activeAllocs.length === 0) {
          courseLoadHtml = `<span class="badge-lec-count zero">0 Courses</span>`;
        } else {
          courseLoadHtml = `<span class="badge-lec-count blue">📚 ${activeAllocs.length} Course${activeAllocs.length === 1 ? "" : "s"}</span>`;
        }

        // Centres badge HTML
        let centresHtml = "";
        if (assignedCentres.length === 0) {
          centresHtml = `<span style="font-size: 0.72rem; color: var(--admin-text-muted);">Base: ${lec.studyCentre ? lec.studyCentre.split(",")[0] : "Goshen"}</span>`;
        } else if (assignedCentres.length === 1) {
          centresHtml = `<span class="badge-lec-count gold">📍 1 Campus</span>`;
        } else {
          centresHtml = `<span class="badge-lec-count gold">📍 ${assignedCentres.length} Campuses</span>`;
        }

        // Status badge HTML
        const statusBadgeHtml = isActive
          ? `<span class="badge-lec-status badge-lec-active">● Active</span>`
          : `<span class="badge-lec-status badge-lec-inactive">○ Inactive</span>`;

        return `
          <tr data-lecturer-id="${id}">
            <td><strong style="color: var(--primary-blue); font-size: 0.875rem;">${staffId}</strong></td>
            <td>
              <div style="font-weight: 700; color: var(--dark-navy);">${name}</div>
              <div style="font-size: 0.72rem; color: var(--admin-text-muted);">${lec.qualification || "Faculty Tutor"}</div>
            </td>
            <td>
              <a href="mailto:${email}" style="color: var(--primary-blue); text-decoration: none; font-size: 0.8125rem;">${email}</a>
            </td>
            <td><span style="font-size: 0.8125rem; color: var(--admin-text-main);">${phone}</span></td>
            <td>
              <div style="font-size: 0.8125rem; font-weight: 600; color: var(--dark-navy);">${dept}</div>
              <div style="font-size: 0.7rem; color: var(--admin-text-muted);">${lec.specialization ? lec.specialization : "Theology"}</div>
            </td>
            <td>${courseLoadHtml}</td>
            <td>${centresHtml}</td>
            <td>${statusBadgeHtml}</td>
            <td style="text-align: right;">
              <div class="lec-actions-cell">
                <button type="button" class="btn-lec-action btn-lec-view action-view-lec-profile" data-id="${id}" title="View Complete Faculty Profile">
                  Profile
                </button>
                <button type="button" class="btn-lec-action btn-lec-edit action-edit-lec-profile" data-id="${id}" title="Edit Profile Details">
                  Edit
                </button>
                <button type="button" class="btn-lec-action btn-lec-allocs action-view-lec-allocs" data-id="${id}" title="View Teaching Allocations">
                  Assignments
                </button>
                <button type="button" class="btn-lec-action ${isActive ? "btn-lec-toggle-active" : "btn-lec-toggle-inactive"} action-toggle-lec-status" data-id="${id}" data-current="${accStatus}" title="${isActive ? "Deactivate Account" : "Activate Account"}">
                  ${isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");

    tbody.innerHTML = rowsHtml;
  };

  // Refresh All Controller Views
  const refreshAll = () => {
    updateStats();
    renderTable();
  };

  // --- Modal Openers & Helpers ---

  const showModalAlert = (alertEl, type, msg) => {
    if (!alertEl) return;
    alertEl.style.display = "block";
    alertEl.className = `course-modal-feedback ${type === "error" ? "error" : "success"}`;
    alertEl.textContent = msg;
  };

  const clearModalAlert = (alertEl) => {
    if (!alertEl) return;
    alertEl.style.display = "none";
    alertEl.textContent = "";
  };

  const openAddLecturerModal = () => {
    if (!addModal) return;
    clearModalAlert(addAlert);
    if (addForm) addForm.reset();

    const staffIdInput = document.getElementById("add-lec-staffid");
    if (staffIdInput) {
      staffIdInput.value = computeNextStaffId();
    }
    const statusSelect = document.getElementById("add-lec-status");
    if (statusSelect) statusSelect.value = "active";

    addModal.style.display = "flex";
  };

  const closeAddLecturerModal = () => {
    if (addModal) addModal.style.display = "none";
  };

  const openEditLecturerModal = (lecturer) => {
    if (!editModal || !lecturer) return;
    clearModalAlert(editAlert);
    activeLecturerForModal = lecturer;

    const idInput = document.getElementById("edit-lec-id");
    const staffIdDisplay = document.getElementById("edit-lec-staffid-display");
    const nameInput = document.getElementById("edit-lec-fullname");
    const emailInput = document.getElementById("edit-lec-email");
    const phoneInput = document.getElementById("edit-lec-phone");
    const deptSelect = document.getElementById("edit-lec-department");
    const qualInput = document.getElementById("edit-lec-qualification");
    const specInput = document.getElementById("edit-lec-specialization");
    const centreSelect = document.getElementById("edit-lec-centre");
    const statusSelect = document.getElementById("edit-lec-status");

    if (idInput) idInput.value = lecturer.id;
    if (staffIdDisplay) staffIdDisplay.textContent = lecturer.staffId || "N/A";
    if (nameInput) nameInput.value = lecturer.fullName || "";
    if (emailInput) emailInput.value = lecturer.email || "";
    if (phoneInput) phoneInput.value = lecturer.phone || "";
    if (deptSelect) deptSelect.value = lecturer.department || "Biblical Studies & Theology";
    if (qualInput) qualInput.value = lecturer.qualification || "";
    if (specInput) specInput.value = lecturer.specialization || "";
    if (centreSelect) centreSelect.value = lecturer.studyCentre || "Goshen Central Campus, Abeokuta";
    if (statusSelect) statusSelect.value = (lecturer.accountStatus || lecturer.status || "active").toLowerCase();

    editModal.style.display = "flex";
  };

  const closeEditLecturerModal = () => {
    if (editModal) editModal.style.display = "none";
  };

  const openViewProfileModal = (lecturer) => {
    if (!viewModal || !lecturer) return;
    activeLecturerForModal = lecturer;

    const initials = (lecturer.fullName || "FA")
      .split(" ")
      .filter((w) => w.length > 0 && !w.startsWith("Rev.") && !w.startsWith("Dr.") && !w.startsWith("Pst."))
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "FA";

    const avatarEl = document.getElementById("view-lec-avatar");
    const nameEl = document.getElementById("view-lec-fullname");
    const staffIdEl = document.getElementById("view-lec-staffid");
    const deptEl = document.getElementById("view-lec-dept");
    const statusBadgeEl = document.getElementById("view-lec-status-badge");
    const emailEl = document.getElementById("view-lec-email");
    const phoneEl = document.getElementById("view-lec-phone");
    const qualEl = document.getElementById("view-lec-qualification");
    const specEl = document.getElementById("view-lec-specialization");
    const centreEl = document.getElementById("view-lec-centre");
    const loadSummaryEl = document.getElementById("view-lec-load-summary");
    const uidEl = document.getElementById("view-lec-uid");
    const assignedCountEl = document.getElementById("view-lec-assigned-count");
    const assignmentsPreview = document.getElementById("view-lec-assignments-preview");

    if (avatarEl) avatarEl.textContent = initials;
    if (nameEl) nameEl.textContent = lecturer.fullName || "Unnamed Faculty";
    if (staffIdEl) staffIdEl.textContent = lecturer.staffId || "N/A";
    if (deptEl) deptEl.textContent = lecturer.department || "General Faculty";

    const isActive = (lecturer.accountStatus || lecturer.status || "active").toLowerCase() === "active";
    if (statusBadgeEl) {
      statusBadgeEl.className = `badge-lec-status ${isActive ? "badge-lec-active" : "badge-lec-inactive"}`;
      statusBadgeEl.textContent = isActive ? "● Active" : "○ Inactive";
    }

    if (emailEl) emailEl.textContent = lecturer.email || "No email recorded";
    if (phoneEl) phoneEl.textContent = lecturer.phone || "No phone recorded";
    if (qualEl) qualEl.textContent = lecturer.qualification || "Unspecified Qualifications";
    if (specEl) specEl.textContent = lecturer.specialization || "General Theology & Ministry";
    if (centreEl) centreEl.textContent = lecturer.studyCentre || "Goshen Central Campus, Abeokuta";

    const activeAllocs = getActiveAllocations(lecturer);
    const assignedCentres = getAssignedCentres(lecturer);

    if (loadSummaryEl) {
      loadSummaryEl.textContent = `${activeAllocs.length} Active Course${activeAllocs.length === 1 ? "" : "s"} · ${assignedCentres.length} Campus${assignedCentres.length === 1 ? "" : "es"}`;
    }

    if (uidEl) {
      uidEl.textContent = lecturer.uid || `lec_auth_${(lecturer.staffId || "").replace(/[^A-Za-z0-9]/g, "_").toLowerCase()}`;
    }

    if (assignedCountEl) {
      assignedCountEl.textContent = `${activeAllocs.length} Offering${activeAllocs.length === 1 ? "" : "s"}`;
    }

    if (assignmentsPreview) {
      if (activeAllocs.length === 0) {
        assignmentsPreview.innerHTML = `
          <div style="background: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: var(--admin-radius-sm); padding: 1.25rem; text-align: center; color: var(--admin-text-muted); font-size: 0.8125rem;">
            No course offerings currently allocated to this faculty member.
          </div>
        `;
      } else {
        assignmentsPreview.innerHTML = activeAllocs
          .map((a) => {
            const sem = a.semester || "Semester";
            const sess = a.academicSession || "Session";
            const centre = a.studyCentre || "Campus";
            return `
              <div class="lec-assignment-card">
                <div>
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.2rem;">
                    <strong style="color: var(--primary-blue); font-size: 0.875rem;">${a.courseCode}</strong>
                    <span style="font-size: 0.72rem; color: var(--admin-text-muted);">· ${sess} (${sem})</span>
                  </div>
                  <div style="font-weight: 700; color: var(--dark-navy); font-size: 0.8125rem;">${a.courseTitle}</div>
                  <div style="font-size: 0.75rem; color: var(--admin-text-muted); margin-top: 2px;">📍 ${centre}</div>
                </div>
                <div>
                  <span class="badge-alloc-status badge-alloc-${a.status === "reassigned" ? "reassigned" : "assigned"}">
                    ${a.status === "reassigned" ? "↻ Reassigned" : "● Assigned"}
                  </span>
                </div>
              </div>
            `;
          })
          .join("");
      }
    }

    viewModal.style.display = "flex";
  };

  const closeViewProfileModal = () => {
    if (viewModal) viewModal.style.display = "none";
  };

  const openViewAssignmentsModal = (lecturer) => {
    if (!allocsModal || !lecturer) return;
    activeLecturerForModal = lecturer;

    const staffIdEl = document.getElementById("allocs-modal-lec-id");
    const nameEl = document.getElementById("allocs-modal-lec-name");
    const deptEl = document.getElementById("allocs-modal-lec-dept");
    const countBadge = document.getElementById("allocs-modal-count-badge");
    const listContainer = document.getElementById("allocs-modal-list-container");

    if (staffIdEl) staffIdEl.textContent = lecturer.staffId || "N/A";
    if (nameEl) nameEl.textContent = lecturer.fullName || "Unnamed Faculty";
    if (deptEl) deptEl.textContent = `${lecturer.department || "Faculty"} · Base: ${lecturer.studyCentre || "Goshen"}`;

    const activeAllocs = getActiveAllocations(lecturer);

    if (countBadge) {
      countBadge.textContent = `${activeAllocs.length} Active Offering${activeAllocs.length === 1 ? "" : "s"}`;
    }

    if (listContainer) {
      if (activeAllocs.length === 0) {
        listContainer.innerHTML = `
          <div style="background: #F8FAFC; border: 1.5px dashed #CBD5E1; border-radius: var(--admin-radius-md); padding: 2rem; text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">📖</div>
            <h5 style="font-size: 0.9375rem; font-weight: 700; color: var(--dark-navy); margin-bottom: 0.35rem;">No Course Allocations Recorded</h5>
            <p style="font-size: 0.8125rem; color: var(--admin-text-muted); margin-bottom: 1rem;">
              ${lecturer.fullName} has not been allocated to any course offering in the active trimester sessions.
            </p>
            <button type="button" class="btn-admin-primary btn-jump-to-alloc-screen" style="font-size: 0.8125rem; padding: 0.5rem 1rem;">
              Open Course Allocation Matrix →
            </button>
          </div>
        `;
      } else {
        listContainer.innerHTML = activeAllocs
          .map((a) => {
            const sem = a.semester || "Semester";
            const sess = a.academicSession || "Session";
            const centre = a.studyCentre || "Campus";
            return `
              <div class="lec-assignment-card" style="padding: 1rem 1.15rem;">
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
                    <strong style="color: var(--primary-blue); font-size: 0.9375rem;">${a.courseCode}</strong>
                    <span class="badge-alloc-status badge-alloc-${a.status === "reassigned" ? "reassigned" : "assigned"}">
                      ${a.status === "reassigned" ? "↻ Reassigned" : "● Assigned"}
                    </span>
                  </div>
                  <h5 style="font-weight: 800; color: var(--dark-navy); font-size: 0.875rem; margin: 0 0 0.3rem 0;">${a.courseTitle}</h5>
                  <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; font-size: 0.75rem; color: var(--admin-text-muted);">
                    <span>📍 <strong>Campus:</strong> ${centre}</span>
                    <span>📅 <strong>Session:</strong> ${sess}</span>
                    <span>⏳ <strong>Term:</strong> ${sem}</span>
                  </div>
                  ${a.notes ? `<div style="margin-top: 0.4rem; font-size: 0.72rem; color: var(--admin-text-main); background: #F8FAFC; padding: 0.3rem 0.5rem; border-radius: 4px;">Scope: ${a.notes}</div>` : ""}
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.35rem; align-items: flex-end;">
                  <button type="button" class="btn-alloc-action btn-alloc-assign btn-jump-to-alloc-screen" style="font-size: 0.72rem; padding: 0.3rem 0.65rem;">
                    Manage Offering
                  </button>
                </div>
              </div>
            `;
          })
          .join("");
      }
    }

    allocsModal.style.display = "flex";
  };

  const closeViewAssignmentsModal = () => {
    if (allocsModal) allocsModal.style.display = "none";
  };

  const openToggleStatusModal = (lecturer) => {
    if (!toggleModal || !lecturer) return;
    activeLecturerForModal = lecturer;

    const currentStatus = (lecturer.accountStatus || lecturer.status || "active").toLowerCase();
    const targetStatus = currentStatus === "active" ? "inactive" : "active";

    const idInput = document.getElementById("toggle-lec-id");
    const targetInput = document.getElementById("toggle-lec-target-status");
    const headerEl = document.getElementById("modal-toggle-lec-header");
    const titleEl = document.getElementById("modal-toggle-lec-title");
    const promptEl = document.getElementById("toggle-lec-prompt");
    const nameEl = document.getElementById("toggle-lec-name-display");
    const metaEl = document.getElementById("toggle-lec-meta-display");
    const explanationEl = document.getElementById("toggle-lec-explanation");
    const confirmBtn = document.getElementById("btn-confirm-toggle-status");

    if (idInput) idInput.value = lecturer.id;
    if (targetInput) targetInput.value = targetStatus;
    if (nameEl) nameEl.textContent = lecturer.fullName || "Unnamed Faculty";
    if (metaEl) metaEl.textContent = `${lecturer.staffId} · ${lecturer.department || "Faculty"}`;

    if (targetStatus === "inactive") {
      if (headerEl) headerEl.style.background = "#DC2626";
      if (titleEl) titleEl.textContent = "Deactivate Faculty Account";
      if (promptEl) promptEl.textContent = "Are you sure you want to suspend this faculty member's account?";
      if (explanationEl) {
        explanationEl.textContent =
          "Deactivating this profile suspends portal access for this faculty member. Existing course allocation records and teaching history are preserved safely in institutional archives.";
      }
      if (confirmBtn) {
        confirmBtn.style.background = "#DC2626";
        confirmBtn.style.borderColor = "#DC2626";
        confirmBtn.textContent = "Confirm Deactivation";
      }
    } else {
      if (headerEl) headerEl.style.background = "#16A34A";
      if (titleEl) titleEl.textContent = "Activate Faculty Account";
      if (promptEl) promptEl.textContent = "Are you sure you want to restore active status for this faculty member?";
      if (explanationEl) {
        explanationEl.textContent =
          "Activating this profile restores full lecturer portal sign-in and enables course assignments across all DIMABIN study centres.";
      }
      if (confirmBtn) {
        confirmBtn.style.background = "#16A34A";
        confirmBtn.style.borderColor = "#16A34A";
        confirmBtn.textContent = "Confirm Activation";
      }
    }

    toggleModal.style.display = "flex";
  };

  const closeToggleStatusModal = () => {
    if (toggleModal) toggleModal.style.display = "none";
  };

  // --- Event Listeners Wiring ---

  // Filters Listeners
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      filters.search = e.target.value.trim();
      renderTable();
    });
  }

  if (deptFilter) {
    deptFilter.addEventListener("change", (e) => {
      filters.department = e.target.value;
      renderTable();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", (e) => {
      filters.status = e.target.value;
      renderTable();
    });
  }

  if (centreFilter) {
    centreFilter.addEventListener("change", (e) => {
      filters.centre = e.target.value;
      renderTable();
    });
  }

  if (sortFilter) {
    sortFilter.addEventListener("change", (e) => {
      filters.sort = e.target.value;
      renderTable();
    });
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", () => {
      filters.search = "";
      filters.department = "all";
      filters.status = "all";
      filters.centre = "all";
      filters.sort = "name-asc";

      if (searchInput) searchInput.value = "";
      if (deptFilter) deptFilter.value = "all";
      if (statusFilter) statusFilter.value = "all";
      if (centreFilter) centreFilter.value = "all";
      if (sortFilter) sortFilter.value = "name-asc";

      renderTable();
      showAdminToast("success", "Faculty directory filters reset.");
    });
  }

  // Cross-Navigation Buttons
  if (gotoAllocationsBtn) {
    gotoAllocationsBtn.addEventListener("click", () => {
      navigateToSection("course-allocation");
    });
  }

  if (openAddLecturerBtn) {
    openAddLecturerBtn.addEventListener("click", () => {
      openAddLecturerModal();
    });
  }

  if (quickAddLecBtn) {
    quickAddLecBtn.addEventListener("click", () => {
      openAddLecturerModal();
    });
  }

  // Add Modal Controls
  if (btnCloseAddModal) btnCloseAddModal.addEventListener("click", closeAddLecturerModal);
  if (btnCancelAddModal) btnCancelAddModal.addEventListener("click", closeAddLecturerModal);
  if (btnAutoGenStaffId) {
    btnAutoGenStaffId.addEventListener("click", () => {
      const staffIdInput = document.getElementById("add-lec-staffid");
      if (staffIdInput) {
        staffIdInput.value = computeNextStaffId();
        showAdminToast("success", `Suggested Next ID: ${staffIdInput.value}`);
      }
    });
  }

  if (btnConfirmAddModal) {
    btnConfirmAddModal.addEventListener("click", async () => {
      const fullName = (document.getElementById("add-lec-fullname")?.value || "").trim();
      const staffId = (document.getElementById("add-lec-staffid")?.value || "").trim();
      const email = (document.getElementById("add-lec-email")?.value || "").trim().toLowerCase();
      const phone = (document.getElementById("add-lec-phone")?.value || "").trim();
      const department = (document.getElementById("add-lec-department")?.value || "Biblical Studies & Theology").trim();
      const qualification = (document.getElementById("add-lec-qualification")?.value || "").trim();
      const specialization = (document.getElementById("add-lec-specialization")?.value || "").trim();
      const studyCentre = (document.getElementById("add-lec-centre")?.value || "Goshen Central Campus, Abeokuta").trim();
      const accountStatus = document.getElementById("add-lec-status")?.value === "inactive" ? "inactive" : "active";

      if (!fullName) {
        showModalAlert(addAlert, "error", "Please provide the lecturer's full name.");
        return;
      }
      if (!staffId) {
        showModalAlert(addAlert, "error", "Institutional Lecturer ID is required.");
        return;
      }
      if (!email || !email.includes("@")) {
        showModalAlert(addAlert, "error", "Please enter a valid institutional email address.");
        return;
      }

      try {
        if (addSpinner) addSpinner.style.display = "inline";
        if (addBtnText) addBtnText.textContent = "Saving Faculty Member...";
        btnConfirmAddModal.disabled = true;

        await createLecturer({
          fullName,
          staffId,
          email,
          phone,
          department,
          qualification,
          specialization,
          studyCentre,
          accountStatus
        });

        showAdminToast("success", `Faculty member ${fullName} (${staffId}) registered successfully.`);
        closeAddLecturerModal();
      } catch (err) {
        console.error("[DIMABIN Lecturers] Add error:", err);
        showModalAlert(addAlert, "error", err.message || "Failed to register lecturer.");
      } finally {
        if (addSpinner) addSpinner.style.display = "none";
        if (addBtnText) addBtnText.textContent = "Register Faculty Member";
        btnConfirmAddModal.disabled = false;
      }
    });
  }

  // Edit Modal Controls
  if (btnCloseEditModal) btnCloseEditModal.addEventListener("click", closeEditLecturerModal);
  if (btnCancelEditModal) btnCancelEditModal.addEventListener("click", closeEditLecturerModal);

  if (btnConfirmEditModal) {
    btnConfirmEditModal.addEventListener("click", async () => {
      const id = (document.getElementById("edit-lec-id")?.value || "").trim();
      const fullName = (document.getElementById("edit-lec-fullname")?.value || "").trim();
      const email = (document.getElementById("edit-lec-email")?.value || "").trim().toLowerCase();
      const phone = (document.getElementById("edit-lec-phone")?.value || "").trim();
      const department = (document.getElementById("edit-lec-department")?.value || "").trim();
      const qualification = (document.getElementById("edit-lec-qualification")?.value || "").trim();
      const specialization = (document.getElementById("edit-lec-specialization")?.value || "").trim();
      const studyCentre = (document.getElementById("edit-lec-centre")?.value || "").trim();
      const accountStatus = document.getElementById("edit-lec-status")?.value === "inactive" ? "inactive" : "active";

      if (!id) {
        showModalAlert(editAlert, "error", "Missing faculty identifier.");
        return;
      }
      if (!fullName) {
        showModalAlert(editAlert, "error", "Full Name is required.");
        return;
      }
      if (!email || !email.includes("@")) {
        showModalAlert(editAlert, "error", "A valid email address is required.");
        return;
      }

      try {
        if (editSpinner) editSpinner.style.display = "inline";
        if (editBtnText) editBtnText.textContent = "Updating...";
        btnConfirmEditModal.disabled = true;

        await updateLecturer(id, {
          fullName,
          email,
          phone,
          department,
          qualification,
          specialization,
          studyCentre,
          accountStatus
        });

        showAdminToast("success", `Faculty profile for ${fullName} updated successfully.`);
        closeEditLecturerModal();
      } catch (err) {
        console.error("[DIMABIN Lecturers] Update error:", err);
        showModalAlert(editAlert, "error", err.message || "Failed to update lecturer profile.");
      } finally {
        if (editSpinner) editSpinner.style.display = "none";
        if (editBtnText) editBtnText.textContent = "Save Changes";
        btnConfirmEditModal.disabled = false;
      }
    });
  }

  // View Profile Modal Controls
  if (btnCloseViewModal) btnCloseViewModal.addEventListener("click", closeViewProfileModal);
  if (btnCloseViewBtn) btnCloseViewBtn.addEventListener("click", closeViewProfileModal);

  if (btnEditFromViewBtn) {
    btnEditFromViewBtn.addEventListener("click", () => {
      closeViewProfileModal();
      if (activeLecturerForModal) {
        openEditLecturerModal(activeLecturerForModal);
      }
    });
  }

  if (btnViewAllAllocsBtn) {
    btnViewAllAllocsBtn.addEventListener("click", () => {
      closeViewProfileModal();
      if (activeLecturerForModal) {
        openViewAssignmentsModal(activeLecturerForModal);
      }
    });
  }

  // View Assignments Modal Controls
  if (btnCloseAllocsModal) btnCloseAllocsModal.addEventListener("click", closeViewAssignmentsModal);
  if (btnCloseAllocsBtn) btnCloseAllocsBtn.addEventListener("click", closeViewAssignmentsModal);

  if (btnGotoAllocsFromModal) {
    btnGotoAllocsFromModal.addEventListener("click", () => {
      closeViewAssignmentsModal();
      navigateToSection("course-allocation");
    });
  }

  // Toggle Status Modal Controls
  if (btnCloseToggleModal) btnCloseToggleModal.addEventListener("click", closeToggleStatusModal);
  if (btnCancelToggleModal) btnCancelToggleModal.addEventListener("click", closeToggleStatusModal);

  if (btnConfirmToggle) {
    btnConfirmToggle.addEventListener("click", async () => {
      const id = (document.getElementById("toggle-lec-id")?.value || "").trim();
      const targetStatus = (document.getElementById("toggle-lec-target-status")?.value || "active").trim();

      if (!id) return;

      try {
        btnConfirmToggle.disabled = true;
        btnConfirmToggle.textContent = "Updating...";

        await setLecturerStatus(id, targetStatus, `Administrator toggle to ${targetStatus}`);
        showAdminToast("success", `Faculty account status updated to ${targetStatus.toUpperCase()}.`);
        closeToggleStatusModal();
      } catch (err) {
        console.error("[DIMABIN Lecturers] Toggle status error:", err);
        showAdminToast("error", err.message || "Failed to change account status.");
      } finally {
        btnConfirmToggle.disabled = false;
        btnConfirmToggle.textContent = "Confirm Status Change";
      }
    });
  }

  // Delegate Row Action Buttons in Table
  if (tbody) {
    tbody.addEventListener("click", (e) => {
      const btnView = e.target.closest(".action-view-lec-profile");
      const btnEdit = e.target.closest(".action-edit-lec-profile");
      const btnAllocs = e.target.closest(".action-view-lec-allocs");
      const btnToggle = e.target.closest(".action-toggle-lec-status");

      if (btnView) {
        const id = btnView.dataset.id;
        const target = lecturersList.find((l) => l.id === id);
        if (target) openViewProfileModal(target);
      } else if (btnEdit) {
        const id = btnEdit.dataset.id;
        const target = lecturersList.find((l) => l.id === id);
        if (target) openEditLecturerModal(target);
      } else if (btnAllocs) {
        const id = btnAllocs.dataset.id;
        const target = lecturersList.find((l) => l.id === id);
        if (target) openViewAssignmentsModal(target);
      } else if (btnToggle) {
        const id = btnToggle.dataset.id;
        const target = lecturersList.find((l) => l.id === id);
        if (target) openToggleStatusModal(target);
      }
    });
  }

  // Handle Delegate Clicks for jump buttons inside modals
  document.addEventListener("click", (e) => {
    if (e.target.closest(".btn-jump-to-alloc-screen")) {
      closeViewAssignmentsModal();
      closeViewProfileModal();
      navigateToSection("course-allocation");
    }
    if (e.target.closest("#btn-open-add-lecturer, .btn-open-add-lecturer, [data-action='open-add-lecturer']")) {
      openAddLecturerModal();
    }
  });

  // --- Real-Time Firestore & Local Cache Subscriptions ---

  subscribeLecturers((lecs) => {
    lecturersList = lecs || [];
    refreshAll();
  });

  subscribeCourseAllocations((allocs) => {
    allocationsList = allocs || [];
    refreshAll();
  });
}

// Auto-run on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDashboard);
} else {
  initDashboard();
}

// Expose safe inspection namespace on window
if (typeof window !== "undefined") {
  window.dimabinAdminDashboard = {
    ADMIN_CONFIG,
    navigateToSection,
    createPublicNotificationModel,
    createPortalNotificationModel,
    handleAdminSignOut,
    initCourseManagement,
    initCourseAllocation,
    initLecturerManagement,
    showAdminToast
  };
}

