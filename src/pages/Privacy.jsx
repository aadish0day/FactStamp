import Seo from "../components/Seo.jsx";

export default function Privacy() {
  return (
    <div className="container" style={{ maxWidth: 760, padding: "64px 24px 96px" }}>
      <Seo title="FactStamp | Privacy Policy" description="Privacy Policy for FactStamp, the community WhatsApp misinformation fact-checker." />
      <h1 className="display" style={{ fontSize: 34, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ color: "var(--text-2)", marginBottom: 32 }}>
        Last updated: {new Date().getFullYear()}. This is a prototype — no real data is collected.
      </p>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>1. Data we don't collect</h2>
        <p style={{ color: "var(--text-2)", lineHeight: 1.7 }}>
          This demo runs entirely in your browser. There is no backend, so no account,
          email, or submission is transmitted or stored on any server.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>2. Local preferences</h2>
        <p style={{ color: "var(--text-2)", lineHeight: 1.7 }}>
          Your theme choice is saved locally in your browser. Clearing site data removes it.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>3. Contact</h2>
        <p style={{ color: "var(--text-2)", lineHeight: 1.7 }}>
          Questions about this prototype? Reach the team at hello@factstamp.example.
        </p>
      </section>
    </div>
  );
}
