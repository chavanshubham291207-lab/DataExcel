import { sttService } from './SpeechRecognition';
import { ttsService } from './TextToSpeech';

/**
 * Unified Speech Service linking STT, TTS, and state notifications.
 */
class SpeechServiceManager {
  constructor() {
    this.stt = sttService;
    this.tts = ttsService;
  }

  isSpeechSupported() {
    return this.stt.isSupported;
  }

  setMuted(muted) {
    this.tts.setMuted(muted);
  }

  speakResponse(text, callbacks) {
    this.tts.speak(text, callbacks);
  }

  stopAll() {
    this.stt.stopListening();
    this.tts.stop();
  }
}

export const speechService = new SpeechServiceManager();
