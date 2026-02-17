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
  'it': 'it',
  'de': 'de',
  'zh': 'zh',
  'ja': 'ja',
  'ru': 'ru',
  'ar': 'ar',
  'hi': 'hi',
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

      // Try multiple translation APIs with fallback
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const sourceLang = LANGUAGE_CODES[sourceLanguage] || sourceLanguage;
        const targetLang = LANGUAGE_CODES[targetLanguage] || targetLanguage;

        // Try Google Translate API through a proxy first
        try {
          const response = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`,
            {
              method: 'GET',
              signal: controller.signal,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              },
            }
          );

          if (response.ok) {
            const data = await response.json() as any;
            if (data && data[0] && data[0][0] && data[0][0][0]) {
              const translatedText = data[0].map((item: any) => item[0]).join('');
              setTranslatedText(translatedText);
              clearTimeout(timeoutId);
              return;
            }
          }
        } catch (googleErr) {
          console.warn('Google Translate failed, trying LibreTranslate:', googleErr);
        }

        // Try multiple LibreTranslate servers
        const libreTranslateServers = [
          'https://libretranslate.de/translate',
          'https://libretranslate.pussthecat.org/translate',
          'https://translate.argosopentech.com/translate',
          'https://translate.mentality.rip/translate'
        ];

        let translationSuccess = false;
        
        for (const server of libreTranslateServers) {
          try {
            const response = await fetch(
              server,
              {
                method: 'POST',
                signal: controller.signal,
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  q: text,
                  source: sourceLang,
                  target: targetLang,
                  format: 'text',
                }),
              }
            );

            if (response.ok) {
              const data = await response.json() as any;
              if (data.translatedText) {
                setTranslatedText(data.translatedText);
                translationSuccess = true;
                break;
              }
            }
          } catch (serverErr) {
            console.warn(`Server ${server} failed:`, serverErr);
            continue;
          }
        }

        if (translationSuccess) {
          clearTimeout(timeoutId);
          return;
        }

        // If all LibreTranslate servers failed, show error
        setError('All translation services failed. Using original text.');
        setTranslatedText(text);
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
