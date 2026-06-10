import { useState } from "react";
import "./Dashboard.css";

const SPECIALTIES = [
  { id: "cardiology",   name: "Cardiology",       icon: "🫀", color: "#8A2A2A", desc: "Heart & cardiovascular" },
  { id: "orthopedics",  name: "Orthopedics",       icon: "🦴", color: "#2A5C8A", desc: "Bones, joints & muscles" },
  { id: "neurology",    name: "Neurology",          icon: "🧠", color: "#5C2A8A", desc: "Brain & nervous system" },
  { id: "pediatrics",   name: "Pediatrics",         icon: "👶", color: "#2A7A6A", desc: "Children's medicine" },
  { id: "general",      name: "General Medicine",   icon: "🩺", color: "#3A5A3A", desc: "Primary care" },
];

const STATS = [
  { label: "Notes Generated", value: "1,240", delta: "+12% this week" },
  { label: "Avg. Time Saved", value: "18 min", delta: "per consultation" },
  { label: "Accuracy Rate", value: "96.4%", delta: "AI extraction" },
  { label: "Active Doctors", value: "34", delta: "across 3 clinics" },
];

export default function Dashboard({ onNavigate }) {
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [doctorName, setDoctorName] = useState("");

  const handleStart = () => {
    if (!selectedSpecialty) return;
    onNavigate("consultation", {
      specialty: selectedSpecialty,
      doctorName: doctorName || "Dr. Attending",
    });
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dash-header">
        <div className="dash-logo">
          <span className="logo-mark">M</span>
          <div>
            <div className="logo-name">Medi-Scribe</div>
            <div className="logo-sub">Specialty</div>
          </div>
        </div>
        <div className="dash-meta">
          <span className="badge badge-green">● System Active</span>
          <div className="dash-time">{new Date().toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}</div>
        </div>
      </header>

      <main className="dash-main">
        {/* Hero */}
        <section className="dash-hero fade-in">
          <div className="hero-text">
            <h1>AI Clinical Documentation<br /><em>for Specialists</em></h1>
            <p>Record your consultation. Our AI listens, understands, and generates specialty-specific clinical notes — instantly.</p>
          </div>
          <div className="hero-visual">
            <div className="hero-orb" />
            <div className="hero-badge-group">
              <span className="hero-badge">Speech → Text</span>
              <span className="hero-arrow">→</span>
              <span className="hero-badge">NLP Extraction</span>
              <span className="hero-arrow">→</span>
              <span className="hero-badge">Clinical Note</span>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="stats-row fade-in">
          {STATS.map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-delta">{s.delta}</div>
            </div>
          ))}
        </section>

        {/* Start Consultation */}
        <section className="start-section fade-in">
          <div className="start-card card">
            <div className="start-header">
              <h2>New Consultation</h2>
              <p>Select your specialty and begin recording</p>
            </div>

            <div className="form-row">
              <label>Your Name</label>
              <input
                type="text"
                placeholder="Dr. Sanjay Gupta"
                value={doctorName}
                onChange={e => setDoctorName(e.target.value)}
                style={{ maxWidth: 320 }}
              />
            </div>

            <div className="specialty-label">
              <label>Select Specialty</label>
            </div>
            <div className="specialty-grid">
              {SPECIALTIES.map(sp => (
                <button
                  key={sp.id}
                  className={`specialty-card ${selectedSpecialty === sp.id ? "selected" : ""}`}
                  style={{ "--sp-color": sp.color }}
                  onClick={() => setSelectedSpecialty(sp.id)}
                >
                  <span className="sp-icon">{sp.icon}</span>
                  <span className="sp-name">{sp.name}</span>
                  <span className="sp-desc">{sp.desc}</span>
                  {selectedSpecialty === sp.id && <span className="sp-check">✓</span>}
                </button>
              ))}
            </div>

            <div className="start-actions">
              <button
                className="btn btn-primary btn-lg"
                disabled={!selectedSpecialty}
                onClick={handleStart}
              >
                <span>🎙️</span> Start Consultation
              </button>
              {!selectedSpecialty && (
                <span className="hint-text">Please select a specialty first</span>
              )}
            </div>
          </div>
        </section>

        {/* Recent Notes Placeholder */}
        <section className="recent-section fade-in">
          <h3>Recent Notes</h3>
          <div className="recent-empty">
            <span className="recent-empty-icon">📋</span>
            <p>No notes yet. Start your first consultation above.</p>
          </div>
        </section>
      </main>

      <footer className="dash-footer">
        <span>© 2025 Medi-Scribe Specialty</span>
        <span>Team CS11-302 · Aurea · IIT</span>
        <span>Track 02 – Intelligence</span>
      </footer>
    </div>
  );
}
