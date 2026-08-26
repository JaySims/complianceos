import {
  resetExecutiveOrganisationState,
} from "@/lib/organisation/executiveOrganisationState";

import {
  resetWorkflowProgress,
} from "@/lib/workflows/workflowProgressStore";

import {
  clearActiveExecutiveMission,
} from "@/lib/missions/executiveMissionLauncher";

export function resetExecutiveDemo(): void {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  /*
   * Reset organisation readiness
   */

  resetExecutiveOrganisationState();

  /*
   * Reset Governance
   */

  resetWorkflowProgress(
    "governance"
  );

  /*
   * Reset Compliance
   */

  resetWorkflowProgress(
    "compliance"
  );

  /*
   * Reset Funding
   */

  resetWorkflowProgress(
    "funding"
  );

  /*
   * Reset Procurement
   */

  resetWorkflowProgress(
    "procurement"
  );

  /*
   * Remove active Executive Mission
   */

  clearActiveExecutiveMission();

  /*
   * Remove legacy Executive state
   * created during earlier development.
   */

  localStorage.removeItem(
    "complianceos.executive.state"
  );

  /*
   * Remove Executive learning state
   */

  localStorage.removeItem(
    "complianceos.executive.learning"
  );
}
