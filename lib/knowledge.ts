import processesRaw from "@/data/processes.json";

export interface ProcessStep {
  order: number;
  action: string;
  detail: string;
  official_link: string;
}

export interface OfficialSource {
  title: string;
  url: string;
}

export interface Process {
  id: string;
  title: string;
  category: string;
  city: string;
  applies_to: {
    residency_status: string[];
    student: boolean | null;
  };
  why_it_matters: string;
  deadline: string;
  cost: string;
  prerequisites: string[];
  documents_required: string[];
  steps: ProcessStep[];
  common_mistakes: string[];
  official_sources: OfficialSource[];
  last_verified: string;
  verification_status: string;
}

export interface UserProfile {
  city: string;
  residency_status: "eu_citizen" | "non_eu_citizen";
  is_student: boolean;
}

const ALL_PROCESSES: Process[] = processesRaw as Process[];

function matchesProfile(process: Process, profile: UserProfile): boolean {
  if (process.city !== profile.city) return false;
  if (!process.applies_to.residency_status.includes(profile.residency_status))
    return false;
  if (process.applies_to.student === true && !profile.is_student) return false;
  return true;
}

export function getRelevantProcesses(profile: UserProfile): Process[] {
  const matched = ALL_PROCESSES.filter((p) => matchesProfile(p, profile));
  return topoSort(matched);
}

function topoSort(processes: Process[]): Process[] {
  const ids = new Set(processes.map((p) => p.id));
  const order: string[] = [];
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function visit(id: string): void {
    if (!ids.has(id) || visited.has(id)) return;
    if (inStack.has(id)) return; // cycle — skip to avoid infinite loop
    inStack.add(id);
    const node = processes.find((p) => p.id === id)!;
    for (const dep of node.prerequisites) {
      visit(dep);
    }
    inStack.delete(id);
    visited.add(id);
    order.push(id);
  }

  for (const p of processes) {
    visit(p.id);
  }

  const indexMap = new Map(order.map((id, i) => [id, i]));
  return [...processes].sort(
    (a, b) => (indexMap.get(a.id) ?? 0) - (indexMap.get(b.id) ?? 0)
  );
}
