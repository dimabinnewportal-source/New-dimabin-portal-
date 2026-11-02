/**
 * Comprehensive Automated Test Suite:
 * DIMABIN Admissions Duplicate Prevention & Integrity Validation
 */

import { readFileSync } from 'fs';
import {
  normalizeEmail,
  normalizePhoneNumber,
  detectAdmissionsDuplicates,
  DUPLICATE_APPLICATION_ERROR_MSG
} from './assets/js/firebase-backend.js';

console.log('================================================================');
console.log('DIMABIN ADMISSIONS DUPLICATE DETECTION & INTEGRITY TEST SUITE');
console.log('================================================================\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    testsFailed++;
  }
}

// -----------------------------------------------------------------------------
// TEST 1: Email Normalization & Validation
// -----------------------------------------------------------------------------
console.log('[TEST 1] Email Normalization & Format Validation:');
assert(
  normalizeEmail('  beckyolive117@gmail.com ') === 'beckyolive117@gmail.com',
  'Trims leading/trailing whitespace'
);
assert(
  normalizeEmail('BECKYOLIVE117@GMAIL.COM') === 'beckyolive117@gmail.com',
  'Converts mixed / uppercase email to lowercase'
);
try {
  normalizeEmail('not-an-email');
  assert(false, 'Rejects invalid email format');
} catch (e) {
  assert(true, 'Rejects invalid email format');
}

// -----------------------------------------------------------------------------
// TEST 2: Phone Normalization & Canonical Key Generation
// -----------------------------------------------------------------------------
console.log('\n[TEST 2] Phone Normalization & Consistent Formatting:');
const p1 = normalizePhoneNumber('09131120270');
const p2 = normalizePhoneNumber('+234 913 112 0270');
const p3 = normalizePhoneNumber('0913-112-0270');
const p4 = normalizePhoneNumber('2349131120270');

assert(p1.key === '2349131120270', 'Standard 11-digit local phone normalized to 2349131120270 key');
assert(p2.key === '2349131120270', '+234 formatted phone matches key');
assert(p3.key === '2349131120270', 'Hyphenated phone matches key');
assert(p4.key === '2349131120270', '234 prefixed phone matches key');
assert(p1.key === p2.key && p2.key === p3.key && p3.key === p4.key, 'All representations yield identical canonical index key');

try {
  normalizePhoneNumber('123');
  assert(false, 'Rejects phone shorter than 7 digits');
} catch (e) {
  assert(true, 'Rejects phone shorter than 7 digits');
}

// -----------------------------------------------------------------------------
// TEST 3: Exact Error Message Requirement
// -----------------------------------------------------------------------------
console.log('\n[TEST 3] Exact Error Message Verification:');
const expectedMsg = 'An application already exists with this email address or phone number. Please contact the admissions office if you need assistance.';
assert(
  DUPLICATE_APPLICATION_ERROR_MSG === expectedMsg,
  `Error message strictly matches specification: "${expectedMsg}"`
);

// -----------------------------------------------------------------------------
// TEST 4: Existing Backup & Duplicate Auditing
// -----------------------------------------------------------------------------
console.log('\n[TEST 4] Existing Admissions Records & Duplicate Grouping:');
const rawBackup = readFileSync('./admissions-backup.json', 'utf8');
const backupData = JSON.parse(rawBackup);
assert(backupData.length === 96, `Backup contains all 96 original Firestore documents (verified: ${backupData.length})`);

const duplicateGroups = detectAdmissionsDuplicates(backupData);
console.log(`  Found ${duplicateGroups.length} duplicate groups across existing dataset.`);

// Locate group for beckyolive117@gmail.com
const fasholaGroup = duplicateGroups.find(
  (g) => g.identifier.toLowerCase() === 'beckyolive117@gmail.com'
);
assert(Boolean(fasholaGroup), 'Detected duplicate group for Fashola Joshua Monday (beckyolive117@gmail.com)');
assert(fasholaGroup?.totalCount === 73, `Identified exactly 73 submissions for beckyolive117@gmail.com (got: ${fasholaGroup?.totalCount})`);
assert(fasholaGroup?.repeatCount === 72, `Correctly flagged 72 redundant repeats in Fashola group (got: ${fasholaGroup?.repeatCount})`);
assert(fasholaGroup?.original.applicationId === 'DIMABIN/APP/2026/2727', `Preserved earliest submission as original: ${fasholaGroup?.original.applicationId}`);

// -----------------------------------------------------------------------------
// TEST 5: Protection of Approved Records
// -----------------------------------------------------------------------------
console.log('\n[TEST 5] Safety Protection for Approved Applications:');
const peterGroup = duplicateGroups.find((g) => g.identifier === '2348137606078');
assert(Boolean(peterGroup), 'Detected duplicate phone group for Peter David Idowu');
const protectedApproved = peterGroup?.protectedRecords || [];
assert(protectedApproved.length >= 1, 'Approved record is recognized in protectedRecords');
assert(
  protectedApproved.some((r) => r.status === 'approved'),
  'Record with status === "approved" is strictly marked PROTECTED'
);
assert(
  !peterGroup?.safeToDelete.some((r) => r.status === 'approved'),
  'No approved record is included in safeToDelete'
);

// -----------------------------------------------------------------------------
// TEST 6: HTML Form Element Verification
// -----------------------------------------------------------------------------
console.log('\n[TEST 6] Admissions Form Button & UI Verification:');
const admissionsHtml = readFileSync('./admissions.html', 'utf8');
assert(
  admissionsHtml.includes('id="submit-application-btn"'),
  'admissions.html contains id="submit-application-btn" on Submit button'
);
assert(
  admissionsHtml.includes('id="submission-status-msg"'),
  'admissions.html contains #submission-status-msg loading feedback container'
);

// -----------------------------------------------------------------------------
// TEST 7: JavaScript Frontend Submission Guards
// -----------------------------------------------------------------------------
console.log('\n[TEST 7] Frontend Submission Guard in js/main.js:');
const mainJs = readFileSync('./js/main.js', 'utf8');
assert(
  mainJs.includes('let isApplicationSubmitting = false;'),
  'js/main.js declares isApplicationSubmitting concurrency guard'
);
assert(
  mainJs.includes('isApplicationSubmitting = true;'),
  'js/main.js locks submission state on form submit'
);
assert(
  mainJs.includes('submitBtn.disabled = true;'),
  'js/main.js disables submit button immediately'
);
assert(
  mainJs.includes('dimabin_submission_idempotency_key'),
  'js/main.js generates and tracks session idempotency key'
);
assert(
  mainJs.includes('An application already exists with this email address or phone number.'),
  'js/main.js displays the exact required duplicate warning message on duplicate errors'
);

// -----------------------------------------------------------------------------
// TEST 8: Firestore Security Rules Coverage
// -----------------------------------------------------------------------------
console.log('\n[TEST 8] Firestore Security Rules in firestore.rules:');
const rules = readFileSync('./firestore.rules', 'utf8');
assert(
  rules.includes('match /admissions/{admissionId}'),
  'firestore.rules includes match /admissions/{admissionId}'
);
assert(
  rules.includes('match /admissions_unique_index/{indexId}'),
  'firestore.rules includes match /admissions_unique_index/{indexId}'
);
assert(
  rules.includes('match /admissions_contact_exceptions/{exceptionId}'),
  'firestore.rules includes match /admissions_contact_exceptions/{exceptionId}'
);

// -----------------------------------------------------------------------------
// TEST 9: Admin Dashboard Duplicate Management UI
// -----------------------------------------------------------------------------
console.log('\n[TEST 9] Admin Dashboard Duplicate Audit UI:');
const adminHtml = readFileSync('./admin-dashboard.html', 'utf8');
assert(
  adminHtml.includes('id="admissions-duplicates-banner"'),
  'admin-dashboard.html includes #admissions-duplicates-banner'
);
assert(
  adminHtml.includes('id="modal-duplicate-applications"'),
  'admin-dashboard.html includes #modal-duplicate-applications'
);
assert(
  adminHtml.includes('id="btn-cleanup-selected-duplicates"'),
  'admin-dashboard.html includes #btn-cleanup-selected-duplicates button'
);
assert(
  adminHtml.includes('id="form-contact-exception"'),
  'admin-dashboard.html includes contact exception override form'
);

const adminJs = readFileSync('./assets/js/admin-dashboard.js', 'utf8');
assert(
  adminJs.includes('detectAdmissionsDuplicates'),
  'admin-dashboard.js calls detectAdmissionsDuplicates'
);
assert(
  adminJs.includes('cleanupDuplicateApplications'),
  'admin-dashboard.js integrates cleanupDuplicateApplications'
);

console.log('\n================================================================');
console.log(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
console.log('================================================================');

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
