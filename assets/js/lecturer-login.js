/**
 * DIMABIN LECTURER PORTAL — LOGIN CONTROLLER
 * Pure Vanilla JavaScript ES Module (Firebase Web SDK v12.19.0 CDN)
 */

import {
  authenticateLecturer,
  sendLecturerPasswordReset
} from "./firebase-backend.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("lecturer-login-form");
  const userIdInput = document.getElementById("lecturer-user-id");
  const passwordInput = document.getElementById("lecturer-password");
  const submitBtn = document.querySelector(".btn-lecturer-login");
  const alertBox = document.getElementById("lecturer-alert-box");

  // Forgot password elements
  const forgotLink = document.getElementById("lecturer-forgot-pass");
  const forgotModal = document.getElementById("lecturer-forgot-modal-overlay");
  const forgotClose = document.getElementById("lecturer-forgot-close");
  const forgotCancel = document.getElementById("lecturer-forgot-cancel");
  const forgotForm = document.getElementById("lecturer-forgot-form");
  const forgotEmailInput = document.getElementById("lecturer-reset-email");
  const forgotAlertBox = document.getElementById("lecturer-forgot-alert-box");
  const forgotSubmitBtn = document.getElementById("lecturer-forgot-submit");

  // Password Visibility Toggle Handlers
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

  // Form submission
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAlert(alertBox);

      const userId = userIdInput ? userIdInput.value.trim() : "";
      const password = passwordInput ? passwordInput.value : "";

      if (!userId || !password) {
        displayAlert(alertBox, "error", "Please provide both your User ID (or institutional email) and password.");
        if (!userId && userIdInput) userIdInput.focus();
        else if (!password && passwordInput) passwordInput.focus();
        return;
      }

      // Loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <span class="btn-spinner" style="display:inline-block; width:16px; height:16px; border:2px solid #FFF; border-top-color:transparent; border-radius:50%; animation:spin 0.6s linear infinite; margin-right:8px; vertical-align:middle;"></span>
          <span>AUTHENTICATING FACULTY...</span>
        `;
      }

      try {
        const result = await authenticateLecturer(userId, password, false);
        displayAlert(
          alertBox,
          "success",
          `Authenticated successfully! Welcome, ${result.lecturer.fullName}. Redirecting to Lecturer Dashboard...`
        );
        setTimeout(() => {
          window.location.href = "lecturer-dashboard.html";
        }, 1100);
      } catch (err) {
        console.warn("[DIMABIN Lecturer Login] Warning:", err.message);
        displayAlert(alertBox, "error", err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>LOGIN</span>`;
        }
      }
    });
  }

  // Forgot Password Modal Handlers
  const openForgotModal = () => {
    if (forgotModal) {
      forgotModal.style.display = "flex";
      clearAlert(forgotAlertBox);
      if (userIdInput && forgotEmailInput && userIdInput.value) {
        forgotEmailInput.value = userIdInput.value;
      }
      if (forgotEmailInput) forgotEmailInput.focus();
    }
  };

  const closeForgotModal = () => {
    if (forgotModal) {
      forgotModal.style.display = "none";
      clearAlert(forgotAlertBox);
    }
  };

  if (forgotLink) forgotLink.addEventListener("click", openForgotModal);
  if (forgotClose) forgotClose.addEventListener("click", closeForgotModal);
  if (forgotCancel) forgotCancel.addEventListener("click", closeForgotModal);

  if (forgotForm) {
    forgotForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAlert(forgotAlertBox);

      const emailOrId = forgotEmailInput ? forgotEmailInput.value.trim() : "";
      if (!emailOrId) {
        displayAlert(forgotAlertBox, "error", "Please enter your registered institutional email address or Lecturer ID.");
        if (forgotEmailInput) forgotEmailInput.focus();
        return;
      }

      if (forgotSubmitBtn) {
        forgotSubmitBtn.disabled = true;
        forgotSubmitBtn.innerHTML = `
          <span class="btn-spinner" style="display:inline-block; width:14px; height:14px; border:2px solid #FFF; border-top-color:transparent; border-radius:50%; animation:spin 0.6s linear infinite; margin-right:6px; vertical-align:middle;"></span>
          <span>DISPATCHING...</span>
        `;
      }

      try {
        const res = await sendLecturerPasswordReset(emailOrId);
        displayAlert(
          forgotAlertBox,
          "success",
          `Password reset instructions sent to ${res.email}. Please check your inbox.`
        );
        setTimeout(() => {
          closeForgotModal();
        }, 3000);
      } catch (err) {
        displayAlert(forgotAlertBox, "error", err.message);
      } finally {
        if (forgotSubmitBtn) {
          forgotSubmitBtn.disabled = false;
          forgotSubmitBtn.innerHTML = `<span>SEND RESET LINK</span>`;
        }
      }
    });
  }
});
