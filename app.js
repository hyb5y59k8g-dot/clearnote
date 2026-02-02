let recognition = null;
let isRecording = false;
let transcript = [];
let activeNoteIndex = null;

/* ---------- ELEMENTS ---------- */
const output = document.getElementById("output");
const historyList = document.getElementById("history");
const speakerSelect = document.getElementById("speaker");
const languageSelect = document.getElementById("language");

const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const stopBtn = document.getElementById("stop");

/* ---------- STORAGE ---------- */
const getNotes = () => JSON.parse(localStorage.getItem("notes") || "[]");
const setNotes = notes => localStorage.setItem("notes", JSON.stringify(notes));

/* ---------- SPEECH ---------- */
function setupRecognition() {
  recognition = new webkitSpeechRecognition();
  recognition.lang = languageSelect.value;
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onresult = event => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        transcript.push({
          speaker: speakerSelect.value,
          text: event.results[i][0].transcript.trim()
        });
        renderTranscript();
      }
    }
  };

  recognition.onerror = () => stopRecording();

  recognition.onend = () => {
    if (!isRecording && transcript.length > 0) {
      persistNote();
    }
  };
}

/* ---------- RECORDING ---------- */
function startRecording() {
  if (isRecording) return;

  setupRecognition();
  recognition.start();
  isRecording = true;

  startBtn.classList.add("active");
  pauseBtn.disabled = false;
  stopBtn.disabled = false;
}

function pauseRecording() {
  if (!isRecording || !recognition) return;

  isRecording = false;
  recognition.stop();
  startBtn.classList.remove("active");
}

function stopRecording() {
  if (!recognition) return;

  isRecording = false;
  recognition.stop();
  startBtn.classList.remove("active");
}

/* ---------- NOTES ---------- */
function persistNote() {
  const notes = getNotes();

  notes.push({
    title: `Note ${new Date().toLocaleString()}`,
    transcript: [...transcript]
  });

  setNotes(notes);
  transcript = [];
  output.innerHTML = "";
  renderHistory();
}

function renderTranscript() {
  output.innerHTML = transcript
    .map(t => `<b>${t.speaker}:</b> ${t.text}`)
    .join("<br>");
}

function renderHistory() {
  const notes = getNotes();
  historyList.innerHTML = "";

  notes.forEach((note, index) => {
    const li = document.createElement("li");
    li.textContent = note.title;
    li.style.cursor = "pointer";
    li.style.fontWeight = index === activeNoteIndex ? "bold" : "normal";

    li.onclick = () => openNote(index);
    historyList.appendChild(li);
  });
}

function openNote(index) {
  const notes = getNotes();
  if (!notes[index]) return;

  activeNoteIndex = index;
  transcript = [...notes[index].transcript];
  renderTranscript();
  renderHistory();
}

/* ---------- NEW NOTE ---------- */
document.getElementById("newNote").onclick = () => {
  transcript = [];
  output.innerHTML = "";
  activeNoteIndex = null;
  speakerSelect.value = "Speaker 1";
  renderHistory();
};

/* ---------- BUTTONS ---------- */
startBtn.onclick = startRecording;
pauseBtn.onclick = pauseRecording;
stopBtn.onclick = stopRecording;

/* ---------- INIT ---------- */
renderHistory();
