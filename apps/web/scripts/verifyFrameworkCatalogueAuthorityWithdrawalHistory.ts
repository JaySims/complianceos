import { Prisma } from "@prisma/client";

import { withdrawFrameworkCatalogueAuthorityInTransaction } from "@/lib/compliance/frameworkCatalogueAuthorityService";

type TestResult = {
  name: string;
  passed: boolean;
};

const results: TestResult[] = [];

const record = (name: string, passed: boolean) =>
  results.push({ name, passed });

type ApprovalRecord = {
  id: string;
  frameworkId: string;
  version: number;
  contentManifest: string;
  contentHash: string;
  manifestAlgorithmVersion: number;
  approvedById: string;
  reason: string;
};

type CatalogueAuthorityRecord = {
  id: string;
  frameworkId: string;
  frameworkCatalogueApprovalId: string;
};

type AssessmentRecord = {
  id: string;
  organizationId: string;
  frameworkId: string;
  title: string;
  score: number | null;
  status: string;
};

type AssessmentAuthorityRecord = {
  organizationId: string;
  frameworkId: string;
  assessmentId: string;
};

type TransitionRecord = {
  frameworkId: string;
  previousFrameworkCatalogueApprovalId: string | null;
  newFrameworkCatalogueApprovalId: string | null;
  transitionType: string;
  transitionedById: string;
  reason: string;
};

type MockDatabase = {
  approvals: Map<string, ApprovalRecord>;
  catalogueAuthority: CatalogueAuthorityRecord | null;
  transitions: TransitionRecord[];
  assessments: Map<string, AssessmentRecord>;
  assessmentAuthorities: Map<string, AssessmentAuthorityRecord>;
  assessmentCreates: number;
  assessmentAuthorityCreates: number;
  assessmentUpdates: number;
  assessmentAuthorityUpdates: number;
  assessmentDeletes: number;
};

function assessmentAuthorityKey(
  organizationId: string,
  frameworkId: string
): string {
  return `${organizationId}::${frameworkId}`;
}

function createMockTransaction(database: MockDatabase) {
  return {
    currentFrameworkCatalogueAuthority: {
      findUnique: async () => database.catalogueAuthority,

      deleteMany: async () => {
        if (!database.catalogueAuthority) {
          return { count: 0 };
        }

        database.catalogueAuthority = null;

        return { count: 1 };
      },
    },

    frameworkCatalogueAuthorityTransition: {
      create: async ({
        data,
      }: {
        data: TransitionRecord;
      }) => {
        database.transitions.push(data);

        return data;
      },
    },
  } as unknown as Prisma.TransactionClient;
}

async function main() {
  const approval: ApprovalRecord = {
    id: "approval-1",
    frameworkId: "framework-1",
    version: 1,
    contentManifest: "canonical-manifest",
    contentHash: "canonical-hash",
    manifestAlgorithmVersion: 1,
    approvedById: "user-1",
    reason: "initial governed approval",
  };

  const existingAssessment: AssessmentRecord = {
    id: "assessment-existing",
    organizationId: "organization-1",
    frameworkId: "framework-1",
    title: "Existing Compliance Assessment",
    score: null,
    status: "DRAFT",
  };

  const existingAssessmentAuthority: AssessmentAuthorityRecord = {
    organizationId: "organization-1",
    frameworkId: "framework-1",
    assessmentId: existingAssessment.id,
  };

  const database: MockDatabase = {
    approvals: new Map([[approval.id, approval]]),

    catalogueAuthority: {
      id: "catalogue-authority-1",
      frameworkId: "framework-1",
      frameworkCatalogueApprovalId: approval.id,
    },

    transitions: [],

    assessments: new Map([
      [existingAssessment.id, existingAssessment],
    ]),

    assessmentAuthorities: new Map([
      [
        assessmentAuthorityKey(
          existingAssessmentAuthority.organizationId,
          existingAssessmentAuthority.frameworkId
        ),
        existingAssessmentAuthority,
      ],
    ]),

    assessmentCreates: 0,
    assessmentAuthorityCreates: 0,
    assessmentUpdates: 0,
    assessmentAuthorityUpdates: 0,
    assessmentDeletes: 0,
  };

  const assessmentBefore = structuredClone(existingAssessment);
  const authorityBefore = structuredClone(
    existingAssessmentAuthority
  );
  const approvalBefore = structuredClone(approval);

  const result =
    await withdrawFrameworkCatalogueAuthorityInTransaction(
      createMockTransaction(database),
      {
        frameworkId: "framework-1",
        actorUserId: "user-2",
        reason: "historical integrity withdrawal proof",
      }
    );

  record(
    "catalogue authority withdrawal succeeds",
    result.success
  );

  record(
    "current catalogue authority removed",
    database.catalogueAuthority === null
  );

  const transition = database.transitions[0];

  record(
    "WITHDRAW transition recorded",
    transition?.transitionType === "WITHDRAW"
  );

  record(
    "withdrawal transition preserves previous approval identity",
    transition?.previousFrameworkCatalogueApprovalId === approval.id
  );

  record(
    "withdrawal transition has no replacement approval",
    transition?.newFrameworkCatalogueApprovalId === null
  );

  const approvalAfter = database.approvals.get(approval.id);

  record(
    "historical approval preserved",
    JSON.stringify(approvalAfter) ===
      JSON.stringify(approvalBefore)
  );

  const assessmentAfter = database.assessments.get(
    existingAssessment.id
  );

  record(
    "existing assessment preserved",
    JSON.stringify(assessmentAfter) ===
      JSON.stringify(assessmentBefore)
  );

  const authorityAfter =
    database.assessmentAuthorities.get(
      assessmentAuthorityKey(
        existingAssessment.organizationId,
        existingAssessment.frameworkId
      )
    );

  record(
    "existing organization assessment authority preserved",
    JSON.stringify(authorityAfter) ===
      JSON.stringify(authorityBefore)
  );

  record(
    "withdrawal creates no assessment",
    database.assessmentCreates === 0
  );

  record(
    "withdrawal creates no organization assessment authority",
    database.assessmentAuthorityCreates === 0
  );

  record(
    "withdrawal updates no assessment",
    database.assessmentUpdates === 0
  );

  record(
    "withdrawal updates no organization assessment authority",
    database.assessmentAuthorityUpdates === 0
  );

  record(
    "withdrawal deletes no assessment",
    database.assessmentDeletes === 0
  );

  record(
    "withdrawal leaves organization assessment authority pointing to existing assessment",
    authorityAfter?.assessmentId === "assessment-existing"
  );

  for (const result of results) {
    console.log(
      `${result.passed ? "PASS" : "FAIL"} — ${result.name}`
    );
  }

  const failed =
    results.filter((result) => !result.passed).length;

  console.log(
    `RESULT — ${results.length - failed} PASS / ${failed} FAIL`
  );

  if (failed > 0) {
    process.exitCode = 1;
  }
}

void main();