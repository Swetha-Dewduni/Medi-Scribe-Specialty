import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Consultation from "./pages/Consultation";
import NoteReview from "./pages/NoteReview";
import "./App.css";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [consultationData, setConsultationData] = useState(null);
  const [generatedNote, setGeneratedNote] = useState(null);

  const navigate = (target, data = null) => {
    if (data) {
      if (target === "review") setGeneratedNote(data);
      if (target === "consultation") setConsultationData(data);
    }
    setPage(target);
  };

  return (
    <div className="app">
      {page === "dashboard" && <Dashboard onNavigate={navigate} />}
      {page === "consultation" && (
        <Consultation
          initialData={consultationData}
          onNavigate={navigate}
        />
      )}
      {page === "review" && (
        <NoteReview note={generatedNote} onNavigate={navigate} />
      )}
    </div>
  );
}
