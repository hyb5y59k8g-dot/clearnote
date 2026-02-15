let recognition = null;
let recording = false;
let buffer = [];
let activeIndex = null;

const output = document.getElementById("output");
const notesList = document.getElementById("notesList");
const trashList = document.getElementById("trashList");
const speakerSelect = document.getElementById("speaker");
const languageSelect = document.getElementById("language");

const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const stopBtn = document.getElementById("stop");
const dot = document.querySelector(".dot");
const statusText = document.getElementById("statusText");

/* ---------- STORAGE ---------- */
const notes = () => JSON.parse(localStorage.getItem("notes") || "[]");
const trash = () => JSON.parse(localStorage.getItem("trash") || "[]");

const saveNotes = n => localStorage.setItem("notes", JSON.stringify(n));
const saveTrash = t => localStorage.setItem("trash", JSON.stringify(t));

/* ---------- SPEECH ---------- */
function initRecognition() {
  const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechAPI();

  recognition.lang = languageSelect.value || "en-US";
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onresult = e => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        buffer.push({
          speaker: speakerSelect.value,
          text: e.results[i][0].transcript.trim()
        });
        renderTranscript();
      }
    }
  };

  // CRITICAL FIX for Polish
  recognition.onend = () => {
    if (recording) {
      recognition.start(); // restart automatically
    }
  };

  recognition.onerror = () => {
    if (recording) {
      recognition.start();
    }
  };
}

/* ---------- RECORDING ---------- */
function start() {
  if (recording) return;

  initRecognition();
  recognition.start();

  recording = true;
  startBtn.classList.add("active");
  dot.classList.add("recording");
  statusText.textContent = "Recording";
}

function pause() {
  if (!recording) return;

  recording = false;
  recognition.stop();

  startBtn.classList.remove("active");
  dot.classList.remove("recording");
  statusText.textContent = "Paused";
}

function stop() {
  if (!recognition) return;

  recording = false;
  recognition.stop();

  startBtn.classList.remove("active");
  dot.classList.remove("recording");
  statusText.textContent = "Saved";

  if (buffer.length) persistNote();
}

/* ---------- NOTES ---------- */
function persistNote() {
  const all = notes();

  all.push({
    title: `Note ${new Date().toLocaleString()}`,
    transcript: JSON.parse(JSON.stringify(buffer))
  });

  saveNotes(all);
  buffer = [];
  activeIndex = null;
  renderAll();
}

function openNote(i) {
  activeIndex = i;
  buffer = JSON.parse(JSON.stringify(notes()[i].transcript));
  renderTranscript();
  renderNotes();
}

function deleteNote(i) {
  const all = notes();
  const t = trash();

  t.push(all[i]);
  all.splice(i, 1);

  saveNotes(all);
  saveTrash(t);

  activeIndex = null;
  buffer = [];
  output.innerHTML = "";

  renderAll();
}

function restoreTrash(i) {
  const all = notes();
  const t = trash();

  all.push(t[i]);
  t.splice(i, 1);

  saveNotes(all);
  saveTrash(t);

  renderAll();
}

function deleteForever(i) {
  const t = trash();
  t.splice(i, 1);
  saveTrash(t);
  renderTrash();
}

/* ---------- RENDER ---------- */
function renderTranscript() {
  output.innerHTML = buffer
    .map(l => `<b>${l.speaker}:</b> ${l.text}`)
    .join("<br>");
}

function renderNotes() {
  notesList.innerHTML = "";

  const all = notes();

  if (!all.length) {
    notesList.innerHTML = "<li>No saved notes</li>";
    return;
  }

  all.forEach((n, i) => {
    const li = document.createElement("li");
    li.className = i === activeIndex ? "active" : "";

    li.innerHTML = `
      <strong>${n.title}</strong><br>
      <button onclick="openNote(${i})">Open</button>
      <button onclick="deleteNote(${i})">🗑</button>
    `;

    notesList.appendChild(li);
  });
}

function renderTrash() {
  trashList.innerHTML = "";

  const t = trash();

  if (!t.length) {
    trashList.innerHTML = "<li>Trash is empty</li>";
    return;
  }

  t.forEach((n, i) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${n.title}</strong><br>
      <button onclick="restoreTrash(${i})">Restore</button>
      <button onclick="deleteForever(${i})">Delete Forever</button>
    `;

    trashList.appendChild(li);
  });
}

function renderAll() {
  renderNotes();
  renderTrash();
}

/* ---------- NEW NOTE ---------- */
document.getElementById("newNote").onclick = () => {
  buffer = [];
  output.innerHTML = "";
  activeIndex = null;
  speakerSelect.value = "Speaker 1";
  statusText.textContent = "Idle";
  renderNotes();
};

/* ---------- EVENTS ---------- */
startBtn.onclick = start;
pauseBtn.onclick = pause;
stopBtn.onclick = stop;

/* ---------- INIT ---------- */
renderAll();
