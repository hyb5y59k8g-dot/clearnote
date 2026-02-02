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

const getTrash = () => JSON.parse(localStorage.getItem("trash") || "[]");
const setTrash = trash => localStorage.setItem("trash", JSON.stringify(trash));

/* ---------- SPEECH ---------- */
function setupRecognition() {
  recognition = new webkitSpeechRecognition();
  recognition.lang = languageSelect.value;
  recognition.continuous = true;
  recognition.interimResults = false;

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

  recognition.onend = () => {
    if (!isRecording && transcript.length > 0) {
      saveNote();
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
}

function pauseRecording() {
  if (!isRecording) return;
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
function saveNote() {
  const notes = getNotes();
  notes.push({
    title: `Note ${new Date().toLocaleString()}`,
    transcript: JSON.parse(JSON.stringify(transcript)) // deep copy
  });
  setNotes(notes);
  transcript = [];
  output.innerHTML = "";
  activeNoteIndex = null;
  renderAll();
}

function openNote(index) {
  const notes = getNotes();
  if (!notes[index]) return;
  activeNoteIndex = index;
  transcript = JSON.parse(JSON.stringify(notes[index].transcript));
  renderTranscript();
  renderAll();
}

function renameNote(index) {
  const notes = getNotes();
  const name = prompt("Rename note:", notes[index].title);
  if (name) {
    notes[index].title = name;
    setNotes(notes);
    renderAll();
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
  renderAll();
}

/* ---------- TRASH ---------- */
function restoreFromTrash(index) {
  const trash = getTrash();
  const notes = getNotes();
  notes.push(trash[index]);
  trash.splice(index, 1);
  setTrash(trash);
  setNotes(notes);
  renderAll();
}

function deleteForever(index) {
  const trash = getTrash();
  trash.splice(index, 1);
  setTrash(trash);
  renderAll();
}

/* ---------- RENDER ---------- */
function renderTranscript() {
  output.innerHTML = transcript
    .map(t => `<b>${t.speaker}:</b> ${t.text}`)
    .join("<br>");
}

function renderAll() {
  renderNotes();
  renderTrash();
}

function renderNotes() {
  historyList.innerHTML = "";
  const notes = getNotes();

  notes.forEach((note, index) => {
    const li = document.createElement("li");
    li.style.padding = "8px";
    li.style.marginBottom = "6px";
    li.style.borderRadius = "8px";
    li.style.background =
      index === activeNoteIndex ? "#e8f0ff" : "transparent";

    li.innerHTML = `
      <strong>${note.title}</strong><br>
      <button onclick="openNote(${index})">Open</button>
      <button onclick="renameNote(${index})">Edit</button>
      <button onclick="deleteNote(${index})">🗑</button>
    `;
    historyList.appendChild(li);
  });
}

function renderTrash() {
  let trashSection = document.getElementById("trash-section");
  if (!trashSection) {
    trashSection = document.createElement("div");
    trashSection.id = "trash-section";
    trashSection.style.marginTop = "20px";
    historyList.after(trashSection);
  }

  const trash = getTrash();
  trashSection.innerHTML = "<h3>Trash</h3>";

  if (trash.length === 0) {
    trashSection.innerHTML += "<em>Trash is empty</em>";
    return;
  }

  trash.forEach((note, index) => {
    const div = document.createElement("div");
    div.style.marginBottom = "6px";
    div.innerHTML = `
      ${note.title}
      <button onclick="restoreFromTrash(${index})">Restore</button>
      <button onclick="deleteForever(${index})">Delete Forever</button>
    `;
    trashSection.appendChild(div);
  });
}

/* ---------- NEW NOTE ---------- */
document.getElementById("newNote").onclick = () => {
  transcript = [];
  output.innerHTML = "";
  activeNoteIndex = null;
  speakerSelect.value = "Speaker 1";
  renderAll();
};

/* ---------- BUTTONS ---------- */
startBtn.onclick = startRecording;
pauseBtn.onclick = pauseRecording;
stopBtn.onclick = stopRecording;

/* ---------- INIT ---------- */
renderAll();
