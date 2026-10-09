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
  normalizeCourseCode
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
    showAdminToast
  };
}

