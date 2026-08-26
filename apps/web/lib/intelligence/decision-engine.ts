import { organisationProfile } from "@/lib/profile/organisation-profile";

export interface Decision {

  nextField: string;

  reason: string;

}

export class DecisionEngine {

  decide(): Decision {

    const profile = organisationProfile.getProfile();

    if (!profile.organisationName) {

      return {

        nextField: "organisationName",

        reason:
          "The organisation identity has not yet been established."

      };

    }

    if (!profile.registrationNumber) {

      return {

        nextField: "registrationNumber",

        reason:
          "Registration verification is required before governance can begin."

      };

    }

    if (!profile.organisationType) {

      return {

        nextField: "organisationType",

        reason:
          "Understanding the organisation type improves compliance recommendations."

      };

    }

    if (!profile.industry) {

      return {

        nextField: "industry",

        reason:
          "Industry classification unlocks tailored funding and procurement opportunities."

      };

    }

    return {

      nextField: "complete",

      reason:
        "Core organisational information has been collected."

    };

  }

}

export const executiveDecision =
  new DecisionEngine();
