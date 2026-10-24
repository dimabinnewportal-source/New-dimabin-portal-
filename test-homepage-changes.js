/**
 * test-homepage-changes.js
 * Verification of the two requested changes on the DIMABIN homepage:
 * 1. Rector's full name: "Sorinola Olalekan Josiah"
 * 2. Removal of the seated-woman image from the middle section of index.html
 */

import fs from 'fs';
import path from 'path';

console.log('=================================================================');
console.log('DIMABIN BIBLE INSTITUTE — HOMEPAGE CHANGES VERIFICATION SUITE');
console.log('=================================================================');

const htmlPath = path.resolve('index.html');
const cssPath = path.resolve('css/style.css');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`PASS: ${message}`);
    passed++;
  } else {
    console.error(`FAIL: ${message}`);
    failed++;
  }
}

console.log('\n--- CHANGE 1: Rector\'s Full Name Verification ---');
assert(
  htmlContent.includes('<span class="rector-info-name">Sorinola Olalekan Josiah</span>'),
  'The Rector\'s name displays "Sorinola Olalekan Josiah" in full inside .rector-info-name'
);
assert(
  !htmlContent.includes('<span class="rector-info-name">Sorinola J.O.</span>'),
  'The old abbreviated name "Sorinola J.O." has been removed'
);
assert(
  htmlContent.includes('aria-label="Rector Sorinola Olalekan Josiah Initials"'),
  'The aria-label includes the full name "Sorinola Olalekan Josiah"'
);
assert(
  htmlContent.includes('<span>SJ</span>'),
  'The circular avatar monogram initials "SJ" are preserved'
);
assert(
  htmlContent.includes('<div class="rector-avatar-badge" aria-hidden="true">✦</div>'),
  'The rector avatar badge with ✦ is preserved'
);
assert(
  htmlContent.includes('<span class="rector-info-title">Rector, Divine Mandate Bible Institute</span>'),
  'The rector title "Rector, Divine Mandate Bible Institute" is preserved'
);
assert(
  htmlContent.includes('From the Rector\'s Desk'),
  'The "From the Rector\'s Desk" card and quote block are intact'
);

console.log('\n--- CHANGE 2: Removal of the Seated-Woman Image Verification ---');
assert(
  !htmlContent.includes('theology-study.jpg'),
  'The seated-woman image ("theology-study.jpg") is completely removed from index.html'
);
assert(
  !htmlContent.includes('class="program-thumb-box"'),
  'The .program-thumb-box container has been removed from index.html'
);
assert(
  !htmlContent.includes('class="program-thumb-img"'),
  'The .program-thumb-img element has been removed from index.html'
);
assert(
  !htmlContent.includes('class="program-split-grid"'),
  'The .program-split-grid wrapper has been removed so text is no longer constrained to a split column'
);
assert(
  htmlContent.includes('<div class="program-paragraphs">'),
  'The .program-paragraphs text container is preserved and flows naturally'
);
assert(
  htmlContent.includes('Our flagship program provides an extensive biblical framework'),
  'The Diploma in Theology curriculum description text is preserved'
);

console.log('\n--- SAFETY REQUIREMENTS: Preservation of Top Image & Other Elements ---');
assert(
  htmlContent.includes('assets/images/hero-library.jpg'),
  'The top hero background library image ("hero-library.jpg") remains intact'
);
assert(
  htmlContent.includes('class="hero-bg-img"'),
  'The .hero-bg-img element remains in the hero section'
);
assert(
  htmlContent.includes('id="btn-floating-sponsor"'),
  'The floating Sponsor Us button remains intact'
);
assert(
  htmlContent.includes('Support DIMABIN Bible Institute'),
  'The sponsorship modal dialog and bank accounts remain intact'
);
assert(
  htmlContent.includes('href="student-portal.html"') || htmlContent.includes('href="student-login.html"'),
  'Student portal link is preserved'
);
assert(
  htmlContent.includes('href="lecturer-login.html"') || htmlContent.includes('href="lecturer-portal.html"'),
  'Lecturer portal link is preserved'
);
assert(
  htmlContent.includes('href="admin-login.html"') || htmlContent.includes('href="admin-portal.html"'),
  'Admin portal link is preserved'
);

console.log('\n--- Layout & Styling Verification ---');
assert(
  cssContent.includes('.rector-profile'),
  '.rector-profile CSS rules are defined'
);
assert(
  cssContent.includes('width: 170px'),
  '.rector-profile has width: 170px for neat presentation of the full name on desktop'
);
assert(
  cssContent.includes('.program-paragraphs'),
  '.program-paragraphs CSS rules are defined'
);
assert(
  cssContent.includes('max-width: 52rem'),
  '.program-paragraphs has clean max-width and comfortable line spacing'
);

console.log('\n=================================================================');
console.log(`TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
console.log('=================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
