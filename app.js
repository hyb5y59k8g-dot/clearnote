let recognition = null;
let isPaused = false;
let currentMeetingTitle = "";

// DOM Elements
const output = document.getElementById("output");
const languageSelect = document.getElementById("language");
const historyList = document.getElementById("history");
const summarizeBtn = document.getElementById("summarize");

// --- SPEECH RECOGNITION ---
function initRecognition() {
  if (recognition) return;

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false; // only final results
  recognition.lang = languageSelect.value;

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        output.textContent += result[0].transcript + "\n";
      }
    }
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
  };

  recognition.onend = () => {
    if (!isPaused) {
      recognition.start();
    }
  };
}

// --- BUTTON EVENTS ---
document.getElementById("start").onclick = () => {
  output.textContent = "";
  isPaused = false;
  currentMeetingTitle = `Meeting ${new Date().toLocaleString()}`;
  initRecognition();
  recognition.start();
};

document.getElementById("pause").onclick = () => {
  if (recognition) {
    isPaused = true;
    recognition.stop();
  }
};

document.getElementById("resume").onclick = () => {
  if (recognition && isPaused) {
    isPaused = false;
    recognition.start();
  }
};

document.getElementById("stop").onclick = () => {
  if (recognition) {
    isPaused = false;
    recognition.stop();
    recognition = null;
    saveMeeting();
  }
};

summarizeBtn.onclick = () => {
  if (output.textContent.trim() === "") return;
  const lines = output.textContent.split("\n");
  const summary = lines.slice(0, 3).join(" "); // simple placeholder summary
  alert(`Summary:\n${summary}...`);
};

// --- LOCAL STORAGE ---
function saveMeeting() {
  if (!currentMeetingTitle || output.textContent.trim() === "") return;

  const meetings = JSON.parse(localStorage.getItem("meetings") || "[]");
  meetings.push({
    title: currentMeetingTitle,
    transcript: output.textContent
  });
  localStorage.setItem("meetings", JSON.stringify(meetings));
  renderHistory();
}

// Render saved meetings in sidebar
function renderHistory() {
  const meetings = JSON.parse(localStorage.getItem("meetings") || "[]");
  historyList.innerHTML = "";
  meetings.forEach((m, idx) => {
    const li = document.createElement("li");
    li.textContent = m.title;
    li.onclick = () => {
      output.textContent = m.transcript;
    };
    historyList.appendChild(li);
  });
}

// Initialize meeting list on page load
renderHistory();
