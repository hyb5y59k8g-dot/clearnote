let recognition;
let isPaused = false;
let transcript = [];
let currentTitle = "";

const output = document.getElementById("output");
const summaryDiv = document.getElementById("summary");
const historyList = document.getElementById("history");

document.getElementById("newNote").onclick = () => {
  transcript = [];
  output.innerHTML = "";
  summaryDiv.textContent = "";
  currentTitle = `Note ${new Date().toLocaleString()}`;
};

function initRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.continuous = true;
  recognition.lang = document.getElementById("language").value;

  recognition.onresult = (e) => {
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

document.getElementById("stop").onclick = async () => {
  recognition.stop();
  const summary = await generateSummary(transcript.join("\n"));
  summaryDiv.textContent = summary;
  saveNote(summary);
};

/* SAFE SUMMARY */
async function generateSummary(text) {
  if (!text) return "No transcript to summarize.";

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_API_KEY"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "Summarize this meeting clearly and logically." },
          { role: "user", content: text }
        ]
      })
    });

    const data = await res.json();
    if (!data.choices || !data.choices.length) {
      return "Summary unavailable (AI error).";
    }

    return data.choices[0].message.content.trim();
  } catch {
    return "Summary unavailable (network error).";
  }
}

function saveNote(summary) {
  const notes = JSON.parse(localStorage.getItem("notes") || "[]");
  notes.push({
    title: currentTitle,
    transcript: transcript.join("\n"),
    summary,
    date: new Date().toISOString()
  });
  localStorage.setItem("notes", JSON.stringify(notes));
  renderHistory();
}

function renderHistory() {
  const notes = JSON.parse(localStorage.getItem("notes") || "[]");
  historyList.innerHTML = "";

  notes.forEach(n => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${n.title}</span><button>✏️</button>`;
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
