let recognition;
let paused = false;

const output = document.getElementById("output");
const languageSelect = document.getElementById("language");

function createRecognition() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = languageSelect.value;

  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    output.textContent += transcript;
  };
}

document.getElementById("start").onclick = () => {
  output.textContent = "";
  createRecognition();
  recognition.start();
};

document.getElementById("pause").onclick = () => {
  if (recognition) {
    recognition.stop();
    paused = true;
  }
};

document.getElementById("resume").onclick = () => {
  if (paused) {
    recognition.start();
    paused = false;
  }
};

document.getElementById("stop").onclick = () => {
  if (recognition) recognition.stop();
};
