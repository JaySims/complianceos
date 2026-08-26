import type {
  ExecutiveMemory,
  ExecutiveSnapshot,
} from "./executiveMemoryEngine";

export function buildExecutiveTimeline(
  memory: ExecutiveMemory
): ExecutiveSnapshot[] {

  return [...memory.history].sort(
    (a, b) =>
      new Date(a.date).getTime() -
      new Date(b.date).getTime()
  );

}
