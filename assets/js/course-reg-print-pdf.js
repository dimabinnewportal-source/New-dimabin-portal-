/**
 * DIVINE MANDATE BIBLE INSTITUTE (DIMABIN)
 * Official Student Course Registration Slip Printing & A4 PDF Generator Engine
 * 
 * Generates an official, print-ready, high-fidelity A4 portrait document (210 × 297 mm)
 * that occupies exactly ONE A4 sheet with zero website/portal interface chrome,
 * crisp typography, accurate credit unit calculations, balanced student details,
 * and official registry endorsement sign-offs.
 */

// Official Logo Path
const LOGO_SRC = "assets/images/dimabin-logo.png";

let cachedLogoDataUri = null;

/**
 * Returns absolute or relative logo URL depending on runtime environment
 */
export function getLogoUrl() {
  if (typeof window !== "undefined" && window.location && window.location.origin) {
    if (window.location.origin.startsWith("http")) {
      return `${window.location.origin}/assets/images/dimabin-logo.png`;
    }
  }
  return LOGO_SRC;
}

/**
 * Pre-fetches logo as a base64 Data URI for instantaneous, CORS-safe html2canvas rendering
 */
export async function getLogoDataUri() {
  if (cachedLogoDataUri) return cachedLogoDataUri;
  if (typeof window === "undefined" || !window.fetch) return getLogoUrl();
  try {
    const res = await fetch(getLogoUrl());
    if (res.ok) {
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          cachedLogoDataUri = reader.result;
          resolve(cachedLogoDataUri);
        };
        reader.onerror = () => resolve(getLogoUrl());
        reader.readAsDataURL(blob);
      });
    }
  } catch (_) {}
  return getLogoUrl();
}

/**
 * Escape HTML to prevent injection and rendering artifacts
 */
function escapeHtml(str) {
  if (str === undefined || str === null || str === "") return "—";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Format date cleanly into UK/Academic standard: "17 Oct 2026, 09:30 AM"
 */
function formatDateTime(dStr) {
  if (!dStr) return "—";
  try {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return String(dStr);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (_) {
    return String(dStr);
  }
}

function formatDateOnly(dStr) {
  if (!dStr) return "—";
  try {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return String(dStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch (_) {
    return String(dStr);
  }
}

/**
 * Sanitize filename identifier
 */
export function sanitizeFileNamePart(str) {
  if (!str) return "DIMABIN";
  return String(str).replace(/[^a-zA-Z0-9_-]/g, "_");
}

/**
 * Build the complete official A4 Course Registration Slip HTML
 */
export function buildRegistrationSlipHtml(reg, studentProfile = {}, customLogoUrl = null) {
  const regData = reg || {};
  const profile = studentProfile || {};

  // Extract student attributes
  const studentName = regData.studentName || profile.fullName || "DIMABIN Student";
  const studentId = regData.studentId || regData.admissionNumber || profile.studentId || profile.admissionNumber || "STU-PENDING";
  const studyCentre = regData.studyCentre || profile.studyCentre || "Abeokuta Main Campus";
  const programme = regData.programme || profile.programme || "Diploma in Theology (Dipl.Th.)";
  const session = regData.academicSession || profile.academicSession || "2026/2027";
  const semester = regData.semester || "First Semester";

  // Status computation
  const rawStatus = (regData.status || "submitted").toLowerCase();
  let statusBadgeClass = "badge-submitted";
  let statusLabel = "SUBMITTED TO REGISTRY";
  let statusColor = "#1D4ED8";
  let statusBg = "#EFF6FF";
  let statusBorder = "#BFDBFE";

  if (rawStatus === "approved") {
    statusLabel = "OFFICIALLY APPROVED BY REGISTRY";
    statusColor = "#15803D";
    statusBg = "#F0FDF4";
    statusBorder = "#86EFAC";
  } else if (rawStatus === "returned") {
    statusLabel = "RETURNED FOR CORRECTION";
    statusColor = "#B45309";
    statusBg = "#FFFBEB";
    statusBorder = "#FDE68A";
  } else if (rawStatus === "rejected") {
    statusLabel = "REGISTRATION REJECTED";
    statusColor = "#B91C1C";
    statusBg = "#FEF2F2";
    statusBorder = "#FCA5A5";
  } else if (rawStatus === "resubmitted") {
    statusLabel = "RESUBMITTED TO REGISTRY";
    statusColor = "#1D4ED8";
    statusBg = "#EFF6FF";
    statusBorder = "#BFDBFE";
  }

  // Courses list & total units computation (filtering out any withdrawn or removed course offerings)
  const rawCourses = Array.isArray(regData.courses) ? regData.courses : [];
  const courses = rawCourses.filter((c) => !c.isRemovedFromOffering && c.status !== "removed");
  let calculatedTotalUnits = 0;
  courses.forEach((c) => {
    calculatedTotalUnits += parseInt(c.creditUnits !== undefined ? c.creditUnits : (c.creditUnit || 3), 10) || 0;
  });

  const totalCredits = calculatedTotalUnits;
  const submissionDate = regData.submittedAt || regData.updatedAt || new Date().toISOString();
  const printTimestamp = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const logoUrl = customLogoUrl || getLogoUrl();

  return `
    <div class="dimabin-reg-a4-sheet" id="dimabin-reg-a4-sheet">
      <!-- 1. OFFICIAL INSTITUTIONAL HEADER -->
      <div class="reg-doc-header">
        <div class="reg-header-brand">
          <img src="${logoUrl}" alt="DIMABIN Seal" class="reg-header-logo" crossorigin="anonymous">
          <div class="reg-header-titles">
            <h1 class="reg-inst-title">DIVINE MANDATE BIBLE INSTITUTE (DIMABIN)</h1>
            <div class="reg-inst-motto">MOTTO: FEAR OF GOD WITHOUT A MEASURE</div>
          </div>
        </div>
        <div class="reg-doc-title-bar">
          <span>OFFICIAL STUDENT COURSE REGISTRATION SLIP</span>
        </div>
        <div class="reg-header-divider"></div>
      </div>

      <!-- 2. STUDENT INFORMATION SECTION -->
      <div class="reg-student-info-panel">
        <div class="reg-info-grid">
          <div class="reg-info-col">
            <div class="reg-info-item">
              <span class="reg-info-label">STUDENT FULL NAME:</span>
              <span class="reg-info-val reg-val-highlight">${escapeHtml(studentName)}</span>
            </div>
            <div class="reg-info-item">
              <span class="reg-info-label">MATRICULATION / STUDENT ID:</span>
              <span class="reg-info-val reg-val-mono">${escapeHtml(studentId)}</span>
            </div>
            <div class="reg-info-item">
              <span class="reg-info-label">OFFICIAL STUDY CENTRE:</span>
              <span class="reg-info-val">${escapeHtml(studyCentre)}</span>
            </div>
            <div class="reg-info-item">
              <span class="reg-info-label">ACADEMIC PROGRAMME:</span>
              <span class="reg-info-val">${escapeHtml(programme)}</span>
            </div>
          </div>

          <div class="reg-info-col">
            <div class="reg-info-item">
              <span class="reg-info-label">ACADEMIC SESSION:</span>
              <span class="reg-info-val reg-val-session">${escapeHtml(session)}</span>
            </div>
            <div class="reg-info-item">
              <span class="reg-info-label">ACADEMIC SEMESTER:</span>
              <span class="reg-info-val reg-val-sem">${escapeHtml(semester)}</span>
            </div>
            <div class="reg-info-item">
              <span class="reg-info-label">REGISTRATION STATUS:</span>
              <span class="reg-status-pill" style="color: ${statusColor}; background: ${statusBg}; border-color: ${statusBorder};">
                ● ${escapeHtml(statusLabel)}
              </span>
            </div>
            <div class="reg-info-item">
              <span class="reg-info-label">DATE SUBMITTED:</span>
              <span class="reg-info-val">${formatDateTime(submissionDate)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. REGISTERED COURSES TABLE -->
      <div class="reg-courses-table-container">
        <div class="reg-table-caption">
          <span>OFFICIALLY REGISTERED THEOLOGICAL COURSE OFFERINGS</span>
          <span class="reg-caption-count">${courses.length} Course${courses.length === 1 ? "" : "s"} Enrolled</span>
        </div>
        <table class="reg-courses-table">
          <thead>
            <tr>
              <th style="width: 32px; text-align: center;">#</th>
              <th style="width: 105px; text-align: left;">Course Code</th>
              <th style="text-align: left;">Course Title</th>
              <th style="width: 75px; text-align: center;">Credit Units</th>
              <th style="width: 185px; text-align: left;">Assigned Lecturer</th>
            </tr>
          </thead>
          <tbody>
            ${
              courses.length === 0
                ? `<tr><td colspan="5" class="reg-no-courses">No registered courses found for this semester.</td></tr>`
                : courses
                    .map((c, idx) => {
                      const code = c.courseCode || "THEO";
                      const title = c.courseTitle || c.title || "Theological Study";
                      const units = parseInt(c.creditUnits !== undefined ? c.creditUnits : (c.creditUnit || 3), 10) || 3;
                      const lecturer = c.lecturerName || c.lecturer || (c.assignedLecturer ? c.assignedLecturer : "TBA");
                      const rowClass = idx % 2 === 1 ? "reg-row-alt" : "";

                      return `
                        <tr class="${rowClass}">
                          <td style="text-align: center; color: #64748B; font-weight: 700;">${idx + 1}</td>
                          <td><strong class="reg-course-code">${escapeHtml(code)}</strong></td>
                          <td class="reg-course-title-cell">${escapeHtml(title)}</td>
                          <td style="text-align: center;"><span class="reg-units-pill">${units}</span></td>
                          <td class="reg-lecturer-cell">${escapeHtml(lecturer)}</td>
                        </tr>
                      `;
                    })
                    .join("")
            }
          </tbody>
          <tfoot>
            <tr class="reg-table-tfoot">
              <td colspan="3" class="reg-tfoot-label">
                TOTAL ENROLLED CREDIT UNITS:
              </td>
              <td style="text-align: center;" class="reg-tfoot-units">
                <span class="reg-total-units-badge">${totalCredits} Units</span>
              </td>
              <td class="reg-tfoot-note">
                Maximum standard limit: 24 Units
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- 4. OFFICIAL ENDORSEMENT & CERTIFICATION SIGN-OFF -->
      <div class="reg-endorsement-section">
        <div class="reg-declaration-text">
          <strong>Candidate Declaration:</strong> I hereby certify that the courses entered above have been selected by me in accordance with the Academic Board regulations of the Divine Mandate Bible Institute for the ${escapeHtml(session)} academic session (${escapeHtml(semester)}).
        </div>

        <div class="reg-signatures-row">
          <div class="reg-sig-block">
            <div class="reg-sig-line"></div>
            <div class="reg-sig-title">Candidate Signature &amp; Date</div>
            <div class="reg-sig-sub">${escapeHtml(studentName)} (${escapeHtml(studentId)})</div>
          </div>

          <div class="reg-stamp-box">
            <div class="reg-stamp-inner">
              <div class="reg-stamp-title">DIVINE MANDATE BIBLE INSTITUTE</div>
              <div class="reg-stamp-sub">OFFICIAL REGISTRY</div>
              <div class="reg-stamp-date">DATE: __________________</div>
              <div class="reg-stamp-status">CERTIFIED &amp; ENDORSED</div>
            </div>
          </div>

          <div class="reg-sig-block">
            <div class="reg-sig-line"></div>
            <div class="reg-sig-title">Dean of Studies / Registrar</div>
            <div class="reg-sig-sub">Academic Affairs &amp; Registry Verification</div>
          </div>
        </div>
      </div>

      <!-- 5. SECURITY & INTEGRITY FOOTER -->
      <div class="reg-doc-footer">
        <div class="reg-footer-meta">
          <span>Printed: ${printTimestamp}</span>
          <span>·</span>
          <span>Security Record: ${escapeHtml(studentId)}_${escapeHtml(session.replace("/", "_"))}_${escapeHtml(semester.replace(/\s+/g, "_"))}</span>
          <span>·</span>
          <span>Divine Mandate Bible Institute (DIMABIN)</span>
        </div>
        <div class="reg-footer-notice">
          This document is an authoritative institutional record. Any unauthorized alteration or forgery renders this registration slip null and void.
        </div>
      </div>
    </div>
  `;
}

/**
 * Injects required print styles into document.head once
 */
export function ensureRegistrationSlipStyles() {
  const STYLE_ID = "dimabin-course-reg-slip-styles";
  if (document.getElementById(STYLE_ID)) return;

  const styleEl = document.createElement("style");
  styleEl.id = STYLE_ID;
  styleEl.textContent = `
    /* ========================================================================
       DIMABIN COURSE REGISTRATION SLIP — A4 PRINT & PDF STYLES
       Exact 1-Page A4 Portrait Layout (210 × 297 mm)
       ======================================================================== */
    
    .dimabin-reg-a4-sheet {
      box-sizing: border-box;
      width: 100%;
      max-width: 790px;
      margin: 0 auto;
      background: #FFFFFF;
      color: #0A1633;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.35;
      padding: 1.25rem 1.5rem;
      border: 1.5px solid #CBD5E1;
      border-radius: 6px;
      box-shadow: 0 4px 14px rgba(10, 22, 51, 0.04);
      position: relative;
    }

    /* 1. Header */
    .reg-doc-header {
      margin-bottom: 0.65rem;
    }
    .reg-header-brand {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      margin-bottom: 0.5rem;
    }
    .reg-header-logo {
      width: 52px;
      height: 52px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .reg-header-titles {
      flex: 1;
      text-align: center;
    }
    .reg-inst-title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 900;
      color: #122452;
      letter-spacing: 0.04em;
      line-height: 1.15;
    }
    .reg-inst-sub {
      font-size: 0.6875rem;
      font-weight: 700;
      color: #1F3C82;
      letter-spacing: 0.06em;
      margin-top: 2px;
    }
    .reg-inst-motto {
      font-size: 0.6875rem;
      font-weight: 800;
      color: #B45309;
      letter-spacing: 0.07em;
      margin-top: 1px;
    }
    .reg-doc-title-bar {
      background: #122452;
      color: #FFFFFF;
      text-align: center;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      padding: 0.3rem 0.75rem;
      border-radius: 3px;
      border-bottom: 2px solid #D97706;
      margin-top: 0.25rem;
    }
    .reg-header-divider {
      height: 1px;
      background: #E2E8F0;
      margin-top: 0.5rem;
    }

    /* 2. Student Info Section */
    .reg-student-info-panel {
      background: #F8FAFC;
      border: 1px solid #CBD5E1;
      border-left: 3.5px solid #1F3C82;
      border-radius: 4px;
      padding: 0.55rem 0.85rem;
      margin-bottom: 0.65rem;
    }
    .reg-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.35rem 1.25rem;
    }
    .reg-info-col {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .reg-info-item {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.5rem;
      font-size: 0.71875rem;
    }
    .reg-info-label {
      font-size: 0.65625rem;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      flex-shrink: 0;
    }
    .reg-info-val {
      font-weight: 600;
      color: #0A1633;
      text-align: right;
      word-break: break-word;
    }
    .reg-val-highlight {
      font-weight: 800;
      color: #122452;
      font-size: 0.78125rem;
    }
    .reg-val-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-weight: 800;
      color: #1F3C82;
    }
    .reg-val-session {
      font-weight: 800;
      color: #122452;
    }
    .reg-val-sem {
      font-weight: 800;
      color: #B45309;
    }
    .reg-status-pill {
      font-size: 0.65625rem;
      font-weight: 800;
      padding: 0.12rem 0.45rem;
      border-radius: 3px;
      border: 1px solid;
      display: inline-block;
      text-align: right;
    }

    /* 3. Courses Table */
    .reg-courses-table-container {
      margin-bottom: 0.65rem;
    }
    .reg-table-caption {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.65625rem;
      font-weight: 800;
      color: #122452;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 0.25rem;
      padding: 0 2px;
    }
    .reg-caption-count {
      color: #1F3C82;
      font-weight: 700;
    }
    .reg-courses-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.71875rem;
      border: 1px solid #CBD5E1;
      table-layout: fixed;
    }
    .reg-courses-table th {
      background: #122452;
      color: #FFFFFF;
      font-size: 0.65625rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      padding: 0.35rem 0.5rem;
      border: 1px solid #1E293B;
      line-height: 1.2;
    }
    .reg-courses-table td {
      padding: 0.32rem 0.5rem;
      border: 1px solid #E2E8F0;
      vertical-align: middle;
      line-height: 1.25;
    }
    .reg-row-alt {
      background: #F8FAFC;
    }
    .reg-course-code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #1F3C82;
      font-size: 0.75rem;
      font-weight: 800;
    }
    .reg-course-title-cell {
      font-weight: 600;
      color: #0F172A;
      word-break: break-word;
    }
    .reg-units-pill {
      display: inline-block;
      padding: 0.1rem 0.35rem;
      background: #EFF6FF;
      color: #1D4ED8;
      border: 1px solid #BFDBFE;
      border-radius: 3px;
      font-weight: 800;
      font-size: 0.6875rem;
    }
    .reg-lecturer-cell {
      font-size: 0.6875rem;
      color: #334155;
      word-break: break-word;
    }
    .reg-table-tfoot td {
      background: #F1F5F9;
      border-top: 1.5px solid #94A3B8;
      padding: 0.4rem 0.5rem;
    }
    .reg-tfoot-label {
      text-align: right;
      font-weight: 900;
      font-size: 0.6875rem;
      color: #122452;
      letter-spacing: 0.03em;
    }
    .reg-tfoot-units {
      font-weight: 900;
    }
    .reg-total-units-badge {
      display: inline-block;
      background: #FEF3C7;
      color: #92400E;
      border: 1px solid #FCD34D;
      padding: 0.15rem 0.45rem;
      border-radius: 3px;
      font-weight: 900;
      font-size: 0.75rem;
    }
    .reg-tfoot-note {
      font-size: 0.625rem;
      color: #64748B;
      font-style: italic;
    }
    .reg-no-courses {
      text-align: center;
      padding: 1.5rem !important;
      color: #64748B;
      font-style: italic;
    }

    /* 4. Endorsement Section */
    .reg-endorsement-section {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 4px;
      padding: 0.55rem 0.85rem;
      margin-bottom: 0.55rem;
    }
    .reg-declaration-text {
      font-size: 0.625rem;
      color: #334155;
      line-height: 1.35;
      margin-bottom: 0.6rem;
      border-bottom: 1px dashed #CBD5E1;
      padding-bottom: 0.4rem;
    }
    .reg-signatures-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 0.75rem;
    }
    .reg-sig-block {
      flex: 1;
      text-align: center;
    }
    .reg-sig-line {
      height: 1px;
      border-bottom: 1.5px dashed #475569;
      margin-bottom: 0.35rem;
      width: 85%;
      margin-left: auto;
      margin-right: auto;
    }
    .reg-sig-title {
      font-size: 0.65625rem;
      font-weight: 800;
      color: #122452;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .reg-sig-sub {
      font-size: 0.59375rem;
      color: #64748B;
      margin-top: 1px;
    }
    .reg-stamp-box {
      width: 140px;
      height: 60px;
      border: 1.5px dashed #94A3B8;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #F8FAFC;
      flex-shrink: 0;
    }
    .reg-stamp-inner {
      text-align: center;
      line-height: 1.15;
    }
    .reg-stamp-title {
      font-size: 0.48rem;
      font-weight: 900;
      color: #1E3A8A;
      letter-spacing: 0.03em;
    }
    .reg-stamp-sub {
      font-size: 0.52rem;
      font-weight: 800;
      color: #B45309;
      letter-spacing: 0.05em;
    }
    .reg-stamp-date {
      font-size: 0.46rem;
      color: #64748B;
      margin-top: 2px;
    }
    .reg-stamp-status {
      font-size: 0.48rem;
      font-weight: 800;
      color: #15803D;
      margin-top: 1px;
    }

    /* 5. Footer */
    .reg-doc-footer {
      border-top: 1px solid #E2E8F0;
      padding-top: 0.35rem;
      text-align: center;
      font-size: 0.59375rem;
      color: #64748B;
    }
    .reg-footer-meta {
      display: flex;
      justify-content: center;
      gap: 0.4rem;
      font-weight: 600;
    }
    .reg-footer-notice {
      font-size: 0.53125rem;
      color: #94A3B8;
      margin-top: 2px;
    }

    /* ========================================================================
       PRINT ISOLATION & PAGE RULES
       Strict 1-Page A4 Sheet Configuration
       ======================================================================== */
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }

    @media print {
      /* Completely suppress browser body backgrounds and website layout */
      html, body {
        background: #FFFFFF !important;
        color: #000000 !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: auto !important;
        overflow: visible !important;
        font-size: 10.5pt !important;
      }

      /* Hide ALL portal website interface chrome */
      body > *:not(#dimabin-reg-print-root) {
        display: none !important;
      }

      #dimabin-reg-print-root {
        display: block !important;
        position: static !important;
        width: 100% !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
        visibility: visible !important;
      }

      #dimabin-reg-print-root,
      #dimabin-reg-print-root * {
        visibility: visible !important;
      }

      .dimabin-reg-a4-sheet {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        page-break-after: avoid !important;
        page-break-inside: avoid !important;
        break-after: avoid !important;
        break-inside: avoid !important;
      }

      .reg-courses-table {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      .reg-endorsement-section {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }

    /* Off-screen A4 PDF snapshot container styling */
    #dimabin-reg-pdf-render-wrap .dimabin-reg-a4-sheet {
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      width: 794px !important;
      min-height: 1123px !important;
      max-width: 794px !important;
      padding: 26px 30px !important;
      box-sizing: border-box !important;
      background: #FFFFFF !important;
    }
  `;
  document.head.appendChild(styleEl);
}

/**
 * Mounts the printable registration slip into the isolated print container
 */
export function mountPrintableRegistrationSlip(reg, studentProfile) {
  ensureRegistrationSlipStyles();
  let container = document.getElementById("dimabin-reg-print-root");
  if (!container) {
    container = document.createElement("div");
    container.id = "dimabin-reg-print-root";
    container.style.display = "none";
    document.body.appendChild(container);
  }
  container.innerHTML = buildRegistrationSlipHtml(reg, studentProfile);
  return container;
}

/**
 * Direct Print: Mounts clean isolated A4 document and calls window.print()
 */
export function printCourseRegistrationSlip(reg, studentProfile) {
  if (!reg) {
    alert("No active course registration record to print.");
    return;
  }

  mountPrintableRegistrationSlip(reg, studentProfile);

  // Short timeout to let browser DOM and CSS settle
  setTimeout(() => {
    window.print();
  }, 100);
}

/**
 * Direct PDF Download: Renders high-fidelity A4 canvas and downloads PDF
 */
export async function downloadCourseRegistrationPdf(reg, studentProfile, onProgress) {
  if (!reg) {
    throw new Error("No course registration data available for PDF generation.");
  }

  ensureRegistrationSlipStyles();

  if (typeof onProgress === "function") {
    onProgress("Preparing document layout & seal...");
  }

  // Pre-load official logo data URI for zero-latency, CORS-safe canvas snapshot
  let logoDataUri = null;
  try {
    logoDataUri = await getLogoDataUri();
  } catch (_) {}

  // Create an off-screen container matching exact 1-page A4 aspect ratio
  // 794px × 1123px at 96 DPI
  const a4WidthPx = 794;
  const a4HeightPx = 1123;

  const renderWrap = document.createElement("div");
  renderWrap.id = "dimabin-reg-pdf-render-wrap";
  renderWrap.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: ${a4WidthPx}px;
    min-height: ${a4HeightPx}px;
    background: #FFFFFF;
    z-index: -9999;
    overflow: hidden;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  `;

  renderWrap.innerHTML = buildRegistrationSlipHtml(reg, studentProfile, logoDataUri);
  document.body.appendChild(renderWrap);

  try {
    if (typeof onProgress === "function") {
      onProgress("Loading PDF rendering engine...");
    }

    const html2canvasModule = await import("html2canvas");
    const html2canvas = html2canvasModule.default || html2canvasModule;
    const { jsPDF } = await import("jspdf");

    if (typeof onProgress === "function") {
      onProgress("Rendering print-ready A4 document...");
    }

    const sheetEl = renderWrap.querySelector("#dimabin-reg-a4-sheet") || renderWrap;

    // Ensure logo image is pre-loaded & decoded
    const logoImg = sheetEl.querySelector(".reg-header-logo");
    if (logoImg) {
      if (!logoImg.complete) {
        await new Promise((resolve) => {
          logoImg.onload = resolve;
          logoImg.onerror = resolve;
          setTimeout(resolve, 800);
        });
      }
      if (logoImg.decode) {
        await logoImg.decode().catch(() => {});
      }
    }

    // Brief stabilization delay
    await new Promise((r) => setTimeout(r, 150));

    const canvas = await html2canvas(sheetEl, {
      scale: 2, // Retina 192dpi equivalent for crystal-sharp print
      useCORS: true,
      logging: false,
      backgroundColor: "#FFFFFF",
      width: a4WidthPx,
      height: a4HeightPx,
      windowWidth: a4WidthPx,
      windowHeight: a4HeightPx
    });

    if (typeof onProgress === "function") {
      onProgress("Compiling PDF file...");
    }

    // A4 dimensions: 210mm × 297mm
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");

    // Clean, professional filename
    const matricClean = sanitizeFileNamePart(reg.studentId || studentProfile.studentId || "Student");
    const sessClean = sanitizeFileNamePart(reg.academicSession || "Session");
    const semClean = sanitizeFileNamePart(reg.semester || "Semester");
    const fileName = `DIMABIN_Course_Registration_Slip_${matricClean}_${sessClean}_${semClean}.pdf`;

    pdf.save(fileName);

    if (typeof onProgress === "function") {
      onProgress("PDF downloaded successfully!");
    }

    return { success: true, fileName };
  } finally {
    if (renderWrap.parentNode) {
      renderWrap.parentNode.removeChild(renderWrap);
    }
  }
}
