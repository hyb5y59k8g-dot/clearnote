let recognition;
let isPaused = false;
let transcript = [];
let currentTitle = "";
let activeNoteIndex = null;

const output = document.getElementById("output");
const summaryDiv = document.getElementById("summary");
const historyList = document.getElementById("history");

/* ---------------- iOS Speech ---------------- */
function initRecognition() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Speech recognition not supported on this device.");
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.lang = document.getElementById("language").value;

  recognition.onresult = e => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        const speaker = document.getElementById("speaker").value;
        const text = e.results[i][0].transcript.trim();
        transcript.push({ speaker, text });
        renderTranscript(transcript);
      }
    }
  };

  recognition.onend = () => {
    if (!isPaused) recognition.start();
  };
}

/* ---------------- Transcript Render ---------------- */
function renderTranscript(items) {
  output.innerHTML = "";
  items.forEach(t => {
    output.innerHTML += `<span class="speaker">${t.speaker}:</span> ${t.text}<br>`;
  });
}

/* ---------------- Buttons ---------------- */
document.getElementById("newNote").onclick = () => {
  transcript = [];
  currentTitle = `Note ${new Date().toLocaleString()}`;
  activeNoteIndex = null;
  output.innerHTML = "";
  summaryDiv.textContent = "Summary will appear here after recording is stopped.";
};

document.getElementById("start").onclick = () => {
  if (!currentTitle) currentTitle = `Note ${new Date().toLocaleString()}`;
  isPaused = false;
  initRecognition();
  recognition.start();
};

document.getElementById("pause").onclick = () => {
  isPaused = true;
  recognition.stop();
};

document.getElementById("resume").onclick = () => {
  isPaused = false;
  recognition.start();
};

document.getElementById("stop").onclick = () => {
  if (recognition) recognition.stop();
  saveNote();
};

/* ---------------- Storage ---------------- */
function saveNote() {
  if (!transcript.length) return;

  const notes = JSON.parse(localStorage.getItem("meetings") || "[]");

  notes.push({
    title: currentTitle,
    transcript,
    summary: "",
    date: new Date().toISOString()
  });

  localStorage.setItem("meetings", JSON.stringify(notes));
  activeNoteIndex = notes.length - 1;
  renderHistory();
}

/* ---------------- History ---------------- */
function renderHistory() {
  const notes = JSON.parse(localStorage.getItem("meetings") || "[]");
  historyList.innerHTML = "";

  notes.forEach((note, index) => {
    const li = document.createElement("li");

    const titleSpan = document.createElement("span");
    titleSpan.textContent = note.title;
    titleSpan.onclick = () => loadNote(index);

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.onclick = e => {
      e.stopPropagation();
      const newName = prompt("Rename note:", note.title);
      if (newName) {
        note.title = newName;
        localStorage.setItem("meetings", JSON.stringify(notes));
        renderHistory();
      }
    };

    li.appendChild(titleSpan);
    li.appendChild(editBtn);
    historyList.appendChild(li);
  });
}

function loadNote(index) {
  const notes = JSON.parse(localStorage.getItem("meetings") || "[]");
  const note = notes[index];
  activeNoteIndex = index;
  transcript = note.transcript;
  renderTranscript(transcript);
  summaryDiv.textContent = note.summary || "Summary not generated yet.";
}

/* ---------------- Export ---------------- */
function getActiveNote() {
  const notes = JSON.parse(localStorage.getItem("meetings") || "[]");
  if (!notes.length) return null;
  return notes[activeNoteIndex ?? notes.length - 1];
}

document.getElementById("exportTXT").onclick = () => {
  const note = getActiveNote();
  if (!note) return;

  const text =
`Title: ${note.title}
Date: ${new Date(note.date).toLocaleString()}

Transcript:
${note.transcript.map(t => `${t.speaker}: ${t.text}`).join("\n")}

Summary:
${note.summary || ""}`;

  const blob = new Blob([text], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${note.title}.txt`;
  a.click();
};

document.getElementById("exportPDF").onclick = () => {
  const note = getActiveNote();
  if (!note) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;

  doc.text(`Title: ${note.title}`, 10, y); y += 8;
  doc.text(`Date: ${new Date(note.date).toLocaleString()}`, 10, y); y += 10;

  doc.text("Transcript:", 10, y); y += 8;
  note.transcript.forEach(t => {
    if (y > 280) { doc.addPage(); y = 10; }
    doc.text(`${t.speaker}: ${t.text}`, 10, y);
    y += 6;
  });

  doc.save(`${note.title}.pdf`);
};

renderHistory();
