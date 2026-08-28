import {
  AssessmentStatus,
} from "@prisma/client";

import {
  canTransitionAssessmentStatus,
} from "../lib/compliance/assessmentLifecycleService";

/*
 * ============================================================
 * COMPLIANCEOS — ASSESSMENT LIFECYCLE POLICY TEST
 * ============================================================
 *
 * PURPOSE
 *
 * Prove the deterministic Assessment lifecycle independently
 * from database state.
 *
 * These tests do not create, update or delete database records.
 * ============================================================
 */

function assertEqual<T>(
  actual: T,
  expected: T,
  message: string
): void {
  if (actual !== expected) {
    throw new Error(
      `${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`
    );
  }

  console.log(`✓ ${message}`);
}

function testTransition(
  currentStatus: AssessmentStatus,
  nextStatus: AssessmentStatus,
  expected: boolean,
  message: string
): void {
  assertEqual(
    canTransitionAssessmentStatus(
      currentStatus,
      nextStatus
    ),
    expected,
    message
  );
}

console.log(
  "============================================================"
);
console.log(
  " COMPLIANCEOS — ASSESSMENT LIFECYCLE POLICY TEST"
);
console.log(
  "============================================================"
);

/*
 * ============================================================
 * TEST 1 — DRAFT → IN_PROGRESS
 * ============================================================
 */

console.log(
  "\n===== TEST 1: DRAFT → IN_PROGRESS ====="
);

testTransition(
  AssessmentStatus.DRAFT,
  AssessmentStatus.IN_PROGRESS,
  true,
  "DRAFT may advance to IN_PROGRESS"
);

/*
 * ============================================================
 * TEST 2 — IN_PROGRESS → REVIEW
 * ============================================================
 */

console.log(
  "\n===== TEST 2: IN_PROGRESS → REVIEW ====="
);

testTransition(
  AssessmentStatus.IN_PROGRESS,
  AssessmentStatus.REVIEW,
  true,
  "IN_PROGRESS may advance to REVIEW"
);

/*
 * ============================================================
 * TEST 3 — REVIEW → COMPLETED
 * ============================================================
 */

console.log(
  "\n===== TEST 3: REVIEW → COMPLETED ====="
);

testTransition(
  AssessmentStatus.REVIEW,
  AssessmentStatus.COMPLETED,
  true,
  "REVIEW may advance to COMPLETED"
);

/*
 * ============================================================
 * TEST 4 — DRAFT CANNOT SKIP TO REVIEW
 * ============================================================
 */

console.log(
  "\n===== TEST 4: DRAFT → REVIEW ====="
);

testTransition(
  AssessmentStatus.DRAFT,
  AssessmentStatus.REVIEW,
  false,
  "DRAFT cannot skip directly to REVIEW"
);

/*
 * ============================================================
 * TEST 5 — DRAFT CANNOT SKIP TO COMPLETED
 * ============================================================
 */

console.log(
  "\n===== TEST 5: DRAFT → COMPLETED ====="
);

testTransition(
  AssessmentStatus.DRAFT,
  AssessmentStatus.COMPLETED,
  false,
  "DRAFT cannot skip directly to COMPLETED"
);

/*
 * ============================================================
 * TEST 6 — IN_PROGRESS CANNOT SKIP TO COMPLETED
 * ============================================================
 */

console.log(
  "\n===== TEST 6: IN_PROGRESS → COMPLETED ====="
);

testTransition(
  AssessmentStatus.IN_PROGRESS,
  AssessmentStatus.COMPLETED,
  false,
  "IN_PROGRESS cannot skip directly to COMPLETED"
);

/*
 * ============================================================
 * TEST 7 — NO BACKWARD TRANSITION FROM IN_PROGRESS
 * ============================================================
 */

console.log(
  "\n===== TEST 7: IN_PROGRESS → DRAFT ====="
);

testTransition(
  AssessmentStatus.IN_PROGRESS,
  AssessmentStatus.DRAFT,
  false,
  "IN_PROGRESS cannot move backward to DRAFT"
);

/*
 * ============================================================
 * TEST 8 — NO BACKWARD TRANSITION FROM REVIEW
 * ============================================================
 */

console.log(
  "\n===== TEST 8: REVIEW → IN_PROGRESS ====="
);

testTransition(
  AssessmentStatus.REVIEW,
  AssessmentStatus.IN_PROGRESS,
  false,
  "REVIEW cannot move backward to IN_PROGRESS"
);

/*
 * ============================================================
 * TEST 9 — COMPLETED IS TERMINAL
 * ============================================================
 */

console.log(
  "\n===== TEST 9: COMPLETED IS TERMINAL ====="
);

testTransition(
  AssessmentStatus.COMPLETED,
  AssessmentStatus.DRAFT,
  false,
  "COMPLETED cannot reopen as DRAFT"
);

testTransition(
  AssessmentStatus.COMPLETED,
  AssessmentStatus.IN_PROGRESS,
  false,
  "COMPLETED cannot reopen as IN_PROGRESS"
);

testTransition(
  AssessmentStatus.COMPLETED,
  AssessmentStatus.REVIEW,
  false,
  "COMPLETED cannot reopen as REVIEW"
);

/*
 * ============================================================
 * TEST 10 — SAME-STATE TRANSITIONS ARE REJECTED
 * ============================================================
 */

console.log(
  "\n===== TEST 10: SAME-STATE TRANSITIONS ====="
);

for (
  const status
  of Object.values(AssessmentStatus)
) {
  testTransition(
    status,
    status,
    false,
    `${status} cannot transition to itself`
  );
}

/*
 * ============================================================
 * TEST 11 — COMPLETE TRANSITION MATRIX
 * ============================================================
 *
 * This protects against accidental future expansion of the
 * lifecycle policy.
 * ============================================================
 */

console.log(
  "\n===== TEST 11: COMPLETE TRANSITION MATRIX ====="
);

const statuses =
  Object.values(AssessmentStatus);

let allowedTransitionCount = 0;

for (const current of statuses) {
  for (const next of statuses) {
    if (
      canTransitionAssessmentStatus(
        current,
        next
      )
    ) {
      allowedTransitionCount += 1;
    }
  }
}

assertEqual(
  allowedTransitionCount,
  3,
  "Exactly three Assessment lifecycle transitions are permitted"
);

console.log(
  "\n============================================================"
);
console.log(
  " ALL ASSESSMENT LIFECYCLE POLICY TESTS PASSED"
);
console.log(
  "============================================================"
);
