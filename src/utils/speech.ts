import { Language } from '../types';

let currentUtterance: SpeechSynthesisUtterance | null = null;

export const isSpeechSynthesisSupported = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

export const isSpeechRecognitionSupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
};

export const speakText = (
  text: string,
  language: Language = 'en',
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void
): void => {
  if (!isSpeechSynthesisSupported()) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Strip markdown symbols or asterisks before speaking
  const cleanText = text
    .replace(/[*_#`~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();

  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  currentUtterance = utterance;

  // Senior-friendly calm, clear pacing
  utterance.rate = 0.88;
  utterance.pitch = 1.0;

  // Select appropriate voice
  const voices = window.speechSynthesis.getVoices();
  if (language === 'hi') {
    utterance.lang = 'hi-IN';
    const hindiVoice = voices.find(
      (v) => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi')
    );
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }
  } else {
    utterance.lang = 'en-IN';
    const englishVoice =
      voices.find(
        (v) => v.lang === 'en-IN' || v.name.toLowerCase().includes('indian')
      ) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      null;
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
  }

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    currentUtterance = null;
    if (onEnd) onEnd();
  };

  utterance.onerror = () => {
    currentUtterance = null;
    if (onError) onError();
  };

  window.speechSynthesis.speak(utterance);
};

export const stopSpeech = (): void => {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
};

export const createSpeechRecognition = (
  language: Language,
  onResult: (text: string) => void,
  onError?: (err: any) => void,
  onEnd?: () => void
): { start: () => void; stop: () => void } | null => {
  if (!isSpeechRecognitionSupported()) {
    return null;
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };

  recognition.onerror = (event: any) => {
    console.error('Speech recognition error:', event.error);
    if (onError) onError(event);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch (e) {
        console.warn('Recognition already started or error', e);
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch (e) {
        // ignore
      }
    },
  };
};
