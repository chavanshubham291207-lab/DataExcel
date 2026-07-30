/**
 * SpeechRecognition Service
 * Wraps browser Web Speech API for speech-to-text and wake word detection.
 */

class SpeechRecognitionService {
  constructor() {
    const SpeechRecognition = typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;

    this.recognition = SpeechRecognition ? new SpeechRecognition() : null;
    this.isSupported = !!this.recognition;
    this.listening = false;

    if (this.recognition) {
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = 'en-US';
    }
  }

  startListening({ onStart, onResult, onEnd, onError, onWakeWord } = {}) {
    if (!this.isSupported) {
      console.warn('[SpeechRecognition] Web Speech API not supported in this browser.');
      if (onError) onError('speech-not-supported');
      return;
    }

    if (this.listening) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.listening = false;
    }

    this.recognition.onstart = () => {
      this.listening = true;
      console.log('[SpeechRecognition] Event: onstart - Listening active.');
      if (onStart) onStart();
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const currentText = (finalTranscript || interimTranscript).trim();
      console.log('[SpeechRecognition] Event: onresult - Transcript:', currentText, 'isFinal:', !!finalTranscript);

      // Wake word check: "Hey VoiceGenie"
      if (currentText.toLowerCase().includes('hey voicegenie') || currentText.toLowerCase().includes('hey genie')) {
        console.log('[SpeechRecognition] Event: onWakeWord detected!');
        if (onWakeWord) onWakeWord(currentText);
      }

      if (onResult) {
        onResult({
          transcript: currentText,
          isFinal: !!finalTranscript
        });
      }
    };

    this.recognition.onend = () => {
      console.log('[SpeechRecognition] Event: onend - Listening stopped.');
      this.listening = false;
      if (onEnd) onEnd();
    };

    this.recognition.onerror = (event) => {
      this.listening = false;
      console.error('[SpeechRecognition] Event: onerror - Error code:', event.error);
      if (onError) onError(event.error);
    };

    try {
      this.recognition.start();
    } catch (err) {
      this.listening = false;
      console.warn('[SpeechRecognition] Failed to invoke start():', err);
      if (onError) onError('start-failed');
    }
  }

  stopListening() {
    if (this.recognition && this.listening) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.listening = false;
    }
  }
}

export const sttService = new SpeechRecognitionService();
