/**
 * test-phase4-integrity.js
 * Comprehensive Verification of Phase 4 Lecturer Portal:
 * Three-Semester Management, Semester-Specific Assignments, and Historical Teaching Records
 *
 * Run via: node --no-warnings --loader ./test-loader.mjs test-phase4-integrity.js
 */

import {
  COLLECTIONS,
  publishSessionRollover,
  getActiveAcademicSession,
  getThreeSemestersForSession,
  getLecturerAssignments,
  getLecturerSemesterTeachingDossier,
  createCourseAllocation,
  saveLecturerGradeRecord,
  submitCourseGradesToRegistry,
  createCourseAssessment,
  createCbtAssessment,
  findLecturerByEmailOrStaffId,
  saveRegistrationSettings,
  submitStudentCourseRegistration
} from "./assets/js/firebase-backend.js";

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`FAIL: ${message}`);
    failedCount++;
  }
}

async function runPhase4Tests() {
  console.log("=================================================================");
  console.log("DIMABIN BIBLE INSTITUTE — PHASE 4 INTEGRITY VERIFICATION SUITE");
  console.log("Lecturer Portal: Three-Semester Management & Historical Records");
  console.log("=================================================================\n");

  const testSession = "2026/2027";
  const testLecturer = {
    staffId: "DIM/LEC/001",
    fullName: "Pastor Dr. Samuel Ogundipe",
    email: "samuel.ogundipe@dimabin.edu.ng",
    studyCentre: "Abeokuta Main Campus",
    department: "Department of Systematic Theology & Biblical Studies"
  };

  // ---------------------------------------------------------------------------
  // 1. Authoritative Session & Active Semester Integrity
  // ---------------------------------------------------------------------------
  console.log("--- 1. Authoritative Academic Configuration ---");
  const currentActive = getActiveAcademicSession();
  if (currentActive.currentSession !== testSession || currentActive.currentSemester !== "First Semester") {
    await publishSessionRollover({
      newSession: testSession,
      semester: "First Semester",
      publishedBy: "admin_phase4_test"
    });
  }

  const activeConf = getActiveAcademicSession();
  assert(activeConf.currentSession === testSession, `Active academic session is ${testSession}`);
  assert(activeConf.currentSemester === "First Semester", "Active semester is First Semester");

  const terms = getThreeSemestersForSession(testSession);
  assert(Array.isArray(terms) && terms.length === 3, "Three semesters returned for session");
  assert(terms[0].semester === "First Semester", "Term 1 is First Semester");
  assert(terms[1].semester === "Second Semester", "Term 2 is Second Semester");
  assert(terms[2].semester === "Third Semester", "Term 3 is Third Semester");

  // ---------------------------------------------------------------------------
  // 2. Semester-Specific Course Assignments
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Semester-Specific Course Allocations ---");
  let sem1Allocations = getLecturerAssignments(testLecturer.staffId, testSession, "First Semester", {
    lecturerName: testLecturer.fullName
  });
  if (sem1Allocations.length === 0) {
    try {
      await createCourseAllocation({
        courseCode: "THY-101",
        courseTitle: "Introduction to Systematic Theology",
        programme: "Diploma in Theology (Dipl.Th.)",
        level: "100",
        academicSession: testSession,
        semester: "First Semester",
        studyCentre: "Abeokuta Main Campus",
        lecturerId: testLecturer.staffId,
        lecturerName: testLecturer.fullName
      });
    } catch (_) {}
    sem1Allocations = getLecturerAssignments(testLecturer.staffId, testSession, "First Semester", {
      lecturerName: testLecturer.fullName
    });
  }

  assert(Array.isArray(sem1Allocations) && sem1Allocations.length > 0, "First Semester assignments returned as array with allocations");
  console.log(`Found ${sem1Allocations.length} assignments for ${testLecturer.staffId} in First Semester`);

  // Verify each allocation belongs strictly to First Semester and 2026/2027
  sem1Allocations.forEach((alloc) => {
    assert(
      (alloc.semester || "First Semester").trim() === "First Semester",
      `Allocation ${alloc.courseCode} has semester matching First Semester`
    );
    assert(
      (alloc.academicSession || testSession).trim() === testSession,
      `Allocation ${alloc.courseCode} belongs to session ${testSession}`
    );
  });

  // Query Second Semester assignments
  let sem2Allocations = getLecturerAssignments(testLecturer.staffId, testSession, "Second Semester", {
    lecturerName: testLecturer.fullName
  });
  if (sem2Allocations.length === 0) {
    try {
      await createCourseAllocation({
        courseCode: "BIB-102",
        courseTitle: "New Testament Literature & History",
        programme: "Diploma in Theology (Dipl.Th.)",
        level: "100",
        academicSession: testSession,
        semester: "Second Semester",
        studyCentre: "Abeokuta Main Campus",
        lecturerId: testLecturer.staffId,
        lecturerName: testLecturer.fullName
      });
    } catch (_) {}
    sem2Allocations = getLecturerAssignments(testLecturer.staffId, testSession, "Second Semester", {
      lecturerName: testLecturer.fullName
    });
  }
  assert(Array.isArray(sem2Allocations) && sem2Allocations.length > 0, "Second Semester assignments returned as array with allocations");

  // Query Third Semester assignments
  const sem3Allocations = getLecturerAssignments(testLecturer.staffId, testSession, "Third Semester", {
    lecturerName: testLecturer.fullName
  });
  assert(Array.isArray(sem3Allocations), "Third Semester assignments returned as array");

  // Course allocations from First Semester must NOT bleed into Second or Third Semester
  const sem1Codes = new Set(sem1Allocations.map((a) => (a.courseCode || "").toUpperCase()));
  const sem2Codes = new Set(sem2Allocations.map((a) => (a.courseCode || "").toUpperCase()));
  const overlap = [...sem1Codes].filter((c) => sem2Codes.has(c));
  assert(overlap.length === 0, `No accidental course allocation leakage between Semesters 1 and 2 (overlap: ${overlap.join(", ") || "none"})`);

  // ---------------------------------------------------------------------------
  // 3. Teaching Dossier Computation for First Semester
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Teaching Dossier Computation & Metrics ---");
  const dossier1 = getLecturerSemesterTeachingDossier(testLecturer.staffId, testSession, "First Semester", {
    lecturerName: testLecturer.fullName
  });

  assert(dossier1.session === testSession, `Dossier session matches ${testSession}`);
  assert(dossier1.semester === "First Semester", "Dossier semester matches First Semester");
  assert(dossier1.isCurrent === true, "First Semester is marked as current");
  assert(typeof dossier1.metrics.coursesCount === "number", "metrics.coursesCount is a valid number");
  assert(typeof dossier1.metrics.studentsCount === "number", "metrics.studentsCount is a valid number");
  assert(typeof dossier1.metrics.pendingTasksCount === "number", "metrics.pendingTasksCount is a valid number");
  assert(typeof dossier1.overallStatus === "string", `overallStatus is string: "${dossier1.overallStatus}"`);

  // Dossier for upcoming Second Semester
  const dossier2 = getLecturerSemesterTeachingDossier(testLecturer.staffId, testSession, "Second Semester", {
    lecturerName: testLecturer.fullName
  });
  assert(dossier2.semester === "Second Semester", "Second Semester dossier semester is Second Semester");
  assert(dossier2.isCurrent === false, "Second Semester is not marked as current while First is active");

  // ---------------------------------------------------------------------------
  // 4. Entering Marks for Active Semester & Isolation from Other Semesters
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Academic Record Entry & Semester Isolation ---");
  const testStudentMatric = "DIM/2026/088";
  const targetCourse = sem1Allocations.length > 0 ? sem1Allocations[0].courseCode : "THY-101";

  // Save CA & Exam marks for First Semester
  await saveLecturerGradeRecord({
    studentName: "Barnabas Adeyemi",
    matricNumber: testStudentMatric,
    courseCode: targetCourse,
    courseTitle: "Theological Foundations",
    creditUnits: 3,
    studyCentre: "Abeokuta Main Campus",
    academicSession: testSession,
    semester: "First Semester",
    caScore: 26,
    cbtScore: 9,
    attendanceScore: 5,
    assignmentScore: 4,
    practicalScore: 8,
    examScore: 58,
    status: "draft",
    lecturerStaffId: testLecturer.staffId,
    lecturerName: testLecturer.fullName
  });

  // Verify the record in First Semester Dossier
  const updatedDossier1 = getLecturerSemesterTeachingDossier(testLecturer.staffId, testSession, "First Semester", {
    lecturerName: testLecturer.fullName
  });
  const savedRec1 = updatedDossier1.results.find(
    (r) => r.matricNumber === testStudentMatric && r.courseCode === targetCourse
  );
  assert(savedRec1 !== undefined, "Grade record successfully stored in First Semester");
  assert(savedRec1.caScore === 26, "CA score equals 26");
  assert(savedRec1.examScore === 58, "Exam score equals 58");
  assert(savedRec1.score === 84, "Total score equals 84");
  assert(savedRec1.grade === "A", "Grade equals A");

  // Verify that this First Semester record does NOT show up in Second Semester Dossier
  const checkDossier2 = getLecturerSemesterTeachingDossier(testLecturer.staffId, testSession, "Second Semester", {
    lecturerName: testLecturer.fullName
  });
  const accidentalLeak = checkDossier2.results.find(
    (r) => r.matricNumber === testStudentMatric && r.courseCode === targetCourse
  );
  assert(accidentalLeak === undefined, "First Semester result did NOT bleed into Second Semester dossier");

  // ---------------------------------------------------------------------------
  // 5. Result Submission to Registry for Active Semester
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Course Result Submission to Registry ---");
  await submitCourseGradesToRegistry(targetCourse, {
    session: testSession,
    semester: "First Semester",
    studyCentre: "all",
    lecturerStaffId: testLecturer.staffId,
    lecturerName: testLecturer.fullName
  });

  const submittedDossier1 = getLecturerSemesterTeachingDossier(testLecturer.staffId, testSession, "First Semester", {
    lecturerName: testLecturer.fullName
  });
  const subRec = submittedDossier1.results.find(
    (r) => r.matricNumber === testStudentMatric && r.courseCode === targetCourse
  );
  assert(subRec && subRec.status === "submitted", "Grade record status successfully updated to 'submitted'");
  assert(
    submittedDossier1.overallStatus.includes("Submitted") || submittedDossier1.overallStatus.includes("Draft"),
    `Dossier overall status reflects submission: "${submittedDossier1.overallStatus}"`
  );

  // ---------------------------------------------------------------------------
  // 6. Semester Rollover: Transition from First to Second Semester
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Rollover to Second Semester & Historical Preservation ---");
  await publishSessionRollover({
    newSession: testSession,
    semester: "Second Semester",
    publishedBy: "super_admin_test"
  });

  const newActiveConf = getActiveAcademicSession();
  assert(newActiveConf.currentSemester === "Second Semester", "Authoritative active semester is now Second Semester");

  // First Semester must now be Completed/Historical
  const histDossier1 = getLecturerSemesterTeachingDossier(testLecturer.staffId, testSession, "First Semester", {
    lecturerName: testLecturer.fullName
  });
  assert(histDossier1.isCurrent === false, "First Semester is now recognized as historical/completed (isCurrent = false)");
  assert(histDossier1.results.length >= 1, "First Semester historical results are preserved and not deleted");
  assert(histDossier1.assignedCourses.length === sem1Allocations.length, "First Semester historical course allocations preserved");

  // Second Semester is now Current
  const currentDossier2 = getLecturerSemesterTeachingDossier(testLecturer.staffId, testSession, "Second Semester", {
    lecturerName: testLecturer.fullName
  });
  assert(currentDossier2.isCurrent === true, "Second Semester is now recognized as current (isCurrent = true)");

  // Third Semester remains Upcoming
  const upcomingDossier3 = getLecturerSemesterTeachingDossier(testLecturer.staffId, testSession, "Third Semester", {
    lecturerName: testLecturer.fullName
  });
  assert(upcomingDossier3.isCurrent === false, "Third Semester remains upcoming");

  // ---------------------------------------------------------------------------
  // 7. Non-Destructive Integrity: Previous Semester Records Undisturbed
  // ---------------------------------------------------------------------------
  console.log("\n--- 7. Non-Destructive Record Integrity ---");
  // Save a new record in Second Semester
  const secCourse = sem2Allocations.length > 0 ? sem2Allocations[0].courseCode : "BIB-102";
  await saveLecturerGradeRecord({
    studentName: "Barnabas Adeyemi",
    matricNumber: testStudentMatric,
    courseCode: secCourse,
    courseTitle: "New Testament Literature",
    creditUnits: 3,
    studyCentre: "Abeokuta Main Campus",
    academicSession: testSession,
    semester: "Second Semester",
    caScore: 28,
    examScore: 62,
    status: "draft",
    lecturerStaffId: testLecturer.staffId,
    lecturerName: testLecturer.fullName
  });

  // Re-verify First Semester historical record remains untouched
  const recheckHist1 = getLecturerSemesterTeachingDossier(testLecturer.staffId, testSession, "First Semester", {
    lecturerName: testLecturer.fullName
  });
  const intactRec1 = recheckHist1.results.find(
    (r) => r.matricNumber === testStudentMatric && r.courseCode === targetCourse
  );
  assert(intactRec1 !== undefined, "First Semester record still intact");
  assert(intactRec1.caScore === 26, "First Semester CA score preserved without corruption");
  assert(intactRec1.examScore === 58, "First Semester exam score preserved without corruption");
  assert(intactRec1.status === "submitted", "First Semester submitted status preserved");

  console.log("\n=================================================================");
  console.log(`TEST SUITE COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase4Tests().catch((err) => {
  console.error("Test execution failed with unhandled exception:", err);
  process.exit(1);
});
