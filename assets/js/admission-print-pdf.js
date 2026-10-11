/**
 * DIVINE MANDATE BIBLE INSTITUTE (DIMABIN)
 * Admission Application Form Printing & PDF Generation Service
 * 
 * Generates an official, compact, high-fidelity 1-page A4 document
 * containing only the candidate's verified admission application record.
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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
          <div class="a4-contact-bar">Goshen 13, Kusimo Street, Idi-Aba, Abeokuta, Ogun State, Nigeria · portal: www.dimabin.edu.ng</div>
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
        <div>Generated via Divine Mandate Bible Institute Portal · Verification: admissions.html#check-status</div>
        <div class="font-bold">A4 Page 1 of 1 · Official Document</div>
      </div>
    </div>
  `;
}

/**
 * Ensures the printable container exists and mounts the sheet
 */
export function mountPrintableApplication(app) {
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

  // Mount document into print container
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
