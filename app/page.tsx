"use client";

import React, { useState, useRef, useEffect } from "react";
import type { OfficialSource } from "@/lib/knowledge";

type ResidencyStatus = "eu_citizen" | "non_eu_citizen";

interface Message {
  role: "user" | "assistant";
  text: string;
  sources?: OfficialSource[];
  verified?: string | null;
  error?: boolean;
}

const SUGGESTIONS = [
  "What's my full checklist in order?",
  "What do I need for the Ausländerbehörde?",
  "How do I open a blocked account?",
  "Can I work while studying?",
  "What happens after graduation?",
  "How do I extend my residence permit?",
];

function inlineBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        )
      )}
    </>
  );
}

function renderText(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("### "))
      return <h3 key={i} className="md-h3">{line.slice(4)}</h3>;

    if (line.startsWith("## ") || line.startsWith("# "))
      return <h2 key={i} className="md-h2">{line.replace(/^#{1,3} /, "")}</h2>;

    // Numbered steps — extract number for amber badge
    const stepMatch = line.match(/^(\d+)\.\s*(.*)/);
    if (stepMatch) {
      return (
        <p key={i} className="md-step">
          <span className="step-num">{stepMatch[1]}</span>
          <span>{inlineBold(stepMatch[2])}</span>
        </p>
      );
    }

    // Bullet points — cyan dot
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return (
        <p key={i} className="md-bullet">
          <span className="bullet-dot">▸</span>
          <span>{inlineBold(line.slice(2))}</span>
        </p>
      );
    }

    if (line.trim() === "---") return <hr key={i} className="md-hr" />;
    if (line.trim() === "")   return <div key={i} className="md-gap" />;

    return <p key={i} className="md-p">{inlineBold(line)}</p>;
  });
}

function ExternalIcon() {
  return (
    <svg className="chip-icon" width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path
        d="M5.5 1H9m0 0v3.5M9 1 4 6M2 2H1v7h7V8"
        stroke="currentColor" strokeWidth="1.3"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M13 7.5L2 2l2 5.5L2 13l11-5.5z" fill="currentColor" />
    </svg>
  );
}

export default function Home() {
  const [residency, setResidency] = useState<ResidencyStatus>("non_eu_citizen");
  const [isStudent, setIsStudent] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  async function send(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const userMsg: Message = {
      role: "user",
      text: text || "What do I need to do and in what order?",
    };
    // Recent turns (before this message), so follow-ups have context
    const history = messages
      .filter((m) => !m.error)
      .slice(-10)
      .map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: { city: "berlin", residency_status: residency, is_student: isStudent },
          question: text,
          history,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: data.error ?? "Something went wrong. Please try again.", error: true },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: data.answer,
            sources: data.sources ?? [],
            verified: data.verified ?? null,
          },
        ]);
      }
    } catch (err) {
      console.error("[SCB]", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Network error — please check your connection.", error: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) void send();
    }
  }

  // Color the profile chips based on value
  const residencyChipClass = residency === "eu_citizen" ? "chip--cyan" : "chip--amber";
  const studentChipClass   = isStudent ? "chip--green" : "chip--neutral";
  const residencyLabel     = residency === "eu_citizen" ? "EU citizen" : "Non-EU citizen";

  return (
    <div className="shell">

      {/* ── Sidebar ── */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`sidebar${sidebarOpen ? " sidebar--open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">SCB</div>
          <div>
            <div className="brand-name">Student Companion</div>
            <div className="brand-tagline">BERLIN · PAPERWORK, SORTED</div>
          </div>
          <button
            type="button"
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="sidebar-profile">
          <p className="sidebar-section-label">Your Profile</p>
          <div className="field">
            <label className="field-label" htmlFor="residency">Residency Status</label>
            <select
              id="residency"
              className="field-select"
              value={residency}
              onChange={(e) => setResidency(e.target.value as ResidencyStatus)}
            >
              <option value="non_eu_citizen">Non-EU citizen</option>
              <option value="eu_citizen">EU citizen / EEA</option>
            </select>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="student">Enrollment</label>
            <select
              id="student"
              className="field-select"
              value={isStudent ? "yes" : "no"}
              onChange={(e) => setIsStudent(e.target.value === "yes")}
            >
              <option value="yes">Student</option>
              <option value="no">Not a student</option>
            </select>
          </div>
        </div>

        <div className="sidebar-hints">
          <p className="sidebar-section-label">Suggested questions</p>
          <div className="hint-list">
            {SUGGESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                className="hint-btn"
                onClick={() => { setInput(q); setSidebarOpen(false); textareaRef.current?.focus(); }}
              >
                <span className="hint-arrow">→</span>
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          Berlin only · Official sources only
          <br />
          Not legal or immigration advice
        </div>
      </aside>

      {/* ── Chat ── */}
      <div className="chat-shell">

        {/* Topbar */}
        <div className="chat-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <span className={`profile-chip ${residencyChipClass}`}>{residencyLabel}</span>
            <span className="topbar-sep">·</span>
            <span className={`profile-chip ${studentChipClass}`}>
              {isStudent ? "Student" : "Non-student"}
            </span>
            <span className="topbar-sep">·</span>
            <span className="profile-chip chip--violet chip--berlin">Berlin</span>
          </div>
          <button
            type="button"
            className="clear-btn"
            onClick={() => setMessages([])}
            disabled={messages.length === 0}
          >
            Clear chat
          </button>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && !loading && (
            <div className="chat-empty">
              <div className="empty-icon">SCB</div>
              <p className="empty-title">German bureaucracy,<br />in plain English</p>
              <p className="empty-sub">
                Anmeldung, residence permit, blocked account — ask about any official
                step, or get your full checklist in the right order. Every answer
                cites official Berlin sources.
              </p>
              <div className="empty-suggestions">
                {SUGGESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="empty-pill"
                    onClick={() => void send(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`msg-row msg-row--${msg.role}`}>
              {msg.role === "assistant" && <div className="msg-avatar">SCB</div>}

              <div className={[
                "msg-bubble",
                `msg-bubble--${msg.role}`,
                msg.error ? "msg-bubble--error" : "",
              ].filter(Boolean).join(" ")}>

                {msg.role === "assistant"
                  ? renderText(msg.text)
                  : <p className="md-p">{msg.text}</p>}

                {msg.sources && msg.sources.length > 0 && (
                  <div className="sources-block">
                    <div className="sources-header">
                      <span className="sources-eyebrow">Official Sources</span>
                      {msg.verified && (
                        <span className="verified-badge">✓ Verified {msg.verified}</span>
                      )}
                    </div>
                    <div className="source-chips">
                      {msg.sources.map((s, j) => (
                        <a key={j} href={s.url} target="_blank" rel="noopener noreferrer" className="source-chip">
                          <ExternalIcon />
                          {s.title}
                        </a>
                      ))}
                    </div>
                    <p className="disclaimer">
                      This is general guidance, not legal or immigration advice.
                    </p>
                  </div>
                )}
              </div>

              {msg.role === "user" && <div className="msg-avatar msg-avatar--user">You</div>}
            </div>
          ))}

          {loading && (
            <div className="msg-row msg-row--assistant">
              <div className="msg-avatar">SCB</div>
              <div className="msg-bubble msg-bubble--assistant">
                <div className="typing"><span /><span /><span /></div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="input-bar">
          <div className="input-wrap">
            <textarea
              ref={textareaRef}
              className="chat-input"
              rows={1}
              placeholder="Ask a question, or press Enter for your full checklist…"
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              type="button"
              className="send-btn"
              onClick={() => void send()}
              disabled={loading}
              aria-label="Send"
            >
              <SendIcon />
            </button>
          </div>
          <div className="input-meta">
            <span className="input-hint">Enter to send &nbsp;·&nbsp; Shift+Enter for new line</span>
          </div>
        </div>

      </div>
    </div>
  );
}
