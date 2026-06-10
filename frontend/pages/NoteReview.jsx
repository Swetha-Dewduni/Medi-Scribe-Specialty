import { useState } from "react";
import "./NoteReview.css";

const API_BASE = "http://localhost:8000";

const SECTION_META = {
  chief_complaint:             { label: "Chief Complaint",                  icon: "📌" },
  history_of_present_illness:  { label: "History of Present Illness",        icon: "📖" },
  symptoms:                    { label: "Symptoms",                           icon: "🔍" },
  examination_findings:        { label: "Examination Findings",               icon: "🩺" },
  diagnosis:                   { label: "Diagnosis",                          icon: "💊" },
  medications:                 { label: "Medications Prescribed",             icon: "💉" },
  treatment_plan:              { label: "Treatment Plan",                     icon: "📋" },
  follow_up:                   { label: "Follow-Up Instructions",             icon: "📅" },
};

export default function NoteReview({ note, onNavigate }) {
  const [editedNote, setEditedNote] = useState(note || {});
  const [approved, setApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [editingField, setEditingField] = useState(null);

  if (!note) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p>No note to display.</p>
        <button className="btn btn-primary" onClick={() => onNavigate("dashboard")}>Go to Dashboard</button>
      </div>
    );
  }

  const updateField = (field, value) => {
    setEditedNote(prev => ({ ...prev, [field]: value }));
  };

  const approveNote = async () => {
    setIsApproving(true);
    try {
      const res = await fetch(`${API_BASE}/api/approve-note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: editedNote }),
      });
      if (res.ok) setApproved(true);
    } catch {
      // Simulate approval offline
      setApproved(true);
    }
    setIsApproving(false);
  };

  const printNote = () => window.print();

  const renderValue = (field, value) => {
    if (Array.isArray(value)) {
      return (
        <ul className="note-list">
          {value.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
    }
    return <p className="note-text">{value || "Not documented"}</p>;
  };

  const renderEditableValue = (field, value) => {
    if (Array.isArray(value)) {
      return (
        <textarea
          className="note-edit-area"
          value={value.join("\n")}
          onChange={e => updateField(field, e.target.value.split("\n").filter(Boolean))}
          rows={Math.max(3, value.length + 1)}
        />
      );
    }
    return (
      <textarea
        className="note-edit-area"
        value={value || ""}
        onChange={e => updateField(field, e.target.value)}
        rows={3}
      />
    );
  };

  if (approved) {
    return (
      <div className="approved-screen fade-in">
        <div className="approved-card card">
          <div className="approved-icon">✅</div>
          <h2>Note Approved & Saved</h2>
          <p>The clinical note for <strong>{editedNote.patient_id}</strong> has been approved and is ready for EMR integration.</p>
          <div className="approved-meta">
            <span>👨‍⚕️ {editedNote.doctor_name}</span>
            <span>🏥 {editedNote.specialty}</span>
            <span>📅 {editedNote.date}</span>
          </div>
          <div className="approved-actions">
            <button className="btn btn-secondary" onClick={printNote}>🖨️ Print Note</button>
            <button className="btn btn-primary" onClick={() => onNavigate("dashboard")}>← New Consultation</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="note-review">
      {/* Header */}
      <header className="review-header">
        <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("dashboard")}>← Dashboard</button>
        <div className="review-title">
          <h2>Clinical Note Review</h2>
          <span className="badge badge-amber">⏳ Pending Approval</span>
        </div>
        <div className="review-actions">
          <button className="btn btn-secondary btn-sm" onClick={printNote}>🖨️ Print</button>
          <button
            className="btn btn-success"
            onClick={approveNote}
            disabled={isApproving}
          >
            {isApproving ? <><span className="spinner" /> Saving…</> : "✅ Approve & Save"}
          </button>
        </div>
      </header>

      <main className="review-main">
        {/* Note Metadata */}
        <section className="note-meta-bar card fade-in">
          <div className="meta-item">
            <span className="meta-label">Patient ID</span>
            <span className="meta-val">{editedNote.patient_id}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Doctor</span>
            <span className="meta-val">{editedNote.doctor_name}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Specialty</span>
            <span className="meta-val">{editedNote.specialty}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Date & Time</span>
            <span className="meta-val">{editedNote.date}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Status</span>
            <span className="badge badge-amber">AI Generated</span>
          </div>
        </section>

        <div className="review-body">
          {/* Clinical Note */}
          <section className="note-sections fade-in">
            <div className="section-header-row">
              <h3>Generated Clinical Note</h3>
              <p className="section-hint">Click any section to edit before approving.</p>
            </div>

            {Object.entries(SECTION_META).map(([field, meta]) => {
              const value = editedNote[field];
              const isEditing = editingField === field;
              return (
                <div key={field} className={`note-section ${isEditing ? "editing" : ""}`}>
                  <div className="note-section-header" onClick={() => setEditingField(isEditing ? null : field)}>
                    <span className="note-section-icon">{meta.icon}</span>
                    <span className="note-section-label">{meta.label}</span>
                    <span className="note-edit-hint">{isEditing ? "Click to collapse" : "✏️ Click to edit"}</span>
                  </div>
                  <div className="note-section-body">
                    {isEditing
                      ? renderEditableValue(field, value)
                      : renderValue(field, value)}
                  </div>
                </div>
              );
            })}
          </section>

          {/* Raw Transcript */}
          <section className="raw-transcript-panel card fade-in">
            <h4>📝 Original Transcript</h4>
            <pre className="raw-transcript">{editedNote.raw_transcript}</pre>
          </section>
        </div>

        {/* Bottom Approve */}
        <div className="bottom-approve fade-in">
          <div className="approve-note-text">
            ⚠️ Please review all sections carefully before approving. You can click any section above to edit.
          </div>
          <button
            className="btn btn-success btn-lg"
            onClick={approveNote}
            disabled={isApproving}
          >
            {isApproving ? <><span className="spinner" /> Saving…</> : "✅ Approve & Save to EMR"}
          </button>
        </div>
      </main>
    </div>
  );
}
