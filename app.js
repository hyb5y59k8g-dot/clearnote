let recognition = null;
let isPaused = false;

const output = document.getElementById("output");
const languageSelect = document.getElementById("language");

// Create a new recognition session
function createRecognition() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  recognition = new SpeechRecognition();
  recognition.continuous = true;      // keep listening
  recognition.interimResults = true;  // allows partial results
  recognition.lang = languageSelect.value;

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        output.textContent += result[0].transcript + "\n";  // Only final results
      }
    }
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
  };

  recognition.onend = () => {
    if (isPaused) {
      // Do nothing, will resume manually
    } else {
      // Auto-restart if the user did not stop
      recognition.start();
    }
  };
}

// Start a new meeting
document.getElementById("start").onclick = () => {
  output.textContent = "";   // Clear previous transcripts
  isPaused = false;
  createRecognition();
  recognition.start();
};

// Pause the current session
document.getElementById("pause").onclick = () => {
  if (recognition) {
    isPaused = true;
    recognition.stop();
  }
};

// Resume a paused session
document.getElementById("resume").onclick = () => {
  if (isPaused) {
    isPaused = false;
    createRecognition();
    recognition.start();
  }
};

// Stop the meeting completely
document.getElementById("stop").onclick = () => {
  if (recognition) {
    isPaused = false;
    recognition.stop();
    recognition = null;  // clear session
  }
};
