"""
Medi-Scribe Specialty - Backend API
Team CS11-302 | Aurea | IIT
Powered by Groq (Free API - works worldwide)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os, json
from datetime import datetime

try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))
except ImportError:
    pass

from groq import Groq

API_KEY = os.environ.get("GROQ_API_KEY", "")
if not API_KEY:
    raise RuntimeError(
        "\n\n❌ No Groq API key found!\n"
        "Add to backend/.env:\n"
        "   GROQ_API_KEY=gsk_your_key_here\n"
        "Get a free key at: https://console.groq.com\n"
    )

client = Groq(api_key=API_KEY)

app = FastAPI(title="Medi-Scribe Specialty API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TranscriptRequest(BaseModel):
    transcript: str
    specialty: str
    patient_id: Optional[str] = None
    doctor_name: Optional[str] = None

class ClinicalNote(BaseModel):
    patient_id: Optional[str]
    doctor_name: Optional[str]
    specialty: str
    date: str
    chief_complaint: str
    history_of_present_illness: str
    symptoms: List[str]
    examination_findings: str
    diagnosis: str
    medications: List[str]
    treatment_plan: str
    follow_up: str
    raw_transcript: str

class NoteApprovalRequest(BaseModel):
    note: ClinicalNote
    doctor_edits: Optional[dict] = None

class TextAnalysisRequest(BaseModel):
    text: str
    specialty: str

SPECIALTY_PROMPTS = {
    "cardiology":  "You specialize in CARDIOLOGY. Focus on cardiac symptoms, heart sounds, BP, ECG findings, and cardiac medications.",
    "orthopedics": "You specialize in ORTHOPEDICS. Focus on musculoskeletal complaints, ROM, special tests, fracture types, physiotherapy.",
    "neurology":   "You specialize in NEUROLOGY. Focus on neurological symptoms, cranial nerves, reflexes, coordination, neurological meds.",
    "pediatrics":  "You specialize in PEDIATRICS. Focus on age-appropriate symptoms, parent-reported concerns, weight-based dosing.",
    "general":     "You specialize in GENERAL MEDICINE. Extract all clinical information comprehensively.",
}

def call_groq(prompt: str) -> str:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=1500,
    )
    raw = response.choices[0].message.content.strip()
    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return raw.strip()

@app.get("/")
def root():
    return {"message": "Medi-Scribe API v1.0 (Groq Free)", "team": "CS11-302 Aurea"}

@app.get("/health")
def health():
    return {"status": "ok", "ai": "Groq Free (Llama 3.3 70B)", "time": datetime.now().isoformat()}

@app.post("/api/generate-note")
async def generate_note(req: TranscriptRequest):
    if not req.transcript.strip():
        raise HTTPException(400, "Transcript cannot be empty")

    sp = SPECIALTY_PROMPTS.get(req.specialty, SPECIALTY_PROMPTS["general"])

    prompt = f"""You are an expert medical documentation AI. {sp}

Extract clinical information from the consultation transcript below.
Respond with ONLY valid JSON — no explanation, no markdown, no code fences.

JSON format:
{{
  "chief_complaint": "string",
  "history_of_present_illness": "string",
  "symptoms": ["symptom1", "symptom2"],
  "examination_findings": "string",
  "diagnosis": "string",
  "medications": ["med name - dose - frequency"],
  "treatment_plan": "string",
  "follow_up": "string"
}}

TRANSCRIPT:
{req.transcript}

JSON only:"""

    try:
        raw = call_groq(prompt)
        extracted = json.loads(raw)
        note = {
            "patient_id": req.patient_id or f"PT-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "doctor_name": req.doctor_name or "Dr. Attending",
            "specialty": req.specialty.capitalize(),
            "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "raw_transcript": req.transcript,
            **extracted,
        }
        return {"success": True, "note": note}
    except json.JSONDecodeError as e:
        raise HTTPException(500, f"JSON parse error: {e}. Raw: {raw[:300]}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"{type(e).__name__}: {str(e)}")

@app.post("/api/analyze-text")
async def analyze_text(req: TextAnalysisRequest):
    prompt = f"""Extract medical entities from this {req.specialty} text.
Return ONLY JSON: {{"symptoms":[],"medications":[],"diagnoses":[],"procedures":[]}}
Text: {req.text}"""
    try:
        raw = call_groq(prompt)
        return {"success": True, "entities": json.loads(raw)}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/api/approve-note")
async def approve_note(req: NoteApprovalRequest):
    note = req.note.dict()
    if req.doctor_edits:
        note.update(req.doctor_edits)
    note["approved"] = True
    note["approved_at"] = datetime.now().isoformat()
    return {"success": True, "message": "Note approved.", "note": note}

@app.get("/api/specialties")
def specialties():
    return {"specialties": [
        {"id": "cardiology",  "name": "Cardiology",      "icon": "🫀"},
        {"id": "orthopedics", "name": "Orthopedics",      "icon": "🦴"},
        {"id": "neurology",   "name": "Neurology",         "icon": "🧠"},
        {"id": "pediatrics",  "name": "Pediatrics",        "icon": "👶"},
        {"id": "general",     "name": "General Medicine",  "icon": "🩺"},
    ]}

@app.post("/api/demo-transcript")
async def demo_transcript(body: dict):
    sp = body.get("specialty", "orthopedics")
    demos = {
        "orthopedics": """Doctor: Good morning! What brings you in today?
Patient: Hi doctor, I've been having severe right knee pain for the past three weeks.
Doctor: Can you describe the pain?
Patient: It's worse going up stairs. Sharp pain, about 7 out of 10. There's swelling and morning stiffness for 20 minutes.
Doctor: Any injury?
Patient: I twisted it playing cricket about a month ago.
Doctor: I'm feeling tenderness along the medial joint line. McMurray's test is positive. I suspect a medial meniscus tear. I'll prescribe Ibuprofen 400mg three times a day with food, physiotherapy three times a week, and we'll do an MRI. Come back in two weeks.""",
        "cardiology": """Doctor: What seems to be the problem?
Patient: I've been having chest pain and palpitations for the last week. Tightness in the center, radiates to my left arm. Lasts 5-10 minutes. I get breathless and dizzy. My father had a heart attack at 58. I'm on Amlodipine 5mg for blood pressure.
Doctor: BP is 158 over 94. ECG shows ST segment changes. I'm concerned about unstable angina. Starting Aspirin 75mg daily, Atorvastatin 40mg at night, increasing Amlodipine to 10mg, and adding GTN spray. Please go to the emergency department today.""",
        "neurology": """Doctor: What brings you in?
Patient: Bad headaches for 2 months. Left side, very throbbing, lasting 4-6 hours. I feel nauseous and light bothers me. I see zigzag lines for 20 minutes before the pain starts.
Doctor: Neurological exam is normal. This is classic migraine with aura. Prescribing Sumatriptan 50mg for acute attacks, Naproxen 500mg for pain, and Propranolol 40mg daily as preventative.""",
        "pediatrics": """Parent: Aiden is 4 years old. Fever for 3 days up to 39.2 and his right ear hurts. He had a cold a week ago.
Doctor: He weighs 16kg. Temperature 38.6. Right eardrum is red and bulging — acute otitis media. Prescribing Amoxicillin 250mg twice daily for 7 days and Paracetamol syrup 240mg every 6 hours for fever. Follow up in one week.""",
        "general": """Doctor: What can I help you with?
Patient: Tired for a month and a cough for three weeks. Low-grade fever in evenings and lost 3 kilos without trying.
Doctor: Crackles in left lower lobe. Temperature 37.8, oxygen 97%. Likely community-acquired pneumonia. Prescribing Amoxicillin 500mg three times a day for 7 days, Paracetamol as needed. Come back in 3 days.""",
    }
    return {"transcript": demos.get(sp, demos["general"])}