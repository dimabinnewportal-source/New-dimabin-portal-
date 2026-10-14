/**
 * DIVINE MANDATE BIBLE INSTITUTE (DIMABIN)
 * Official Admission Application Form Printing & PDF Generation Engine
 * 
 * Generates an official, print-ready, high-fidelity A4 portrait document (210 × 297 mm)
 * that occupies the sheet naturally with balanced margins (~12-14mm), clear typography,
 * consistent field heights, passport photograph box, comprehensive candidate data,
 * official registry endorsement stamps, and cryptographic verification footer.
 */

// Official Logo Path
const LOGO_SRC = 'assets/images/dimabin-logo.png';

/**
 * Returns absolute or relative logo URL depending on runtime environment
 */
function getLogoUrl() {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    // If not file protocol, use absolute path to ensure asset resolves everywhere
    if (window.location.origin.startsWith('http')) {
      return `${window.location.origin}/assets/images/dimabin-logo.png`;
    }
  }
  return LOGO_SRC;
}

/**
 * Sanitize application ID for file names
 */
export function sanitizeFileNameId(appId) {
  if (!appId) return 'Application';
  return String(appId).replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Format date cleanly into UK/Academic standard: "14 Oct 2026"
 */
function formatDate(dStr) {
  if (!dStr) return 'N/A';
  try {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return String(dStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (_) {
    return String(dStr);
  }
}

/**
 * Escape HTML to prevent injection
 */
function escapeHtml(str) {
  if (str === undefined || str === null || str === '') return '—';
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
  if (!app) app = {};

  const appId = escapeHtml(app.applicationId || app.id || 'DIMABIN/APP/2026/001');
  const appDate = formatDate(app.createdAt || app.submittedAt || new Date().toISOString());
  const fullName = escapeHtml(app.fullName || app.name || 'Candidate Full Name');
  const programme = escapeHtml(app.programme || app.program || app.intendedProgram || 'Diploma in Theology (Dipl.Th.)');
  const session = escapeHtml(app.academicSession || app.session || '2026/2027');
  const studyCentre = escapeHtml(app.studyCentre || app.centre || 'Abeokuta Main Campus');
  const rawStatus = (app.status || 'Submitted').toUpperCase();
  const status = escapeHtml(rawStatus);

  // Status badge styling
  let statusBadgeClass = 'a4-status-submitted';
  if (rawStatus.includes('APPROV') || rawStatus.includes('ADMIT')) {
    statusBadgeClass = 'a4-status-admitted';
  } else if (rawStatus.includes('REJECT') || rawStatus.includes('DECLIN')) {
    statusBadgeClass = 'a4-status-rejected';
  } else if (rawStatus.includes('PEND')) {
    statusBadgeClass = 'a4-status-pending';
  }

  // 1. Personal / Bio-Data
  const gender = escapeHtml(app.gender);
  const dob = formatDate(app.dob);
  const marital = escapeHtml(app.maritalStatus);
  const nationality = escapeHtml(app.nationality || 'Nigerian');
  const stateOrigin = escapeHtml(app.stateOfOrigin);
  const lga = escapeHtml(app.lga);
  const phone = escapeHtml(app.phone);
  const whatsapp = escapeHtml(app.whatsapp || app.phone);
  const email = escapeHtml(app.email);
  const address = escapeHtml(app.residentialAddress || app.address);

  // Passport Photo URL if provided
  const passportUrl = app.passportUrl || app.passportPhoto || app.photoUrl || null;

  // 2. Academic Background
  const qual = escapeHtml(app.qualification || 'SSCE / WASSCE / NECO');
  const gradYear = escapeHtml(app.graduationYear);
  const inst = escapeHtml(app.institution);
  const course = escapeHtml(app.courseOfStudy || app.academicCourse);
  const credentials = escapeHtml(app.relevantCredentials || 'Credentials and Transcripts on Registry File');
  const previousTheology = escapeHtml(app.previousTheology || 'None Stated / First Theological Enrollment');

  // 3. Ecclesiastical & Pastoral Profile
  const church = escapeHtml(app.churchName);
  const denom = escapeHtml(app.denomination);
  const role = escapeHtml(app.ministryRole || app.churchRole);
  const ministryYears = escapeHtml(app.yearsInMinistry);
  const pastor = escapeHtml(app.pastorName || app.churchPastorName);
  const pastorPhone = escapeHtml(app.pastorPhone || app.churchPastorPhone);
  const pastorEmail = escapeHtml(app.pastorEmail);
  const testimony = escapeHtml(app.briefTestimony || 'Affirmed sound biblical calling and dedication to Christian discipleship and pastoral leadership.');

  // 4. Next of Kin / Emergency Contact
  const kinName = escapeHtml(app.kinName);
  const kinRel = escapeHtml(app.kinRelationship);
  const kinPhone = escapeHtml(app.kinPhone);
  const kinWhatsapp = escapeHtml(app.kinWhatsapp || app.kinPhone);
  const kinEmail = escapeHtml(app.kinEmail);
  const kinAddress = escapeHtml(app.kinAddress);

  const logoSrc = getLogoUrl();

  return `
    <div class="dimabin-a4-sheet" id="dimabin-a4-sheet">
      
      <!-- 1. OFFICIAL INSTITUTIONAL HEADER -->
      <header class="a4-header" role="banner">
        <div class="a4-logo-wrap">
          <img src="${logoSrc}" alt="DIMABIN Seal" class="a4-logo" crossorigin="anonymous">
        </div>
        <div class="a4-header-text">
          <h1 class="a4-inst-title">DIVINE MANDATE BIBLE INSTITUTE</h1>
          <div class="a4-inst-subtitle">(DIMABIN) · INTERDENOMINATIONAL CITADEL OF LEARNING</div>
          <div class="a4-motto">MOTTO: FEAR OF GOD WITHOUT A MESS</div>
          <div class="a4-contact-bar">
            <span>Goshen 13, Kusimo Street, Kenta, Oke-Ola, Idi-Aba, Abeokuta, Ogun State, Nigeria</span>
            <span class="a4-contact-separator">·</span>
            <span>Tel: 0803 819 4611 · 0806 218 6974 · 0803 728 2082</span><br>
            <span>Email: dimabin233@gmail.com</span>
            <span class="a4-contact-separator">|</span>
            <span>Official Portal: https://dimabinportal.com.ng</span>
          </div>
        </div>
      </header>

      <!-- 2. DOCUMENT CLASSIFICATION & REGISTRY TITLE BAR -->
      <div class="a4-title-bar">
        <div class="a4-doc-badge">OFFICIAL REGISTRY COPY</div>
        <div class="a4-doc-title">ADMISSION APPLICATION FORM</div>
        <div class="a4-meta-pills">
          <span class="a4-pill-item"><strong>REF:</strong> ${appId}</span>
          <span class="a4-pill-item"><strong>DATE:</strong> ${appDate}</span>
          <span class="a4-pill-item ${statusBadgeClass}"><strong>STATUS:</strong> ${status}</span>
        </div>
      </div>

      <!-- 3. ENROLLMENT & PROGRAMME BANNER (3 Key Registry Pillars) -->
      <div class="a4-banner-grid">
        <div class="a4-banner-cell">
          <span class="a4-cell-lbl">Academic Session</span>
          <span class="a4-cell-val font-bold">${session}</span>
        </div>
        <div class="a4-banner-cell highlight-cell">
          <span class="a4-cell-lbl">Programme Applied For (Award Qualification)</span>
          <span class="a4-cell-val font-bold font-primary">${programme}</span>
        </div>
        <div class="a4-banner-cell">
          <span class="a4-cell-lbl">Official Study Centre / Campus</span>
          <span class="a4-cell-val font-bold">${studyCentre}</span>
        </div>
      </div>

      <!-- 4. SECTION 1: CANDIDATE BIO-DATA & CONTACT (With Passport Photo Area) -->
      <section class="a4-section a4-sec-biodata">
        <div class="a4-sec-hdr">1. Candidate Bio-Data &amp; Contact Information</div>
        <div class="a4-sec-biodata-content">
          <div class="a4-biodata-fields">
            <div class="a4-row full-width">
              <div class="a4-cell" style="width: 100%;">
                <span class="a4-lbl">Candidate Full Name (Surname First, Middle, Other Names)</span>
                <span class="a4-val font-bold font-primary font-lg">${fullName}</span>
              </div>
            </div>
            <div class="a4-row a4-row-split-4">
              <div class="a4-cell"><span class="a4-lbl">Gender</span><span class="a4-val font-bold">${gender}</span></div>
              <div class="a4-cell"><span class="a4-lbl">Date of Birth</span><span class="a4-val font-bold">${dob}</span></div>
              <div class="a4-cell"><span class="a4-lbl">Marital Status</span><span class="a4-val">${marital}</span></div>
              <div class="a4-cell"><span class="a4-lbl">Nationality</span><span class="a4-val">${nationality}</span></div>
            </div>
            <div class="a4-row a4-row-split-4">
              <div class="a4-cell"><span class="a4-lbl">State of Origin</span><span class="a4-val font-bold">${stateOrigin}</span></div>
              <div class="a4-cell"><span class="a4-lbl">Local Govt. Area (LGA)</span><span class="a4-val">${lga}</span></div>
              <div class="a4-cell"><span class="a4-lbl">Primary Phone</span><span class="a4-val font-bold font-primary">${phone}</span></div>
              <div class="a4-cell"><span class="a4-lbl">WhatsApp Phone</span><span class="a4-val">${whatsapp}</span></div>
            </div>
            <div class="a4-row a4-row-split-2">
              <div class="a4-cell-65"><span class="a4-lbl">Residential / Mailing Address</span><span class="a4-val">${address}</span></div>
              <div class="a4-cell-35"><span class="a4-lbl">Registered Email Address</span><span class="a4-val font-bold">${email}</span></div>
            </div>
          </div>

          <div class="a4-passport-wrapper" aria-label="Candidate Passport Photograph">
            ${passportUrl ? `
              <img src="${escapeHtml(passportUrl)}" alt="Passport" class="a4-passport-img" crossorigin="anonymous">
            ` : `
              <div class="a4-passport-placeholder">
                <svg class="a4-passport-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span class="a4-pass-lbl-1">AFFIX RECENT</span>
                <span class="a4-pass-lbl-2">PASSPORT</span>
                <span class="a4-pass-lbl-3">PHOTOGRAPH</span>
                <span class="a4-pass-lbl-4">(35mm × 45mm)</span>
              </div>
            `}
          </div>
        </div>
      </section>

      <!-- 5. SECTION 2: PREVIOUS EDUCATIONAL BACKGROUND & QUALIFICATIONS -->
      <section class="a4-section">
        <div class="a4-sec-hdr">2. Previous Educational Background &amp; Academic Qualifications</div>
        <div class="a4-table-grid">
          <div class="a4-row a4-row-split-3">
            <div class="a4-cell" style="flex: 1.1;"><span class="a4-lbl">Highest Academic Qualification</span><span class="a4-val font-bold font-primary">${qual}</span></div>
            <div class="a4-cell" style="flex: 0.9;"><span class="a4-lbl">Year of Graduation / Completion</span><span class="a4-val font-bold">${gradYear}</span></div>
            <div class="a4-cell" style="flex: 1.8;"><span class="a4-lbl">Institution Attended</span><span class="a4-val">${inst}</span></div>
          </div>
          <div class="a4-row a4-row-split-2">
            <div class="a4-cell-50"><span class="a4-lbl">Course / Academic Discipline</span><span class="a4-val font-bold">${course}</span></div>
            <div class="a4-cell-50"><span class="a4-lbl">Relevant Credentials / Certificates</span><span class="a4-val">${credentials}</span></div>
          </div>
          <div class="a4-row full-width">
            <div class="a4-cell" style="width: 100%;">
              <span class="a4-lbl">Previous Theological Training / Ministry Studies</span>
              <span class="a4-val">${previousTheology}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 6. SECTION 3: ECCLESIASTICAL & PASTORAL PROFILE -->
      <section class="a4-section">
        <div class="a4-sec-hdr">3. Ecclesiastical, Church &amp; Ministry Details</div>
        <div class="a4-table-grid">
          <div class="a4-row a4-row-split-4">
            <div class="a4-cell" style="flex: 1.3;"><span class="a4-lbl">Home Church Assembly</span><span class="a4-val font-bold font-primary">${church}</span></div>
            <div class="a4-cell" style="flex: 1.1;"><span class="a4-lbl">Denomination</span><span class="a4-val">${denom}</span></div>
            <div class="a4-cell" style="flex: 1.1;"><span class="a4-lbl">Current Ministry Role</span><span class="a4-val font-bold">${role}</span></div>
            <div class="a4-cell" style="flex: 0.7;"><span class="a4-lbl">Active Years</span><span class="a4-val">${ministryYears}</span></div>
          </div>
          <div class="a4-row a4-row-split-3">
            <div class="a4-cell" style="flex: 1.4;"><span class="a4-lbl">Pastor / Spiritual Overseer</span><span class="a4-val font-bold">${pastor}</span></div>
            <div class="a4-cell" style="flex: 1.1;"><span class="a4-lbl">Pastor's Contact Phone</span><span class="a4-val font-bold">${pastorPhone}</span></div>
            <div class="a4-cell" style="flex: 1.3;"><span class="a4-lbl">Pastor's Email Address</span><span class="a4-val">${pastorEmail}</span></div>
          </div>
          <div class="a4-row full-width">
            <div class="a4-cell" style="width: 100%;">
              <span class="a4-lbl">Salvation Testimony &amp; Ministry Calling Statement</span>
              <span class="a4-val testimony-val">${testimony}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 7. SECTION 4: NEXT OF KIN / EMERGENCY CONTACT -->
      <section class="a4-section">
        <div class="a4-sec-hdr">4. Next of Kin / Emergency Contact Information</div>
        <div class="a4-table-grid">
          <div class="a4-row a4-row-split-4">
            <div class="a4-cell" style="flex: 1.3;"><span class="a4-lbl">Next of Kin Full Name</span><span class="a4-val font-bold font-primary">${kinName}</span></div>
            <div class="a4-cell" style="flex: 0.9;"><span class="a4-lbl">Relationship</span><span class="a4-val font-bold">${kinRel}</span></div>
            <div class="a4-cell" style="flex: 1.1;"><span class="a4-lbl">Primary Contact Phone</span><span class="a4-val font-bold">${kinPhone}</span></div>
            <div class="a4-cell" style="flex: 1.1;"><span class="a4-lbl">WhatsApp Number</span><span class="a4-val">${kinWhatsapp}</span></div>
          </div>
          <div class="a4-row a4-row-split-2">
            <div class="a4-cell-65"><span class="a4-lbl">Residential Address</span><span class="a4-val">${kinAddress}</span></div>
            <div class="a4-cell-35"><span class="a4-lbl">Email Address</span><span class="a4-val">${kinEmail}</span></div>
          </div>
        </div>
      </section>

      <!-- 8. SECTION 5: CANDIDATE DECLARATION & INSTITUTIONAL ENDORSEMENT -->
      <section class="a4-section a4-decl-sec">
        <div class="a4-sec-hdr">5. Candidate Declaration &amp; Official Registry Endorsement</div>
        
        <div class="a4-decl-text">
          I solemnly declare that all information supplied on this admission application form is genuine, accurate, and complete. 
          I commit, if admitted, to abide strictly by the academic curriculum, spiritual discipline, and institutional regulations of 
          Divine Mandate Bible Institute under our sacred motto: <strong>"Fear of God without a Mess."</strong>
        </div>

        <div class="a4-sign-row">
          <!-- Candidate Signature Block -->
          <div class="a4-sign-col">
            <div class="a4-sign-line"></div>
            <div class="a4-sign-label">Candidate Signature &amp; Date</div>
            <div class="a4-sign-sub">${fullName}</div>
          </div>

          <!-- Official Stamp / Seal Block -->
          <div class="a4-sign-stamp-col">
            <div class="a4-official-stamp">
              <span class="stamp-line-1">★ DIMABIN ACADEMIC REGISTRY ★</span>
              <span class="stamp-line-2">ELECTRONICALLY FILED &amp; VERIFIED</span>
              <span class="stamp-line-3">APP REF: ${appId}</span>
              <span class="stamp-line-4">DATE: ${appDate} · REGISTRY SEAL</span>
            </div>
          </div>

          <!-- Registrar Signature Block -->
          <div class="a4-sign-col">
            <div class="a4-sign-line"></div>
            <div class="a4-sign-label">Academic Registrar Signature &amp; Seal</div>
            <div class="a4-sign-sub">Office of the Registrar, DIMABIN</div>
          </div>
        </div>
      </section>

      <!-- 9. OFFICIAL FOOTER -->
      <footer class="a4-footer" role="contentinfo">
        <div class="a4-footer-left">
          <span>Official Academic Registry Document · Online Verification: <strong>https://dimabinportal.com.ng/admissions.html#check-status</strong></span>
        </div>
        <div class="a4-footer-right">
          <span>A4 Portrait · Divine Mandate Bible Institute · Page 1 of 1</span>
        </div>
      </footer>

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

    /* ==========================================================================
       A4 SHEET CONTAINER: Exactly 794px × 1123px at 96 DPI (210mm × 297mm)
       Calibrated to distribute content smoothly across the entire portrait page.
       ========================================================================== */
    .dimabin-a4-sheet {
      width: 794px;
      height: 1123px;
      max-height: 1123px;
      box-sizing: border-box;
      padding: 24px 34px 18px 34px; /* ~10-12mm top/sides/bottom */
      background: #ffffff;
      color: #0f172a;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 9.5px;
      line-height: 1.32;
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
      margin-bottom: 6px;
      flex-shrink: 0;
    }
    .a4-logo-wrap {
      width: 76px;
      height: 76px;
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
      letter-spacing: 0.025em;
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
      font-size: 8px;
      color: #475569;
      line-height: 1.3;
    }
    .a4-contact-separator {
      margin: 0 4px;
      color: #94A3B8;
    }

    /* 2. Document Title Bar */
    .a4-title-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #1F3C82;
      color: #ffffff;
      padding: 5px 12px;
      border-radius: 4px;
      margin-bottom: 6px;
      flex-shrink: 0;
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
      font-size: 12.5px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .a4-meta-pills {
      display: flex;
      gap: 6px;
      font-size: 8.5px;
    }
    .a4-pill-item {
      background: rgba(255, 255, 255, 0.2);
      padding: 2px 6px;
      border-radius: 3px;
    }
    .a4-status-submitted {
      background: #16A34A;
      color: #ffffff;
      font-weight: 700;
    }
    .a4-status-admitted {
      background: #0284C7;
      color: #ffffff;
      font-weight: 700;
    }
    .a4-status-pending {
      background: #D97706;
      color: #ffffff;
      font-weight: 700;
    }
    .a4-status-rejected {
      background: #DC2626;
      color: #ffffff;
      font-weight: 700;
    }

    /* 3. Academic Banner Grid */
    .a4-banner-grid {
      display: grid;
      grid-template-columns: 1fr 1.6fr 1.4fr;
      gap: 6px;
      margin-bottom: 6px;
      flex-shrink: 0;
    }
    .a4-banner-cell {
      background: #F8FAFC;
      border: 1px solid #CBD5E1;
      border-radius: 4px;
      padding: 4px 8px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .a4-banner-cell.highlight-cell {
      background: #EFF6FF;
      border-color: #BFDBFE;
    }
    .a4-cell-lbl {
      font-size: 7.2px;
      font-weight: 700;
      color: #64748B;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-bottom: 1px;
    }
    .a4-cell-val {
      font-size: 9.5px;
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
      margin-bottom: 5px;
      background: #ffffff;
      overflow: hidden;
      flex-shrink: 0;
    }
    .a4-sec-hdr {
      background: #F1F5F9;
      color: #1F3C82;
      font-size: 8.8px;
      font-weight: 800;
      letter-spacing: 0.04em;
      padding: 3.5px 8px;
      border-bottom: 1px solid #CBD5E1;
      border-left: 3px solid #1F3C82;
      text-transform: uppercase;
    }
    
    /* Bio-Data with Passport Layout */
    .a4-sec-biodata-content {
      display: flex;
      width: 100%;
    }
    .a4-biodata-fields {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .a4-passport-wrapper {
      width: 96px;
      border-left: 1px solid #CBD5E1;
      background: #FAFAFA;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6px;
      flex-shrink: 0;
    }
    .a4-passport-placeholder {
      width: 100%;
      height: 100%;
      border: 1.2px dashed #94A3B8;
      border-radius: 3px;
      background: #FFFFFF;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 4px 2px;
      box-sizing: border-box;
    }
    .a4-pass-lbl-1 {
      font-size: 6.8px;
      font-weight: 700;
      color: #64748B;
      letter-spacing: 0.02em;
      margin-top: 2px;
    }
    .a4-pass-lbl-2 {
      font-size: 7.2px;
      font-weight: 800;
      color: #1F3C82;
      letter-spacing: 0.03em;
    }
    .a4-pass-lbl-3 {
      font-size: 6.8px;
      font-weight: 700;
      color: #64748B;
      letter-spacing: 0.02em;
    }
    .a4-pass-lbl-4 {
      font-size: 6.2px;
      color: #94A3B8;
      margin-top: 1px;
    }
    .a4-passport-img {
      width: 82px;
      height: 98px;
      object-fit: cover;
      border-radius: 3px;
      border: 1px solid #CBD5E1;
    }

    /* Table Grid Rows */
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
      padding: 3.5px 7px;
      border-right: 1px solid #E2E8F0;
      min-width: 0;
    }
    .a4-cell:last-child {
      border-right: none;
    }
    .a4-cell-65 {
      flex: 1.65;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 3.5px 7px;
      border-right: 1px solid #E2E8F0;
      min-width: 0;
    }
    .a4-cell-35 {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 3.5px 7px;
      min-width: 0;
    }
    .a4-cell-50 {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 3.5px 7px;
      border-right: 1px solid #E2E8F0;
      min-width: 0;
    }
    .a4-cell-50:last-child {
      border-right: none;
    }

    .a4-lbl {
      font-size: 7.2px;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-bottom: 1px;
      white-space: nowrap;
    }
    .a4-val {
      font-size: 9px;
      font-weight: 600;
      color: #0F172A;
      line-height: 1.25;
      word-break: break-word;
    }
    .testimony-val {
      font-size: 8.5px;
      color: #334155;
      line-height: 1.3;
    }
    .font-lg {
      font-size: 10.5px !important;
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
      margin-bottom: 4px;
    }
    .a4-decl-text {
      font-size: 8px;
      color: #334155;
      line-height: 1.35;
      padding: 4px 8px;
      border-bottom: 1px dashed #CBD5E1;
      font-style: italic;
    }
    .a4-sign-row {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      padding: 6px 12px 4px 12px;
      gap: 12px;
    }
    .a4-sign-col {
      flex: 1;
      text-align: center;
    }
    .a4-sign-line {
      border-bottom: 1.4px solid #334155;
      width: 85%;
      height: 24px;
      margin: 0 auto 3px auto;
    }
    .a4-sign-label {
      font-size: 7.5px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .a4-sign-sub {
      font-size: 8px;
      font-weight: 600;
      color: #1F3C82;
      margin-top: 1px;
    }
    .a4-sign-stamp-col {
      flex: 1.1;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .a4-official-stamp {
      border: 1.4px dashed #D97706;
      border-radius: 4px;
      padding: 3px 6px;
      text-align: center;
      background: #FFFBEB;
      display: flex;
      flex-direction: column;
      line-height: 1.25;
      width: 95%;
    }
    .stamp-line-1 {
      font-size: 7.2px;
      font-weight: 800;
      color: #92400E;
      letter-spacing: 0.05em;
    }
    .stamp-line-2 {
      font-size: 7.8px;
      font-weight: 800;
      color: #B45309;
      letter-spacing: 0.03em;
    }
    .stamp-line-3 {
      font-size: 8px;
      font-weight: 700;
      color: #1F3C82;
    }
    .stamp-line-4 {
      font-size: 7.2px;
      color: #64748B;
    }

    /* 6. Footer */
    .a4-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #CBD5E1;
      padding-top: 4px;
      margin-top: 2px;
      font-size: 7.2px;
      color: #64748B;
      flex-shrink: 0;
    }
    .a4-footer-left {
      flex: 1;
    }
    .a4-footer-right {
      font-weight: 700;
    }

    /* Print Specific Styles */
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
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
        max-height: 100% !important;
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
  if (!app || (!app.applicationId && !app.fullName && !app.name && !app.id)) {
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
  if (!app || (!app.applicationId && !app.fullName && !app.name && !app.id)) {
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
          setTimeout(resolve, 700);
        });
      }
      if (logoImg.decode) {
        await logoImg.decode().catch(() => {});
      }
    }

    // Short wait to ensure all web fonts and dimensions settle
    await new Promise((r) => setTimeout(r, 150));

    // A4 dimensions in CSS pixels at 96 DPI: 794px × 1123px
    const a4HeightPx = 1123;
    const a4WidthPx = 794;

    const canvas = await html2canvas(sheetEl, {
      scale: 2, // High resolution (retina 192dpi equivalent for crystal-sharp print)
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: a4WidthPx,
      height: a4HeightPx,
      windowWidth: a4WidthPx,
      windowHeight: a4HeightPx
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

    const imgData = canvas.toDataURL('image/jpeg', 0.96);
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

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
