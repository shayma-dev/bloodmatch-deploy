// src/pages/Landing.jsx
import { useState } from "react";
import { Navigate } from "react-router-dom";
import AppLayout from "../ui/layout/AppLayout";
import useAuth from "../auth/useAuth";
import Modal from "../ui/layout/Modal";
import Button from "../ui/controls/Button";
import LoginForm from "../features/auth/LoginForm";
import SignupForm from "../features/auth/SignupForm";

export default function Landing() {
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  // If logged in, redirect by role
  if (user) {
    if (user.role === "DONOR") return <Navigate to="/donor/dashboard" replace />;
    if (user.role === "REQUESTER") return <Navigate to="/requester/dashboard" replace />;
    return <Navigate to="/donor/requests" replace />;
  }

  return (
    <AppLayout user={user} onLogout={logout}>
      {/* HERO */}
      <section
        style={{
          position: "relative",
          padding: "56px 0 40px",
          overflow: "hidden",
          background:
            "radial-gradient(1200px 600px at 20% -20%, rgba(255,0,0,0.08), transparent 60%), radial-gradient(1000px 500px at 100% 0%, rgba(255,0,0,0.05), transparent 60%)",
        }}
      >
        <div
          className="container"
          style={{
            display: "grid",
            gap: 24,
            gridTemplateColumns: "1.2fr 1fr",
            alignItems: "center",
          }}
        >
          {/* Left: Hero text */}
          <div>
            <div
              className="badge"
              style={{
                display: "inline-block",
                padding: "6px 10px",
                borderRadius: 999,
                background: "var(--red-100)",
                border: "1px solid var(--red-300)",
                color: "var(--red-900)",
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Faster matches. Better outcomes.
            </div>

            <h1 style={{ fontSize: "2.4rem", lineHeight: 1.15, marginBottom: 12 }}>
              Connect with lifesaving donors in minutes — not days
            </h1>

            <p className="muted" style={{ marginBottom: 20, maxWidth: 680 }}>
              BloodMatch links urgent blood requests with compatible donors nearby, using role-based access, smart matching, and real-time availability checks.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button onClick={() => setShowSignup(true)}>Get started — It’s free</Button>
              <button className="btn ghost" onClick={() => setShowLogin(true)}>I already have an account</button>
            </div>
          </div>

          {/* Right: Visual card */}
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0 }}>Join BloodMatch</h3>
            <p className="muted" style={{ marginBottom: 16 }}>
              Create an account to request help or donate blood. Choose your role during sign up.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button onClick={() => setShowSignup(true)}>Sign up</Button>
              <button className="btn ghost" onClick={() => setShowLogin(true)}>Login</button>
            </div>
            <ul className="muted" style={{ lineHeight: 1.8, marginTop: 16, marginBottom: 0 }}>
              <li>Smart location and blood-type matching</li>
              <li>Eligibility cooldown enforcement</li>
              <li>Request management and donor applications</li>
            </ul>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container" style={{ padding: "28px 0" }}>
        <SectionTitle eyebrow="How it works" title="From request to donation, in 3 simple steps" />
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <StepCard index={1} title="Create request" desc="Post your blood type, urgency, and location. We’ll notify compatible donors nearby." />
          <StepCard index={2} title="Review donors" desc="Check donor compatibility and contact information as applications arrive." />
          <StepCard index={3} title="Coordinate donation" desc="Confirm a donor, share details, and mark your request as resolved when complete." />
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background: "var(--gray-50)" }}>
        <div className="container" style={{ padding: "28px 0" }}>
          <SectionTitle eyebrow="Why BloodMatch" title="Built for speed, safety, and clarity" />
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            <Feature icon="🩸" title="Precise matching" desc="Filter by blood type and proximity to surface the most relevant donors first." />
            <Feature icon="🛡️" title="Eligibility checks" desc="Automatic cooldown tracking helps ensure donors are donation-ready." />
            <Feature icon="⚡" title="Real-time alerts" desc="Get immediate visibility with donors and reduce time-to-first-response." />
            <Feature icon="📊" title="Simple dashboards" desc="Clear overviews for donors and requesters to stay on top of progress." />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container" style={{ padding: "28px 0" }}>
        <SectionTitle eyebrow="What users say" title="Early feedback from our community" />
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          <Testimonial
            quote="We found a compatible donor within the hour. BloodMatch made a scary situation manageable."
            name="Ayesha R."
            role="Requester, AB+"
          />
          <Testimonial
            quote="The platform makes it easy to see when I can donate again and where I'm needed most."
            name="Daniel O."
            role="Donor, O-"
          />
          <Testimonial
            quote="Clear and fast process. I applied, got contacted, and donated the next day."
            name="Priya K."
            role="Donor, B+"
          />
        </div>
      </section>

      {/* CTA STRIPE */}
      <section
        style={{
          background:
            "linear-gradient(90deg, rgba(255,60,60,0.14), rgba(255,0,0,0.12))",
          borderTop: "1px solid var(--color-border)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div className="container" style={{ padding: "24px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: 0 }}>Ready to save time — and lives?</h3>
            <p className="muted" style={{ margin: 0 }}>Join in under a minute. It’s free for donors and requesters.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button onClick={() => setShowSignup(true)}>Create your account</Button>
            <button className="btn ghost" onClick={() => setShowLogin(true)}>Login</button>
          </div>
        </div>
      </section>

      {/* Modals */}
      <Modal open={showLogin} onClose={() => setShowLogin(false)} title="Welcome back">
        <LoginForm
          onSwitchToSignup={() => {
            setShowLogin(false);
            setShowSignup(true);
          }}
        />
      </Modal>

      <Modal open={showSignup} onClose={() => setShowSignup(false)} title="Create your account">
        <SignupForm
          onSwitchToLogin={() => {
            setShowSignup(false);
            setShowLogin(true);
          }}
        />
      </Modal>
    </AppLayout>
  );
}

function SectionTitle({ eyebrow, title }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="muted" style={{ textTransform: "uppercase", letterSpacing: 0.6, fontSize: 12 }}>{eyebrow}</div>
      <h2 style={{ marginTop: 4, marginBottom: 0 }}>{title}</h2>
    </div>
  );
}

function StepCard({ index, title, desc }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: "var(--red-100)",
            border: "1px solid var(--red-300)",
            color: "var(--red-900)",
            fontWeight: 700,
          }}
          aria-hidden="true"
        >
          {index}
        </div>
        <strong>{title}</strong>
      </div>
      <div className="muted">{desc}</div>
    </div>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 22, marginBottom: 8 }} aria-hidden="true">{icon}</div>
      <strong style={{ display: "block", marginBottom: 6 }}>{title}</strong>
      <div className="muted">{desc}</div>
    </div>
  );
}

function Testimonial({ quote, name, role }) {
  return (
    <blockquote className="card" style={{ padding: 16, margin: 0 }}>
      <p style={{ marginTop: 0, marginBottom: 8, fontStyle: "italic" }}>&ldquo;{quote}&rdquo;</p>
      <footer className="muted">
        — {name} <span aria-hidden="true"> </span> ({role})
      </footer>
    </blockquote>
  );
}