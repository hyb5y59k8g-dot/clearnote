let recognition = null;
let isPaused = false;
let currentMeetingTitle = "";
let currentTranscript = [];

// DOM Elements
const output = document.getElementById("output");
const summaryDiv = document.getElementById("summary");
const languageSelect = document.getElementById("language");
const speakerSelect = document.getElementById("speaker");
const historyList = document.getElementById("history");
const toggleHistoryBtn = document.getElementById("toggleHistory");

// ----------------------
// SPEECH RECOGNITION
// ----------------------
function initRecognition() {
  if (recognition) return;

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = languageSelect.value;

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        const speaker = speakerSelect.value;
        const line = `${speaker}: ${result[0].transcript}`;
        currentTranscript.push(line);
        output.textContent += line + "\n";
      }
    }
  };

  recognition.onerror = (event) => console.error("Speech recognition error:", event.error);

  recognition.onend = () => {
    if (!isPaused) recognition.start();
  };
}

// ----------------------
// BUTTON EVENTS
// ----------------------
document.getElementById("newMeeting").onclick = () => {
  currentTranscript = [];
  output.textContent = "";
  summaryDiv.textContent = "";
  currentMeetingTitle = `Meeting ${new Date().toLocaleString()}`;
};

document.getElementById("start").onclick = () => {
  if (!currentMeetingTitle) currentMeetingTitle = `Meeting ${new Date().toLocaleString()}`;
  isPaused = false;
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

document.getElementById("stop").onclick = async () => {
  if (recognition) {
    isPaused = false;
    recognition.stop();
    recognition = null;

    // Automatically summarize
    const summaryText = await generateSummary(currentTranscript.join("\n"));
    summaryDiv.textContent = summaryText;

    saveMeeting(summaryText);
  }
};

// ----------------------
// AI SUMMARY FUNCTION
// ----------------------
async function generateSummary(transcriptText) {
  if (!transcriptText) return "";

  const apiKey = "YOUR_OPENAI_API_KEY"; // replace with your key
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "Summarize the following meeting transcript clearly and logically." },
          { role: "user", content: transcriptText }
        ],
        temperature: 0.5
      })
    });

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (err) {
    return "Error generating summary: " + err;
  }
}

// ----------------------
// LOCAL STORAGE
// ----------------------
function saveMeeting(summary="") {
  if (!currentMeetingTitle || !currentTranscript.length) return;

  const meetings = JSON.parse(localStorage.getItem("meetings") || "[]");
  meetings.push({
    title: currentMeetingTitle,
    transcript: currentTranscript.join("\n"),
    summary: summary,
    date: new Date().toISOString()
  });
  localStorage.setItem("meetings", JSON.stringify(meetings));
  renderHistory();
}

// Update summary of last meeting
function updateMeetingSummary(summary) {
  const meetings = JSON.parse(localStorage.getItem("meetings") || "[]");
  if (!meetings.length) return;
  meetings[meetings.length - 1].summary = summary;
  localStorage.setItem("meetings", JSON.stringify(meetings));
}

// ----------------------
// RENDER HISTORY & RENAME NOTES
// ----------------------
function renderHistory() {
  const meetings = JSON.parse(localStorage.getItem("meetings") || "[]");
  historyList.innerHTML = "";

  meetings.forEach((m) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="note-title">${new Date(m.date).toLocaleDateString()} - ${m.title}</span>
                    <button class="edit-note">✏️</button>`;

    li.querySelector(".note-title").onclick = () => {
      output.textContent = m.transcript;
      summaryDiv.textContent = m.summary;
    };

    li.querySelector(".edit-note").onclick = () => {
      const newName = prompt("Enter new meeting name:", m.title);
      if (newName) {
        m.title = newName;
        localStorage.setItem("meetings", JSON.stringify(meetings));
        renderHistory();
      }
    };

    historyList.appendChild(li);
  });
}

// ----------------------
// COLLAPSIBLE HISTORY
// ----------------------
toggleHistoryBtn.onclick = () => {
  const section = document.getElementById("saved-meetings");
  section.classList.toggle("collapsed");
  toggleHistoryBtn.textContent = section.classList.contains("collapsed") ? "Saved Meetings ▼" : "Saved Meetings ▲";
};

// ----------------------
// EXPORT TXT & PDF
// ----------------------
document.getElementById("exportTXT").onclick = () => {
  const meetings = JSON.parse(localStorage.getItem("meetings") || "[]");
  if (!meetings.length) return;

  const lastMeeting = meetings[meetings.length - 1];
  const blob = new Blob([
    `Title: ${lastMeeting.title}\nDate: ${new Date(lastMeeting.date).toLocaleString()}\n\nTranscript:\n${lastMeeting.transcript}\n\nSummary:\n${lastMeeting.summary}`
  ], {type: "text/plain"});

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${lastMeeting.title}.txt`;
  a.click();
};

document.getElementById("exportPDF").onclick = () => {
  const meetings = JSON.parse(localStorage.getItem("meetings") || "[]");
  if (!meetings.length) return;

  const lastMeeting = meetings[meetings.length - 1];
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;
  doc.setFontSize(14);
  doc.text(`Title: ${lastMeeting.title}`, 10, y);
  y += 10;
  doc.setFontSize(12);
  doc.text(`Date: ${new Date(lastMeeting.date).toLocaleString()}`, 10, y);
  y += 10;
  doc.text("Transcript:", 10, y); y += 10;
  lastMeeting.transcript.split("\n").forEach(line => {
    if (y > 280) { doc.addPage(); y = 10; }
    doc.text(line, 10, y); y += 6;
  });
  y += 10;
  doc.text("Summary:", 10, y); y += 10;
  lastMeeting.summary.split("\n").forEach(line => {
    if (y > 280) { doc.addPage(); y = 10; }
    doc.text(line, 10, y); y += 6;
  });
  doc.save(`${lastMeeting.title}.pdf`);
};

// ----------------------
// INITIALIZE
// ----------------------
renderHistory();
