/**
 * DIMABIN LECTURER PORTAL — PASSWORD SETUP CONTROLLER
 * Pure Vanilla JavaScript ES Module (Firebase Web SDK v12.19.0 CDN)
 *
 * Implements:
 * 1. Verification of lecturer registration in institutional database
 * 2. Case-insensitive email and Lecturer ID resolution
 * 3. User chooses their own password (min 6 characters)
 * 4. Firebase Auth creation / sync
 * 5. Update lecturer record and user identity
 */

import {
  findLecturerByEmailOrStaffId,
  completeLecturerPortalSetup
} from "./firebase-backend.js";

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("lecturer-password-setup-form");
  const formContainer = document.getElementById("lec-setup-form-container");
  const identifierInput = document.getElementById("setup-lec-identifier");
  const emailLockTag = document.getElementById("email-lock-tag");
  const identifierHelpText = document.getElementById("lec-identifier-help-text");
  const passwordInput = document.getElementById("setup-lec-password");
  const confirmPasswordInput = document.getElementById("setup-lec-confirm-password");
  const submitBtn = document.getElementById("setup-lec-submit-btn");
  const alertBox = document.getElementById("lec-setup-alert-box");

  // Context banner & success view elements
  const verifiedBanner = document.getElementById("verified-faculty-banner");
  const bannerLecBadge = document.getElementById("banner-lec-badge");
  const bannerFacultyName = document.getElementById("banner-faculty-name");
  const bannerFacultyDept = document.getElementById("banner-faculty-dept");
  const successView = document.getElementById("lec-setup-success-view");

  const succName = document.getElementById("succ-lec-name");
  const succId = document.getElementById("succ-lec-id");
  const succEmail = document.getElementById("succ-lec-email");
  const succDept = document.getElementById("succ-lec-dept");

  let verifiedLecturerRecord = null;

  // 1. Password Visibility Toggle Handlers
  document.querySelectorAll(".password-toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const container = btn.closest(".portal-input-container");
      const input = container ? container.querySelector("input") : null;
      if (!input) return;

      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      btn.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");

      btn.innerHTML = isPassword
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
    });
  });

  const displayAlert = (box, type, message) => {
    if (!box) return;
    box.className = `portal-alert-box ${type} show`;
    const icon = type === "error" ? "⚠️" : type === "success" ? "✓" : "ℹ️";
    box.innerHTML = `<span class="portal-alert-icon" aria-hidden="true">${icon}</span><span>${message}</span>`;
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const clearAlert = (box) => {
    if (!box) return;
    box.className = "portal-alert-box";
    box.innerHTML = "";
  };

  // 2. Parse Query Parameters (?email=... or ?staffId=...)
  const urlParams = new URLSearchParams(window.location.search);
  const paramEmail = (urlParams.get("email") || "").trim().toLowerCase();
  const paramStaffId = (urlParams.get("staffId") || urlParams.get("id") || "").trim().toUpperCase();
  const initialIdentifier = paramEmail || paramStaffId;

  if (initialIdentifier) {
    if (identifierInput) {
      identifierInput.value = initialIdentifier;
      identifierInput.readOnly = true;
      identifierInput.style.backgroundColor = "#F1F5F9";
      identifierInput.style.cursor = "not-allowed";
      identifierInput.style.color = "var(--dark-navy)";
      identifierInput.style.fontWeight = "600";
    }
    if (emailLockTag) emailLockTag.style.display = "inline-block";
    if (identifierHelpText) {
      identifierHelpText.textContent = "🔒 Verified institutional faculty identity.";
      identifierHelpText.style.color = "#15803D";
      identifierHelpText.style.fontWeight = "600";
    }

    try {
      const res = await findLecturerByEmailOrStaffId(initialIdentifier);
      if (res.success && res.authorized) {
        verifiedLecturerRecord = res.lecturer;
        if (verifiedBanner) {
          verifiedBanner.style.display = "block";
          if (bannerLecBadge) bannerLecBadge.textContent = verifiedLecturerRecord.staffId || "FACULTY";
          if (bannerFacultyName) bannerFacultyName.textContent = verifiedLecturerRecord.fullName || "Faculty Member";
          if (bannerFacultyDept) {
            bannerFacultyDept.textContent = `${verifiedLecturerRecord.department || "Biblical Studies"} (${verifiedLecturerRecord.qualification || "Faculty"})`;
          }
        }
      } else {
        displayAlert(
          alertBox,
          "error",
          res.error || "No authorized faculty member found with this identifier."
        );
        if (submitBtn) submitBtn.disabled = true;
      }
    } catch (err) {
      console.warn("[DIMABIN Lecturer Setup] Verification warning:", err.message);
    }
  }

  // 3. Form Submission
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAlert(alertBox);

      const rawIdentifier = identifierInput ? identifierInput.value.trim() : "";
      const newPassword = passwordInput ? passwordInput.value : "";
      const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : "";

      if (!rawIdentifier) {
        displayAlert(alertBox, "error", "Please enter your registered institutional email address or Lecturer ID.");
        if (identifierInput) identifierInput.focus();
        return;
      }

      if (!newPassword || newPassword.length < 6) {
        displayAlert(alertBox, "error", "Password must be at least 6 characters long.");
        if (passwordInput) passwordInput.focus();
        return;
      }

      if (newPassword !== confirmPassword) {
        displayAlert(alertBox, "error", "The two passwords entered do not match. Please re-enter your password.");
        if (confirmPasswordInput) confirmPasswordInput.focus();
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <span class="btn-spinner" style="display:inline-block; width:16px; height:16px; border:2px solid #FFF; border-top-color:transparent; border-radius:50%; animation:spin 0.6s linear infinite; margin-right:8px; vertical-align:middle;"></span>
          <span>ACTIVATING ACCOUNT...</span>
        `;
      }

      try {
        let record = verifiedLecturerRecord;
        if (!record || (record.email?.toLowerCase().trim() !== rawIdentifier.toLowerCase() && record.staffId?.toLowerCase().trim() !== rawIdentifier.toLowerCase())) {
          const lookup = await findLecturerByEmailOrStaffId(rawIdentifier);
          if (!lookup.success || !lookup.authorized) {
            throw new Error(
              lookup.error || "No authorized faculty member was found matching this institutional ID or email."
            );
          }
          record = lookup.lecturer;
          verifiedLecturerRecord = record;
        }

        const emailToUse = (record.email || "").trim().toLowerCase();
        if (!emailToUse) {
          throw new Error("No institutional email is linked to this faculty record. Please contact the administrator.");
        }

        const result = await completeLecturerPortalSetup(emailToUse, newPassword, record);

        if (formContainer) formContainer.style.display = "none";
        if (verifiedBanner) verifiedBanner.style.display = "none";
        clearAlert(alertBox);

        if (successView) {
          successView.style.display = "block";
          if (succName) succName.textContent = result.lecturer.fullName;
          if (succId) succId.textContent = result.lecturer.staffId;
          if (succEmail) succEmail.textContent = result.lecturer.email;
          if (succDept) succDept.textContent = `${result.lecturer.department || "Theology"} (${result.lecturer.studyCentre || "Abeokuta"})`;
          successView.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      } catch (err) {
        console.warn("[DIMABIN Lecturer Setup] Setup warning:", err.message);
        displayAlert(alertBox, "error", err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>ACTIVATE ACCOUNT &amp; SET PASSWORD</span>`;
        }
      }
    });
  }
});
