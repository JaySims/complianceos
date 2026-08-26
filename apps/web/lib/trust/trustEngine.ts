export interface TrustFactors {

    companyRegistered:boolean;

    directorsVerified:boolean;

    governanceCompleted:boolean;

    complianceCompleted:boolean;

    documentsUploaded:number;

    fundingReady:boolean;

    procurementReady:boolean;

    aiValidated:boolean;

}

export interface TrustResult{

    score:number;

    grade:string;

    level:string;

}

export function calculateTrustScore(

f:TrustFactors

):TrustResult{

let score=0;

if(f.companyRegistered) score+=10;

if(f.directorsVerified) score+=12;

if(f.governanceCompleted) score+=15;

if(f.complianceCompleted) score+=18;

score+=Math.min(f.documentsUploaded*3,15);

if(f.procurementReady) score+=12;

if(f.fundingReady) score+=10;

if(f.aiValidated) score+=8;

score=Math.min(score,100);

let grade="D";
let level="Emerging";

if(score>=90){

grade="A+";
level="Elite";

}

else if(score>=80){

grade="A";
level="Investment Ready";

}

else if(score>=70){

grade="B";
level="Procurement Ready";

}

else if(score>=60){

grade="C";
level="Growing";

}

return{

score,

grade,

level,

};

}
