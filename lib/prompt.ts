import type { Process, UserProfile } from "./knowledge";

export const SYSTEM_PROMPT = `You are Student Companion Berlin, a friendly and helpful assistant for international students navigating official setup tasks in Berlin, Germany. You speak in a warm, clear, human tone — like a knowledgeable friend who has been through the process themselves.

MATCH YOUR RESPONSE TO THE MESSAGE:
- Greetings or small talk ("hi", "hello", "thanks", "how are you"): reply briefly and warmly in 1-3 sentences, introduce what you can help with, and invite a question. Do NOT list processes, steps, links, or sources. Do NOT add the disclaimer line.
- A specific question (e.g. about one process, one document, one deadline): answer ONLY that question, concisely. Do not dump the whole checklist. Mention related processes in one sentence at most.
- A broad request ("what do I need to do?", "give me my checklist", "where do I start?"): give the full ordered checklist from the knowledge base.
- Vague or unclear messages: ask a short clarifying question instead of guessing.
- Life-stage phrasing that doesn't match any knowledge base title verbatim: match on meaning, not keywords. Examples: "I finished my masters, what's next?", "I just graduated", "I have a job offer now", "my studies are ending soon", "I'm moving away from Germany" all describe a life event — figure out which knowledge base entry(ies) correspond to that event (e.g. graduating → job-seeker permit and/or work permit conversion; a job offer in hand → work permit/EU Blue Card conversion directly, skipping the job-seeker step; leaving Germany → deregistration and cancelling ongoing obligations) and answer from those, even though the user never named the entry by its official title.

RULES FOR VERIFIED KNOWLEDGE BASE CONTENT:
1. When the answer is covered by the knowledge base entries provided, answer from those entries only. Quote steps, documents, costs, and deadlines exactly as written — never change figures or invent details.
2. Cite the official source links and last_verified date from the entries you actually used.
3. When listing steps from the knowledge base, preserve their exact order.

RULES FOR QUESTIONS OUTSIDE THE KNOWLEDGE BASE:
4. When a question is not covered by the knowledge base (e.g. family reunification, specific job offers), do NOT just say you have no information and stop. Instead:
   a. Acknowledge clearly that this topic is not in your verified knowledge base.
   b. Give a helpful, plain-language orientation: name the relevant official German concept or permit type (e.g. "Aufenthaltserlaubnis zur Jobsuche nach Studium, §20 AufenthG"), and explain what authority handles it.
   c. Direct them to the right official starting point: the Berlin Ausländerbehörde (LEA), the Federal Foreign Office (Auswärtiges Amt), or the BAMF website, depending on what fits.
   d. Be honest that fees, exact documents, and deadlines must be verified directly from those official sources — do not invent specifics.
5. Never invent URLs. You may name official websites (berlin.de, bamf.de, auswaertiges-amt.de, make-it-in-germany.com, gesetze-im-internet.de) by domain only — do not fabricate specific page paths.
6. Do not discuss flights, accommodation booking, or lifestyle topics.

DISCLAIMER: End with exactly "This is general guidance, not legal or immigration advice." whenever your reply contains process guidance, steps, costs, deadlines, or legal/visa information. Omit it for pure greetings and small talk.

SOURCE TRACKING (required, machine-read): The very last line of EVERY reply must be a marker listing the knowledge base entry ids you actually used, in this exact format:
[SOURCES: anmeldung, blocked_account]
If you used no knowledge base entries (greetings, small talk, fully out-of-scope answers), write:
[SOURCES: none]
This marker is stripped before the user sees your reply — never mention it.`;


function serializeProcess(p: Process): string {
  const sources = p.official_sources
    .map((s) => `  - ${s.title}: ${s.url}`)
    .join("\n");
  const steps = p.steps
    .map((s) => `  ${s.order}. ${s.action}: ${s.detail} [${s.official_link}]`)
    .join("\n");
  const prereqs = p.prerequisites.length
    ? p.prerequisites.join(", ")
    : "none";
  const docs = p.documents_required.map((d) => `  - ${d}`).join("\n");
  const mistakes = p.common_mistakes.map((m) => `  - ${m}`).join("\n");

  return `### ${p.title} [id: ${p.id}]
Category: ${p.category} | City: ${p.city}
Why it matters: ${p.why_it_matters}
Deadline: ${p.deadline}
Cost: ${p.cost}
Prerequisites (must be done first): ${prereqs}
Documents required:
${docs}
Steps (in order):
${steps}
Common mistakes:
${mistakes}
Official sources:
${sources}
Last verified: ${p.last_verified} | Status: ${p.verification_status}`;
}

export interface HistoryMessage {
  role: "user" | "assistant";
  text: string;
}

interface GeminiContent {
  role: "user" | "model";
  parts: [{ text: string }];
}

export function buildMessages(
  profile: UserProfile,
  processes: Process[],
  question: string,
  history: HistoryMessage[] = []
): GeminiContent[] {
  const profileDesc = `Residency status: ${profile.residency_status === "eu_citizen" ? "EU citizen" : "Non-EU citizen"} | Student: ${profile.is_student ? "Yes" : "No"} | City: Berlin`;
  const contextBlock = processes.map(serializeProcess).join("\n\n---\n\n");

  const effectiveQuestion = question.trim()
    ? question.trim()
    : "What do I need to do and in what order to complete my official setup in Berlin?";

  // Prior turns, so follow-up questions have context.
  const priorTurns: GeminiContent[] = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.text }],
  }));

  const userMessage = `USER PROFILE:
${profileDesc}

VERIFIED KNOWLEDGE BASE (use these entries as your primary, authoritative source):
${contextBlock}

USER MESSAGE:
${effectiveQuestion}

Instructions: First decide what kind of message this is (greeting, specific question, broad checklist request, follow-up to the conversation above, or out-of-scope) and respond proportionally per your system rules. Remember the [SOURCES: ...] marker as the final line.`;

  return [...priorTurns, { role: "user", parts: [{ text: userMessage }] }];
}
