import {
  createCbtQuestion,
  updateCbtQuestion,
  deleteCbtQuestion,
  duplicateCbtQuestion,
  subscribeCbtQuestions
} from './assets/js/firebase-backend.js';

console.log('=================================================================');
console.log('DIMABIN CBT QUESTION BANK & CRUD INTEGRITY TEST');
console.log('=================================================================');

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

async function runTests() {
  // 1. Test creation of Multiple-Choice (MCQ) question
  const mcqData = {
    courseCode: 'BIB-101',
    courseTitle: 'Introduction to Biblical Studies',
    topic: 'Biblical Hermeneutics',
    type: 'mcq',
    difficulty: 'intermediate',
    marks: 2,
    questionText: 'What is the grammatical-historical method of biblical interpretation?',
    options: [
      { id: 'opt_a', text: 'Interpreting solely through modern allegories' },
      { id: 'opt_b', text: 'Discovering the author original intended meaning in historical context' },
      { id: 'opt_c', text: 'Reading only philosophical commentaries' },
      { id: 'opt_d', text: 'Ignoring grammar and literary genre' }
    ],
    correctOptionId: 'opt_b',
    markingGuide: 'Award 2 marks for selecting Option B.',
    explanation: 'Grammatical-historical hermeneutics seeks the author original intent.',
    lecturerStaffId: 'DIMABIN/LEC/2026/01',
    lecturerName: 'Dr. Emmanuel Adebayo'
  };

  const mcqResult = await createCbtQuestion(mcqData);
  assert(mcqResult.success === true, 'MCQ Question created successfully');
  assert(mcqResult.id && mcqResult.id.length > 0, 'MCQ Question assigned valid ID');
  assert(mcqResult.type === 'mcq', 'MCQ Question retains type mcq');
  assert(mcqResult.marks === 2, 'MCQ Question retains marks value of 2');

  // 2. Test creation of True/False question
  const tfData = {
    courseCode: 'THE-201',
    courseTitle: 'Systematic Theology I',
    topic: 'Doctrine of God',
    type: 'true_false',
    difficulty: 'basic',
    marks: 1,
    questionText: 'The Council of Nicaea (AD 325) affirmed that the Son is homoousios (of the same substance) with the Father.',
    options: [
      { id: 'opt_true', text: 'True' },
      { id: 'opt_false', text: 'False' }
    ],
    correctOptionId: 'opt_true',
    markingGuide: 'Award 1 mark for True.',
    lecturerStaffId: 'DIMABIN/LEC/2026/01',
    lecturerName: 'Dr. Emmanuel Adebayo'
  };

  const tfResult = await createCbtQuestion(tfData);
  assert(tfResult.success === true, 'True/False Question created successfully');
  assert(tfResult.correctOptionId === 'opt_true', 'True/False Question correct option is True');

  // 3. Test creation of Yes/No question
  const ynData = {
    courseCode: 'HOM-301',
    courseTitle: 'Homiletics & Expository Preaching',
    topic: 'Sermon Structure',
    type: 'yes_no',
    difficulty: 'basic',
    marks: 1,
    questionText: 'Does expository preaching require deriving the main point of the sermon from the main point of the biblical text?',
    options: [
      { id: 'opt_yes', text: 'Yes' },
      { id: 'opt_no', text: 'No' }
    ],
    correctOptionId: 'opt_yes',
    markingGuide: 'Award 1 mark for Yes.',
    lecturerStaffId: 'DIMABIN/LEC/2026/01',
    lecturerName: 'Dr. Emmanuel Adebayo'
  };

  const ynResult = await createCbtQuestion(ynData);
  assert(ynResult.success === true, 'Yes/No Question created successfully');
  assert(ynResult.correctOptionId === 'opt_yes', 'Yes/No Question correct option is Yes');

  // 4. Test creation of Short Answer question
  const saData = {
    courseCode: 'CHH-202',
    courseTitle: 'Church History & Reformation',
    topic: 'Protestant Reformation',
    type: 'short_answer',
    difficulty: 'intermediate',
    marks: 3,
    questionText: 'Name the German reformer who posted the Ninety-five Theses in Wittenberg in 1517.',
    expectedAnswer: 'Martin Luther',
    matchingRule: 'exact_or_contains',
    markingGuide: 'Award 3 marks if response contains Martin Luther.',
    lecturerStaffId: 'DIMABIN/LEC/2026/01',
    lecturerName: 'Dr. Emmanuel Adebayo'
  };

  const saResult = await createCbtQuestion(saData);
  assert(saResult.success === true, 'Short Answer Question created successfully');
  assert(saResult.expectedAnswer === 'Martin Luther', 'Expected answer stored correctly');

  // 5. Test creation of Theory / Essay question
  const thData = {
    courseCode: 'THE-201',
    courseTitle: 'Systematic Theology I',
    topic: 'Pneumatology',
    type: 'theory',
    difficulty: 'advanced',
    marks: 10,
    questionText: 'Examine the theological significance of the Holy Spirit in the Old Testament compared to the New Testament.',
    markingGuide: '10 marks: 4 marks for OT references, 4 marks for NT Pauline/Johannine theology, 2 marks for synthesis.',
    lecturerStaffId: 'DIMABIN/LEC/2026/01',
    lecturerName: 'Dr. Emmanuel Adebayo'
  };

  const thResult = await createCbtQuestion(thData);
  assert(thResult.success === true, 'Theory Question created successfully');
  assert(thResult.marks === 10, 'Theory Question marks allocated accurately (10)');

  // 6. Test update of question
  const updateResult = await updateCbtQuestion(mcqResult.id, {
    topic: 'Advanced Hermeneutics & Exegesis',
    marks: 4
  });
  assert(updateResult.success === true, 'Question updated successfully');
  assert(updateResult.topic === 'Advanced Hermeneutics & Exegesis', 'Updated topic saved');
  assert(updateResult.marks === 4, 'Updated marks saved');

  // 7. Test duplication of question
  const dupResult = await duplicateCbtQuestion(mcqResult.id);
  assert(dupResult.success === true, 'Question duplicated successfully');
  assert(dupResult.id !== mcqResult.id, 'Duplicated question has unique ID');
  assert(dupResult.status === 'draft', 'Duplicated question is saved as draft');

  // 8. Test deletion of duplicated question
  const delResult = await deleteCbtQuestion(dupResult.id);
  assert(delResult.success === true, 'Duplicated question deleted successfully');

  // 9. Required field validation
  try {
    await createCbtQuestion({ courseCode: '', questionText: 'Invalid question without course' });
    assert(false, 'Should have rejected question without courseCode');
  } catch (err) {
    assert(err.message.includes('Course Code is required'), 'Validation correctly rejects question without courseCode');
  }

  try {
    await createCbtQuestion({ courseCode: 'BIB-101', questionText: '' });
    assert(false, 'Should have rejected question without questionText');
  } catch (err) {
    assert(err.message.includes('Question text is required'), 'Validation correctly rejects question without text');
  }

  console.log('=================================================================');
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=================================================================');
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test runner failure:', err);
  process.exit(1);
});
