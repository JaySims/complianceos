import {
  AssessmentStatus,
  ComplianceRequirementCategory,
  DocumentVerificationStatus,
  EvidenceVerificationStatus,
} from "@prisma/client";

import {
  evidenceCollectionQueryHttpResponse,
  evidenceQueryFailureStatus,
  evidenceQueryHttpResponse,
  serializeEvidenceQueryRecord,
} from "../lib/compliance/evidenceQueryHttp";

import type {
  EvidenceQueryFailure,
  EvidenceQueryRecord,
} from "../lib/compliance/evidenceQueryService";


/*
 * ============================================================
 * COMPLIANCEOS — EVIDENCE QUERY HTTP POLICY VERIFICATION
 * ============================================================
 *
 * PURPOSE
 *
 * Deterministically verify the HTTP translation layer for
 * Evidence queries.
 *
 * This suite performs no database reads or writes.
 *
 * It proves:
 *
 * - Evidence Date values serialize to ISO strings;
 * - nullable Requirement and Document relationships survive;
 * - linked Requirement and Document projections serialize;
 * - failure reasons map to the intended HTTP statuses;
 * - single Evidence responses preserve the contract;
 * - Assessment Evidence collections preserve the contract.
 * ============================================================
 */


type AsyncTestCase = {
  name: string;
  run: () => void | Promise<void>;
};


let passed = 0;
let failed = 0;


/*
 * ============================================================
 * ASSERTIONS
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
}


function assertTrue(
  actual: boolean,
  message: string
): void {
  assertEqual(
    actual,
    true,
    message
  );
}


function assertNull(
  actual: unknown,
  message: string
): void {
  assertEqual(
    actual,
    null,
    message
  );
}


/*
 * ============================================================
 * FIXTURES
 * ============================================================
 */

const createdAt =
  new Date(
    "2026-08-29T08:00:00.000Z"
  );

const updatedAt =
  new Date(
    "2026-08-29T09:00:00.000Z"
  );

const verifiedAt =
  new Date(
    "2026-08-29T10:00:00.000Z"
  );

const issuedAt =
  new Date(
    "2026-01-01T00:00:00.000Z"
  );

const expiresAt =
  new Date(
    "2027-01-01T00:00:00.000Z"
  );

const uploadedAt =
  new Date(
    "2026-08-28T12:00:00.000Z"
  );


function makeEvidenceRecord(
  overrides: Partial<EvidenceQueryRecord> = {}
): EvidenceQueryRecord {
  return {
    id:
      "evidence-1",

    title:
      "Tax Clearance Evidence",

    fileUrl:
      "https://example.test/evidence/tax-clearance",

    assessmentId:
      "assessment-1",

    documentId:
      "document-1",

    requirementId:
      "requirement-1",

    status:
      EvidenceVerificationStatus.VERIFIED,

    verifiedAt,

    verifiedById:
      "user-reviewer",

    notes:
      "Verified against source document.",

    createdAt,

    updatedAt,

    assessment: {
      id:
        "assessment-1",

      title:
        "Tax Compliance Assessment",

      score:
        100,

      status:
        AssessmentStatus.REVIEW,

      frameworkId:
        "framework-tax",
    },

    requirement: {
      id:
        "requirement-1",

      code:
        "TAX-001",

      title:
        "Tax Registration",

      description:
        "Organization must maintain valid tax registration.",

      category:
        ComplianceRequirementCategory.TAX,

      authority:
        "SARS",

      mandatory:
        true,

      weight:
        1,

      active:
        true,
    },

    document: {
      id:
        "document-1",

      documentType:
        "TAX_CLEARANCE",

      fileName:
        "tax-clearance.pdf",

      fileSize:
        2048,

      mimeType:
        "application/pdf",

      status:
        DocumentVerificationStatus.VERIFIED,

      issuedAt,

      expiresAt,

      verifiedAt,

      uploadedAt,

      updatedAt,
    },

    ...overrides,
  };
}


/*
 * ============================================================
 * FAILURE HELPERS
 * ============================================================
 */

function makeFailure(
  reason: EvidenceQueryFailure["reason"]
): EvidenceQueryFailure {
  return {
    success: false,
    reason,
    message:
      `Failure: ${reason}`,
  };
}


/*
 * ============================================================
 * TESTS
 * ============================================================
 */

const tests: AsyncTestCase[] = [
  {
    name:
      "Evidence dates serialize to ISO strings",

    run: () => {
      const serialized =
        serializeEvidenceQueryRecord(
          makeEvidenceRecord()
        );

      assertEqual(
        serialized.createdAt,
        createdAt.toISOString(),
        "createdAt must serialize to ISO."
      );

      assertEqual(
        serialized.updatedAt,
        updatedAt.toISOString(),
        "updatedAt must serialize to ISO."
      );

      assertEqual(
        serialized.verifiedAt,
        verifiedAt.toISOString(),
        "verifiedAt must serialize to ISO."
      );
    },
  },

  {
    name:
      "Document dates serialize to ISO strings",

    run: () => {
      const serialized =
        serializeEvidenceQueryRecord(
          makeEvidenceRecord()
        );

      if (!serialized.document) {
        throw new Error(
          "Expected linked Document."
        );
      }

      assertEqual(
        serialized.document.issuedAt,
        issuedAt.toISOString(),
        "Document issuedAt must serialize to ISO."
      );

      assertEqual(
        serialized.document.expiresAt,
        expiresAt.toISOString(),
        "Document expiresAt must serialize to ISO."
      );

      assertEqual(
        serialized.document.verifiedAt,
        verifiedAt.toISOString(),
        "Document verifiedAt must serialize to ISO."
      );

      assertEqual(
        serialized.document.uploadedAt,
        uploadedAt.toISOString(),
        "Document uploadedAt must serialize to ISO."
      );

      assertEqual(
        serialized.document.updatedAt,
        updatedAt.toISOString(),
        "Document updatedAt must serialize to ISO."
      );
    },
  },

  {
    name:
      "Nullable Evidence verification date remains null",

    run: () => {
      const serialized =
        serializeEvidenceQueryRecord(
          makeEvidenceRecord({
            verifiedAt: null,
          })
        );

      assertNull(
        serialized.verifiedAt,
        "Expected null Evidence verifiedAt."
      );
    },
  },

  {
    name:
      "Nullable Requirement relationship remains null",

    run: () => {
      const serialized =
        serializeEvidenceQueryRecord(
          makeEvidenceRecord({
            requirementId: null,
            requirement: null,
          })
        );

      assertNull(
        serialized.requirement,
        "Expected null Requirement relationship."
      );

      assertNull(
        serialized.requirementId,
        "Expected null requirementId."
      );
    },
  },

  {
    name:
      "Nullable Document relationship remains null",

    run: () => {
      const serialized =
        serializeEvidenceQueryRecord(
          makeEvidenceRecord({
            documentId: null,
            document: null,
          })
        );

      assertNull(
        serialized.document,
        "Expected null Document relationship."
      );

      assertNull(
        serialized.documentId,
        "Expected null documentId."
      );
    },
  },

  {
    name:
      "Requirement projection preserves compliance metadata",

    run: () => {
      const serialized =
        serializeEvidenceQueryRecord(
          makeEvidenceRecord()
        );

      if (!serialized.requirement) {
        throw new Error(
          "Expected linked Requirement."
        );
      }

      assertEqual(
        serialized.requirement.code,
        "TAX-001",
        "Requirement code must be preserved."
      );

      assertEqual(
        serialized.requirement.category,
        ComplianceRequirementCategory.TAX,
        "Requirement category must be preserved."
      );

      assertEqual(
        serialized.requirement.mandatory,
        true,
        "Requirement mandatory flag must be preserved."
      );

      assertEqual(
        serialized.requirement.weight,
        1,
        "Requirement weight must be preserved."
      );

      assertEqual(
        serialized.requirement.active,
        true,
        "Requirement active flag must be preserved."
      );
    },
  },

  {
    name:
      "Document projection does not expose storage filePath",

    run: () => {
      const serialized =
        serializeEvidenceQueryRecord(
          makeEvidenceRecord()
        );

      if (!serialized.document) {
        throw new Error(
          "Expected linked Document."
        );
      }

      assertEqual(
        Object.prototype.hasOwnProperty.call(
          serialized.document,
          "filePath"
        ),
        false,
        "Serialized Document must not expose filePath."
      );
    },
  },

  {
    name:
      "Read authorization failures map to 403",

    run: () => {
      assertEqual(
        evidenceQueryFailureStatus(
          makeFailure(
            "EVIDENCE_READ_FORBIDDEN"
          )
        ),
        403,
        "EVIDENCE_READ_FORBIDDEN must map to 403."
      );

      assertEqual(
        evidenceQueryFailureStatus(
          makeFailure(
            "ASSESSMENT_ACCESS_DENIED"
          )
        ),
        403,
        "ASSESSMENT_ACCESS_DENIED must map to 403."
      );

      assertEqual(
        evidenceQueryFailureStatus(
          makeFailure(
            "EVIDENCE_ACCESS_DENIED"
          )
        ),
        403,
        "EVIDENCE_ACCESS_DENIED must map to 403."
      );
    },
  },

  {
    name:
      "Missing resources map to 404",

    run: () => {
      assertEqual(
        evidenceQueryFailureStatus(
          makeFailure(
            "ASSESSMENT_NOT_FOUND"
          )
        ),
        404,
        "ASSESSMENT_NOT_FOUND must map to 404."
      );

      assertEqual(
        evidenceQueryFailureStatus(
          makeFailure(
            "EVIDENCE_NOT_FOUND"
          )
        ),
        404,
        "EVIDENCE_NOT_FOUND must map to 404."
      );
    },
  },

  {
    name:
      "Internal query failure maps to 500",

    run: () => {
      assertEqual(
        evidenceQueryFailureStatus(
          makeFailure(
            "EVIDENCE_QUERY_FAILED"
          )
        ),
        500,
        "EVIDENCE_QUERY_FAILED must map to 500."
      );
    },
  },

  {
    name:
      "Single Evidence success response returns status 200",

    run: async () => {
      const response =
        evidenceQueryHttpResponse({
          success: true,
          evidence:
            makeEvidenceRecord(),
        });

      assertEqual(
        response.status,
        200,
        "Single Evidence success must return 200."
      );

      const body =
        await response.json();

      assertEqual(
        body.success,
        true,
        "Single Evidence response must report success."
      );

      assertEqual(
        body.evidence.id,
        "evidence-1",
        "Single Evidence response must preserve Evidence id."
      );

      assertEqual(
        body.evidence.createdAt,
        createdAt.toISOString(),
        "Single Evidence response must serialize dates."
      );
    },
  },

  {
    name:
      "Single Evidence failure response preserves reason and status",

    run: async () => {
      const response =
        evidenceQueryHttpResponse(
          makeFailure(
            "EVIDENCE_NOT_FOUND"
          )
        );

      assertEqual(
        response.status,
        404,
        "Missing Evidence response must return 404."
      );

      const body =
        await response.json();

      assertEqual(
        body.success,
        false,
        "Failure response must report success false."
      );

      assertEqual(
        body.reason,
        "EVIDENCE_NOT_FOUND",
        "Failure response must preserve domain reason."
      );
    },
  },

  {
    name:
      "Collection success response returns Assessment and Evidence count",

    run: async () => {
      const evidence =
        [
          makeEvidenceRecord(),
          makeEvidenceRecord({
            id:
              "evidence-2",

            title:
              "Second Evidence",

            requirementId:
              null,

            requirement:
              null,

            documentId:
              null,

            document:
              null,
          }),
        ];

      const response =
        evidenceCollectionQueryHttpResponse({
          success: true,

          assessment: {
            id:
              "assessment-1",

            title:
              "Tax Compliance Assessment",

            score:
              50,

            status:
              AssessmentStatus.IN_PROGRESS,

            frameworkId:
              "framework-tax",
          },

          evidence,

          count:
            evidence.length,
        });

      assertEqual(
        response.status,
        200,
        "Collection success must return 200."
      );

      const body =
        await response.json();

      assertEqual(
        body.success,
        true,
        "Collection response must report success."
      );

      assertEqual(
        body.assessment.id,
        "assessment-1",
        "Collection response must preserve Assessment id."
      );

      assertEqual(
        body.count,
        2,
        "Collection response must preserve count."
      );

      assertEqual(
        body.evidence.length,
        2,
        "Collection response must contain both Evidence records."
      );

      assertNull(
        body.evidence[1].requirement,
        "Nullable Requirement must survive collection serialization."
      );

      assertNull(
        body.evidence[1].document,
        "Nullable Document must survive collection serialization."
      );
    },
  },

  {
    name:
      "Empty Evidence collection is a successful 200 response",

    run: async () => {
      const response =
        evidenceCollectionQueryHttpResponse({
          success: true,

          assessment: {
            id:
              "assessment-1",

            title:
              "Tax Compliance Assessment",

            score:
              null,

            status:
              AssessmentStatus.DRAFT,

            frameworkId:
              "framework-tax",
          },

          evidence: [],

          count: 0,
        });

      assertEqual(
        response.status,
        200,
        "Empty collection must return 200."
      );

      const body =
        await response.json();

      assertEqual(
        body.count,
        0,
        "Empty collection count must be zero."
      );

      assertEqual(
        body.evidence.length,
        0,
        "Empty collection must contain no Evidence."
      );

      assertNull(
        body.assessment.score,
        "Null Assessment score must remain null."
      );
    },
  },

  {
    name:
      "Collection failure preserves domain failure mapping",

    run: async () => {
      const response =
        evidenceCollectionQueryHttpResponse(
          makeFailure(
            "ASSESSMENT_ACCESS_DENIED"
          )
        );

      assertEqual(
        response.status,
        403,
        "Assessment access denial must return 403."
      );

      const body =
        await response.json();

      assertEqual(
        body.reason,
        "ASSESSMENT_ACCESS_DENIED",
        "Collection failure must preserve domain reason."
      );
    },
  },
];


/*
 * ============================================================
 * EXECUTION
 * ============================================================
 */

async function main(): Promise<void> {
  console.log(
    "============================================================"
  );

  console.log(
    " COMPLIANCEOS — EVIDENCE QUERY HTTP POLICY VERIFICATION"
  );

  console.log(
    "============================================================"
  );

  console.log(
    `Running ${tests.length} deterministic tests.`
  );

  console.log("");


  for (
    let index = 0;
    index < tests.length;
    index += 1
  ) {
    const test =
      tests[index];

    try {
      await test.run();

      passed += 1;

      console.log(
        `PASS ${index + 1}: ${test.name}`
      );
    } catch (error) {
      failed += 1;

      console.error(
        `FAIL ${index + 1}: ${test.name}`
      );

      if (
        error instanceof Error
      ) {
        console.error(
          error.message
        );
      } else {
        console.error(
          String(error)
        );
      }
    }
  }


  console.log("");

  console.log(
    "============================================================"
  );

  console.log(
    `RESULT: ${passed}/${tests.length} passed`
  );

  console.log(
    `FAILED: ${failed}`
  );

  console.log(
    "============================================================"
  );


  if (failed > 0) {
    process.exitCode = 1;
  }
}


void main();
