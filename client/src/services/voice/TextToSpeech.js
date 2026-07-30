/**
 * TextToSpeech Service
 * Handles browser SpeechSynthesis with sentence chunking and automatic female voice selection.
 */

class TextToSpeechService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.selectedVoice = null;
    this.isMuted = false;
    this.speaking = false;
    this.currentUtterances = [];
    this.initVoices();

    if (this.synth && typeof this.synth.onvoiceschanged !== 'undefined') {
      this.synth.onvoiceschanged = () => this.initVoices();
    }
  }

  initVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return;

    // Prioritize clear female voices across operating systems
    const femaleVoiceKeywords = ['female', 'zira', 'samantha', 'victoria', 'karen', 'fiona', 'moira', 'google uk english female', 'google us english female'];
    
    let femaleVoice = voices.find(v => 
      femaleVoiceKeywords.some(kw => v.name.toLowerCase().includes(kw))
    );

    if (!femaleVoice) {
      femaleVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    }

    this.selectedVoice = femaleVoice;
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted && this.synth) {
      this.stop();
    }
  }

  cleanMarkdownText(rawText) {
    if (!rawText) return '';
    return rawText
      .replace(/#+\s+/g, '') // remove headings
      .replace(/\*\*(.*?)\*\*/g, '$1') // remove bold
      .replace(/\*(.*?)\*/g, '$1') // remove italics
      .replace(/`(.*?)`/g, '$1') // remove inline code
      .replace(/```[\s\S]*?```/g, 'Code block output.') // replace code blocks
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // remove links
      .replace(/[-*]\s+/g, '') // remove bullet points
      .replace(/\n+/g, '. ') // replace newlines with sentence pauses
      .replace(/\s+/g, ' ')
      .trim();
  }

  speak(text, { onStart, onEnd, onError } = {}) {
    if (!this.synth || this.isMuted || !text) {
      if (onEnd) onEnd();
      return;
    }

    const cleanedText = this.cleanMarkdownText(text);
    if (!cleanedText) {
      if (onEnd) onEnd();
      return;
    }

    // Cancel ongoing speech
    this.stop();

    // Chunk text into sentences to prevent Chrome SpeechSynthesis length limits
    const sentences = cleanedText
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Limit spoken audio to first 3 key sentences if response is lengthy
    const spokenSentences = sentences.slice(0, 4);
    const textToSpeak = spokenSentences.join(' ');

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      this.speaking = true;
      console.log('[TextToSpeech] Synthesis started.');
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.speaking = false;
      console.log('[TextToSpeech] Synthesis completed.');
      if (onEnd) onEnd();
    };

    utterance.onerror = (err) => {
      this.speaking = false;
      console.warn('[TextToSpeech] Synthesis error handled:', err);
      if (onError) onError(err);
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {}
      this.speaking = false;
    }
  }
}

export const ttsService = new TextToSpeechService();
