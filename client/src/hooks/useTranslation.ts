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
  },
  'en|pt': {
    'hello': 'olá',
    'hi': 'oi',
    'thank you': 'obrigado',
    'please': 'por favor',
    'yes': 'sim',
    'no': 'não',
    'how are you': 'tudo bem',
    'goodbye': 'adeus',
    'bye': 'tchau',
    'good morning': 'bom dia',
    'good night': 'boa noite',
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

      // Build query parameters
      const params = new URLSearchParams({
        q: text,
        langpair: `${sourceLanguage}|${targetLanguage}`,
      });

      // Try to fetch from API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const translationResponse = await fetch(
          `https://api.mymemory.translated.net/get?${params.toString()}`,
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        if (!translationResponse.ok) {
          throw new Error('Translation service error');
        }

        const data = await translationResponse.json() as any;

        if (data.responseStatus === 200 && data.responseData?.translatedText) {
          setTranslatedText(data.responseData.translatedText);
        } else if (data.responseStatus === 429) {
          setError('Too many requests. Please wait a moment.');
          // Use text as fallback
          setTranslatedText(text);
        } else {
          setError('Translation failed. Using original text.');
          // Use text as fallback
          setTranslatedText(text);
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        // If API fails, use original text as fallback
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
