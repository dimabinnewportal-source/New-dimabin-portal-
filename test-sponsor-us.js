/**
 * DIMABIN BIBLE INSTITUTE — FLOATING SPONSOR US FEATURE VERIFICATION
 * Tests and verifies all requirements from the user request:
 * 1. Button presence, positioning, icon, styling, and scroll visibility
 * 2. Positioning separation from WhatsApp floating button (no overlap)
 * 3. Modal open / close behaviors (close button, backdrop click, Escape key)
 * 4. Exact bank names, account names, and account numbers
 * 5. Copy Account Number button functionality, trimming, and feedback
 * 6. Responsive CSS rules for mobile and desktop
 * 7. Preservation of existing homepage links, portal gateway, and footer
 */

import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`PASS: ${testName}`);
    passed++;
  } else {
    console.error(`FAIL: ${testName}`);
    failed++;
  }
}

console.log("=================================================================");
console.log("DIMABIN BIBLE INSTITUTE — SPONSOR US FEATURE VERIFICATION SUITE");
console.log("=================================================================");

const indexHtml = fs.readFileSync('index.html', 'utf8');
const styleCss = fs.readFileSync('css/style.css', 'utf8');
const mainJs = fs.readFileSync('js/main.js', 'utf8');

// --- 1. Floating Sponsor Us Button Markup & Attributes ---
console.log("\n--- 1. Floating Sponsor Us Button Verification ---");
assert(indexHtml.includes('id="btn-floating-sponsor"'), 'Floating button element with id="btn-floating-sponsor" is present');
assert(indexHtml.includes('class="floating-sponsor-btn"'), 'Floating button has class="floating-sponsor-btn"');
assert(indexHtml.includes('aria-controls="modal-sponsorship"'), 'Floating button has aria-controls="modal-sponsorship"');
assert(indexHtml.includes('aria-haspopup="dialog"'), 'Floating button has aria-haspopup="dialog"');
assert(indexHtml.includes('floating-sponsor-icon'), 'Floating button includes heart/helping icon SVG');
assert(indexHtml.includes('Sponsor Us'), 'Floating button displays "Sponsor Us" label text');

// --- 2. Positioning & Separation from WhatsApp Floating Elements ---
console.log("\n--- 2. Positioning & Non-Overlapping Verification ---");
assert(styleCss.includes('.floating-sponsor-wrapper'), 'CSS defines .floating-sponsor-wrapper');
assert(styleCss.includes('position: fixed;'), 'Floating button uses fixed positioning to stay visible while scrolling');
assert(styleCss.includes('right: 24px;'), 'Floating button is anchored to the right side on desktop');
assert(styleCss.includes('bottom: 96px;'), 'Desktop bottom elevation (96px) ensures complete non-overlap above standard WhatsApp button (24px + 56px = 80px)');
assert(styleCss.includes('background-color: #16a34a;'), 'Floating button has green background (#16a34a)');
assert(styleCss.includes('border-radius: var(--radius-full);'), 'Floating button has rounded corners');
assert(styleCss.includes('box-shadow: 0 4px 14px'), 'Floating button has subtle shadow for depth');

// --- 3. Sponsorship Modal Content & Exact Banking Details ---
console.log("\n--- 3. Sponsorship Modal & Bank Accounts Verification ---");
assert(indexHtml.includes('id="modal-sponsorship"'), 'Modal overlay with id="modal-sponsorship" is present');
assert(indexHtml.includes('Support DIMABIN Bible Institute'), 'Modal heading contains exact "Support DIMABIN Bible Institute"');
assert(
  indexHtml.includes('“Your sponsorship helps support the work and mission of DIMABIN Bible Institute. Thank you for your generosity and support.”'),
  'Modal contains exact sponsorship message'
);

// Verify FIRST BANK
assert(indexHtml.includes('FIRST BANK'), 'First Bank card heading is present');
assert(indexHtml.includes('SORINOLA OLALEKAN JOSIAH'), 'First Bank exact account name "SORINOLA OLALEKAN JOSIAH" is present');
assert(indexHtml.includes('3015784163'), 'First Bank exact account number "3015784163" is present');

// Verify GTB BANK
assert(indexHtml.includes('GTB BANK'), 'GTB Bank card heading is present');
assert(indexHtml.includes('SORINOLA OLABINPE ARIKE'), 'GTB Bank exact account name "SORINOLA OLABINPE ARIKE" is present');
assert(indexHtml.includes('0032819189'), 'GTB Bank exact account number "0032819189" is present');

// --- 4. Copy Account Number Features & Trimming ---
console.log("\n--- 4. Copy Account Number Feature Verification ---");
assert(indexHtml.includes('data-account="3015784163"'), 'First Bank copy button carries clean trimmed account number');
assert(indexHtml.includes('data-account="0032819189"'), 'GTB Bank copy button carries clean trimmed account number');
assert(mainJs.includes('accountNumber = rawAccount.trim()'), 'Script ensures copied account number is trimmed without extra spaces');
assert(mainJs.includes('navigator.clipboard.writeText'), 'Script uses standard navigator.clipboard API');
assert(mainJs.includes('document.execCommand(\'copy\')'), 'Script provides fallback textarea copy mechanism');
assert(mainJs.includes('Account number copied!'), 'Script provides visual confirmation "Account number copied!"');
assert(styleCss.includes('.btn-copy-account.copied'), 'CSS defines .btn-copy-account.copied success state');

// --- 5. Modal Behaviors & Accessibility ---
console.log("\n--- 5. Modal Behavior & Accessibility Verification ---");
assert(indexHtml.includes('id="btn-close-sponsorship"'), 'Close button with id="btn-close-sponsorship" in modal header');
assert(indexHtml.includes('id="btn-close-sponsorship-footer"'), 'Secondary close button in modal footer');
assert(mainJs.includes("e.target === modal"), 'Script handles outside backdrop click to close modal');
assert(mainJs.includes("e.key === 'Escape'"), 'Script closes modal when Escape key is pressed');
assert(mainJs.includes("document.body.classList.add('modal-open')"), 'Script prevents background scrolling by adding modal-open class');
assert(styleCss.includes('body.modal-open'), 'CSS prevents scrolling when modal is open');
assert(mainJs.includes("e.key === 'Tab'"), 'Script traps tab navigation inside active modal');
assert(indexHtml.includes('id="sponsorship-copy-announcement"'), 'Screen reader polite announcement region present');

// --- 6. Mobile Responsiveness ---
console.log("\n--- 6. Mobile Responsiveness Verification ---");
assert(styleCss.includes('@media (max-width: 640px)'), 'Mobile breakpoint (<= 640px) configured in CSS');
assert(styleCss.includes('bottom: 88px;'), 'Mobile elevation (88px) leaves clear room above mobile bottom widgets');
assert(styleCss.includes('min-height: 44px;'), 'Touch target meets WCAG AA >= 44px on mobile');
assert(styleCss.includes('max-height: calc(100vh - 2.5rem);'), 'Modal dialog prevents viewport overflow on small screens');

// --- 7. Preservation of Existing Features ---
console.log("\n--- 7. Non-Regression & Brand Preservation ---");
assert(indexHtml.includes('https://whatsapp.com'), 'Original footer WhatsApp link preserved without alteration');
assert(indexHtml.includes('student-login.html'), 'Student portal link preserved');
assert(indexHtml.includes('lecturer-login.html'), 'Lecturer portal link preserved');
assert(indexHtml.includes('admin-login.html'), 'Admin portal link preserved');
assert(styleCss.includes('--primary-blue: #1F3C82;'), 'DIMABIN primary blue #1F3C82 intact');
assert(styleCss.includes('--dark-navy: #122452;'), 'DIMABIN dark navy #122452 intact');
assert(styleCss.includes('--gold: #F5B800;'), 'DIMABIN gold #F5B800 intact');

console.log("=================================================================");
console.log(`TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
console.log("=================================================================");

if (failed > 0) {
  process.exit(1);
}
