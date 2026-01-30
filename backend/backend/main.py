from fastapi import FastAPI, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import uuid
import openai
import io

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

USERS = {}
MEETINGS = {}

def get_user(uid):
    if uid not in USERS:
        USERS[uid] = {"created": datetime.utcnow().isoformat()}
    return USERS[uid]

@app.get("/")
def root():
    return {"status": "ClearNote backend running"}

@app.post("/meeting/start")
def start_meeting(x_user: str = Header(...)):
    get_user(x_user)
    mid = str(uuid.uuid4())
    MEETINGS[mid] = {
        "id": mid,
        "user": x_user,
        "created": datetime.utcnow().isoformat(),
        "transcript": "",
        "summary": "",
        "actions": [],
        "status": "recording",
        "shared": False
    }
    return {"meeting_id": mid}

@app.post("/meeting/{mid}/segment")
async def upload_segment(
    mid: str,
    file: UploadFile = File(...),
    x_user: str = Header(...)
):
    audio = await file.read()

    transcript = openai.audio.transcriptions.create(
        file=io.BytesIO(audio),
        model="gpt-4o-transcribe"
    )

    text = transcript.text
    MEETINGS[mid]["transcript"] += text + "\n"
    return {"text": text}

@app.post("/meeting/{mid}/stop")
def stop_meeting(mid: str, x_user: str = Header(...)):
    prompt = f"""
Summarize the meeting.
Return:
1. Summary
2. Action items (bullet list)

Transcript:
{MEETINGS[mid]['transcript']}
"""
    res = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )

    content = res.choices[0].message.content
    MEETINGS[mid]["summary"] = content
    MEETINGS[mid]["actions"] = [
        l for l in content.split("\n") if l.startswith("-")
    ]
    MEETINGS[mid]["status"] = "finished"
    return {"status": "finished"}

@app.get("/meetings")
def meetings(x_user: str = Header(...)):
    return [m for m in MEETINGS.values() if m["user"] == x_user]

@app.get("/meeting/{mid}/export/pdf")
def export_pdf(mid: str):
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    text = c.beginText(40, 800)

    m = MEETINGS[mid]
    text.textLine("ClearNote – Meeting Notes")
    text.textLine("")
    text.textLine(m["summary"])
    text.textLine("")
    text.textLine("Transcript:")
    text.textLine(m["transcript"])

    c.drawText(text)
    c.showPage()
    c.save()
    buf.seek(0)
    return buf.read()
