/**
 * DIVINE MANDATE BIBLE INSTITUTE (DIMABIN)
 * Admission Application Form Printing & PDF Generation Service
 * 
 * Generates an official, compact, high-fidelity 1-page A4 document
 * containing only the candidate's verified admission application record.
 */

// Pre-cached base64 or verified logo path
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
 * Build the exact HTML string for the 1-Page A4 Admission Application Document
 */
export function buildApplicationDocHtml(app) {
  const appId = escapeHtml(app.applicationId || 'DIMABIN/APP/2026');
  const appDate = formatDate(app.createdAt || new Date().toISOString());
  const fullName = escapeHtml(app.fullName || app.name || 'Candidate');
  const programme = escapeHtml(app.programme || app.program || 'Diploma in Theology (Dipl.Th.)');
  const session = escapeHtml(app.academicSession || '2026/2027');
  const studyCentre = escapeHtml(app.studyCentre || 'Abeokuta Main Campus');
  const status = escapeHtml((app.status || 'Submitted').toUpperCase());

  // Personal
  const gender = escapeHtml(app.gender || 'N/A');
  const dob = formatDate(app.dob);
  const marital = escapeHtml(app.maritalStatus || 'N/A');
  const nationality = escapeHtml(app.nationality || 'Nigerian');
  const stateOrigin = escapeHtml(app.stateOfOrigin || 'N/A');
  const lga = escapeHtml(app.lga || 'N/A');
  const phone = escapeHtml(app.phone || 'N/A');
  const whatsapp = escapeHtml(app.whatsapp || app.phone || 'N/A');
  const email = escapeHtml(app.email || 'N/A');
  const address = escapeHtml(app.residentialAddress || 'N/A');

  // Academic
  const qual = escapeHtml(app.qualification || 'N/A');
  const gradYear = escapeHtml(app.graduationYear || 'N/A');
  const inst = escapeHtml(app.institution || 'N/A');
  const course = escapeHtml(app.courseOfStudy || app.academicCourse || 'N/A');

  // Church
  const church = escapeHtml(app.churchName || 'N/A');
  const denom = escapeHtml(app.denomination || 'N/A');
  const role = escapeHtml(app.ministryRole || app.churchRole || 'N/A');
  const pastor = escapeHtml(app.pastorName || app.churchPastorName || 'N/A');
  const pastorPhone = escapeHtml(app.pastorPhone || app.churchPastorPhone || 'N/A');

  // Next of Kin
  const kinName = escapeHtml(app.kinName || 'N/A');
  const kinRel = escapeHtml(app.kinRelationship || 'N/A');
  const kinPhone = escapeHtml(app.kinPhone || 'N/A');
  const kinAddress = escapeHtml(app.kinAddress || 'N/A');

  return `
    <div class="dimabin-a4-sheet" id="dimabin-a4-sheet">
      <!-- HEADER -->
      <div class="a4-header">
        <div class="a4-logo-wrap">
          <img src="${LOGO_SRC}" alt="DIMABIN Seal" class="a4-logo" crossorigin="anonymous">
        </div>
        <div class="a4-header-text">
          <h1 class="a4-inst-title">DIVINE MANDATE BIBLE INSTITUTE</h1>
          <div class="a4-inst-subtitle">(DIMABIN) · AN INTERDENOMINATIONAL CITADEL OF LEARNING</div>
          <div class="a4-motto">MOTTO: FEAR OF GOD WITHOUT A MESS</div>
          <div class="a4-contact-bar">Goshen 13, Kusimo Street, Idi-Aba, Abeokuta, Ogun State, Nigeria · portal: https://dimabinportal.com.ng</div>
        </div>
      </div>

      <!-- TITLE BAR -->
      <div class="a4-title-bar">
        <div class="a4-doc-badge">OFFICIAL REGISTRY COPY</div>
        <div class="a4-doc-title">ADMISSION APPLICATION FORM</div>
        <div class="a4-meta-pills">
          <span class="a4-pill-item"><strong>REF:</strong> ${appId}</span>
          <span class="a4-pill-item"><strong>DATE:</strong> ${appDate}</span>
          <span class="a4-pill-item a4-status-pill"><strong>STATUS:</strong> ${status}</span>
        </div>
      </div>

      <!-- PROGRAMME & CENTRE BANNER -->
      <div class="a4-banner-grid">
        <div class="a4-banner-cell">
          <span class="a4-cell-lbl">ACADEMIC SESSION:</span>
          <span class="a4-cell-val font-bold">${session}</span>
        </div>
        <div class="a4-banner-cell highlight-cell">
          <span class="a4-cell-lbl">PROGRAMME APPLIED FOR:</span>
          <span class="a4-cell-val font-bold">${programme}</span>
        </div>
        <div class="a4-banner-cell">
          <span class="a4-cell-lbl">OFFICIAL STUDY CENTRE / CAMPUS:</span>
          <span class="a4-cell-val font-bold">${studyCentre}</span>
        </div>
      </div>

      <!-- SECTION 1: PERSONAL & BIO-DATA -->
      <div class="a4-section">
        <div class="a4-sec-hdr">1. CANDIDATE BIO-DATA &amp; CONTACT INFORMATION</div>
        <div class="a4-table-grid">
          <div class="a4-row full-width">
            <span class="a4-lbl">Full Name:</span>
            <span class="a4-val font-bold font-primary">${fullName}</span>
          </div>
          <div class="a4-row-split">
            <div class="a4-cell"><span class="a4-lbl">Gender:</span><span class="a4-val">${gender}</span></div>
            <div class="a4-cell"><span class="a4-lbl">Date of Birth:</span><span class="a4-val">${dob}</span></div>
            <div class="a4-cell"><span class="a4-lbl">Marital Status:</span><span class="a4-val">${marital}</span></div>
            <div class="a4-cell"><span class="a4-lbl">Nationality:</span><span class="a4-val">${nationality}</span></div>
          </div>
          <div class="a4-row-split">
            <div class="a4-cell"><span class="a4-lbl">State of Origin:</span><span class="a4-val">${stateOrigin}</span></div>
            <div class="a4-cell"><span class="a4-lbl">LGA:</span><span class="a4-val">${lga}</span></div>
            <div class="a4-cell"><span class="a4-lbl">Phone Number:</span><span class="a4-val">${phone}</span></div>
            <div class="a4-cell"><span class="a4-lbl">WhatsApp:</span><span class="a4-val">${whatsapp}</span></div>
          </div>
          <div class="a4-row-split-2">
            <div class="a4-cell-60"><span class="a4-lbl">Residential Address:</span><span class="a4-val">${address}</span></div>
            <div class="a4-cell-40"><span class="a4-lbl">Email Address:</span><span class="a4-val">${email}</span></div>
          </div>
        </div>
      </div>

      <!-- SECTION 2: ACADEMIC QUALIFICATIONS -->
      <div class="a4-section">
        <div class="a4-sec-hdr">2. PREVIOUS EDUCATIONAL BACKGROUND</div>
        <div class="a4-table-grid">
          <div class="a4-row-split">
            <div class="a4-cell"><span class="a4-lbl">Highest Qualification:</span><span class="a4-val font-bold">${qual}</span></div>
            <div class="a4-cell"><span class="a4-lbl">Year of Graduation:</span><span class="a4-val">${gradYear}</span></div>
            <div class="a4-cell" style="flex:2;"><span class="a4-lbl">Institution Attended:</span><span class="a4-val">${inst}</span></div>
          </div>
          ${(course && course !== 'N/A') ? `
          <div class="a4-row full-width">
            <span class="a4-lbl">Course / Discipline:</span>
            <span class="a4-val">${course}</span>
          </div>` : ''}
        </div>
      </div>

      <!-- SECTION 3: CHURCH & SPIRITUAL PROFILE -->
      <div class="a4-section">
        <div class="a4-sec-hdr">3. ECCLESIASTICAL &amp; PASTORAL INFORMATION</div>
        <div class="a4-table-grid">
          <div class="a4-row-split">
            <div class="a4-cell"><span class="a4-lbl">Home Church:</span><span class="a4-val">${church}</span></div>
            <div class="a4-cell"><span class="a4-lbl">Denomination:</span><span class="a4-val">${denom}</span></div>
            <div class="a4-cell"><span class="a4-lbl">Current Role:</span><span class="a4-val">${role}</span></div>
          </div>
          <div class="a4-row-split">
            <div class="a4-cell" style="flex:2;"><span class="a4-lbl">Pastor / Spiritual Overseer:</span><span class="a4-val">${pastor}</span></div>
            <div class="a4-cell"><span class="a4-lbl">Pastor's Phone:</span><span class="a4-val">${pastorPhone}</span></div>
          </div>
        </div>
      </div>

      <!-- SECTION 4: NEXT OF KIN -->
      <div class="a4-section">
        <div class="a4-sec-hdr">4. NEXT OF KIN / EMERGENCY CONTACT</div>
        <div class="a4-table-grid">
          <div class="a4-row-split">
            <div class="a4-cell"><span class="a4-lbl">Full Name:</span><span class="a4-val">${kinName}</span></div>
            <div class="a4-cell"><span class="a4-lbl">Relationship:</span><span class="a4-val">${kinRel}</span></div>
            <div class="a4-cell"><span class="a4-lbl">Contact Phone:</span><span class="a4-val">${kinPhone}</span></div>
          </div>
          ${(kinAddress && kinAddress !== 'N/A') ? `
          <div class="a4-row full-width">
            <span class="a4-lbl">Address:</span>
            <span class="a4-val">${kinAddress}</span>
          </div>` : ''}
        </div>
      </div>

      <!-- SECTION 5: DECLARATION & SIGNATURE -->
      <div class="a4-section a4-decl-sec">
        <div class="a4-sec-hdr">5. CANDIDATE DECLARATION &amp; REGISTRY ENDORSEMENT</div>
        <div class="a4-decl-text">
          I declare that all information supplied on this application form is genuine, accurate, and complete. 
          I commit to abide by the academic statutes, spiritual discipline, and institutional regulations of Divine Mandate Bible Institute under the motto <em>"Fear of God without a Mess."</em>
        </div>

        <div class="a4-sign-row">
          <div class="a4-sign-col">
            <div class="a4-sign-line"></div>
            <div class="a4-sign-label">Candidate Signature &amp; Date</div>
            <div class="a4-sign-sub">${fullName}</div>
          </div>
          <div class="a4-sign-stamp-col">
            <div class="a4-official-stamp">
              <span class="stamp-line-1">DIMABIN REGISTRY</span>
              <span class="stamp-line-2">ELECTRONICALLY FILED</span>
              <span class="stamp-line-3">${appId}</span>
            </div>
          </div>
          <div class="a4-sign-col">
            <div class="a4-sign-line"></div>
            <div class="a4-sign-label">Academic Registry Seal &amp; Officer</div>
            <div class="a4-sign-sub">Office of the Registrar, DIMABIN</div>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="a4-footer">
        <div>Generated via Divine Mandate Bible Institute Portal · Verification: https://dimabinportal.com.ng/admissions.html#check-status</div>
        <div class="font-bold">A4 Page 1 of 1 · Official Document</div>
      </div>
    </div>
  `;
}

/**
 * Injects self-contained styling if not already present in DOM
 */
export function ensureDocumentStyles() {
  if (document.getElementById('dimabin-application-print-styles')) return;
  const styleEl = document.createElement('style');
  styleEl.id = 'dimabin-application-print-styles';
  styleEl.textContent = `
    #dimabin-print-root {
      display: none;
    }
    .dimabin-a4-sheet {
      width: 100%;
      max-width: 794px;
      min-height: 1115px;
      max-height: 1123px;
      box-sizing: border-box;
      padding: 16px 20px 14px 20px;
      background: #ffffff;
      color: #1e293b;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.35;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 1px solid #cbd5e1;
      position: relative;
      overflow: hidden;
    }
    .a4-header {
      display: flex;
      align-items: center;
      gap: 14px;
      border-bottom: 2px solid #1F3C82;
      padding-bottom: 8px;
      margin-bottom: 6px;
    }
    .a4-logo-wrap {
      width: 60px;
      height: 60px;
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
      font-size: 17px;
      font-weight: 800;
      color: #1F3C82;
      letter-spacing: 0.02em;
      margin: 0 0 2px 0;
      line-height: 1.15;
    }
    .a4-inst-subtitle {
      font-size: 9.5px;
      font-weight: 700;
      color: #0F172A;
      letter-spacing: 0.05em;
      margin-bottom: 2px;
    }
    .a4-motto {
      font-size: 9px;
      font-weight: 800;
      color: #B45309;
      letter-spacing: 0.04em;
      margin-bottom: 2px;
    }
    .a4-contact-bar {
      font-size: 8.5px;
      color: #64748B;
      line-height: 1.2;
    }
    .a4-title-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #1F3C82;
      color: #ffffff;
      padding: 5px 10px;
      border-radius: 4px;
      margin-bottom: 6px;
    }
    .a4-doc-badge {
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.08em;
      background: #F5B800;
      color: #0F172A;
      padding: 2px 6px;
      border-radius: 2px;
    }
    .a4-doc-title {
      font-size: 12.5px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .a4-meta-pills {
      display: flex;
      gap: 8px;
      font-size: 9px;
    }
    .a4-pill-item {
      background: rgba(255, 255, 255, 0.15);
      padding: 1px 6px;
      border-radius: 3px;
    }
    .a4-status-pill {
      background: #16A34A;
      color: #ffffff;
      font-weight: 700;
    }
    .a4-banner-grid {
      display: grid;
      grid-template-columns: 1fr 1.6fr 1.4fr;
      gap: 6px;
      margin-bottom: 6px;
    }
    .a4-banner-cell {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 3px;
      padding: 4px 8px;
      display: flex;
      flex-direction: column;
    }
    .a4-banner-cell.highlight-cell {
      background: #EEF3FF;
      border-color: #BFDBFE;
    }
    .a4-cell-lbl {
      font-size: 7.5px;
      font-weight: 700;
      color: #64748B;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 1px;
    }
    .a4-cell-val {
      font-size: 9.5px;
      color: #1F3C82;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .a4-section {
      border: 1px solid #E2E8F0;
      border-radius: 3px;
      margin-bottom: 6px;
      background: #ffffff;
      overflow: hidden;
    }
    .a4-sec-hdr {
      background: #F1F5F9;
      color: #1F3C82;
      font-size: 8.5px;
      font-weight: 800;
      letter-spacing: 0.05em;
      padding: 3px 8px;
      border-bottom: 1px solid #E2E8F0;
      text-transform: uppercase;
    }
    .a4-table-grid {
      padding: 4px 8px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .a4-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
    .a4-row.full-width {
      width: 100%;
    }
    .a4-row-split {
      display: flex;
      width: 100%;
      gap: 8px;
    }
    .a4-row-split .a4-cell {
      flex: 1;
      display: flex;
      align-items: baseline;
      gap: 4px;
      min-width: 0;
    }
    .a4-row-split-2 {
      display: flex;
      width: 100%;
      gap: 8px;
    }
    .a4-cell-60 {
      flex: 1.4;
      display: flex;
      align-items: baseline;
      gap: 4px;
      min-width: 0;
    }
    .a4-cell-40 {
      flex: 1;
      display: flex;
      align-items: baseline;
      gap: 4px;
      min-width: 0;
    }
    .a4-lbl {
      font-size: 8px;
      font-weight: 700;
      color: #64748B;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .a4-val {
      font-size: 9px;
      color: #0F172A;
      word-break: break-word;
    }
    .font-bold {
      font-weight: 700;
    }
    .font-primary {
      color: #1F3C82;
      font-size: 9.5px;
    }
    .a4-decl-sec {
      background: #FAFAFA;
    }
    .a4-decl-text {
      font-size: 7.8px;
      color: #475569;
      line-height: 1.35;
      padding: 4px 8px;
      border-bottom: 1px dashed #E2E8F0;
    }
    .a4-sign-row {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      padding: 8px 12px 6px 12px;
      gap: 12px;
    }
    .a4-sign-col {
      flex: 1;
      text-align: center;
    }
    .a4-sign-line {
      border-bottom: 1px solid #334155;
      width: 80%;
      margin: 0 auto 3px auto;
    }
    .a4-sign-label {
      font-size: 7.5px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .a4-sign-sub {
      font-size: 8px;
      font-weight: 600;
      color: #1F3C82;
      margin-top: 1px;
    }
    .a4-sign-stamp-col {
      flex: 0.9;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .a4-official-stamp {
      border: 1.5px dashed #D97706;
      border-radius: 4px;
      padding: 3px 6px;
      text-align: center;
      color: #92400E;
      font-size: 7px;
      font-weight: 800;
      letter-spacing: 0.05em;
      background: #FFFBEB;
      display: flex;
      flex-direction: column;
      line-height: 1.25;
    }
    .stamp-line-2 {
      font-size: 7.5px;
      color: #B45309;
    }
    .stamp-line-3 {
      font-size: 8px;
      color: #1F3C82;
    }
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
    @page {
      size: A4 portrait;
      margin: 6mm 8mm;
    }
    @media print {
      html, body {
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: auto !important;
        overflow: visible !important;
      }
      body > *:not(#dimabin-print-root) {
        display: none !important;
      }
      #dimabin-print-root {
        display: block !important;
        position: static !important;
        width: 100% !important;
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
        height: auto !important;
        min-height: 0 !important;
        max-height: 100% !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        margin: 0 !important;
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
  if (!app || (!app.applicationId && !app.fullName)) {
    throw new Error('Application record is missing or incomplete.');
  }

  // Ensure styles & mount document into print container
  mountPrintableApplication(app);

  // Trigger print
  window.print();
}

/**
 * Download Application Form as PDF
 * Uses html2canvas + jsPDF to produce an exact 1-page A4 PDF file directly
 */
export async function downloadApplicationPdf(app, onProgress) {
  if (!app || (!app.applicationId && !app.fullName)) {
    throw new Error('Application record is missing or incomplete.');
  }

  ensureDocumentStyles();

  if (typeof onProgress === 'function') {
    onProgress('Preparing document...');
  }

  // Create an off-screen render container with exact A4 dimensions at 96 DPI (794px x 1123px)
  const renderWrap = document.createElement('div');
  renderWrap.id = 'dimabin-pdf-render-wrap';
  renderWrap.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: 794px;
    height: 1123px;
    background: #ffffff;
    z-index: -9999;
    overflow: hidden;
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

    // Dynamic import to avoid holding or stalling module graph during dashboard / portal boot
    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default || html2canvasModule;
    const { jsPDF } = await import('jspdf');

    if (typeof onProgress === 'function') {
      onProgress('Generating high-resolution document...');
    }

    // Target the sheet inside
    const sheetEl = renderWrap.querySelector('#dimabin-a4-sheet') || renderWrap;

    // Wait a moment for any assets to settle
    await new Promise((r) => setTimeout(r, 150));

    const canvas = await html2canvas(sheetEl, {
      scale: 2, // High resolution (retina 192dpi equivalent)
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      height: 1123,
      windowWidth: 794,
      windowHeight: 1123
    });

    if (typeof onProgress === 'function') {
      onProgress('Creating PDF file...');
    }

    // A4 dimensions in mm: 210mm x 297mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

    const cleanId = sanitizeFileNameId(app.applicationId || 'DIMABIN');
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
