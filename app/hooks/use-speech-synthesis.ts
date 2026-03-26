import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechSynthesisOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceName?: string;
  lang?: string;
}

interface UseSpeechSynthesisReturn {
  speak: (text: string) => void;
  cancel: () => void;
  isSpeaking: boolean;
  isMuted: boolean;
  setMuted: (muted: boolean) => void;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  currentLang: string;
  setLang: (lang: string) => void;
  getVoicesForLang: (lang: string) => SpeechSynthesisVoice[];
}

export function useSpeechSynthesis(
  options: UseSpeechSynthesisOptions = {}
): UseSpeechSynthesisReturn {
  const { rate = 1, pitch = 1, volume = 1, voiceName, lang: initialLang = 'en-US' } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sam-voice-muted') === 'true';
    }
    return false;
  });
  const [currentLang, setCurrentLang] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sam-speech-lang') || initialLang;
    }
    return initialLang;
  });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sam-voice-muted', String(isMuted));
    }
  }, [isMuted]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || isMuted || !text.trim()) return;

      window.speechSynthesis.cancel();

      const cleanText = text
        .replace(/\*\*/g, '')
        .replace(/[#*_~`]/g, '')
        .replace(/\n+/g, '. ')
        .replace(/•/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      utterance.lang = currentLang;

      const langPrefix = currentLang.split('-')[0];
      
      if (voiceName && voices.length > 0) {
        const selectedVoice = voices.find((v) => v.name === voiceName);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          utterance.lang = selectedVoice.lang;
        }
      } else if (voices.length > 0) {
        const matchingVoice = voices.find(
          (v) => v.lang.startsWith(langPrefix) && v.name.includes('Google')
        ) || voices.find((v) => v.lang.startsWith(langPrefix));
        if (matchingVoice) {
          utterance.voice = matchingVoice;
          utterance.lang = matchingVoice.lang;
        }
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, isMuted, rate, pitch, volume, voiceName, voices, currentLang]
  );

  const cancel = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  const handleSetMuted = useCallback((muted: boolean) => {
    setIsMuted(muted);
    if (muted) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const setLang = useCallback((lang: string) => {
    setCurrentLang(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sam-speech-lang', lang);
    }
  }, []);

  const getVoicesForLang = useCallback((lang: string) => {
    const langPrefix = lang.split('-')[0];
    return voices.filter((v) => v.lang.startsWith(langPrefix));
  }, [voices]);

  return {
    speak,
    cancel,
    isSpeaking,
    isMuted,
    setMuted: handleSetMuted,
    isSupported,
    voices,
    currentLang,
    setLang,
    getVoicesForLang,
  };
}
