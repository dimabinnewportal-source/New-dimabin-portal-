/**
 * DIMABIN PUBLIC NOTICE BOARD / ANNOUNCEMENTS MODULE
 * Pure Vanilla JavaScript ES Module (Zero Framework Dependencies)
 * Reads published announcements from the existing Firestore "announcements" collection.
 *
 * Rules:
 * - Visitors do NOT need to log in.
 * - Only active/published announcements (status === "published" or active === true) appear.
 * - Does NOT expose drafts, unpublished, archived or expired announcements.
 * - Audience must be "public" or "all" (never student/lecturer private portal notes).
 * - Real-time listener keeps public website synchronized with Administrator Portal.
 */

import { subscribeAnnouncements, formatDateTime, formatDateOnly } from "./firebase-backend.js";

/**
 * Filter predicate: determines if an announcement should be visible to public visitors
 * Reuses existing fields: status, audience, expiresAt, publishedAt
 */
export function isPubliclyVisibleAnnouncement(item) {
  if (!item) return false;

  // 1. Must be published
  const isPublished =
    item.status === "published" ||
    item.active === true ||
    (item.status !== "draft" && item.status !== "archived" && Boolean(item.publishedAt));

  if (!isPublished) return false;

  // 2. Audience check: must be intended for public or general institute audience
  const audience = (item.audience || "public").toLowerCase().trim();
  const isPublicAudience =
    audience === "public" ||
    audience === "all" ||
    audience === "general" ||
    audience === "prospective";

  if (!isPublicAudience) return false;

  // 3. Expiration check: if expiresAt is set, must not be in the past
  if (item.expiresAt) {
    try {
      let expTime = null;
      if (typeof item.expiresAt?.toDate === "function") {
        expTime = item.expiresAt.toDate().getTime();
      } else if (typeof item.expiresAt?.seconds === "number") {
        expTime = item.expiresAt.seconds * 1000;
      } else {
        const d = new Date(item.expiresAt);
        if (!isNaN(d.getTime())) expTime = d.getTime();
      }
      if (expTime !== null && expTime < Date.now()) {
        return false; // Expired
      }
    } catch (_) {}
  }

  return true;
}

/**
 * Helper to escape HTML and prevent XSS
 */
function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Render individual announcement card HTML
 */
function renderAnnouncementCardHTML(ann, index) {
  const title = escapeHTML(ann.title || "Institutional Notice");
  const rawMessage = ann.message || "";
  const category = escapeHTML(ann.category || "Official Notice");
  
  // Format publication date
  const pubDateStr = ann.publishedAt || ann.createdAt;
  const dateFormatted = formatDateOnly(pubDateStr);

  const isLong = rawMessage.length > 220;
  const shortText = isLong ? rawMessage.slice(0, 200).trim() + "..." : rawMessage;

  return `
    <article class="notice-card" data-ann-id="${escapeHTML(ann.id || '')}">
      <div class="notice-card-header">
        <span class="notice-badge">${category}</span>
        <time class="notice-date" datetime="${escapeHTML(String(pubDateStr || ''))}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>${escapeHTML(dateFormatted)}</span>
        </time>
      </div>

      <h3 class="notice-card-title">${title}</h3>

      <div class="notice-card-body">
        <p class="notice-summary" id="notice-summary-${index}">${escapeHTML(shortText)}</p>
        ${
          isLong
            ? `<div class="notice-full-text" id="notice-full-${index}" style="display: none;">${escapeHTML(rawMessage)}</div>`
            : ""
        }
      </div>

      <div class="notice-card-footer">
        ${
          isLong
            ? `<button type="button" class="notice-read-more-btn" data-target="${index}" aria-expanded="false">
                <span>Read More</span>
                <span class="chevron-icon" aria-hidden="true">↓</span>
               </button>`
            : `<span class="notice-official-seal">CITADEL REGISTRY VERIFIED</span>`
        }
      </div>
    </article>
  `;
}

/**
 * Initialize and bind Read More button toggles
 */
function attachReadMoreHandlers(container) {
  const buttons = container.querySelectorAll(".notice-read-more-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = btn.getAttribute("data-target");
      const summaryEl = container.querySelector(`#notice-summary-${idx}`);
      const fullEl = container.querySelector(`#notice-full-${idx}`);
      const isExpanded = btn.getAttribute("aria-expanded") === "true";

      if (isExpanded) {
        if (summaryEl) summaryEl.style.display = "block";
        if (fullEl) fullEl.style.display = "none";
        btn.setAttribute("aria-expanded", "false");
        btn.querySelector("span:first-child").textContent = "Read More";
        const icon = btn.querySelector(".chevron-icon");
        if (icon) icon.textContent = "↓";
      } else {
        if (summaryEl) summaryEl.style.display = "none";
        if (fullEl) fullEl.style.display = "block";
        btn.setAttribute("aria-expanded", "true");
        btn.querySelector("span:first-child").textContent = "Show Less";
        const icon = btn.querySelector(".chevron-icon");
        if (icon) icon.textContent = "↑";
      }
    });
  });
}

/**
 * Mount and connect Public Notice Board to a DOM container
 * @param {Object} options
 * @param {string} options.containerId - Container element ID
 * @param {number} [options.limit=4] - Number of items to display
 * @param {boolean} [options.showViewAll=true] - Display "View All" toggle button
 */
export function mountPublicNoticeBoard(options = {}) {
  const {
    containerId = "public-notice-board-container",
    limit = 4,
    showViewAll = true
  } = options;

  const container = document.getElementById(containerId);
  if (!container) return () => {};

  // Initial loading state
  container.innerHTML = `
    <div class="notice-board-loading" role="status" aria-live="polite">
      <div class="notice-spinner" aria-hidden="true"></div>
      <p>Loading latest institutional announcements...</p>
    </div>
  `;

  let isShowingAll = false;
  let cachedValidList = [];

  const renderCurrentState = () => {
    if (!cachedValidList || cachedValidList.length === 0) {
      container.innerHTML = `
        <div class="notice-board-empty">
          <div class="notice-empty-icon" aria-hidden="true">📣</div>
          <h4 class="notice-empty-title">DIMABIN Notice Board</h4>
          <p class="notice-empty-text">No announcements at the moment. Please check back later.</p>
          <span class="notice-empty-sub">Academic Registry &amp; Admissions Directorate</span>
        </div>
      `;
      return;
    }

    const itemsToDisplay = isShowingAll ? cachedValidList : cachedValidList.slice(0, limit);
    const hasMore = cachedValidList.length > limit;

    let html = `
      <div class="notice-cards-grid">
        ${itemsToDisplay.map((ann, idx) => renderAnnouncementCardHTML(ann, idx)).join("")}
      </div>
    `;

    if (showViewAll && hasMore) {
      html += `
        <div class="notice-board-action-row">
          <button type="button" class="btn btn-outline-blue btn-sm notice-view-all-btn" id="${containerId}-view-all-btn">
            ${isShowingAll ? "Show Recent Only" : `View All Announcements (${cachedValidList.length})`}
          </button>
        </div>
      `;
    }

    container.innerHTML = html;
    attachReadMoreHandlers(container);

    const toggleBtn = document.getElementById(`${containerId}-view-all-btn`);
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        isShowingAll = !isShowingAll;
        renderCurrentState();
      });
    }
  };

  // Subscribe to real-time updates from Firestore announcements collection
  const unsubscribe = subscribeAnnouncements((rawList) => {
    try {
      const publicOnly = (rawList || []).filter(isPubliclyVisibleAnnouncement);

      // Sort newest published first
      publicOnly.sort((a, b) => {
        const timeA = new Date(a.publishedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.publishedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      cachedValidList = publicOnly;
      renderCurrentState();
    } catch (err) {
      console.warn("[DIMABIN Notice Board] Render note:", err);
      container.innerHTML = `
        <div class="notice-board-empty">
          <div class="notice-empty-icon" aria-hidden="true">📣</div>
          <h4 class="notice-empty-title">Notice Board Offline</h4>
          <p class="notice-empty-text">Institutional announcements are currently undergoing maintenance. Please check back shortly.</p>
        </div>
      `;
    }
  });

  return unsubscribe;
}

/**
 * Mount and connect the Prominent Public Announcement Banner (Top of Homepage)
 * Displays the latest active announcement with maximum visibility in high contrast.
 * @param {Object} options
 * @param {string} [options.sectionId="prominent-announcement-section"]
 * @param {string} [options.containerId="prominent-announcement-container"]
 */
export function mountProminentAnnouncementBanner(options = {}) {
  const {
    sectionId = "prominent-announcement-section",
    containerId = "prominent-announcement-container"
  } = options;

  const section = document.getElementById(sectionId);
  const container = document.getElementById(containerId);
  if (!section || !container) return () => {};

  const renderBanner = (announcements) => {
    const publicOnly = (announcements || []).filter(isPubliclyVisibleAnnouncement);

    // Sort newest published first
    publicOnly.sort((a, b) => {
      const timeA = new Date(a.publishedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.publishedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    if (publicOnly.length === 0) {
      section.style.display = "none";
      document.body.classList.remove("has-prominent-announcement");
      container.innerHTML = "";
      return;
    }

    const latest = publicOnly[0];
    const dismissKey = `dimabin_dismissed_ann_${latest.id || "latest"}`;

    // Check if dismissed for current visit session
    if (sessionStorage.getItem(dismissKey) === "true") {
      section.style.display = "none";
      document.body.classList.remove("has-prominent-announcement");
      container.innerHTML = "";
      return;
    }

    const title = escapeHTML(latest.title || "Institutional Announcement");
    const rawMessage = latest.message || "";
    const category = escapeHTML(latest.category || "Official Notice");
    const pubDateStr = latest.publishedAt || latest.createdAt;
    const dateFormatted = formatDateOnly(pubDateStr);
    const totalCount = publicOnly.length;

    const isLong = rawMessage.length > 260;
    const shortText = isLong ? rawMessage.slice(0, 240).trim() + "..." : rawMessage;

    container.innerHTML = `
      <div class="prominent-ann-card" role="region" aria-labelledby="prominent-ann-heading" data-ann-id="${escapeHTML(latest.id || '')}">
        <!-- Top Meta Bar: Kicker + Category + Date + Session Dismissal -->
        <div class="prominent-ann-topbar">
          <div class="prominent-ann-meta-left">
            <div class="prominent-ann-kicker-badge">
              <span class="prominent-ann-pulse-dot" aria-hidden="true"></span>
              <svg class="prominent-ann-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
              <span class="kicker-title">IMPORTANT ANNOUNCEMENT</span>
            </div>
            <span class="prominent-ann-category">${category}</span>
            <span class="prominent-ann-sep" aria-hidden="true">·</span>
            <time class="prominent-ann-date" datetime="${escapeHTML(String(pubDateStr || ''))}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>${escapeHTML(dateFormatted)}</span>
            </time>
            ${totalCount > 1 ? `<span class="prominent-ann-count-pill">Latest of ${totalCount} Notices</span>` : ''}
          </div>

          <!-- Session Dismiss Button (Preserves Database) -->
          <button type="button" class="prominent-ann-dismiss-btn" id="prominent-ann-dismiss-btn" aria-label="Dismiss this announcement for this visit" title="Dismiss announcement">
            <span class="dismiss-text">Dismiss</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Heading & Message Content -->
        <div class="prominent-ann-content">
          <h2 class="prominent-ann-title" id="prominent-ann-heading">${title}</h2>
          <div class="prominent-ann-prose">
            <p class="prominent-ann-summary" id="prominent-ann-summary">${escapeHTML(shortText)}</p>
            ${isLong ? `<div class="prominent-ann-full" id="prominent-ann-full" style="display: none;">${escapeHTML(rawMessage)}</div>` : ''}
          </div>
        </div>

        <!-- Action Footer Row -->
        <div class="prominent-ann-footer">
          <div class="prominent-ann-btn-group">
            ${isLong ? `
              <button type="button" class="btn btn-gold btn-sm prominent-ann-toggle-btn" id="prominent-ann-toggle-btn" aria-expanded="false">
                <span>Read Full Announcement</span>
                <span class="ann-btn-arrow" aria-hidden="true">↓</span>
              </button>
            ` : ''}

            <a href="#notice-board" class="btn btn-outline-gold btn-sm prominent-ann-noticeboard-btn" id="prominent-ann-noticeboard-btn">
              <span>${totalCount > 1 ? `View All Announcements (${totalCount})` : 'Visit Notice Board'}</span>
              <span class="ann-btn-arrow" aria-hidden="true">↓</span>
            </a>
          </div>

          <div class="prominent-ann-seal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f0c43f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span>Official Institute Broadcast · Registry Directive</span>
          </div>
        </div>
      </div>
    `;

    section.style.display = "block";
    document.body.classList.add("has-prominent-announcement");

    // Bind Dismiss action
    const dismissBtn = document.getElementById("prominent-ann-dismiss-btn");
    if (dismissBtn) {
      dismissBtn.addEventListener("click", () => {
        sessionStorage.setItem(dismissKey, "true");
        section.classList.add("is-dismissing");
        setTimeout(() => {
          section.style.display = "none";
          section.classList.remove("is-dismissing");
          document.body.classList.remove("has-prominent-announcement");
        }, 280);
      });
    }

    // Bind Read Full / Show Less toggle
    if (isLong) {
      const toggleBtn = document.getElementById("prominent-ann-toggle-btn");
      const summaryEl = document.getElementById("prominent-ann-summary");
      const fullEl = document.getElementById("prominent-ann-full");
      if (toggleBtn && summaryEl && fullEl) {
        toggleBtn.addEventListener("click", () => {
          const isExpanded = toggleBtn.getAttribute("aria-expanded") === "true";
          if (isExpanded) {
            summaryEl.style.display = "block";
            fullEl.style.display = "none";
            toggleBtn.setAttribute("aria-expanded", "false");
            toggleBtn.querySelector("span:first-child").textContent = "Read Full Announcement";
            const arrow = toggleBtn.querySelector(".ann-btn-arrow");
            if (arrow) arrow.textContent = "↓";
          } else {
            summaryEl.style.display = "none";
            fullEl.style.display = "block";
            toggleBtn.setAttribute("aria-expanded", "true");
            toggleBtn.querySelector("span:first-child").textContent = "Show Less";
            const arrow = toggleBtn.querySelector(".ann-btn-arrow");
            if (arrow) arrow.textContent = "↑";
          }
        });
      }
    }

    // Bind smooth scroll to Notice Board
    const nbBtn = document.getElementById("prominent-ann-noticeboard-btn");
    if (nbBtn) {
      nbBtn.addEventListener("click", (e) => {
        const target = document.getElementById("notice-board");
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
  };

  const unsubscribe = subscribeAnnouncements((rawList) => {
    try {
      renderBanner(rawList);
    } catch (err) {
      console.warn("[DIMABIN Prominent Announcement] render note:", err);
    }
  });

  return unsubscribe;
}

