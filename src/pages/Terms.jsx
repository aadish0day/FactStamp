import Seo from "../components/Seo.jsx";

export default function Terms() {
  return (
    <div className="container" style={{ maxWidth: 760, padding: "64px 24px 96px" }}>
      <Seo title="FactStamp | Terms of Service" description="Terms of Service for FactStamp, the community WhatsApp misinformation fact-checker." />
      <h1 className="display" style={{ fontSize: 34, marginBottom: 8 }}>Terms of Service</h1>
      <p style={{ color: "var(--text-2)", marginBottom: 32 }}>
        Last updated: {new Date().getFullYear()}. This is a prototype — these terms are illustrative.
      </p>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>1. Community verification</h2>
        <p style={{ color: "var(--text-2)", lineHeight: 1.7 }}>
          FactStamp is a demo experience. All claims, verdicts and accounts shown here are
          mock data and do not represent real people or events.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>2. Acceptable use</h2>
        <p style={{ color: "var(--text-2)", lineHeight: 1.7 }}>
          Be honest when verifying. Submit credible sources, avoid harassment, and don't
          use the platform to spread the very misinformation it exists to counter.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>3. No warranty</h2>
        <p style={{ color: "var(--text-2)", lineHeight: 1.7 }}>
          Verdicts are community-generated and provided "as is" without warranty of
          accuracy. Always confirm critical claims through official sources.
        </p>
      </section>
    </div>
  );
}
