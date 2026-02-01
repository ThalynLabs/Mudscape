import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechOptions {
  enabled: boolean;
  rate?: number;
  volume?: number;
  pitch?: number;
  voiceURI?: string;
}

export function useSpeech({ enabled, rate = 1, volume = 1, pitch = 1, voiceURI }: SpeechOptions) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const lastTextRef = useRef<string>("");

  useEffect(() => {
    const loadVoices = () => {
      const vs = window.speechSynthesis.getVoices();
      setVoices(vs);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((text: string, force = false) => {
    if ((!enabled && !force) || !text) return;

    lastTextRef.current = text;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.volume = volume;
    utterance.pitch = pitch;

    if (voiceURI) {
      const selectedVoice = voices.find(v => v.voiceURI === voiceURI);
      if (selectedVoice) utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setSpeaking(true);
      setPaused(false);
    };
    utterance.onend = () => {
      setSpeaking(false);
      setPaused(false);
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [enabled, rate, volume, pitch, voiceURI, voices]);

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  }, []);

  const pause = useCallback(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    }
  }, []);

  const togglePause = useCallback(() => {
    if (window.speechSynthesis.paused) {
      resume();
    } else if (window.speechSynthesis.speaking) {
      pause();
    }
  }, [pause, resume]);

  const speakLine = useCallback((text: string) => {
    cancel();
    speak(text, true);
  }, [cancel, speak]);

  return { speak, speakLine, cancel, pause, resume, togglePause, speaking, paused, voices };
}
