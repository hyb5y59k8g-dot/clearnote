let recognition;
let transcript = [];
let activeNoteIndex = null;
let currentTitle = "";

const output = document.getElementById("output");
const summaryDiv = document.getElementById("summary");
const speakerSelect = document.getElementById("speaker");

/* ---------- Storage ---------- */
const getNotes = () => JSON.parse(localStorage.getItem("meetings") || "[]");
const setNotes = n => localStorage.setItem("meetings", JSON.stringify(n));
const getTrash = () => JSON.parse(localStorage.getItem("trash") || "[]");
const setTrash = t => localStorage.setItem("trash", JSON.stringify(t));

/* ---------- Speech ---------- */
function initRecognition() {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.lang = document.getElementById("language").value;

  recognition.onresult = e => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        transcript.push({
          speaker: speakerSelect.value,
          text: e.results[i][0].transcript.trim()
        });
        renderTranscript();
      }
    }
  };
}

/* ---------- Render ---------- */
function renderTranscript() {
  output.innerHTML = transcript
    .map(t => `<span class="speaker">${t.speaker}:</span> ${t.text}`)
    .join("<br>");
}

function renderHistory() {
  const list = document.getElementById("history");
  list.innerHTML = "";
  getNotes().forEach((n, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span onclick="loadNote(${i})">${n.title}</span>
      <span>
        <button onclick="renameNote(${i})">✏️</button>
        <button onclick="moveToTrash(${i})">🗑️</button>
      </span>`;
    list.appendChild(li);
  });
}

function renderTrash() {
  const list = document.getElementById("trash");
  list.innerHTML = "";
  getTrash().forEach((n, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${n.title}</span>
      <span>
        <button onclick="restoreNote(${i})">♻️</button>
        <button onclick="deleteForever(${i})">❌</button>
      </span>`;
    list.appendChild(li);
  });
}

/* ---------- Note Actions ---------- */
window.loadNote = i => {
  const n = getNotes()[i];
  activeNoteIndex = i;
  transcript = n.transcript;
  summaryDiv.textContent = n.summary || "";
  renderTranscript();
};

window.renameNote = i => {
  const notes = getNotes();
  const name = prompt("Rename note:", notes[i].title);
  if (name) {
    notes[i].title = name;
    setNotes(notes);
    renderHistory();
  }
};

window.moveToTrash = i => {
  if (!confirm("Move note to Trash?")) return;
  const notes = getNotes();
  const trash = getTrash();
  trash.push(notes.splice(i, 1)[0]);
  setNotes(notes);
  setTrash(trash);
  renderHistory();
  renderTrash();
};

window.restoreNote = i => {
  const notes = getNotes();
  const trash = getTrash();
  notes.push(trash.splice(i, 1)[0]);
  setNotes(notes);
  setTrash(trash);
  renderHistory();
  renderTrash();
};

window.deleteForever = i => {
  if (!confirm("Delete permanently?")) return;
  const trash = getTrash();
  trash.splice(i, 1);
  setTrash(trash);
  renderTrash();
};

/* ---------- Controls ---------- */
document.getElementById("newNote").onclick = () => {
  transcript = [];
  speakerSelect.value = "Speaker 1";
  output.innerHTML = "";
  summaryDiv.textContent = "";
  currentTitle = `Note ${new Date().toLocaleString()}`;
  activeNoteIndex = null;
};

document.getElementById("start").onclick = () => {
  initRecognition();
  recognition.start();
};

document.getElementById("pause").onclick = () => recognition.stop();
document.getElementById("resume").onclick = () => recognition.start();

document.getElementById("stop").onclick = () => {
  recognition.stop();
  const notes = getNotes();
  notes.push({
    title: currentTitle,
    transcript,
    summary: "",
    date: new Date().toISOString()
  });
  setNotes(notes);
  activeNoteIndex = notes.length - 1;
  renderHistory();
};

/* ---------- Export TXT ---------- */
document.getElementById("exportTXT").onclick = () => {
  const n = getNotes()[activeNoteIndex];
  if (!n) return;
  const blob = new Blob(
    [`${n.title}\n\n${n.transcript.map(t => `${t.speaker}: ${t.text}`).join("\n")}`],
    { type: "text/plain" }
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${n.title}.txt`;
  a.click();
};

/* ---------- Export PDF (FIXED) ---------- */
document.getElementById("exportPDF").onclick = () => {
  const note = getNotes()[activeNoteIndex];
  if (!note) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  doc.setFontSize(16);
  doc.text(note.title, margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.text(new Date(note.date).toLocaleString(), margin, y);
  y += 10;

  doc.setFontSize(13);
  doc.text("Transcript", margin, y);
  y += 8;

  doc.setFontSize(11);

  note.transcript.forEach(t => {
    const lines = doc.splitTextToSize(`${t.speaker}: ${t.text}`, maxWidth);
    lines.forEach(line => {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 6;
    });
  });

  doc.save(`${note.title}.pdf`);
};

/* ---------- Init ---------- */
renderHistory();
renderTrash();
