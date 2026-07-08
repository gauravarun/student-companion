import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Student Companion Berlin",
  description: "What Student Companion Berlin does and doesn't do with your data.",
};

const LAST_UPDATED = "2026-07-08";
const CONTACT_EMAIL = "gauravarun21@gmail.com";

export default function PrivacyPage() {
  return (
    <div className="legal-shell">
      <div className="legal-doc">
        <Link href="/" className="legal-back">
          ← Back to Student Companion
        </Link>

        <p className="legal-eyebrow">PRIVACY POLICY &nbsp;·&nbsp; LAST UPDATED {LAST_UPDATED}</p>
        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-sub">
          There's no account, no ads, and nothing here is sold. This page explains,
          in plain terms, exactly what happens to your information when you use
          Student Companion Berlin.
        </p>

        <section className="legal-section">
          <h2>What gets sent to Google&rsquo;s Gemini API</h2>
          <p>
            When you ask a question, we send Google&rsquo;s Gemini API your question
            text, your selected profile (residency status, student status, and
            city), and your recent conversation history so follow-up questions
            keep context. This app currently runs on the free tier of the Gemini
            API. Under Google&rsquo;s terms for unpaid use, Google may use submitted
            content to improve its products, and human reviewers may read some of
            it — so please avoid entering sensitive identifiers (passport numbers,
            full financial details, etc.) into your questions. See the{" "}
            <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer">
              Gemini API Additional Terms of Service
            </a>{" "}
            and{" "}
            <a href="https://ai.google.dev/gemini-api/docs/logs-policy" target="_blank" rel="noopener noreferrer">
              Data Logging and Sharing
            </a>{" "}
            policy for details.
          </p>
        </section>

        <section className="legal-section">
          <h2>What stays on your device</h2>
          <p>
            Your profile selection, chat history (capped at the most recent 100
            messages), checklist progress, and dark/light preference are all
            stored in your browser&rsquo;s local storage. We don&rsquo;t have a database —
            none of this is ever transmitted to or saved on our servers. Clicking
            &ldquo;Clear chat,&rdquo; &ldquo;Reset checklist,&rdquo; or clearing your
            browser&rsquo;s site data removes it.
          </p>
        </section>

        <section className="legal-section">
          <h2>Rate limiting</h2>
          <p>
            To stop a single source from draining our shared Gemini quota, the
            server keeps a temporary count of requests per IP address in memory —
            never written to disk — which automatically expires after 10 minutes.
          </p>
        </section>

        <section className="legal-section">
          <h2>Error monitoring</h2>
          <p>
            We use Sentry to capture technical error details (stack traces, HTTP
            status codes) when something breaks, so we can fix it. We don&rsquo;t
            deliberately send your questions or answers to Sentry, though generic
            error context may be attached automatically. See{" "}
            <a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer">
              Sentry&rsquo;s Privacy Policy
            </a>
            .
          </p>
        </section>

        <section className="legal-section">
          <h2>Usage analytics</h2>
          <p>
            We use Vercel Web Analytics, which doesn&rsquo;t use cookies and reports
            only anonymous, aggregated statistics — it can&rsquo;t identify you. Beyond
            page views, we track two custom, non-identifying events: which
            internal knowledge-base topic (an id like &ldquo;blocked_account,&rdquo;
            never your actual question) was used to answer a question, and
            whether the checklist PDF export was used. See{" "}
            <a href="https://vercel.com/docs/analytics/privacy-policy" target="_blank" rel="noopener noreferrer">
              Vercel Web Analytics Privacy &amp; Compliance
            </a>{" "}
            and Vercel&rsquo;s own{" "}
            <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>{" "}
            for standard hosting logs (e.g. IP address, request timestamps).
          </p>
        </section>

        <section className="legal-section">
          <h2>Reporting an issue with an answer</h2>
          <p>
            The &ldquo;Report an issue&rdquo; link opens your own device&rsquo;s email app with a
            pre-filled message addressed to us — including the question, an
            excerpt of the answer, and its sources. Nothing is sent unless you
            press send yourself.
          </p>
        </section>

        <section className="legal-section">
          <h2>No ads, no data sale</h2>
          <p>
            We don&rsquo;t run advertising and we don&rsquo;t sell or share your data with
            data brokers. The only outside parties involved are the ones named
            above: Google (Gemini API), Sentry (error monitoring), and Vercel
            (hosting and analytics).
          </p>
        </section>

        <section className="legal-section">
          <h2>Children</h2>
          <p>
            This service is intended for current and prospective university
            students and is not directed at children under 16.
          </p>
        </section>

        <section className="legal-section">
          <h2>Changes to this policy</h2>
          <p>
            If this policy changes materially, we&rsquo;ll update the &ldquo;last
            updated&rdquo; date at the top of this page.
          </p>
        </section>

        <section className="legal-section">
          <h2>Contact</h2>
          <p>
            Questions about privacy:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </section>

        <p className="legal-disclaimer">
          Reminder: Student Companion Berlin provides general informational
          guidance, not legal or immigration advice.
        </p>
      </div>
    </div>
  );
}
