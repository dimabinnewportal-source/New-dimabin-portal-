/**
 * DIMABIN Portal — Firebase Connection & Foundation Test
 * Reusable ES Module to verify that Firebase initializes successfully
 * with the correct project ID without performing any authentication
 * or database write operations.
 */

import { app, firebaseConfig } from "./firebase-config.js";

/**
 * Tests that Firebase App initialized with correct project ID
 * @returns {{ success: boolean, projectId: string, appName: string, message: string }}
 */
export function testFirebaseConnection() {
  try {
    const isInitialized = Boolean(app && app.name);
    const configuredProjectId = app?.options?.projectId || firebaseConfig.projectId;
    const expectedProjectId = "dimabinnewportal-cd827";

    if (!isInitialized) {
      console.error("[DIMABIN Firebase] Error: Firebase App instance is not initialized.");
      return {
        success: false,
        projectId: configuredProjectId,
        appName: null,
        message: "Firebase App failed to initialize."
      };
    }

    if (configuredProjectId !== expectedProjectId) {
      console.warn(`[DIMABIN Firebase] Project ID mismatch. Expected '${expectedProjectId}', got '${configuredProjectId}'.`);
      return {
        success: false,
        projectId: configuredProjectId,
        appName: app.name,
        message: `Project ID mismatch: ${configuredProjectId}`
      };
    }

    // Success confirmation
    const result = {
      success: true,
      projectId: configuredProjectId,
      appName: app.name,
      message: "Firebase foundation connected successfully."
    };

    console.log(`[DIMABIN Firebase] ${result.message} (Project: ${result.projectId}, App: ${result.appName})`);
    return result;
  } catch (err) {
    console.error("[DIMABIN Firebase] Exception during connection verification:", err);
    return {
      success: false,
      projectId: null,
      appName: null,
      message: err.message
    };
  }
}

// Automatically verify connection when module loads
const connectionStatus = testFirebaseConnection();

// Expose safe inspection object on window for manual verification
if (typeof window !== "undefined") {
  window.dimabinFirebase = {
    app,
    config: firebaseConfig,
    test: testFirebaseConnection,
    status: connectionStatus
  };
}
