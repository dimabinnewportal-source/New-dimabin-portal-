/**
 * DIMABIN STUDENT PORTAL — PASSWORD SETUP CONTROLLER
 * Pure Vanilla JavaScript ES Module (Firebase Web SDK v12.19.0 CDN)
 *
 * Implements:
 * 1. Secure onboarding for approved admission candidates
 * 2. Strict email validation: ONE EMAIL ADDRESS = ONE STUDENT ACCOUNT
 * 3. Readonly lock for pre-filled verified admission email
 * 4. Password validation (min. 6 characters, exact match)
 * 5. Firebase Auth user credential creation
 * 6. Firestore technical identity creation: students/{uid} & users/{uid}
 * 7. Real-time active student session hydration
 */

import {
  findApprovedAdmissionByEmail,
  completeStudentPortalSetup,
  checkAdmissionStatus
} from "./firebase-backend.js";
import {
  displayPortalAlert,
  clearPortalAlert
} from "./firebase-student-auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("student-password-setup-form");
  const formContainer = document.getElementById("setup-form-container");
  const emailInput = document.getElementById("setup-email");
  const emailLockTag = document.getElementById("email-lock-tag");
  const emailHelpText = document.getElementById("email-help-text");
  const passwordInput = document.getElementById("setup-password");
  const confirmPasswordInput = document.getElementById("setup-confirm-password");
  const submitBtn = document.getElementById("setup-submit-btn");
  const alertBox = document.getElementById("setup-alert-box");

  // Context banner & success view elements
  const verifiedBanner = document.getElementById("verified-candidate-banner");
  const bannerAppBadge = document.getElementById("banner-app-badge");
  const bannerCandidateName = document.getElementById("banner-candidate-name");
  const bannerCandidateProg = document.getElementById("banner-candidate-program");
  const successView = document.getElementById("setup-success-view");

  const succName = document.getElementById("succ-student-name");
  const succId = document.getElementById("succ-student-id");
  const succEmail = document.getElementById("succ-student-email");
  const succProg = document.getElementById("succ-student-prog");

  let verifiedAdmissionRecord = null;
  let isEmailLocked = false;

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

  // 2. Parse Query Parameters (?email=...&appId=...)
  const urlParams = new URLSearchParams(window.location.search);
  const paramEmail = (urlParams.get("email") || "").trim().toLowerCase();
  const paramAppId = (urlParams.get("appId") || "").trim().toUpperCase();

  if (paramEmail) {
    emailInput.value = paramEmail;
    // Lock email to applicant's identity
    isEmailLocked = true;
    emailInput.readOnly = true;
    emailInput.style.backgroundColor = "#F1F5F9";
    emailInput.style.cursor = "not-allowed";
    emailInput.style.color = "var(--dark-navy)";
    emailInput.style.fontWeight = "600";
    if (emailLockTag) emailLockTag.style.display = "inline-block";
    if (emailHelpText) {
      emailHelpText.textContent = "🔒 This email address is locked to your official approved admission record.";
      emailHelpText.style.color = "#15803D";
      emailHelpText.style.fontWeight = "600";
    }

    // Verify against registry
    try {
      const res = await findApprovedAdmissionByEmail(paramEmail);
      if (res.success && res.approved) {
        verifiedAdmissionRecord = res.record;

        // Display verified candidate banner
        if (verifiedBanner) {
          verifiedBanner.style.display = "block";
          if (bannerAppBadge) bannerAppBadge.textContent = verifiedAdmissionRecord.applicationId || paramAppId || "APPROVED";
          if (bannerCandidateName) bannerCandidateName.textContent = verifiedAdmissionRecord.fullName || "Candidate";
          if (bannerCandidateProg) {
            bannerCandidateProg.textContent = `${verifiedAdmissionRecord.programme || "Diploma in Theology"} (${verifiedAdmissionRecord.academicSession || "2026/2027"})`;
          }
        }
      } else {
        displayPortalAlert(
          alertBox,
          "error",
          res.error || "No approved admission record found for this email address."
        );
        if (submitBtn) submitBtn.disabled = true;
      }
    } catch (err) {
      console.warn("[DIMABIN Password Setup] Verification lookup warning:", err.message);
    }
  }

  // 3. Form Submission
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearPortalAlert(alertBox);

      const rawEmail = emailInput ? emailInput.value : "";
      const normalizedEmail = (rawEmail || "").trim().toLowerCase();
      const newPassword = passwordInput ? passwordInput.value : "";
      const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : "";

      // Validation 1: Email Provided
      if (!normalizedEmail) {
        displayPortalAlert(alertBox, "error", "Please enter the email address used during your admission application.");
        if (emailInput) emailInput.focus();
        return;
      }

      // Validation 2: Email format
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(normalizedEmail)) {
        displayPortalAlert(alertBox, "error", "Please provide a valid email address (e.g. name@domain.org).");
        if (emailInput) emailInput.focus();
        return;
      }

      // Validation 3: Password Length
      if (!newPassword || newPassword.length < 6) {
        displayPortalAlert(alertBox, "error", "Password must be at least 6 characters long.");
        if (passwordInput) passwordInput.focus();
        return;
      }

      // Validation 4: Password Match
      if (newPassword !== confirmPassword) {
        displayPortalAlert(alertBox, "error", "The two passwords entered do not match. Please re-enter your password.");
        if (confirmPasswordInput) confirmPasswordInput.focus();
        return;
      }

      // Button loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <span class="btn-spinner" style="display:inline-block; width:16px; height:16px; border:2px solid #FFF; border-top-color:transparent; border-radius:50%; animation:spin 0.6s linear infinite; margin-right:8px; vertical-align:middle;"></span>
          <span>CONFIGURING PORTAL ACCOUNT...</span>
        `;
      }

      try {
        // Step A: If record is not verified yet, look it up in Firestore
        let record = verifiedAdmissionRecord;
        if (!record || record.email?.toLowerCase().trim() !== normalizedEmail) {
          const lookup = await findApprovedAdmissionByEmail(normalizedEmail);
          if (!lookup.success || !lookup.approved) {
            throw new Error(
              lookup.error ||
              "No approved admission record found for this email address. Please ensure you are using the exact email address submitted during your admission application."
            );
          }
          record = lookup.record;
          verifiedAdmissionRecord = record;
        }

        // Step B: Complete Student Portal Setup via Firebase Auth & Firestore
        const result = await completeStudentPortalSetup(normalizedEmail, newPassword, record);

        // Step C: Display Success View
        if (formContainer) formContainer.style.display = "none";
        if (verifiedBanner) verifiedBanner.style.display = "none";
        clearPortalAlert(alertBox);

        if (successView) {
          successView.style.display = "block";
          if (succName) succName.textContent = result.student.fullName;
          if (succId) succId.textContent = result.student.studentId || result.student.admissionNumber;
          if (succEmail) succEmail.textContent = result.student.email;
          if (succProg) succProg.textContent = `${result.student.programme} (${result.student.academicSession})`;
          successView.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      } catch (err) {
        console.warn("[DIMABIN Password Setup] Setup warning:", err.message);
        displayPortalAlert(alertBox, "error", err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>SET PASSWORD</span>`;
        }
      }
    });
  }
});
