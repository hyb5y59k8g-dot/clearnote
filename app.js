let recognition = null;
let isPaused = false;
let currentMeetingTitle = "";
let currentTranscript = [];

// DOM Elements
const output = document.getElementById("output");
const summaryDiv = document.getElementById("summary");
const languageSelect = document.getElementById("language");
const historyList = document.getElementById("history");
const speakerSelect = document.getElementById("speaker");

// --- INIT SPEECH RECOGNITION ---
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
    if (!isPaused) recognition.start(); // auto-restart
  };
}

// --- BUTTON EVENTS ---
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

document.getElementById("stop").onclick = () => {
  if (recognition) {
    isPaused = false;
    recognition.stop();
    recognition = null;
    saveMeeting();
  }
};

// --- AI SUMMARY ---
document.getElementById("summarize").onclick = async () => {
  if (!currentTranscript.length) return;
  summaryDiv.textContent = "Generating summary...";
  
  // Example using OpenAI API (replace with your key)
  const apiKey = "YOUR_OPENAI_API_KEY"; 
  const text = currentTranscript.join("\n");

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
          { role: "system", content: "Summarize the following meeting transcript into a clear, concise summary, preserving speaker names." },
          { role: "user", content: text }
        ],
        temperature: 0.5
      })
    });

    const data = await response.json();
    summaryDiv.textContent = data.choices[0].message.content.trim();
    updateMeetingSummary(summaryDiv.textContent);

  } catch (err) {
    summaryDiv.textContent = "Error generating summary: " + err;
  }
};

// --- LOCAL STORAGE ---
function saveMeeting(summary="") {
  if (!currentMeetingTitle || !currentTranscript.length) return;
  const meetings = JSON.parse(localStorage.getItem("meetings") || "[]");
  meetings.push({
    title: currentMeetingTitle,
    transcript: currentTranscript.join("\n"),
    summary: summary || "",
    date: new Date().toISOString()
  });
  localStorage.setItem("meetings", JSON.stringify(meetings));
  renderHistory();
}

function updateMeetingSummary(summary) {
  const meetings = JSON.parse(localStorage.getItem("meetings") || "[]");
  if (!meetings.length) return;
  meetings[meetings.length - 1].summary = summary;
  localStorage.setItem("meetings", JSON.stringify(meetings));
}

function renderHistory() {
  const meetings = JSON.parse(localStorage.getItem("meetings") || "[]");
  historyList.innerHTML = "";
  meetings.forEach((m, idx) => {
    const li = document.createElement("li");
    li.textContent = `${new Date(m.date).toLocaleDateString()} - ${m.title}`;
    li.onclick = () => {
      output.textContent = m.transcript;
      summaryDiv.textContent = m.summary;
    };
    historyList.appendChild(li);
  });
}

// --- EXPORT FEATURES ---
document.getElementById("exportTXT").onclick = () => {
  const blob = new Blob([`Title: ${currentMeetingTitle}\n\nTranscript:\n${currentTranscript.join("\n")}\n\nSummary:\n${summaryDiv.textContent}`], {type: "text/plain"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${currentMeetingTitle}.txt`;
  a.click();
};

document.getElementById("exportPDF").onclick = async () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;
  doc.setFontSize(14);
  doc.text(`Title: ${currentMeetingTitle}`, 10, y);
  y += 10;
  doc.setFontSize(12);
  doc.text("Transcript:", 10, y);
  y += 10;
  const transcriptLines = currentTranscript.join("\n").split("\n");
  transcriptLines.forEach(line => {
    if (y > 280) { doc.addPage(); y = 10; }
    doc.text(line, 10, y); y += 6;
  });
  y += 10;
  doc.text("Summary:", 10, y); y += 10;
  const summaryLines = summaryDiv.textContent.split("\n");
  summaryLines.forEach(line => {
    if (y > 280) { doc.addPage(); y = 10; }
    doc.text(line, 10, y); y += 6;
  });
  doc.save(`${currentMeetingTitle}.pdf`);
};

// --- INITIALIZE ---
renderHistory();
