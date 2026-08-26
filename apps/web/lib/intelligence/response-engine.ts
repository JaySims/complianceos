import { organisationProfile } from "@/lib/profile/organisation-profile";
import { executiveDecision } from "./decision-engine";

export interface ExecutiveResponse {

  message: string;

  encouragement: string;

  nextMission: string;

}

export class ResponseEngine {

  generate(): ExecutiveResponse {

    const profile = organisationProfile.getProfile();

    const decision = executiveDecision.decide();

    let message = "";

    switch (decision.nextField) {

      case "organisationName":

        message =
          "Let's begin by identifying your organisation.";

        break;

      case "registrationNumber":

        message =
          `Excellent. I've recorded ${profile.organisationName}. Now let's verify its registration.`;

        break;

      case "organisationType":

        message =
          "Great progress. Understanding your organisation type allows me to personalise compliance guidance.";

        break;

      case "industry":

        message =
          "Now let's identify your industry so I can discover funding and procurement opportunities.";

        break;

      default:

        message =
          "Excellent work. Your organisation's core profile is complete.";

    }

    return {

      message,

      encouragement:
        "Every answer strengthens your Digital Trust Profile.",

      nextMission: decision.reason,

    };

  }

}

export const executiveResponse =
  new ResponseEngine();
