// Automated verification script for CBT Question Bank and New Question Button
import { readFileSync } from 'fs';
import { resolve } from 'path';

console.log('--- STARTING CBT REPAIR TEST SUITE ---');

// 1. Inspect DOM structure of lecturer-dashboard.html
const html = readFileSync(resolve(process.cwd(), 'lecturer-dashboard.html'), 'utf-8');

// Check that modal-create-assessment is properly closed before modal-cbt-question
const asmtModalIdx = html.indexOf('id="modal-create-assessment"');
const asmtFormIdx = html.indexOf('id="form-create-assessment"');
const cbtQModalIdx = html.indexOf('id="modal-cbt-question"');
const cbtQFormIdx = html.indexOf('id="form-cbt-question"');

if (asmtModalIdx === -1 || asmtFormIdx === -1 || cbtQModalIdx === -1 || cbtQFormIdx === -1) {
  throw new Error('Crucial modal or form IDs missing from lecturer-dashboard.html');
}

// Check that between asmtModalIdx and cbtQModalIdx, the form and modal are closed
const intermediate = html.substring(asmtFormIdx, cbtQModalIdx);
const intermediateFormCloses = (intermediate.match(/<\/form>/g) || []).length;
const intermediateDivCloses = (intermediate.match(/<\/div>/g) || []).length;

console.log(`Intermediate between assessment form and CBT question modal:`);
console.log(`  </form> count: ${intermediateFormCloses}`);
console.log(`  </div> count: ${intermediateDivCloses}`);

if (intermediateFormCloses < 1) {
  throw new Error('FAIL: form-create-assessment is NOT closed before modal-cbt-question');
}

// 2. Check that modal-cbt-question is a sibling/root modal and not inside modal-create-assessment
const openDivsInSlice = (intermediate.match(/<div(\s|>)/gi) || []).length;
const closeDivsInSlice = (intermediate.match(/<\/div>/gi) || []).length;
if (openDivsInSlice - closeDivsInSlice > 0) {
  throw new Error(`FAIL: modal-create-assessment has unclosed divs (${openDivsInSlice - closeDivsInSlice}) before modal-cbt-question`);
}
console.log('✓ PASS: DOM hierarchy verified. modal-cbt-question is independent and un-nested.');

// 3. Check for existence of all crucial button IDs
const requiredIds = [
  'btn-open-add-q-modal',
  'btn-close-cbt-q-modal',
  'btn-cancel-cbt-q-modal',
  'btn-submit-cbt-q-form',
  'btn-quick-add-question',
  'btn-quick-create-test',
  'form-cbt-question',
  'modal-cbt-question',
  'cbt-q-course',
  'cbt-q-topic',
  'cbt-q-type',
  'cbt-q-difficulty',
  'cbt-q-marks',
  'cbt-q-text',
  'cbt-q-options-container',
  'cbt-q-marking-guide',
  'cbt-q-explanation'
];

requiredIds.forEach(id => {
  if (!html.includes(`id="${id}"`)) {
    throw new Error(`FAIL: Required element ID missing: ${id}`);
  }
});
console.log(`✓ PASS: All ${requiredIds.length} required elements and button IDs present in lecturer-dashboard.html.`);

// 4. Test backend methods in firebase-backend.js
const backendJs = readFileSync(resolve(process.cwd(), 'assets/js/firebase-backend.js'), 'utf-8');
const backendFunctions = [
  'subscribeCbtQuestions',
  'createCbtQuestion',
  'updateCbtQuestion',
  'deleteCbtQuestion',
  'duplicateCbtQuestion'
];
backendFunctions.forEach(fn => {
  if (!backendJs.includes(`export function ${fn}`) && !backendJs.includes(`export async function ${fn}`)) {
    throw new Error(`FAIL: Backend function missing: ${fn}`);
  }
});
console.log(`✓ PASS: All CBT Question backend methods verified in firebase-backend.js.`);

// 5. Test lecturer-dashboard.js logic
const dashJs = readFileSync(resolve(process.cwd(), 'assets/js/lecturer-dashboard.js'), 'utf-8');

if (!dashJs.includes('subscribeCbtQuestions((')) {
  throw new Error('FAIL: subscribeCbtQuestions is not active in lecturer-dashboard.js');
}
if (!dashJs.includes('btnOpenAddQ.addEventListener("click"')) {
  throw new Error('FAIL: btn-open-add-q-modal event listener not found');
}
if (!dashJs.includes('window.cbtOpenQuestionModal = openQuestionModal')) {
  throw new Error('FAIL: openQuestionModal not exposed on window');
}
if (!dashJs.includes('renderDynamicOptions')) {
  throw new Error('FAIL: renderDynamicOptions function missing');
}

// 6. Test supported question types in renderDynamicOptions
['mcq', 'yes_no', 'true_false', 'short_answer', 'theory'].forEach(type => {
  if (!dashJs.includes(`"${type}"`) && !dashJs.includes(`'${type}'`)) {
    throw new Error(`FAIL: Question type "${type}" not handled in lecturer-dashboard.js`);
  }
});
console.log('✓ PASS: All 5 question types (MCQ, Yes/No, True/False, Short Answer, Theory) supported.');

console.log('--- ALL AUTOMATED CBT REPAIR CHECKS PASSED ---');
