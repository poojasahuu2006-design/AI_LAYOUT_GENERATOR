/**
 * Web Speech API Voice Recognition Helper
 * Configured for English (India) with continuous transcript capture and clean non-repetitive result processing.
 */

export const isSpeechSupported = () => {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
};

export const createSpeechListener = ({ onResult, onError, onEnd }) => {
  if (!isSpeechSupported()) {
    return null;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-IN'; // Targeted Indian English accent recognition

  recognition.onresult = (event) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = 0; i < event.results.length; i++) {
      const transcriptChunk = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcriptChunk + ' ';
      } else {
        interimTranscript += transcriptChunk;
      }
    }

    const fullSessionTranscript = (finalTranscript + interimTranscript).replace(/\s+/g, ' ').trim();
    if (onResult && fullSessionTranscript) {
      onResult(fullSessionTranscript, finalTranscript.trim());
    }
  };

  recognition.onerror = (event) => {
    console.error('[Web Speech API Error]', event.error);
    let friendlyError = 'Speech recognition error occurred.';
    if (event.error === 'not-allowed') friendlyError = 'Microphone permission was denied. Please allow mic access in your browser.';
    else if (event.error === 'no-speech') friendlyError = 'No speech detected. Please speak clearly into your microphone.';
    else if (event.error === 'audio-capture') friendlyError = 'No microphone was found. Please ensure a microphone is plugged in.';
    else if (event.error === 'network') friendlyError = 'Network error occurred during speech recognition.';
    
    if (onError) onError(friendlyError);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return recognition;
};
