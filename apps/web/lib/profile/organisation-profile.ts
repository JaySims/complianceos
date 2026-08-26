export interface OrganisationProfile {

  organisationName: string;

  registrationNumber: string;

  organisationType: string;

  industry: string;

  taxNumber: string;

  vatNumber: string;

  directors: string[];

  completedFields: number;

}

export class OrganisationProfileStore {

  private profile: OrganisationProfile = {

    organisationName: "",

    registrationNumber: "",

    organisationType: "",

    industry: "",

    taxNumber: "",

    vatNumber: "",

    directors: [],

    completedFields: 0,

  };

  getProfile() {

    return this.profile;

  }

  updateField(

    field: keyof OrganisationProfile,

    value: any

  ) {

    (this.profile as any)[field] = value;

    this.calculateCompletion();

  }

  private calculateCompletion() {

    const values = [

      this.profile.organisationName,

      this.profile.registrationNumber,

      this.profile.organisationType,

      this.profile.industry,

      this.profile.taxNumber,

      this.profile.vatNumber,

    ];

    this.profile.completedFields = values.filter(

      (value) => value !== ""

    ).length;

  }

}

export const organisationProfile =
  new OrganisationProfileStore();
