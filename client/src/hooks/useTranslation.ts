import { useState, useCallback } from 'react';

interface UseTranslationReturn {
  translatedText: string;
  isTranslating: boolean;
  error: string | null;
  translate: (text: string, sourceLanguage: string, targetLanguage: string) => Promise<void>;
}

const LANGUAGE_NAMES: Record<string, string> = {
  'pt': 'Portuguese',
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'ko': 'Korean',
};

export function useTranslation(): UseTranslationReturn {
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translate = useCallback(async (text: string, sourceLanguage: string, targetLanguage: string) => {
    if (!text.trim()) {
      setTranslatedText('');
      return;
    }

    try {
      setIsTranslating(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        q: text,
        langpair: `${sourceLanguage}|${targetLanguage}`,
      });

      // Using a simple translation approach with a free API
      // For production, consider using a proper translation service
      const translationResponse = await fetch(
        `https://api.mymemory.translated.net/get?${params.toString()}`
      );

      if (!translationResponse.ok) {
        throw new Error('Translation service error');
      }

      const data = await translationResponse.json() as any;

      if (data.responseStatus === 200) {
        setTranslatedText(data.responseData.translatedText);
      } else if (data.responseStatus === 429) {
        setError('Too many requests. Please wait a moment.');
      } else {
        setError('Translation failed. Please try again.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Translation error';
      setError(message);
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  }, []);

  return {
    translatedText,
    isTranslating,
    error,
    translate,
  };
}
