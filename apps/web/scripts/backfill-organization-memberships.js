const {
  PrismaClient,
} = require("@prisma/client");

const prisma =
  new PrismaClient();

/*
 * ============================================================
 * LEGACY ORGANISATION MEMBERSHIP BACKFILL
 * ============================================================
 *
 * Purpose:
 *
 * Older ComplianceOS users were created before
 * OrganizationMember existed.
 *
 * Those users may already have:
 *
 * User.organizationId
 *
 * but no corresponding:
 *
 * OrganizationMember
 *
 * This script repairs that relationship.
 *
 * SAFETY:
 *
 * - Existing memberships are preserved.
 * - Only the user's primary organisation is considered.
 * - Missing relationships are created.
 * - Re-running the script is safe.
 * ============================================================
 */

async function main() {
  console.log(
    "\n=== COMPLIANCEOS MEMBERSHIP BACKFILL ===\n"
  );

  /*
   * Find every user that already belongs
   * to a primary organisation.
   */

  const users =
    await prisma.user.findMany({
      where: {
        organizationId: {
          not: null,
        },
      },

      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        organizationId: true,

        organization: {
          select: {
            id: true,
            name: true,
          },
        },

        memberships: {
          select: {
            id: true,
            organizationId: true,
            role: true,
            active: true,
          },
        },
      },

      orderBy: {
        createdAt: "asc",
      },
    });

  /*
   * Identify only users missing a membership
   * for their primary organisation.
   */

  const missingMemberships =
    users.filter(
      (user) => {
        if (
          !user.organizationId
        ) {
          return false;
        }

        return !user.memberships.some(
          (membership) =>
            membership.organizationId ===
            user.organizationId
        );
      }
    );

  console.log(
    "Users requiring repair:",
    missingMemberships.length
  );

  if (
    missingMemberships.length === 0
  ) {
    console.log(
      "\nNo membership repairs are required."
    );

    return;
  }

  console.log(
    "\n=== REPAIR PLAN ==="
  );

  for (
    const user of
    missingMemberships
  ) {
    console.log({
      userId:
        user.id,

      fullName:
        user.fullName,

      email:
        user.email,

      userRole:
        user.role,

      organizationId:
        user.organizationId,

      organization:
        user.organization?.name,
    });
  }

  /*
   * ============================================================
   * TRANSACTION
   * ============================================================
   *
   * Perform the complete backfill atomically.
   */

  const createdMemberships =
    await prisma.$transaction(
      async (tx) => {
        const created = [];

        for (
          const user of
          missingMemberships
        ) {
          if (
            !user.organizationId
          ) {
            continue;
          }

          /*
           * upsert protects against duplicate
           * user/organisation relationships.
           *
           * The Prisma schema already has:
           *
           * @@unique([userId, organizationId])
           */

          const membership =
            await tx.organizationMember.upsert({
              where: {
                userId_organizationId: {
                  userId:
                    user.id,

                  organizationId:
                    user.organizationId,
                },
              },

              update: {},

              create: {
                userId:
                  user.id,

                organizationId:
                  user.organizationId,

                /*
                 * These legacy records represent
                 * the original users associated
                 * with their organisations.
                 */

                role:
                  "OWNER",

                active:
                  true,
              },
            });

          created.push(
            membership
          );
        }

        return created;
      }
    );

  console.log(
    "\n=== BACKFILL COMPLETE ==="
  );

  console.log(
    "Memberships processed:",
    createdMemberships.length
  );

  /*
   * ============================================================
   * VERIFICATION
   * ============================================================
   */

  const verification =
    await prisma.user.findMany({
      where: {
        id: {
          in:
            missingMemberships.map(
              (user) =>
                user.id
            ),
        },
      },

      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        organizationId: true,

        organization: {
          select: {
            id: true,
            name: true,
          },
        },

        memberships: {
          select: {
            id: true,
            organizationId: true,
            role: true,
            active: true,
          },
        },
      },
    });

  console.log(
    "\n=== VERIFICATION ==="
  );

  console.dir(
    verification,
    {
      depth: null,
    }
  );

  /*
   * Confirm no primary organisation
   * relationships remain unresolved.
   */

  const unresolved =
    verification.filter(
      (user) => {
        if (
          !user.organizationId
        ) {
          return false;
        }

        return !user.memberships.some(
          (membership) =>
            membership.organizationId ===
            user.organizationId
        );
      }
    );

  if (
    unresolved.length > 0
  ) {
    throw new Error(
      `${unresolved.length} legacy membership relationship(s) remain unresolved.`
    );
  }

  console.log(
    "\nSUCCESS: All targeted legacy memberships are valid."
  );
}

main()
  .catch(
    (error) => {
      console.error(
        "\nBACKFILL FAILED\n"
      );

      console.error(
        error
      );

      process.exitCode = 1;
    }
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    }
  );
