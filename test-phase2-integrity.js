/**
 * DIMABIN Bible Institute — Phase 2 Verification & Integrity Test Suite
 * Validates semester-specific database structures, record preservation across rollovers,
 * idempotent migrations, and multi-semester transcript generation.
 */

// Node test environment polyfills
if (typeof globalThis.localStorage === "undefined") {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) || null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
  };
}
if (typeof globalThis.window === "undefined") {
  globalThis.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true
  };
}
if (typeof globalThis.CustomEvent === "undefined") {
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init) {
      this.type = type;
      this.detail = init?.detail;
    }
  };
}

import {
  DEFAULT_DIMABIN_COURSES,
  COLLECTIONS,
  validateAcademicSessionFormat,
  getSemesterAcademicRecords,
  getCourseAcademicHistory,
  getStudentAcademicTranscript,
  getStudentAllCourseRegistrations,
  getStudentCbtAttempts,
  getStudentResults,
  getLecturerAssignments,
  migrateSemesterAcademicRecords
} from "./assets/js/firebase-backend.js";

async function runTests() {
  console.log("=================================================================");
  console.log("DIMABIN BIBLE INSTITUTE — PHASE 2 INTEGRITY TEST SUITE");
  console.log("=================================================================\n");

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

  // TEST 1: Course catalogue structure across all three semesters
  const sem1Courses = DEFAULT_DIMABIN_COURSES.filter(c => c.semester === "First Semester");
  const sem2Courses = DEFAULT_DIMABIN_COURSES.filter(c => c.semester === "Second Semester");
  const sem3Courses = DEFAULT_DIMABIN_COURSES.filter(c => c.semester === "Third Semester");

  assert(sem1Courses.length > 0, `First Semester has ${sem1Courses.length} courses catalogued`);
  assert(sem2Courses.length > 0, `Second Semester has ${sem2Courses.length} courses catalogued`);
  assert(sem3Courses.length > 0, `Third Semester has ${sem3Courses.length} courses catalogued`);
  assert(
    DEFAULT_DIMABIN_COURSES.every(c => c.academicSession === "2026/2027"),
    "All initial catalog courses are mapped to 2026/2027 academic session"
  );

  // TEST 2: Academic session format validator
  assert(validateAcademicSessionFormat("2026/2027").valid === true, "Validates 2026/2027 format");
  assert(validateAcademicSessionFormat("2027/2028").valid === true, "Validates 2027/2028 format");
  assert(validateAcademicSessionFormat("2026-2027").valid === false, "Rejects dash separator");
  assert(validateAcademicSessionFormat("2026/2029").valid === false, "Rejects non-consecutive years");

  // TEST 3: Multi-semester course allocations without overwriting
  const mockAllocations = [
    {
      id: "alloc_THY_101_sem1",
      courseCode: "THY-101",
      courseTitle: "Christology",
      lecturerId: "DIMABIN/LEC/2026/01",
      lecturerName: "Dr. Samuel Adeyemi",
      academicSession: "2026/2027",
      semester: "First Semester",
      studyCentre: "Abeokuta Main Campus",
      status: "active"
    },
    {
      id: "alloc_THY_102_sem2",
      courseCode: "THY-102",
      courseTitle: "Pneumatology",
      lecturerId: "DIMABIN/LEC/2026/01",
      lecturerName: "Dr. Samuel Adeyemi",
      academicSession: "2026/2027",
      semester: "Second Semester",
      studyCentre: "Abeokuta Main Campus",
      status: "active"
    },
    {
      id: "alloc_THY_103_sem3",
      courseCode: "THY-103",
      courseTitle: "Eschatology",
      lecturerId: "DIMABIN/LEC/2026/01",
      lecturerName: "Dr. Samuel Adeyemi",
      academicSession: "2026/2027",
      semester: "Third Semester",
      studyCentre: "Abeokuta Main Campus",
      status: "active"
    }
  ];
  localStorage.setItem(`dimabin_db_cache_${COLLECTIONS.COURSE_ALLOCATIONS}`, JSON.stringify(mockAllocations));

  const lecSem1 = getLecturerAssignments("DIMABIN/LEC/2026/01", { session: "2026/2027", semester: "First Semester" });
  const lecSem2 = getLecturerAssignments("DIMABIN/LEC/2026/01", { session: "2026/2027", semester: "Second Semester" });
  const lecSem3 = getLecturerAssignments("DIMABIN/LEC/2026/01", { session: "2026/2027", semester: "Third Semester" });
  const lecAll = getLecturerAssignments("DIMABIN/LEC/2026/01");

  assert(lecSem1.length === 1 && lecSem1[0].courseCode === "THY-101", "Lecturer First Semester assignment isolated");
  assert(lecSem2.length === 1 && lecSem2[0].courseCode === "THY-102", "Lecturer Second Semester assignment isolated");
  assert(lecSem3.length === 1 && lecSem3[0].courseCode === "THY-103", "Lecturer Third Semester assignment isolated");
  assert(lecAll.length === 3, "All three semester assignments preserved in historical record");

  // TEST 4: Multi-semester course registration records for a student
  const mockRegistrations = [
    {
      id: "usr123_2026_2027_First_Semester",
      studentUid: "usr123",
      studentId: "DIMABIN/STU/2026/001",
      studentName: "Grace Emmanuel",
      academicSession: "2026/2027",
      semester: "First Semester",
      courses: [{ courseCode: "THY-101", creditUnits: 3 }, { courseCode: "BIB-101", creditUnits: 3 }],
      totalCredits: 6,
      status: "approved",
      submittedAt: "2026-09-05T10:00:00.000Z"
    },
    {
      id: "usr123_2026_2027_Second_Semester",
      studentUid: "usr123",
      studentId: "DIMABIN/STU/2026/001",
      studentName: "Grace Emmanuel",
      academicSession: "2026/2027",
      semester: "Second Semester",
      courses: [{ courseCode: "THY-102", creditUnits: 3 }, { courseCode: "BIB-102", creditUnits: 3 }],
      totalCredits: 6,
      status: "approved",
      submittedAt: "2027-01-10T10:00:00.000Z"
    },
    {
      id: "usr123_2026_2027_Third_Semester",
      studentUid: "usr123",
      studentId: "DIMABIN/STU/2026/001",
      studentName: "Grace Emmanuel",
      academicSession: "2026/2027",
      semester: "Third Semester",
      courses: [{ courseCode: "THY-103", creditUnits: 3 }, { courseCode: "BIB-103", creditUnits: 3 }],
      totalCredits: 6,
      status: "submitted",
      submittedAt: "2027-05-15T10:00:00.000Z"
    }
  ];
  localStorage.setItem(`dimabin_db_cache_${COLLECTIONS.COURSE_REGISTRATIONS}`, JSON.stringify(mockRegistrations));

  const studentAllRegs = getStudentAllCourseRegistrations("usr123");
  assert(studentAllRegs.length === 3, `Retrieved ${studentAllRegs.length} separate semester registrations for student`);
  assert(studentAllRegs.some(r => r.semester === "First Semester" && r.status === "approved"), "First semester registration intact");
  assert(studentAllRegs.some(r => r.semester === "Second Semester" && r.status === "approved"), "Second semester registration intact");
  assert(studentAllRegs.some(r => r.semester === "Third Semester" && r.status === "submitted"), "Third semester registration intact");

  // TEST 5: CBT test attempts retaining session & semester
  const mockCbtSubmissions = [
    {
      id: "sub_cbt1_STU001_att1",
      assessmentId: "cbt_thy101",
      courseCode: "THY-101",
      studentId: "usr123",
      matricNumber: "DIMABIN/STU/2026/001",
      academicSession: "2026/2027",
      semester: "First Semester",
      totalScore: 26,
      maxMarks: 30,
      grade: "A",
      status: "graded"
    },
    {
      id: "sub_cbt2_STU001_att1",
      assessmentId: "cbt_thy102",
      courseCode: "THY-102",
      studentId: "usr123",
      matricNumber: "DIMABIN/STU/2026/001",
      academicSession: "2026/2027",
      semester: "Second Semester",
      totalScore: 24,
      maxMarks: 30,
      grade: "B",
      status: "graded"
    }
  ];
  localStorage.setItem(`dimabin_db_cache_${COLLECTIONS.CBT_SUBMISSIONS}`, JSON.stringify(mockCbtSubmissions));

  const stuAttemptsSem1 = getStudentCbtAttempts("DIMABIN/STU/2026/001", { semester: "First Semester" });
  const stuAttemptsSem2 = getStudentCbtAttempts("DIMABIN/STU/2026/001", { semester: "Second Semester" });

  assert(stuAttemptsSem1.length === 1 && stuAttemptsSem1[0].courseCode === "THY-101", "First Semester CBT attempt preserved");
  assert(stuAttemptsSem2.length === 1 && stuAttemptsSem2[0].courseCode === "THY-102", "Second Semester CBT attempt preserved");

  // TEST 6: Results Management & Cumulative Transcript across 3 Semesters
  const mockResults = [
    // Sem 1: THY-101 (3cr, A=5.0 => 15gp), BIB-101 (3cr, B=4.0 => 12gp) => 6cr, 27gp => GPA = 4.50
    {
      id: "res_STU001_THY101_2026_First",
      matricNumber: "DIMABIN/STU/2026/001",
      studentName: "Grace Emmanuel",
      courseCode: "THY-101",
      courseTitle: "Christology",
      creditUnits: 3,
      academicSession: "2026/2027",
      semester: "First Semester",
      score: 78,
      grade: "A",
      gradePoint: 5.0,
      status: "approved"
    },
    {
      id: "res_STU001_BIB101_2026_First",
      matricNumber: "DIMABIN/STU/2026/001",
      studentName: "Grace Emmanuel",
      courseCode: "BIB-101",
      courseTitle: "Old Testament Survey",
      creditUnits: 3,
      academicSession: "2026/2027",
      semester: "First Semester",
      score: 65,
      grade: "B",
      gradePoint: 4.0,
      status: "approved"
    },
    // Sem 2: THY-102 (3cr, A=5.0 => 15gp), BIB-102 (3cr, A=5.0 => 15gp) => 6cr, 30gp => GPA = 5.00
    {
      id: "res_STU001_THY102_2026_Second",
      matricNumber: "DIMABIN/STU/2026/001",
      studentName: "Grace Emmanuel",
      courseCode: "THY-102",
      courseTitle: "Pneumatology",
      creditUnits: 3,
      academicSession: "2026/2027",
      semester: "Second Semester",
      score: 82,
      grade: "A",
      gradePoint: 5.0,
      status: "approved"
    },
    {
      id: "res_STU001_BIB102_2026_Second",
      matricNumber: "DIMABIN/STU/2026/001",
      studentName: "Grace Emmanuel",
      courseCode: "BIB-102",
      courseTitle: "New Testament Epistles",
      creditUnits: 3,
      academicSession: "2026/2027",
      semester: "Second Semester",
      score: 75,
      grade: "A",
      gradePoint: 5.0,
      status: "approved"
    }
  ];
  localStorage.setItem(`dimabin_db_cache_${COLLECTIONS.RESULTS}`, JSON.stringify(mockResults));

  const transcript = getStudentAcademicTranscript("DIMABIN/STU/2026/001");
  assert(transcript !== null, "Transcript generated successfully");
  assert(transcript.semesters.length >= 2, `Transcript contains ${transcript.semesters.length} semesters`);

  const tSem1 = transcript.semesters.find(s => s.semester === "First Semester");
  const tSem2 = transcript.semesters.find(s => s.semester === "Second Semester");

  assert(tSem1 && tSem1.gpa === 4.5, `First Semester GPA is 4.50 (actual: ${tSem1?.gpa})`);
  assert(tSem2 && tSem2.gpa === 5.0, `Second Semester GPA is 5.00 (actual: ${tSem2?.gpa})`);
  // Combined: (27 + 30) / 12 = 57 / 12 = 4.75
  assert(transcript.cgpa === 4.75, `Cumulative CGPA across semesters is 4.75 (actual: ${transcript.cgpa})`);

  // TEST 7: Idempotent Migration Verification
  const auditResult1 = await migrateSemesterAcademicRecords();
  assert(auditResult1.status === "completed", "Migration ran successfully");
  assert(auditResult1.isIdempotent === true, "Migration is flagged idempotent");

  const auditResult2 = await migrateSemesterAcademicRecords();
  const migratedInRun2 = Object.values(auditResult2.migrated).reduce((a, b) => a + b, 0);
  assert(migratedInRun2 === 0, `Rerunning migration is idempotent (0 additional modifications in run 2)`);

  // TEST 8: Partitioned Semester Records Reader
  const sem1Records = getSemesterAcademicRecords("2026/2027", "First Semester");
  const sem2Records = getSemesterAcademicRecords("2026/2027", "Second Semester");
  const sem3Records = getSemesterAcademicRecords("2026/2027", "Third Semester");

  assert(sem1Records.counts.allocations === 1, "First Semester has exactly 1 allocation");
  assert(sem2Records.counts.allocations === 1, "Second Semester has exactly 1 allocation");
  assert(sem3Records.counts.allocations === 1, "Third Semester has exactly 1 allocation");
  assert(sem1Records.counts.results === 2, "First Semester has exactly 2 results");
  assert(sem2Records.counts.results === 2, "Second Semester has exactly 2 results");
  assert(sem3Records.counts.results === 0, "Third Semester has 0 results (pristine/upcoming)");

  console.log("\n=================================================================");
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
