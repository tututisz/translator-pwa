import { useState, useCallback, useRef } from 'react';

interface UseTextToSpeechReturn {
  isSpeaking: boolean;
  speak: (text: string, language: string) => void;
  stop: () => void;
  error: string | null;
}

const LANGUAGE_VOICES: Record<string, string> = {
  'pt': 'pt-BR',
  'en': 'en-US',
  'es': 'es-ES',
  'fr': 'fr-FR',
  'ko': 'ko-KR',
};

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string, language: string) => {
    if (!text.trim()) {
      setError('No text to speak');
      return;
    }

    try {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const langCode = LANGUAGE_VOICES[language] || 'en-US';
      
      utterance.lang = langCode;
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setError(null);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = (event) => {
        setError(`Speech synthesis error: ${event.error}`);
        setIsSpeaking(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to speak';
      setError(message);
      console.error('TTS error:', err);
    }
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    isSpeaking,
    speak,
    stop,
    error,
  };
}
