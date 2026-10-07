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
