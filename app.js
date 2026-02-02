/* -------------------- STATE -------------------- */
let recognition;
let isRecording = false;
let transcript = [];
let activeNoteIndex = null;
let seconds = 0;
let timerInterval;

/* -------------------- ELEMENTS -------------------- */
const output = document.getElementById("output");
const summaryDiv = document.getElementById("summary");
const speakerSelect = document.getElementById("speaker");
const languageSelect = document.getElementById("language");
const historyList = document.getElementById("history");

const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const stopBtn = document.getElementById("stop");

const timerEl = document.getElementById("timer");
const recordDot = document.getElementById("recordDot");

/* -------------------- STORAGE -------------------- */
const getNotes = () => JSON.parse(localStorage.getItem("notes") || "[]");
const setNotes = n => localStorage.setItem("notes", JSON.stringify(n));
const getTrash = () => JSON.parse(localStorage.getItem("trash") || "[]");
const setTrash = t => localStorage.setItem("trash", JSON.stringify(t));

/* -------------------- TIMER -------------------- */
function startTimer() {
  seconds = 0;
  timerEl.textContent = "00:00";
  recordDot.style.display = "inline-block";

  timerInterval = setInterval(() => {
    seconds++;
    timerEl.textContent =
      String(Math.floor(seconds / 60)).padStart(2, "0") + ":" +
      String(seconds % 60).padStart(2, "0");
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerEl.textContent = "00:00";
  recordDot.style.display = "none";
}

/* -------------------- SPEECH -------------------- */
function initRecognition() {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.lang = languageSelect.value;

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

  recognition.onerror = () => stopRecording();
}

/* -------------------- RECORDING -------------------- */
function startRecording() {
  if (isRecording) return;
  initRecognition();
  recognition.start();
  startTimer();
  isRecording = true;

  startBtn.classList.add("active");
  pauseBtn.disabled = false;
  stopBtn.disabled = false;
}

function pauseRecording() {
  if (!isRecording) return;
  recognition.stop();
  stopTimer();
  isRecording = false;
  startBtn.classList.remove("active");
}

function stopRecording() {
  if (!isRecording) return;
  recognition.stop();
  stopTimer();
  isRecording = false;
  saveNote();
  startBtn.classList.remove("active");
}

/* -------------------- RENDER -------------------- */
function renderTranscript() {
  output.innerHTML = transcript
    .map(t => `<span class="speaker">${t.speaker}:</span> ${t.text}`)
    .join("<br>");
}

function renderHistory() {
  historyList.innerHTML = "";
  const notes = getNotes();

  notes.forEach((note, index) => {
    const li = document.createElement("li");
    li.className = index === activeNoteIndex ? "active-note" : "";
    li.innerHTML = `
      <strong>${note.title}</strong><br>
      <button onclick="selectNote(${index})">Open</button>
      <button onclick="renameNote(${index})">Edit</button>
      <button onclick="deleteNote(${index})">🗑</button>
    `;
    historyList.appendChild(li);
  });
}

/* -------------------- NOTES -------------------- */
function saveNote() {
  const notes = getNotes();

  notes.push({
    title: `Note ${new Date().toLocaleString()}`,
    transcript,
    summary: "",
    date: new Date().toISOString()
  });

  setNotes(notes);
  transcript = [];
  renderHistory();
}

function selectNote(index) {
  const notes = getNotes();
  activeNoteIndex = index;
  transcript = notes[index].transcript;
  output.innerHTML = transcript
    .map(t => `<span class="speaker">${t.speaker}:</span> ${t.text}`)
    .join("<br>");
  summaryDiv.textContent = notes[index].summary || "";
  renderHistory();
}

function renameNote(index) {
  const notes = getNotes();
  const name = prompt("Rename note:", notes[index].title);
  if (name) {
    notes[index].title = name;
    setNotes(notes);
    renderHistory();
  }
}

function deleteNote(index) {
  const notes = getNotes();
  const trash = getTrash();
  trash.push(notes[index]);
  notes.splice(index, 1);
  setTrash(trash);
  setNotes(notes);
  activeNoteIndex = null;
  output.innerHTML = "";
  summaryDiv.textContent = "";
  renderHistory();
}

/* -------------------- NEW NOTE -------------------- */
document.getElementById("newNote").onclick = () => {
  transcript = [];
  output.innerHTML = "";
  summaryDiv.textContent = "";
  speakerSelect.value = "Speaker 1";
  activeNoteIndex = null;
  renderHistory();
};

/* -------------------- BUTTONS -------------------- */
startBtn.onclick = startRecording;
pauseBtn.onclick = pauseRecording;
stopBtn.onclick = stopRecording;

/* -------------------- EXPORT & COPY -------------------- */
document.getElementById("copyTranscript").onclick =
  () => navigator.clipboard.writeText(output.innerText);

document.getElementById("copySummary").onclick =
  () => navigator.clipboard.writeText(summaryDiv.innerText);

function exportTXT(name, text) {
  const blob = new Blob([text], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.txt`;
  a.click();
}

function exportPDF(name, text) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const lines = doc.splitTextToSize(text, 180);
  doc.text(lines, 10, 10);
  doc.save(`${name}.pdf`);
}

document.getElementById("exportTranscriptTXT").onclick =
  () => exportTXT("Transcript", output.innerText);

document.getElementById("exportTranscriptPDF").onclick =
  () => exportPDF("Transcript", output.innerText);

document.getElementById("exportSummaryTXT").onclick =
  () => exportTXT("Summary", summaryDiv.innerText);

document.getElementById("exportSummaryPDF").onclick =
  () => exportPDF("Summary", summaryDiv.innerText);

/* -------------------- INIT -------------------- */
renderHistory();
