// Quick smoke-test: prints the topologically-ordered process IDs for a non-EU student.
// Run with: node scripts/test-retrieval.mjs

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const processes = JSON.parse(
  readFileSync(join(__dirname, "../data/processes.json"), "utf-8")
);

const profile = {
  city: "berlin",
  residency_status: "non_eu_citizen",
  is_student: true,
};

function matchesProfile(p, profile) {
  if (p.city !== profile.city) return false;
  if (!p.applies_to.residency_status.includes(profile.residency_status)) return false;
  if (p.applies_to.student === true && !profile.is_student) return false;
  return true;
}

function topoSort(processes) {
  const ids = new Set(processes.map((p) => p.id));
  const order = [];
  const visited = new Set();
  const inStack = new Set();

  function visit(id) {
    if (!ids.has(id) || visited.has(id)) return;
    if (inStack.has(id)) return;
    inStack.add(id);
    const node = processes.find((p) => p.id === id);
    for (const dep of node.prerequisites) {
      visit(dep);
    }
    inStack.delete(id);
    visited.add(id);
    order.push(id);
  }

  for (const p of processes) visit(p.id);

  const indexMap = new Map(order.map((id, i) => [id, i]));
  return [...processes].sort((a, b) => (indexMap.get(a.id) ?? 0) - (indexMap.get(b.id) ?? 0));
}

const matched = processes.filter((p) => matchesProfile(p, profile));
const sorted = topoSort(matched);

console.log("Profile: non-EU student in Berlin");
console.log("Ordered process IDs:");
sorted.forEach((p, i) => {
  const prereqLabel = p.prerequisites.length ? ` (after: ${p.prerequisites.join(", ")})` : "";
  console.log(`  ${i + 1}. ${p.id} — "${p.title}"${prereqLabel}`);
});
console.log(`\nTotal: ${sorted.length} processes`);
