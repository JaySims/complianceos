"use client";

import { useMemo } from "react";

import { executiveAI } from "@/lib/intelligence/executive-orchestrator";

export function useExecutiveAI() {

  const intelligence = useMemo(() => {

    return executiveAI.analyseOrganisation();

  }, []);

  return intelligence;

}
