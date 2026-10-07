/**
 * DIMABIN STUDENT PORTAL — LOGIN CLIENT SCRIPT
 * Pure Vanilla JavaScript ES Module (Firebase Web SDK v12.19.0 CDN)
 */

import {
  authenticateStudent,
  sendStudentPasswordReset,
  displayPortalAlert,
  clearPortalAlert
} from "./firebase-student-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("student-login-form");
  const emailInput = document.getElementById("student-email");
  const passwordInput = document.getElementById("student-password");
  const rememberCheckbox = document.getElementById("student-remember-me");
  const submitBtn = document.getElementById("student-login-submit");
  const alertBox = document.getElementById("student-alert-box");

  // Forgot password modal elements
  const forgotLink = document.getElementById("student-forgot-pass");
  const forgotModal = document.getElementById("student-forgot-modal-overlay");
  const forgotClose = document.getElementById("student-forgot-close");
  const forgotCancel = document.getElementById("student-forgot-cancel");
  const forgotForm = document.getElementById("student-forgot-form");
  const forgotEmailInput = document.getElementById("student-reset-email");
  const forgotAlertBox = document.getElementById("student-forgot-alert-box");
  const forgotSubmitBtn = document.getElementById("student-forgot-submit");

  // Form submission
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearPortalAlert(alertBox);

      const email = emailInput ? emailInput.value.trim() : "";
      const password = passwordInput ? passwordInput.value : "";
      const remember = rememberCheckbox ? rememberCheckbox.checked : false;

      if (!email || !password) {
        displayPortalAlert(alertBox, "error", "Please provide both your registered email address and password.");
        if (!email && emailInput) emailInput.focus();
        else if (!password && passwordInput) passwordInput.focus();
        return;
      }

      // Loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <span class="btn-spinner" style="display:inline-block; width:16px; height:16px; border:2px solid #FFF; border-top-color:transparent; border-radius:50%; animation:spin 0.6s linear infinite; margin-right:8px; vertical-align:middle;"></span>
          <span>AUTHENTICATING...</span>
        `;
      }

      try {
        const result = await authenticateStudent(email, password, remember);
        displayPortalAlert(
          alertBox,
          "success",
          `Authenticated successfully! Welcome, ${result.session.fullName}. Loading your portal...`
        );
        setTimeout(() => {
          window.location.href = "student-dashboard.html";
        }, 1200);
      } catch (err) {
        console.warn("[DIMABIN Student Login] Sign-in warning:", err.message);
        displayPortalAlert(alertBox, "error", err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>SIGN IN TO STUDENT PORTAL</span>`;
        }
      }
    });
  }

  // Forgot Password Modal Triggers
  const openForgotModal = () => {
    if (forgotModal) {
      forgotModal.style.display = "flex";
      clearPortalAlert(forgotAlertBox);
      if (emailInput && forgotEmailInput && emailInput.value) {
        forgotEmailInput.value = emailInput.value;
      }
      if (forgotEmailInput) forgotEmailInput.focus();
    }
  };

  const closeForgotModal = () => {
    if (forgotModal) {
      forgotModal.style.display = "none";
      clearPortalAlert(forgotAlertBox);
    }
  };

  if (forgotLink) forgotLink.addEventListener("click", openForgotModal);
  if (forgotClose) forgotClose.addEventListener("click", closeForgotModal);
  if (forgotCancel) forgotCancel.addEventListener("click", closeForgotModal);

  if (forgotForm) {
    forgotForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearPortalAlert(forgotAlertBox);

      const resetEmail = forgotEmailInput ? forgotEmailInput.value.trim() : "";
      if (!resetEmail) {
        displayPortalAlert(forgotAlertBox, "error", "Please enter your student email address.");
        return;
      }

      if (forgotSubmitBtn) {
        forgotSubmitBtn.disabled = true;
        forgotSubmitBtn.innerHTML = `<span>SENDING...</span>`;
      }

      try {
        const res = await sendStudentPasswordReset(resetEmail);
        displayPortalAlert(forgotAlertBox, "success", res.message);
        forgotForm.reset();
        setTimeout(closeForgotModal, 4500);
      } catch (err) {
        displayPortalAlert(forgotAlertBox, "error", err.message);
      } finally {
        if (forgotSubmitBtn) {
          forgotSubmitBtn.disabled = false;
          forgotSubmitBtn.innerHTML = `<span>SEND RESET LINK</span>`;
        }
      }
    });
  }
});
