/**
 * DIVINE MANDATE BIBLE INSTITUTE (DIMABIN)
 * Admission Application Form Printing & PDF Generation Service
 * 
 * Generates an official, print-ready, high-fidelity A4 portrait document (210 × 297 mm)
 * occupying the sheet naturally with balanced margins, clear typography, and official seals.
 */

// Official Logo Path
const LOGO_SRC = 'assets/images/dimabin-logo.png';

/**
 * Sanitize application ID for file names
 */
export function sanitizeFileNameId(appId) {
  if (!appId) return 'Application';
  return String(appId).replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Format date nicely
 */
function formatDate(dStr) {
  if (!dStr) return 'N/A';
  try {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (_) {
    return dStr;
  }
}

/**
 * Escape HTML to prevent injection
 */
function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Build the exact HTML string for the balanced, print-ready A4 Admission Application Document
 */
export function buildApplicationDocHtml(app) {
  const appId = escapeHtml(app.applicationId || app.id || 'DIMABIN/APP/2026');
  const appDate = formatDate(app.createdAt || new Date().toISOString());
  const fullName = escapeHtml(app.fullName || app.name || 'Candidate');
  const programme = escapeHtml(app.programme || app.program || 'Diploma in Theology (Dipl.Th.)');
  const session = escapeHtml(app.academicSession || app.session || '2026/2027');
  const studyCentre = escapeHtml(app.studyCentre || app.centre || 'Abeokuta Main Campus');
  const status = escapeHtml((app.status || 'Submitted').toUpperCase());

  // Personal / Bio-Data
  const gender = escapeHtml(app.gender || 'N/A');
  const dob = formatDate(app.dob);
  const marital = escapeHtml(app.maritalStatus || 'N/A');
  const nationality = escapeHtml(app.nationality || 'Nigerian');
  const stateOrigin = escapeHtml(app.stateOfOrigin || 'N/A');
  const lga = escapeHtml(app.lga || 'N/A');
  const phone = escapeHtml(app.phone || 'N/A');
  const whatsapp = escapeHtml(app.whatsapp || app.phone || 'N/A');
  const email = escapeHtml(app.email || 'N/A');
  const address = escapeHtml(app.residentialAddress || app.address || 'N/A');

  // Academic Background
  const qual = escapeHtml(app.qualification || 'N/A');
  const gradYear = escapeHtml(app.graduationYear || 'N/A');
  const inst = escapeHtml(app.institution || 'N/A');
  const course = escapeHtml(app.courseOfStudy || app.academicCourse || 'N/A');

  // Ecclesiastical & Pastoral Profile
  const church = escapeHtml(app.churchName || 'N/A');
  const denom = escapeHtml(app.denomination || 'N/A');
  const role = escapeHtml(app.ministryRole || app.churchRole || 'N/A');
  const pastor = escapeHtml(app.pastorName || app.churchPastorName || 'N/A');
  const pastorPhone = escapeHtml(app.pastorPhone || app.churchPastorPhone || 'N/A');

  // Next of Kin / Emergency Contact
  const kinName = escapeHtml(app.kinName || 'N/A');
  const kinRel = escapeHtml(app.kinRelationship || 'N/A');
  const kinPhone = escapeHtml(app.kinPhone || 'N/A');
  const kinAddress = escapeHtml(app.kinAddress || 'N/A');

  return `
    <div class="dimabin-a4-sheet" id="dimabin-a4-sheet">
      <!-- 1. INSTITUTIONAL HEADER -->
      <div class="a4-header">
        <div class="a4-logo-wrap">
          <img src="${LOGO_SRC}" alt="DIMABIN Seal" class="a4-logo" crossorigin="anonymous">
        </div>
        <div class="a4-header-text">
          <h1 class="a4-inst-title">DIVINE MANDATE BIBLE INSTITUTE</h1>
          <div class="a4-inst-subtitle">(DIMABIN) · INTERDENOMINATIONAL CITADEL OF LEARNING</div>
          <div class="a4-motto">MOTTO: FEAR OF GOD WITHOUT A MESS</div>
          <div class="a4-contact-bar">
            <span>Goshen 13, Kusimo Street, Kenta, Oke-Ola, Idi-Aba, Abeokuta, Ogun State, Nigeria</span><br>
            <span>Tel: 0803 819 4611 · 0806 218 6974 · 0803 728 2082 | Email: dimabin233@gmail.com | Portal: https://dimabinportal.com.ng</span>
          </div>
        </div>
      </div>

      <!-- 2. DOCUMENT TITLE & REGISTRY STATUS BAR -->
      <div class="a4-title-bar">
        <div class="a4-doc-badge">OFFICIAL REGISTRY COPY</div>
        <div class="a4-doc-title">ADMISSION APPLICATION FORM</div>
        <div class="a4-meta-pills">
          <span class="a4-pill-item"><strong>REF:</strong> ${appId}</span>
          <span class="a4-pill-item"><strong>DATE:</strong> ${appDate}</span>
          <span class="a4-pill-item a4-status-pill"><strong>STATUS:</strong> ${status}</span>
        </div>
      </div>

      <!-- 3. ENROLLMENT & PROGRAMME BANNER -->
      <div class="a4-banner-grid">
        <div class="a4-banner-cell">
          <span class="a4-cell-lbl">Academic Session</span>
          <span class="a4-cell-val font-bold">${session}</span>
        </div>
        <div class="a4-banner-cell highlight-cell">
          <span class="a4-cell-lbl">Programme Applied For</span>
          <span class="a4-cell-val font-bold font-primary">${programme}</span>
        </div>
        <div class="a4-banner-cell">
          <span class="a4-cell-lbl">Official Study Centre / Campus</span>
          <span class="a4-cell-val font-bold">${studyCentre}</span>
        </div>
      </div>

      <!-- 4. SECTION 1: CANDIDATE BIO-DATA & CONTACT -->
      <div class="a4-section">
        <div class="a4-sec-hdr">1. Candidate Bio-Data &amp; Contact Information</div>
        <div class="a4-table-grid">
          <div class="a4-row full-width">
            <div class="a4-cell" style="width: 100%;">
              <span class="a4-lbl">Candidate Full Name</span>
              <span class="a4-val font-bold font-primary font-lg">${fullName}</span>
            </div>
          </div>
          <div class="a4-row a4-row-split-4">
            <div class="a4-cell"><span class="a4-lbl">Gender</span><span class="a4-val">${gender}</span></div>
            <div class="a4-cell"><span class="a4-lbl">Date of Birth</span><span class="a4-val">${dob}</span></div>
            <div class="a4-cell"><span class="a4-lbl">Marital Status</span><span class="a4-val">${marital}</span></div>
            <div class="a4-cell"><span class="a4-lbl">Nationality</span><span class="a4-val">${nationality}</span></div>
          </div>
          <div class="a4-row a4-row-split-4">
            <div class="a4-cell"><span class="a4-lbl">State of Origin</span><span class="a4-val">${stateOrigin}</span></div>
            <div class="a4-cell"><span class="a4-lbl">LGA</span><span class="a4-val">${lga}</span></div>
            <div class="a4-cell"><span class="a4-lbl">Phone Number</span><span class="a4-val">${phone}</span></div>
            <div class="a4-cell"><span class="a4-lbl">WhatsApp Number</span><span class="a4-val">${whatsapp}</span></div>
          </div>
          <div class="a4-row a4-row-split-2">
            <div class="a4-cell-65"><span class="a4-lbl">Residential Address</span><span class="a4-val">${address}</span></div>
            <div class="a4-cell-35"><span class="a4-lbl">Email Address</span><span class="a4-val">${email}</span></div>
          </div>
        </div>
      </div>

      <!-- 5. SECTION 2: PREVIOUS EDUCATIONAL BACKGROUND -->
      <div class="a4-section">
        <div class="a4-sec-hdr">2. Previous Educational Background</div>
        <div class="a4-table-grid">
          <div class="a4-row a4-row-split-3">
            <div class="a4-cell"><span class="a4-lbl">Highest Qualification</span><span class="a4-val font-bold">${qual}</span></div>
            <div class="a4-cell"><span class="a4-lbl">Year of Graduation</span><span class="a4-val">${gradYear}</span></div>
            <div class="a4-cell" style="flex: 1.8;"><span class="a4-lbl">Institution Attended</span><span class="a4-val">${inst}</span></div>
          </div>
          ${(course && course !== 'N/A') ? `
          <div class="a4-row full-width">
            <div class="a4-cell" style="width: 100%;">
              <span class="a4-lbl">Course / Academic Discipline</span>
              <span class="a4-val">${course}</span>
            </div>
          </div>` : ''}
        </div>
      </div>

      <!-- 6. SECTION 3: ECCLESIASTICAL & PASTORAL INFORMATION -->
      <div class="a4-section">
        <div class="a4-sec-hdr">3. Ecclesiastical &amp; Pastoral Information</div>
        <div class="a4-table-grid">
          <div class="a4-row a4-row-split-3">
            <div class="a4-cell"><span class="a4-lbl">Home Church</span><span class="a4-val">${church}</span></div>
            <div class="a4-cell"><span class="a4-lbl">Denomination</span><span class="a4-val">${denom}</span></div>
            <div class="a4-cell"><span class="a4-lbl">Current Ministry Role</span><span class="a4-val">${role}</span></div>
          </div>
          <div class="a4-row a4-row-split-2">
            <div class="a4-cell-60"><span class="a4-lbl">Pastor / Spiritual Overseer</span><span class="a4-val">${pastor}</span></div>
            <div class="a4-cell-40"><span class="a4-lbl">Pastor's Contact Phone</span><span class="a4-val">${pastorPhone}</span></div>
          </div>
        </div>
      </div>

      <!-- 7. SECTION 4: NEXT OF KIN / EMERGENCY CONTACT -->
      <div class="a4-section">
        <div class="a4-sec-hdr">4. Next of Kin / Emergency Contact</div>
        <div class="a4-table-grid">
          <div class="a4-row a4-row-split-3">
            <div class="a4-cell"><span class="a4-lbl">Full Name</span><span class="a4-val font-bold">${kinName}</span></div>
            <div class="a4-cell"><span class="a4-lbl">Relationship</span><span class="a4-val">${kinRel}</span></div>
            <div class="a4-cell"><span class="a4-lbl">Contact Phone Number</span><span class="a4-val">${kinPhone}</span></div>
          </div>
          ${(kinAddress && kinAddress !== 'N/A') ? `
          <div class="a4-row full-width">
            <div class="a4-cell" style="width: 100%;">
              <span class="a4-lbl">Contact / Residential Address</span>
              <span class="a4-val">${kinAddress}</span>
            </div>
          </div>` : ''}
        </div>
      </div>

      <!-- 8. SECTION 5: CANDIDATE DECLARATION & REGISTRY ENDORSEMENT -->
      <div class="a4-section a4-decl-sec">
        <div class="a4-sec-hdr">5. Candidate Declaration &amp; Registry Endorsement</div>
        <div class="a4-decl-text">
          I solemnly declare that all information supplied on this application form is genuine, accurate, and complete. 
          I commit, if admitted, to abide strictly by the academic statutes, spiritual discipline, and institutional regulations of 
          Divine Mandate Bible Institute under the sacred motto <em>"Fear of God without a Mess."</em>
        </div>

        <div class="a4-sign-row">
          <div class="a4-sign-col">
            <div class="a4-sign-line"></div>
            <div class="a4-sign-label">Candidate Signature &amp; Date</div>
            <div class="a4-sign-sub">${fullName}</div>
          </div>

          <div class="a4-sign-stamp-col">
            <div class="a4-official-stamp">
              <span class="stamp-line-1">★ DIMABIN REGISTRY ★</span>
              <span class="stamp-line-2">ELECTRONICALLY FILED &amp; VERIFIED</span>
              <span class="stamp-line-3">${appId}</span>
              <span class="stamp-line-4">${appDate}</span>
            </div>
          </div>

          <div class="a4-sign-col">
            <div class="a4-sign-line"></div>
            <div class="a4-sign-label">Academic Registrar Signature &amp; Seal</div>
            <div class="a4-sign-sub">Office of the Registrar, DIMABIN</div>
          </div>
        </div>
      </div>

      <!-- 9. FOOTER -->
      <div class="a4-footer">
        <div>Official Academic Registry Copy · Verification: https://dimabinportal.com.ng/admissions.html#check-status</div>
        <div class="font-bold">A4 Page 1 of 1 · Divine Mandate Bible Institute</div>
      </div>
    </div>
  `;
}

/**
 * Injects self-contained styling for A4 sheet preview, print, and PDF generation
 */
export function ensureDocumentStyles() {
  if (document.getElementById('dimabin-application-print-styles')) return;
  const styleEl = document.createElement('style');
  styleEl.id = 'dimabin-application-print-styles';
  styleEl.textContent = `
    #dimabin-print-root {
      display: none;
    }

    /* A4 Sheet Container: Exactly 794px × 1123px at 96 DPI (210mm × 297mm) */
    .dimabin-a4-sheet {
      width: 794px;
      min-height: 1123px;
      box-sizing: border-box;
      padding: 34px 42px 28px 42px; /* ~12mm top, 14mm sides, 11mm bottom */
      background: #ffffff;
      color: #0f172a;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 10px;
      line-height: 1.35;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 1px solid #cbd5e1;
      position: relative;
      overflow: hidden;
      margin: 0 auto;
    }

    /* 1. Header */
    .a4-header {
      display: flex;
      align-items: center;
      gap: 16px;
      border-bottom: 2.5px solid #1F3C82;
      padding-bottom: 8px;
      margin-bottom: 7px;
    }
    .a4-logo-wrap {
      width: 72px;
      height: 72px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .a4-logo {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .a4-header-text {
      flex: 1;
      text-align: center;
    }
    .a4-inst-title {
      font-size: 19px;
      font-weight: 800;
      color: #1F3C82;
      letter-spacing: 0.02em;
      margin: 0 0 2px 0;
      line-height: 1.15;
    }
    .a4-inst-subtitle {
      font-size: 10px;
      font-weight: 700;
      color: #0F172A;
      letter-spacing: 0.05em;
      margin-bottom: 2px;
    }
    .a4-motto {
      font-size: 9.5px;
      font-weight: 800;
      color: #B45309;
      letter-spacing: 0.04em;
      margin-bottom: 2px;
    }
    .a4-contact-bar {
      font-size: 8.5px;
      color: #475569;
      line-height: 1.3;
    }

    /* 2. Document Title Bar */
    .a4-title-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #1F3C82;
      color: #ffffff;
      padding: 6px 12px;
      border-radius: 4px;
      margin-bottom: 7px;
    }
    .a4-doc-badge {
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.06em;
      background: #F5B800;
      color: #0A192F;
      padding: 2px 7px;
      border-radius: 3px;
    }
    .a4-doc-title {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .a4-meta-pills {
      display: flex;
      gap: 7px;
      font-size: 9px;
    }
    .a4-pill-item {
      background: rgba(255, 255, 255, 0.18);
      padding: 2px 7px;
      border-radius: 3px;
    }
    .a4-status-pill {
      background: #16A34A;
      color: #ffffff;
      font-weight: 700;
    }

    /* 3. Academic Banner Grid */
    .a4-banner-grid {
      display: grid;
      grid-template-columns: 1fr 1.6fr 1.4fr;
      gap: 6px;
      margin-bottom: 7px;
    }
    .a4-banner-cell {
      background: #F8FAFC;
      border: 1px solid #CBD5E1;
      border-radius: 4px;
      padding: 5px 9px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .a4-banner-cell.highlight-cell {
      background: #EFF6FF;
      border-color: #BFDBFE;
    }
    .a4-cell-lbl {
      font-size: 7.5px;
      font-weight: 700;
      color: #64748B;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-bottom: 1px;
    }
    .a4-cell-val {
      font-size: 10px;
      color: #1F3C82;
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* 4. Sections */
    .a4-section {
      border: 1px solid #CBD5E1;
      border-radius: 4px;
      margin-bottom: 7px;
      background: #ffffff;
      overflow: hidden;
    }
    .a4-sec-hdr {
      background: #F1F5F9;
      color: #1F3C82;
      font-size: 9.5px;
      font-weight: 800;
      letter-spacing: 0.04em;
      padding: 4px 10px;
      border-bottom: 1px solid #CBD5E1;
      text-transform: uppercase;
    }
    .a4-table-grid {
      display: flex;
      flex-direction: column;
    }
    .a4-row {
      display: flex;
      width: 100%;
      border-bottom: 1px solid #E2E8F0;
    }
    .a4-row:last-child {
      border-bottom: none;
    }
    .a4-row.full-width {
      width: 100%;
    }
    .a4-row-split-4 .a4-cell {
      flex: 1;
    }
    .a4-row-split-3 .a4-cell {
      flex: 1;
    }
    .a4-cell {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 4.5px 8px;
      border-right: 1px solid #E2E8F0;
      min-width: 0;
    }
    .a4-cell:last-child {
      border-right: none;
    }
    .a4-cell-65 {
      flex: 1.6;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 4.5px 8px;
      border-right: 1px solid #E2E8F0;
      min-width: 0;
    }
    .a4-cell-35 {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 4.5px 8px;
      min-width: 0;
    }
    .a4-cell-60 {
      flex: 1.5;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 4.5px 8px;
      border-right: 1px solid #E2E8F0;
      min-width: 0;
    }
    .a4-cell-40 {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 4.5px 8px;
      min-width: 0;
    }
    .a4-lbl {
      font-size: 7.8px;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-bottom: 1px;
      white-space: nowrap;
    }
    .a4-val {
      font-size: 9.5px;
      font-weight: 600;
      color: #0F172A;
      line-height: 1.25;
      word-break: break-word;
    }
    .font-lg {
      font-size: 11px !important;
    }
    .font-primary {
      color: #1F3C82 !important;
    }
    .font-bold {
      font-weight: 700 !important;
    }

    /* 5. Declaration & Signatures */
    .a4-decl-sec {
      background: #FAFAFA;
    }
    .a4-decl-text {
      font-size: 8.5px;
      color: #334155;
      line-height: 1.4;
      padding: 5px 10px;
      border-bottom: 1px dashed #CBD5E1;
      font-style: italic;
    }
    .a4-sign-row {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      padding: 10px 14px 6px 14px;
      gap: 14px;
    }
    .a4-sign-col {
      flex: 1;
      text-align: center;
    }
    .a4-sign-line {
      border-bottom: 1.5px solid #334155;
      width: 85%;
      height: 30px;
      margin: 0 auto 3px auto;
    }
    .a4-sign-label {
      font-size: 8px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .a4-sign-sub {
      font-size: 8.5px;
      font-weight: 600;
      color: #1F3C82;
      margin-top: 1px;
    }
    .a4-sign-stamp-col {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .a4-official-stamp {
      border: 1.5px dashed #D97706;
      border-radius: 4px;
      padding: 4px 8px;
      text-align: center;
      background: #FFFBEB;
      display: flex;
      flex-direction: column;
      line-height: 1.25;
      width: 90%;
    }
    .stamp-line-1 {
      font-size: 7.5px;
      font-weight: 800;
      color: #92400E;
      letter-spacing: 0.05em;
    }
    .stamp-line-2 {
      font-size: 8px;
      font-weight: 800;
      color: #B45309;
      letter-spacing: 0.03em;
    }
    .stamp-line-3 {
      font-size: 8.5px;
      font-weight: 700;
      color: #1F3C82;
    }
    .stamp-line-4 {
      font-size: 7.5px;
      color: #64748B;
    }

    /* 6. Footer */
    .a4-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #CBD5E1;
      padding-top: 4px;
      margin-top: 4px;
      font-size: 7.5px;
      color: #64748B;
    }

    /* Print Specific Styles */
    @page {
      size: A4 portrait;
      margin: 12mm 14mm;
    }
    @media print {
      html, body {
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important;
        overflow: visible !important;
      }
      body > *:not(#dimabin-print-root) {
        display: none !important;
      }
      #dimabin-print-root {
        display: block !important;
        position: static !important;
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
      }
      #dimabin-print-root,
      #dimabin-print-root * {
        visibility: visible !important;
      }
      .dimabin-a4-sheet {
        width: 100% !important;
        max-width: 100% !important;
        height: 100% !important;
        min-height: 100% !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        margin: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        page-break-after: avoid !important;
        page-break-inside: avoid !important;
        break-after: avoid !important;
        break-inside: avoid !important;
      }
    }
  `;
  document.head.appendChild(styleEl);
}

/**
 * Ensures the printable container exists and mounts the sheet
 */
export function mountPrintableApplication(app) {
  ensureDocumentStyles();
  let container = document.getElementById('dimabin-print-root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'dimabin-print-root';
    container.className = 'dimabin-print-only-container';
    document.body.appendChild(container);
  }
  container.innerHTML = buildApplicationDocHtml(app);
  return container;
}

/**
 * Print Application Form
 * Opens native print dialog for the isolated 1-page A4 application form
 */
export function printApplicationForm(app) {
  if (!app || (!app.applicationId && !app.fullName && !app.name)) {
    throw new Error('Application record is missing or incomplete.');
  }

  // Ensure styles & mount document into print container
  mountPrintableApplication(app);

  // Trigger print dialog
  window.print();
}

/**
 * Download Application Form as PDF
 * Uses html2canvas + jsPDF to produce an exact, balanced A4 PDF file directly
 */
export async function downloadApplicationPdf(app, onProgress) {
  if (!app || (!app.applicationId && !app.fullName && !app.name)) {
    throw new Error('Application record is missing or incomplete.');
  }

  ensureDocumentStyles();

  if (typeof onProgress === 'function') {
    onProgress('Preparing document...');
  }

  // Create an off-screen render container with exact A4 dimensions at 96 DPI (794px × 1123px)
  const renderWrap = document.createElement('div');
  renderWrap.id = 'dimabin-pdf-render-wrap';
  renderWrap.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: 794px;
    min-height: 1123px;
    background: #ffffff;
    z-index: -9999;
    overflow: visible;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  `;

  renderWrap.innerHTML = buildApplicationDocHtml(app);
  document.body.appendChild(renderWrap);

  try {
    if (typeof onProgress === 'function') {
      onProgress('Loading PDF generator engine...');
    }

    // Dynamic import to avoid holding or stalling module graph during dashboard boot
    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default || html2canvasModule;
    const { jsPDF } = await import('jspdf');

    if (typeof onProgress === 'function') {
      onProgress('Rendering print-ready A4 layout...');
    }

    const sheetEl = renderWrap.querySelector('#dimabin-a4-sheet') || renderWrap;

    // Ensure logo image is pre-loaded & decoded before canvas snapshot
    const logoImg = sheetEl.querySelector('.a4-logo');
    if (logoImg) {
      if (!logoImg.complete) {
        await new Promise((resolve) => {
          logoImg.onload = resolve;
          logoImg.onerror = resolve;
          setTimeout(resolve, 600);
        });
      }
      if (logoImg.decode) {
        await logoImg.decode().catch(() => {});
      }
    }

    // Settle layout
    await new Promise((r) => setTimeout(r, 120));

    // A4 dimensions in CSS pixels at 96 DPI
    const a4HeightPx = 1123;
    const sheetHeight = sheetEl.scrollHeight || sheetEl.offsetHeight || a4HeightPx;
    const targetHeight = Math.max(a4HeightPx, sheetHeight);

    const canvas = await html2canvas(sheetEl, {
      scale: 2, // High resolution (retina 192dpi equivalent for crystal-sharp print)
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      height: targetHeight,
      windowWidth: 794,
      windowHeight: targetHeight
    });

    if (typeof onProgress === 'function') {
      onProgress('Compiling PDF file...');
    }

    // A4 dimensions in mm: 210mm × 297mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // If fits naturally on 1 page (up to ~1145px)
    if (targetHeight <= a4HeightPx + 25) {
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    } else {
      // Continuation page support: slice canvas across A4 pages
      const canvasPageHeight = (canvas.width * 297) / 210; // Exact A4 aspect ratio in canvas pixels
      const totalPages = Math.ceil(canvas.height / canvasPageHeight);

      for (let p = 0; p < totalPages; p++) {
        if (p > 0) {
          pdf.addPage('a4', 'portrait');
        }

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = canvasPageHeight;
        const pageCtx = pageCanvas.getContext('2d');
        pageCtx.fillStyle = '#ffffff';
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        const sourceY = p * canvasPageHeight;
        const sourceH = Math.min(canvasPageHeight, canvas.height - sourceY);

        pageCtx.drawImage(
          canvas,
          0, sourceY, canvas.width, sourceH,
          0, 0, canvas.width, sourceH
        );

        const pageImg = pageCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(pageImg, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }
    }

    const cleanId = sanitizeFileNameId(app.applicationId || app.id || 'DIMABIN');
    const fileName = `DIMABIN_Admission_Application_${cleanId}.pdf`;

    pdf.save(fileName);

    if (typeof onProgress === 'function') {
      onProgress('Done');
    }

    return { success: true, fileName };
  } finally {
    // Cleanup render wrapper
    if (renderWrap && renderWrap.parentNode) {
      renderWrap.parentNode.removeChild(renderWrap);
    }
  }
}
