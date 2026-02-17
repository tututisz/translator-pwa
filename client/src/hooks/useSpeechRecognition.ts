import { useState, useRef, useCallback, useEffect } from 'react';

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: (language: string) => void;
  stopListening: () => void;
  error: string | null;
}

const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

const LANGUAGE_CODES: Record<string, string> = {
  'pt': 'pt-BR',
  'en': 'en-US',
  'es': 'es-ES',
  'fr': 'fr-FR',
  'ko': 'ko-KR',
  'it': 'it-IT',
  'de': 'de-DE',
  'zh': 'zh-CN',
  'ja': 'ja-JP',
  'ru': 'ru-RU',
  'ar': 'ar-SA',
  'hi': 'hi-IN',
};

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!SpeechRecognition) {
      setError('Speech Recognition not supported in this browser');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;

    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript('');
      setInterimTranscript('');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptSegment = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          final += transcriptSegment + ' ';
        } else {
          interim += transcriptSegment;
        }
      }

      setInterimTranscript(interim);
      if (final) {
        setTranscript((prev) => prev + final);
      }
    };

    recognition.onerror = (event: any) => {
      setError(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, []);

  const startListening = useCallback((language: string) => {
    if (!recognitionRef.current) {
      setError('Speech Recognition not available');
      return;
    }

    const langCode = LANGUAGE_CODES[language] || 'en-US';
    recognitionRef.current.lang = langCode;
    recognitionRef.current.start();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    error,
  };
}
