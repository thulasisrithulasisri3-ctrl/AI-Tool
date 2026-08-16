/* =========================================
   VOICE OUTPUT
   CLICK AGAIN = STOP
========================================= */

let currentSpeakingButton = null;
let isSpeaking = false;


function speakText(text, button = null) {

    if (!window.speechSynthesis) {

        showToast("Voice not supported");

        return;

    }


    /* If already speaking → STOP */

    if (isSpeaking) {

        speechSynthesis.cancel();

        isSpeaking = false;

        if (currentSpeakingButton) {
            currentSpeakingButton.textContent = "🔊";
        }

        currentSpeakingButton = null;

        return;

    }


    speechSynthesis.cancel();


    const speech =
        new SpeechSynthesisUtterance(text);


    const languageMap = {

        en: "en-IN",
        ta: "ta-IN",
        hi: "hi-IN",
        ml: "ml-IN",
        te: "te-IN",
        kn: "kn-IN"

    };


    speech.lang =
        languageMap[currentLanguage]
        || "en-IN";


    const selectedVoice =
        getSelectedVoice();


    if (selectedVoice) {

        speech.voice =
            selectedVoice;

    }


    speech.rate = 1;

    speech.pitch =
        voiceGender === "male"
            ? 0.95
            : 1.05;

    speech.volume = 1;


    if (button) {

        button.textContent = "⏹️";

        currentSpeakingButton = button;

    }


    isSpeaking = true;


    speech.onend = () => {

        isSpeaking = false;

        if (currentSpeakingButton) {
            currentSpeakingButton.textContent = "🔊";
        }

        currentSpeakingButton = null;

    };


    speech.onerror = () => {

        isSpeaking = false;

        if (currentSpeakingButton) {
            currentSpeakingButton.textContent = "🔊";
        }

        currentSpeakingButton = null;

    };


    speechSynthesis.speak(speech);

}
