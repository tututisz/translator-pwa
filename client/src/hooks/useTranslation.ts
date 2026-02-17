import { useState, useCallback } from 'react';

interface UseTranslationReturn {
  translatedText: string;
  isTranslating: boolean;
  error: string | null;
  translate: (text: string, sourceLanguage: string, targetLanguage: string) => Promise<void>;
}

const LANGUAGE_CODES: Record<string, string> = {
  'pt': 'pt',
  'en': 'en',
  'es': 'es',
  'fr': 'fr',
  'ko': 'ko',
};

// Simple offline dictionary for common phrases
const OFFLINE_TRANSLATIONS: Record<string, Record<string, string>> = {
  'pt|en': {
    'olá': 'hello',
    'oi': 'hi',
    'obrigado': 'thank you',
    'por favor': 'please',
    'sim': 'yes',
    'não': 'no',
    'tudo bem': 'how are you',
    'adeus': 'goodbye',
    'tchau': 'bye',
    'bom dia': 'good morning',
    'boa noite': 'good night',
    'como você está': 'how are you',
    'estou bem': 'i am well',
    'muito bem': 'very well',
    'eu estou bem': 'i am well',
    'estou bem obrigado': 'i am well thank you',
    'e você': 'and you',
    'tudo certo': 'all good',
    'tudo ok': 'all ok',
  },
  'en|pt': {
    'hello': 'olá',
    'hi': 'oi',
    'thank you': 'obrigado',
    'please': 'por favor',
    'yes': 'sim',
    'no': 'não',
    'how are you': 'como você está',
    'goodbye': 'adeus',
    'bye': 'tchau',
    'good morning': 'bom dia',
    'good night': 'boa noite',
    'i am well': 'estou bem',
    'very well': 'muito bem',
    'and you': 'e você',
    'all good': 'tudo certo',
    'all ok': 'tudo ok',
  },
};

export function useTranslation(): UseTranslationReturn {
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getOfflineTranslation = useCallback((text: string, sourceLang: string, targetLang: string): string | null => {
    const key = `${sourceLang}|${targetLang}`;
    const dict = OFFLINE_TRANSLATIONS[key];
    if (dict) {
      const lowerText = text.toLowerCase().trim();
      return dict[lowerText] || null;
    }
    return null;
  }, []);

  const translate = useCallback(async (text: string, sourceLanguage: string, targetLanguage: string) => {
    if (!text.trim()) {
      setTranslatedText('');
      return;
    }

    try {
      setIsTranslating(true);
      setError(null);

      // Try offline translation first
      const offlineResult = getOfflineTranslation(text, sourceLanguage, targetLanguage);
      if (offlineResult) {
        setTranslatedText(offlineResult);
        setIsTranslating(false);
        return;
      }

      // Use LibreTranslate API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const sourceLang = LANGUAGE_CODES[sourceLanguage] || sourceLanguage;
        const targetLang = LANGUAGE_CODES[targetLanguage] || targetLanguage;

        const response = await fetch(
          'https://libretranslate.de/translate',
          {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              q: text,
              source_language: sourceLang,
              target_language: targetLang,
            }),
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('Translation service error');
        }

        const data = await response.json() as any;

        if (data.translatedText) {
          setTranslatedText(data.translatedText);
        } else {
          setError('Translation failed. Using original text.');
          setTranslatedText(text);
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        console.error('Translation API error:', fetchErr);
        setTranslatedText(text);
        setError('Translation service unavailable. Showing original text.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Translation error';
      setError(message);
      console.error('Translation error:', err);
      setTranslatedText(text);
    } finally {
      setIsTranslating(false);
    }
  }, [getOfflineTranslation]);

  return {
    translatedText,
    isTranslating,
    error,
    translate,
  };
}
