"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";

import {
  ExecutiveMission,
  getMission,
} from "@/lib/onboarding/missionEngine";

type MissionContextType = {

  step: number;

  totalSteps: number;

  mission: ExecutiveMission;

  nextStep: () => void;

  previousStep: () => void;

  setStep: (step: number) => void;

};

const MissionContext =
createContext<MissionContextType | null>(null);

export function MissionProvider({

children,

}:{

children:ReactNode;

}){

const totalSteps=7;

const [step,setStep]=useState(1);

const mission=useMemo(

()=>getMission(step),

[step]

);

function nextStep(){

setStep((current)=>

Math.min(current+1,totalSteps)

);

}

function previousStep(){

setStep((current)=>

Math.max(current-1,1)

);

}

return(

<MissionContext.Provider

value={{

step,

totalSteps,

mission,

nextStep,

previousStep,

setStep,

}}

>

{children}

</MissionContext.Provider>

);

}

export function useMission(){

const context=useContext(MissionContext);

if(!context){

throw new Error(

"useMission must be used inside MissionProvider"

);

}

return context;

}
