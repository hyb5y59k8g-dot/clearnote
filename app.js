/* ---------------------- VARIABLES ---------------------- */
let recognition = null;
let recording = false;
let buffer = "";
let activeIndex = null;
let timerInterval = null;
let seconds = 0;
let lastSpeechTime = Date.now();

const output = document.getElementById("output");
const notesList = document.getElementById("notesList");
const trashList = document.getElementById("trashList");
const languageSelect = document.getElementById("language");

const recordBtn = document.getElementById("recordBtn");
const dot = document.getElementById("recordDot");
const timerEl = document.getElementById("timer");

/* ---------------------- STORAGE ---------------------- */
const notes = () => JSON.parse(localStorage.getItem("notes") || "[]");
const trash = () => JSON.parse(localStorage.getItem("trash") || "[]");
const saveNotes = n => localStorage.setItem("notes", JSON.stringify(n));
const saveTrash = t => localStorage.setItem("trash", JSON.stringify(t));

/* ---------------------- TIMER ---------------------- */
function startTimer() {
  seconds = 0;
  timerEl.textContent = "00:00";
  timerInterval = setInterval(() => {
    seconds++;
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    timerEl.textContent = `${m}:${s}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

/* ---------------------- SPEECH RECOGNITION ---------------------- */
function initRecognition() {
  const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechAPI();

  recognition.lang = languageSelect.value || "en-US";
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onresult = e => {
    let textChunk = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        textChunk += e.results[i][0].transcript + " ";
      }
    }
    if (textChunk) {
      buffer += textChunk;
      lastSpeechTime = Date.now();
      renderTranscript();
    }
  };

  recognition.onend = () => {
    if (recording) {
      setTimeout(() => {
        try { recognition.start(); } catch(e) {}
      }, 500);
    }
  };

  recognition.onerror = () => {
    if (recording) {
      try { recognition.start(); } catch(e) {}
    }
  };
}

/* ---------------------- RECORD BUTTON ---------------------- */
function toggleRecording() {
  if (!recording) {
    buffer = "";
    initRecognition();
    recognition.start();
    recording = true;

    recordBtn.textContent = "■ Stop";
    recordBtn.classList.add("recording");
    dot.classList.add("recording");

    startTimer();
  } else {
    recording = false;
    recognition.stop();
    stopTimer();

    recordBtn.textContent = "● Record";
    recordBtn.classList.remove("recording");
    dot.classList.remove("recording");

    if (buffer.trim()) persistNote();
  }
}

/* ---------------------- NOTES MANAGEMENT ---------------------- */
function persistNote() {
  const all = notes();
  all.push({
    title: `Note ${new Date().toLocaleString()}`,
    transcript: buffer
  });
  saveNotes(all);
  activeIndex = null;
  buffer = "";
  renderAll();
}

function openNote(i) {
  const all = notes();
  activeIndex = i;
  buffer = all[i].transcript;
  renderTranscript();
  renderNotes();
}

function renameNote(i) {
  const all = notes();
  const newName = prompt("Rename note:", all[i].title);
  if (!newName) return;
  all[i].title = newName;
  saveNotes(all);
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
  buffer = "";
  output.textContent = "";
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

/* ---------------------- RENDER ---------------------- */
function renderTranscript() {
  output.textContent = buffer;
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
      <button onclick="renameNote(${i})">Edit</button>
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

/* ---------------------- COLLAPSIBLE ---------------------- */
function toggleSection(id) {
  const el = document.getElementById(id);
  el.style.display = el.style.display === "none" ? "block" : "none";
}

/* ---------------------- NEW NOTE ---------------------- */
document.getElementById("newNote").onclick = () => {
  if (recording) {
    recording = false;
    try { recognition.stop(); } catch(e) {}
    stopTimer();
  }
  buffer = "";
  activeIndex = null;
  output.textContent = "";
};

/* ---------------------- EVENTS ---------------------- */
recordBtn.onclick = toggleRecording;

/* ---------------------- WATCHDOG for Polish or auto-restart ---------------------- */
setInterval(() => {
  if (recording && Date.now() - lastSpeechTime > 7000) {
    try {
      recognition.stop();
      recognition.start();
    } catch(e) {}
  }
}, 5000);

/* ---------------------- INIT ---------------------- */
renderAll();
