import { useState, useRef, useEffect } from "react";
import "./Consultation.css";

const API_BASE = "http://localhost:8000";

const SPECIALTY_INFO = {
  cardiology:   { name: "Cardiology",     icon: "🫀", color: "#8A2A2A" },
  orthopedics:  { name: "Orthopedics",    icon: "🦴", color: "#2A5C8A" },
  neurology:    { name: "Neurology",       icon: "🧠", color: "#5C2A8A" },
  pediatrics:   { name: "Pediatrics",      icon: "👶", color: "#2A7A6A" },
  general:      { name: "General Medicine",icon: "🩺", color: "#3A5A3A" },
};

export default function Consultation({ initialData, onNavigate }) {
  const specialty = initialData?.specialty || "general";
  const doctorName = initialData?.doctorName || "Dr. Attending";
  const spInfo = SPECIALTY_INFO[specialty];

  const [phase, setPhase] = useState("ready"); // ready | recording | processing | done
  const [transcript, setTranscript] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [usingDemo, setUsingDemo] = useState(false);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const transcriptAreaRef = useRef(null);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptAreaRef.current) {
      transcriptAreaRef.current.scrollTop = transcriptAreaRef.current.scrollHeight;
    }
  }, [transcript]);

  // Timer
  useEffect(() => {
    if (phase === "recording") {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Browser doesn't support speech recognition. Please use Chrome/Edge, or type/paste your transcript below.");
      setPhase("recording");
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    let finalTranscript = transcript;

    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript + interim);
    };

    rec.onerror = (e) => {
      if (e.error !== "no-speech") {
        setError(`Microphone error: ${e.error}. You can type the transcript manually.`);
      }
    };

    rec.start();
    recognitionRef.current = rec;
    setPhase("recording");
    setElapsed(0);
    setError("");
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setPhase("stopped");
  };

  const loadDemo = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/demo-transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialty }),
      });
      const data = await res.json();
      setTranscript(data.transcript);
      setUsingDemo(true);
      setPhase("stopped");
    } catch {
      // Fallback demo
      setTranscript(`Doctor: Good morning! What brings you in today?
Patient: I've been having right knee pain for 3 weeks, doctor. It's a sharp pain, about 7 out of 10.
Doctor: Did you have any injury? Any swelling?
Patient: I twisted it during cricket a month ago. There's some swelling and morning stiffness.
Doctor: I'll examine your knee now. I notice tenderness along the medial joint line, and McMurray's test is positive. I suspect a medial meniscus tear. I'll prescribe Ibuprofen 400mg three times daily with food. We'll order an MRI and start physiotherapy three times weekly.
Patient: How long is recovery?
Doctor: 6 to 8 weeks conservatively. Come back in two weeks.`);
      setUsingDemo(true);
      setPhase("stopped");
    }
    setIsLoading(false);
  };

  const generateNote = async () => {
    if (!transcript.trim()) {
      setError("Please record or enter a transcript first.");
      return;
    }
    setIsLoading(true);
    setError("");
    setPhase("processing");

    try {
      const res = await fetch(`${API_BASE}/api/generate-note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          specialty,
          doctor_name: doctorName,
          patient_id: `PT-${Date.now()}`,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Server error");
      }
      const data = await res.json();
      onNavigate("review", data.note);
    } catch (e) {
      setError(`Failed to generate note: ${e.message}. Check the backend is running.`);
      setPhase("stopped");
    }
    setIsLoading(false);
  };

  return (
    <div className="consultation">
      {/* Header */}
      <header className="consult-header">
        <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("dashboard")}>
          ← Back
        </button>
        <div className="consult-title">
          <span className="consult-sp-badge" style={{ background: spInfo.color + "18", color: spInfo.color }}>
            {spInfo.icon} {spInfo.name}
          </span>
          <span className="consult-doctor">{doctorName}</span>
        </div>
        <div className="consult-time">{new Date().toLocaleTimeString()}</div>
      </header>

      <main className="consult-main">
        {/* Recording Control Panel */}
        <section className="record-panel card fade-in">
          <div className="record-status">
            <div className={`record-indicator ${phase}`} />
            <div>
              <div className="record-phase-label">
                {phase === "ready" && "Ready to Record"}
                {phase === "recording" && "🔴 Recording in Progress"}
                {phase === "stopped" && "Recording Complete"}
                {phase === "processing" && "⚙️ Generating Clinical Note…"}
              </div>
              {phase === "recording" && (
                <div className="record-timer">{formatTime(elapsed)}</div>
              )}
            </div>
          </div>

          <div className="record-controls">
            {phase === "ready" && (
              <>
                <button className="btn btn-danger btn-lg" onClick={startRecording}>
                  🎙️ Start Recording
                </button>
                <button className="btn btn-secondary" onClick={loadDemo} disabled={isLoading}>
                  {isLoading ? <span className="spinner" /> : "📋 Load Demo"}
                </button>
              </>
            )}
            {phase === "recording" && (
              <button className="btn btn-secondary btn-lg" onClick={stopRecording}>
                ⏹ Stop Recording
              </button>
            )}
            {phase === "stopped" && (
              <>
                <button className="btn btn-danger btn-sm" onClick={startRecording}>
                  🎙️ Continue Recording
                </button>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={generateNote}
                  disabled={!transcript.trim() || isLoading}
                >
                  {isLoading ? <><span className="spinner" /> Processing…</> : "✨ Generate Clinical Note"}
                </button>
              </>
            )}
            {phase === "processing" && (
              <div className="processing-indicator">
                <span className="spinner" style={{ borderTopColor: "var(--accent)" }} />
                <span>AI is extracting clinical information…</span>
              </div>
            )}
          </div>

          {usingDemo && (
            <div className="demo-banner">
              📋 Demo transcript loaded. Click "Generate Clinical Note" to see AI extraction in action.
            </div>
          )}

          {error && <div className="error-banner">{error}</div>}
        </section>

        {/* Transcript Area */}
        <section className="transcript-section fade-in">
          <div className="transcript-header">
            <h3>Consultation Transcript</h3>
            <div className="transcript-actions">
              <span className="char-count">{transcript.length} chars</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setTranscript("")}>
                Clear
              </button>
            </div>
          </div>
          <textarea
            ref={transcriptAreaRef}
            className="transcript-area"
            placeholder={
              phase === "ready"
                ? "Your consultation transcript will appear here as you speak…\n\nOr type / paste it manually. Or click 'Load Demo' to see a sample."
                : phase === "recording"
                ? "🎙️ Listening… speak naturally."
                : "Edit the transcript if needed before generating the note."
            }
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            readOnly={phase === "recording"}
          />
        </section>

        {/* Tips */}
        <section className="tips-section card fade-in">
          <h4>💡 Tips for best results</h4>
          <ul className="tips-list">
            <li>Speak clearly and naturally — no need to slow down</li>
            <li>Mention the patient's symptoms, your examination findings, and your plan</li>
            <li>Include medication names and dosages when prescribing</li>
            <li>The AI understands medical terminology for <strong>{spInfo.name}</strong></li>
          </ul>
        </section>
      </main>
    </div>
  );
}
