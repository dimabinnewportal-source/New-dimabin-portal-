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
  formatDateOnly
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
    handleAdminSignOut
  };
}
