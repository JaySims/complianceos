export type ExecutiveState = {
  activeMission: string;
  activeWorkflow: string;
  trustScore: number;
  workspaceVersion: string;
  lastUpdated: string;
};

const STORAGE_KEY = "complianceos.executive.state";

export function saveExecutiveState(
  state: ExecutiveState
): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );
}

export function loadExecutiveState(): ExecutiveState | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as ExecutiveState;
  } catch {
    return null;
  }
}

export function clearExecutiveState(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEY);
}
