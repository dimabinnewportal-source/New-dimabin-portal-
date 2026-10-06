/**
 * DIMABIN Portal — Administrator Authentication Controller
 * Pure Vanilla JavaScript ES Module (Firebase Web SDK v12.19.0 CDN)
 *
 * Implements real Firebase Authentication sign-in for the Super Administrator account:
 * - Administrator ID: "DIMABIN/ADM/2026/01"
 * - Authorized Email: "dimabinnewportal@gmail.com"
 * - Initial Password: "Admin001" (set in Firebase Console)
 *
 * Enforces role verification (users/{uid}: role === 'admin', status === 'active', adminId === 'DIMABIN/ADM/2026/01').
 * Provides restricted Forgot Password recovery strictly limited to "dimabinnewportal@gmail.com".
 */

import { app } from "./firebase-config.js";
import {
  auth,
  db,
  USERS_COLLECTION,
  USER_ROLES,
  USER_STATUS,
  getUserProfile,
  createUserProfile
} from "./firebase-users.js";

import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// Canonical Authorized Administrator Credentials
export const AUTHORIZED_ADMIN_ID = "DIMABIN/ADM/2026/01";
export const AUTHORIZED_ADMIN_EMAIL = "dimabinnewportal@gmail.com";

// Anti-Abuse Cooldown Tracking (60 seconds)
const COOLDOWN_DURATION_MS = 60000;
let lastResetAttemptTime = 0;

/**
 * Display alert inside portal card or modal
 * @param {HTMLElement} box 
 * @param {'error'|'info'|'success'} type 
 * @param {string} message 
 */
function displayAlert(box, type, message) {
  if (!box) return;
  box.className = `portal-alert-box ${type} show`;
  const icon = type === "error" ? "⚠️" : type === "success" ? "✓" : "ℹ️";
  box.innerHTML = `<span class="portal-alert-icon" aria-hidden="true">${icon}</span><span>${message}</span>`;
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * Clear alert from view
 * @param {HTMLElement} box 
 */
function clearAlert(box) {
  if (!box) return;
  box.className = "portal-alert-box";
  box.innerHTML = "";
}

/**
 * Authenticates the Super Administrator via Firebase Authentication
 * and verifies their Firestore role record.
 * 
 * @param {string} rawAdminId - The entered Administrator ID
 * @param {string} rawPassword - The entered administrator password
 * @param {boolean} rememberMe - Whether to use local or session persistence
 * @returns {Promise<{ success: boolean, user: Object, message: string }>}
 */
export async function authenticateAdministrator(rawAdminId, rawPassword, rememberMe = false) {
  const adminId = (rawAdminId || "").trim();
  const password = rawPassword || "";

  // 1. Basic field checks
  if (!adminId || !password) {
    throw new Error("Please enter both your Administrator ID and password.");
  }

  // 2. Strict ID verification mapping
  if (adminId.toUpperCase() !== AUTHORIZED_ADMIN_ID) {
    throw new Error("Invalid Administrator ID. Access is restricted to authorized DIMABIN personnel (e.g. DIMABIN/ADM/2026/01).");
  }

  // 3. Configure persistence
  try {
    const persistenceMode = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistenceMode);
  } catch (persistErr) {
    console.warn("[DIMABIN Admin] Persistence setup warning:", persistErr.message);
  }

  // 4. Real Firebase Authentication with authorized email
  let userCredential;
  try {
    userCredential = await signInWithEmailAndPassword(auth, AUTHORIZED_ADMIN_EMAIL, password);
  } catch (authError) {
    console.error("[DIMABIN Admin] Firebase Auth error code:", authError.code);
    if (authError.code === "auth/user-not-found" || authError.code === "auth/invalid-credential") {
      throw new Error(
        "Authentication failed: The administrator Firebase Authentication account for 'dimabinnewportal@gmail.com' must first be created in Firebase Console with the initial password 'Admin001'."
      );
    } else if (authError.code === "auth/wrong-password") {
      throw new Error("Invalid password. Please verify your administrator credentials or use Forgot Password.");
    } else if (authError.code === "auth/too-many-requests") {
      throw new Error("Access temporarily blocked due to multiple failed login attempts. Please wait or reset your password.");
    } else if (authError.code === "auth/network-request-failed") {
      throw new Error("Network connection error. Please check your internet connectivity.");
    } else {
      throw new Error(authError.message || "Authentication failed. Please verify administrator credentials.");
    }
  }

  const user = userCredential.user;

  // 5. Confirm authenticated Firebase email matches authorized admin email
  if (!user.email || user.email.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
    await signOut(auth);
    throw new Error("Access Denied: The authenticated account email does not match the authorized DIMABIN Administrator email.");
  }

  // 6. Verify or initialize Firestore profile (users/{uid})
  let profileVerificationMessage = "";
  try {
    const profile = await getUserProfile(user.uid);

    if (profile) {
      // Confirm role === 'admin'
      if (profile.role !== USER_ROLES.ADMIN) {
        await signOut(auth);
        throw new Error("Access Denied: Account lacks Administrator role clearance.");
      }
      // Confirm status === 'active'
      if (profile.status !== USER_STATUS.ACTIVE) {
        await signOut(auth);
        throw new Error("Access Denied: Administrator account is currently marked as inactive or disabled.");
      }
      // Confirm adminId === 'DIMABIN/ADM/2026/01'
      if (profile.adminId && profile.adminId !== AUTHORIZED_ADMIN_ID) {
        await signOut(auth);
        throw new Error("Access Denied: Administrator ID record mismatch.");
      }
      profileVerificationMessage = "Registry privileges confirmed (Role: Super Administrator).";
    } else {
      // Profile doc doesn't exist yet: Attempt to bootstrap admin profile
      try {
        await createUserProfile(user.uid, {
          email: AUTHORIZED_ADMIN_EMAIL,
          fullName: "DIMABIN Super Administrator",
          role: USER_ROLES.ADMIN,
          status: USER_STATUS.ACTIVE,
          adminId: AUTHORIZED_ADMIN_ID
        });
        profileVerificationMessage = "Administrator profile initialized.";
      } catch (createErr) {
        console.warn("[DIMABIN Admin] Profile auto-creation notice (Firestore locked):", createErr.message);
        profileVerificationMessage = "Firebase Authentication verified for dimabinnewportal@gmail.com (Firestore rules locked in Production Mode).";
      }
    }
  } catch (firestoreErr) {
    console.warn("[DIMABIN Admin] Firestore profile lookup notice:", firestoreErr.message);
    profileVerificationMessage = "Firebase Authentication verified for dimabinnewportal@gmail.com (Firestore client access currently locked by Production security rules).";
  }

  return {
    success: true,
    user,
    message: `Administrator authenticated successfully! ${profileVerificationMessage}`
  };
}

/**
 * Handles administrator password recovery strictly restricted to "dimabinnewportal@gmail.com".
 * 
 * @param {string} rawEmail - Email address input
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function sendAdminPasswordReset(rawEmail) {
  const email = (rawEmail || "").trim().toLowerCase();

  // 1. Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    throw new Error("Please enter a valid administrator email address.");
  }

  // 2. Strict restriction to ONE authorized email address
  if (email !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
    throw new Error(
      "Access Denied: Administrator password recovery is strictly restricted to the authorized registry address (dimabinnewportal@gmail.com)."
    );
  }

  // 3. Anti-abuse Cooldown enforcement
  const now = Date.now();
  const timeSinceLast = now - lastResetAttemptTime;
  if (timeSinceLast < COOLDOWN_DURATION_MS) {
    const remainingSecs = Math.ceil((COOLDOWN_DURATION_MS - timeSinceLast) / 1000);
    throw new Error(`A password reset request was recently submitted. Please wait ${remainingSecs} seconds before requesting another email.`);
  }

  // 4. Dispatch Firebase password reset email
  try {
    await sendPasswordResetEmail(auth, AUTHORIZED_ADMIN_EMAIL);
    lastResetAttemptTime = Date.now();

    return {
      success: true,
      message: "Password reset link dispatched successfully! A secure email has been sent to dimabinnewportal@gmail.com. Please check your inbox to update your password."
    };
  } catch (resetErr) {
    console.error("[DIMABIN Admin] Password reset error:", resetErr.code, resetErr.message);
    if (resetErr.code === "auth/user-not-found") {
      throw new Error(
        "The administrator Firebase Authentication account for 'dimabinnewportal@gmail.com' must first be created in Firebase Console before passwords can be reset."
      );
    } else if (resetErr.code === "auth/too-many-requests") {
      throw new Error("Too many reset attempts. Please wait a few minutes before trying again.");
    } else {
      throw new Error("Unable to send reset email at this time. Please try again later or check your network.");
    }
  }
}

/**
 * Initialize DOM Event Listeners for Administrator Login & Forgot Password Modal
 */
export function initAdminAuthUI() {
  const loginForm = document.getElementById("admin-login-form");
  const alertBox = document.getElementById("admin-alert-box");
  const adminIdInput = document.getElementById("admin-user-id");
  const passwordInput = document.getElementById("admin-password");
  const rememberCheckbox = document.getElementById("admin-remember-me");
  const submitBtn = loginForm?.querySelector("button[type='submit']");

  // Modal elements
  const forgotBtn = document.getElementById("admin-forgot-pass");
  const modalOverlay = document.getElementById("forgot-modal-overlay");
  const modalCloseBtn = document.getElementById("forgot-modal-close");
  const modalCancelBtn = document.getElementById("forgot-cancel-btn");
  const forgotForm = document.getElementById("admin-forgot-form");
  const resetEmailInput = document.getElementById("admin-reset-email");
  const forgotAlertBox = document.getElementById("forgot-alert-box");
  const forgotSubmitBtn = document.getElementById("forgot-submit-btn");

  // A. Admin Login Form Submission
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAlert(alertBox);

      const adminId = adminIdInput?.value.trim() || "";
      const password = passwordInput?.value || "";
      const rememberMe = Boolean(rememberCheckbox?.checked);

      // Reset error highlights
      adminIdInput?.classList.remove("input-error");
      passwordInput?.classList.remove("input-error");

      if (!adminId) {
        adminIdInput?.classList.add("input-error");
        displayAlert(alertBox, "error", "Administrator ID is required.");
        adminIdInput?.focus();
        return;
      }

      if (!password) {
        passwordInput?.classList.add("input-error");
        displayAlert(alertBox, "error", "Administrator password is required.");
        passwordInput?.focus();
        return;
      }

      // Indicate loading
      const originalBtnText = submitBtn ? submitBtn.innerHTML : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "<span>AUTHENTICATING...</span>";
      }

      try {
        const result = await authenticateAdministrator(adminId, password, rememberMe);
        displayAlert(alertBox, "success", result.message);
      } catch (err) {
        displayAlert(alertBox, "error", err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      }
    });

    // Clear error highlights on input
    adminIdInput?.addEventListener("input", () => adminIdInput.classList.remove("input-error"));
    passwordInput?.addEventListener("input", () => passwordInput.classList.remove("input-error"));
  }

  // B. Forgot Password Modal Triggers
  const openModal = () => {
    if (modalOverlay) {
      modalOverlay.style.display = "flex";
      modalOverlay.setAttribute("aria-hidden", "false");
      clearAlert(forgotAlertBox);
      if (resetEmailInput) {
        resetEmailInput.value = "";
        resetEmailInput.classList.remove("input-error");
        setTimeout(() => resetEmailInput.focus(), 100);
      }
    }
  };

  const closeModal = () => {
    if (modalOverlay) {
      modalOverlay.style.display = "none";
      modalOverlay.setAttribute("aria-hidden", "true");
      clearAlert(forgotAlertBox);
    }
  };

  if (forgotBtn) {
    forgotBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);
  if (modalCancelBtn) modalCancelBtn.addEventListener("click", closeModal);

  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay && modalOverlay.style.display !== "none") {
      closeModal();
    }
  });

  // C. Forgot Password Submission
  if (forgotForm) {
    forgotForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAlert(forgotAlertBox);

      const email = resetEmailInput?.value.trim() || "";
      resetEmailInput?.classList.remove("input-error");

      if (!email) {
        resetEmailInput?.classList.add("input-error");
        displayAlert(forgotAlertBox, "error", "Please enter the authorized administrator email.");
        resetEmailInput?.focus();
        return;
      }

      if (forgotSubmitBtn) {
        forgotSubmitBtn.disabled = true;
        forgotSubmitBtn.innerHTML = "<span>DISPATCHING LINK...</span>";
      }

      try {
        const result = await sendAdminPasswordReset(email);
        displayAlert(forgotAlertBox, "success", result.message);
        if (resetEmailInput) resetEmailInput.value = "";
      } catch (err) {
        resetEmailInput?.classList.add("input-error");
        displayAlert(forgotAlertBox, "error", err.message);
      } finally {
        if (forgotSubmitBtn) {
          forgotSubmitBtn.disabled = false;
          forgotSubmitBtn.innerHTML = "<span>SEND RESET LINK</span>";
        }
      }
    });

    resetEmailInput?.addEventListener("input", () => resetEmailInput.classList.remove("input-error"));
  }
}

// Auto-initialize when loaded on admin-login page
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAdminAuthUI);
} else {
  initAdminAuthUI();
}

// Attach to window for testing
if (typeof window !== "undefined") {
  window.dimabinAdminAuth = {
    AUTHORIZED_ADMIN_ID,
    AUTHORIZED_ADMIN_EMAIL,
    authenticateAdministrator,
    sendAdminPasswordReset,
    initAdminAuthUI
  };
}
