let recognition;
let isPaused = false;
let transcript = [];
let currentTitle = "";

const output = document.getElementById("output");
const summaryDiv = document.getElementById("summary");
const historyList = document.getElementById("history");

/* iOS SAFE SPEECH INIT */
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
        transcript.push(`${speaker}: ${text}`);
        output.innerHTML += `<span class="speaker">${speaker}:</span> ${text}<br>`;
      }
    }
  };

  recognition.onend = () => {
    if (!isPaused) recognition.start();
  };
}

/* BUTTONS */
document.getElementById("newNote").onclick = () => {
  transcript = [];
  output.innerHTML = "";
  summaryDiv.textContent = "";
  currentTitle = `Note ${new Date().toLocaleString()}`;
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
  recognition.stop();
  saveNote();
};

/* STORAGE (RESTORED) */
function saveNote() {
  const notes =
    JSON.parse(localStorage.getItem("meetings")) ||
    JSON.parse(localStorage.getItem("notes")) ||
    [];

  notes.push({
    title: currentTitle,
    transcript: transcript.join("\n"),
    summary: "",
    date: new Date().toISOString()
  });

  localStorage.setItem("meetings", JSON.stringify(notes));
  renderHistory();
}

function renderHistory() {
  const notes = JSON.parse(localStorage.getItem("meetings") || "[]");
  historyList.innerHTML = "";

  notes.forEach(n => {
    const li = document.createElement("li");
    li.textContent = n.title;
    li.onclick = () => {
      output.textContent = n.transcript;
      summaryDiv.textContent = n.summary;
    };
    historyList.appendChild(li);
  });
}

document.getElementById("toggleHistory").onclick = () => {
  document.getElementById("saved-meetings").classList.toggle("collapsed");
};

renderHistory();
