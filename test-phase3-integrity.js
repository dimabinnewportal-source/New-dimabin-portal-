/**
 * test-phase3-integrity.js
 * Verification of Phase 3 Student Portal Three-Semester Interface & Academic History
 * Run via: node --no-warnings --loader ./test-loader.mjs test-phase3-integrity.js
 */

import {
  COLLECTIONS,
  publishSessionRollover,
  getActiveAcademicSession,
  getThreeSemestersForSession,
  saveRegistrationSettings,
  getRegistrationSettings,
  submitStudentCourseRegistration,
  getStudentCourseRegistration,
  getStudentAllCourseRegistrations,
  getStudentResults,
  getStudentAcademicTranscript,
  getStudentCbtAttempts
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

async function runPhase3Tests() {
  console.log("=================================================================");
  console.log("DIMABIN BIBLE INSTITUTE — PHASE 3 INTEGRITY VERIFICATION SUITE");
  console.log("Student Portal: Three-Semester Interface & Academic History");
  console.log("=================================================================\n");

  const testSession = "2026/2027";
  const testStudent = {
    uid: "stu_phase3_tester",
    studentId: "DIM/2026/088",
    matricNumber: "DIM/2026/088",
    admissionNumber: "DIM/2026/088",
    fullName: "Barnabas Adeyemi",
    studyCentre: "Abeokuta Main Campus",
    programme: "Diploma in Theology (Dipl.Th.)",
    academicSession: testSession
  };

  // ---------------------------------------------------------------------------
  // 1. Authoritative Configuration as Single Source of Truth
  // ---------------------------------------------------------------------------
  console.log("--- 1. Authoritative Active Semester & Three Semesters Metadata ---");
  const currentActive = getActiveAcademicSession();
  if (currentActive.currentSession !== testSession || currentActive.currentSemester !== "First Semester") {
    await publishSessionRollover({
      newSession: testSession,
      semester: "First Semester",
      publishedBy: "super_admin_test"
    });
  }

  const activeConf = getActiveAcademicSession();
  assert(activeConf.currentSession === testSession, `Active session is ${testSession}`);
  assert(activeConf.currentSemester === "First Semester", "Active semester is First Semester");

  const threeSems = getThreeSemestersForSession(testSession);
  assert(Array.isArray(threeSems) && threeSems.length === 3, "getThreeSemestersForSession returns exactly 3 terms");
  assert(threeSems[0].semester === "First Semester", "First term is First Semester");
  assert(threeSems[1].semester === "Second Semester", "Second term is Second Semester");
  assert(threeSems[2].semester === "Third Semester", "Third term is Third Semester");

  // ---------------------------------------------------------------------------
  // 2. Open First Semester Registration and Enroll Student
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. First Semester Course Registration & Slip Generation ---");
  await saveRegistrationSettings(testSession, "First Semester", {
    isOpen: true,
    maxCredits: 24,
    notes: "First Semester Open for Enrollment"
  });

  const regSetting1 = getRegistrationSettings(testSession, "First Semester");
  assert(regSetting1.isOpen === true, "First Semester registration window is open");

  // Submit First Semester Registration (Courses catalogued for First Semester)
  const res1 = await submitStudentCourseRegistration({
    studentUid: testStudent.uid,
    studentProfile: testStudent,
    academicSession: testSession,
    semester: "First Semester",
    selectedCourseIds: ["THY-101", "BIB-101", "MIN-101"]
  });
  const regResult1 = res1.registration;

  assert(regResult1 && regResult1.courses.length === 3, "First Semester registered 3 courses");
  assert(regResult1.totalCredits === 8, "First Semester total credit units equal 8");
  assert(regResult1.academicSession === testSession, `Registration record belongs to ${testSession}`);
  assert(regResult1.semester === "First Semester", "Registration record belongs to First Semester");

  // ---------------------------------------------------------------------------
  // 3. Block Submissions for Closed / Upcoming Semesters
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Semester-Specific Entry Points & Access Boundaries ---");
  await saveRegistrationSettings(testSession, "Second Semester", {
    isOpen: false,
    maxCredits: 24,
    notes: "Second Semester Registration Not Yet Open"
  });

  let blockedError = null;
  try {
    await submitStudentCourseRegistration({
      studentUid: testStudent.uid,
      studentProfile: testStudent,
      academicSession: testSession,
      semester: "Second Semester",
      selectedCourseIds: ["BIB-102"]
    });
  } catch (err) {
    blockedError = err;
  }
  assert(blockedError !== null, "Attempt to register for closed Second Semester was rejected");
  assert(blockedError.message.includes("closed"), `Rejection reason correctly indicates closed: "${blockedError?.message}"`);

  // ---------------------------------------------------------------------------
  // 4. Semester Rollover from First Semester to Second Semester
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Active Semester Rollover & Historical Integrity ---");
  await publishSessionRollover({
    newSession: testSession,
    semester: "Second Semester",
    publishedBy: "super_admin_test"
  });

  const rolledActiveConf = getActiveAcademicSession();
  assert(rolledActiveConf.currentSemester === "Second Semester", "Active semester successfully rolled over to Second Semester");

  // First Semester record must NOT be deleted, overwritten, or reset
  const preservedReg1 = getStudentCourseRegistration(testStudent.uid, testSession, "First Semester");
  assert(preservedReg1 !== null, "First Semester registration is preserved after rollover");
  assert(preservedReg1.courses.length === 3, "First Semester courses (3) intact");
  assert(preservedReg1.totalCredits === 8, "First Semester credits (8) intact");

  // Open Second Semester Registration
  await saveRegistrationSettings(testSession, "Second Semester", {
    isOpen: true,
    maxCredits: 24,
    notes: "Second Semester Now Open"
  });

  // Verify student has no registration yet for Second Semester (clean form)
  const initialReg2 = getStudentCourseRegistration(testStudent.uid, testSession, "Second Semester");
  assert(initialReg2 === null, "Student initially has no registration for newly active Second Semester");

  // Register courses for Second Semester
  const res2 = await submitStudentCourseRegistration({
    studentUid: testStudent.uid,
    studentProfile: testStudent,
    academicSession: testSession,
    semester: "Second Semester",
    selectedCourseIds: ["BIB-102", "PAS-102"]
  });
  const regResult2 = res2.registration;

  assert(regResult2.courses.length === 2, "Second Semester registered 2 distinct courses");
  assert(regResult2.totalCredits === 6, "Second Semester total credits equal 6");
  assert(regResult2.semester === "Second Semester", "Second registration tagged as Second Semester");

  // Check all registrations list for student
  const allRegs = getStudentAllCourseRegistrations(testStudent.matricNumber);
  assert(allRegs.length >= 2, `Student has multiple distinct semester registrations (found ${allRegs.length})`);

  const sem1InList = allRegs.find((r) => r.semester === "First Semester" && r.academicSession === testSession);
  const sem2InList = allRegs.find((r) => r.semester === "Second Semester" && r.academicSession === testSession);
  assert(sem1InList && sem1InList.courses.length === 3, "First Semester in historical list has 3 courses");
  assert(sem2InList && sem2InList.courses.length === 2, "Second Semester in historical list has 2 courses");

  // ---------------------------------------------------------------------------
  // 5. Results Retrieval & Semester Filtering
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Results Display, Moderation Privacy & Cumulative CGPA ---");
  // Test results retrieval for First Semester vs Second Semester vs All
  const firstSemResults = getStudentResults(testStudent.matricNumber, {
    session: testSession,
    semester: "First Semester",
    onlyApproved: true
  });
  assert(Array.isArray(firstSemResults), "getStudentResults returns array for First Semester");

  const transcript = getStudentAcademicTranscript(testStudent.matricNumber);
  assert(transcript !== null, "Transcript object generated");
  assert(typeof transcript.cgpa === "number", `CGPA calculated (${transcript.cgpa})`);
  assert(Array.isArray(transcript.semesters), "Transcript contains array of semester records");

  // ---------------------------------------------------------------------------
  // 6. CBT Assessment Attempts Filtered by Semester
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. CBT Assessment History & Semester Context ---");
  const cbtAttempts = getStudentCbtAttempts(testStudent.matricNumber, {
    session: testSession,
    semester: "First Semester"
  });
  assert(Array.isArray(cbtAttempts), "getStudentCbtAttempts returns array for semester");

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n=================================================================");
  console.log(`TEST SUITE COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase3Tests().catch((err) => {
  console.error("Test execution threw error:", err);
  process.exit(1);
});
