let recognition;
let transcript = [];
let activeNoteIndex = null;
let currentTitle = "";

let timerInterval;
let seconds = 0;

const output = document.getElementById("output");
const summaryDiv = document.getElementById("summary");
const speakerSelect = document.getElementById("speaker");
const timerEl = document.getElementById("timer");
const recordDot = document.getElementById("recordDot");

const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const stopBtn = document.getElementById("stop");

/* Storage */
const getNotes = () => JSON.parse(localStorage.getItem("notes") || "[]");
const setNotes = n => localStorage.setItem("notes", JSON.stringify(n));

/* Timer */
function startTimer() {
  seconds = 0;
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

/* Speech */
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

/* Render */
function renderTranscript() {
  output.innerHTML = transcript
    .map(t => `<span class="speaker">${t.speaker}:</span> ${t.text}`)
    .join("<br>");
}

function renderHistory() {
  const list = document.getElementById("history");
  list.innerHTML = "";
  getNotes().forEach(n => {
    const li = document.createElement("li");
    li.textContent = n.title;
    list.appendChild(li);
  });
}

/* New Note */
document.getElementById("newNote").onclick = () => {
  transcript = [];
  output.innerHTML = "";
  summaryDiv.textContent = "";
  speakerSelect.value = "Speaker 1";
  currentTitle = `Note ${new Date().toLocaleString()}`;
};

/* Recorder */
startBtn.onclick = () => {
  initRecognition();
  recognition.start();
  startTimer();
};

pauseBtn.onclick = () => {
  recognition.stop();
  stopTimer();
};

stopBtn.onclick = () => {
  recognition.stop();
  stopTimer();

  const notes = getNotes();
  notes.push({
    title: currentTitle,
    transcript,
    summary: "",
    date: new Date().toISOString()
  });
  setNotes(notes);
  renderHistory();
};

/* Copy */
document.getElementById("copyTranscript").onclick = () =>
  navigator.clipboard.writeText(output.innerText);

document.getElementById("copySummary").onclick = () =>
  navigator.clipboard.writeText(summaryDiv.innerText);

/* Export helpers */
function exportTXT(title, content) {
  const blob = new Blob([content], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${title}.txt`;
  a.click();
}

function exportPDF(title, content) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const lines = doc.splitTextToSize(content, 180);
  doc.text(lines, 10, 10);
  doc.save(`${title}.pdf`);
}

/* Transcript exports */
document.getElementById("exportTranscriptTXT").onclick = () =>
  exportTXT("Transcript", output.innerText);

document.getElementById("exportTranscriptPDF").onclick = () =>
  exportPDF("Transcript", output.innerText);

/* Summary exports */
document.getElementById("exportSummaryTXT").onclick = () =>
  exportTXT("Summary", summaryDiv.innerText);

document.getElementById("exportSummaryPDF").onclick = () =>
  exportPDF("Summary", summaryDiv.innerText);

renderHistory();
