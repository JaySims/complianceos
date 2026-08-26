export interface InterviewQuestion {

  id: string;

  title: string;

  description: string;

  placeholder: string;

  field: string;

}

export class InterviewFlow {

  private questions: InterviewQuestion[] = [

    {
      id: "organisation-name",
      title: "Organisation Name",
      description:
        "Let's begin by identifying your organisation.",
      placeholder:
        "Enter your registered organisation name...",
      field: "organisationName",
    },

    {
      id: "registration-number",
      title: "Registration Number",
      description:
        "Please provide your CIPC registration number.",
      placeholder:
        "K2026/123456/07",
      field: "registrationNumber",
    },

    {
      id: "organisation-type",
      title: "Organisation Type",
      description:
        "What type of organisation are you registering?",
      placeholder:
        "Private Company (Pty) Ltd",
      field: "organisationType",
    },

    {
      id: "industry",
      title: "Industry",
      description:
        "Which industry does your organisation operate in?",
      placeholder:
        "Technology",
      field: "industry",
    }

  ];

  getQuestion(index: number) {

    return this.questions[index];

  }

  totalQuestions() {

    return this.questions.length;

  }

}

export const interviewFlow =
  new InterviewFlow();
