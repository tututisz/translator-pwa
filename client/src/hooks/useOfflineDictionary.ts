import { useEffect, useState } from 'react';

interface DictionaryEntry {
  word: string;
  translation: string;
  language: string;
}

const OFFLINE_DICTIONARY: Record<string, DictionaryEntry[]> = {
  'pt-en': [
    { word: 'olá', translation: 'hello', language: 'en' },
    { word: 'obrigado', translation: 'thank you', language: 'en' },
    { word: 'por favor', translation: 'please', language: 'en' },
    { word: 'sim', translation: 'yes', language: 'en' },
    { word: 'não', translation: 'no', language: 'en' },
    { word: 'água', translation: 'water', language: 'en' },
    { word: 'comida', translation: 'food', language: 'en' },
    { word: 'bom dia', translation: 'good morning', language: 'en' },
    { word: 'boa noite', translation: 'good night', language: 'en' },
    { word: 'tudo bem', translation: 'how are you', language: 'en' },
  ],
  'en-pt': [
    { word: 'hello', translation: 'olá', language: 'pt' },
    { word: 'thank you', translation: 'obrigado', language: 'pt' },
    { word: 'please', translation: 'por favor', language: 'pt' },
    { word: 'yes', translation: 'sim', language: 'pt' },
    { word: 'no', translation: 'não', language: 'pt' },
    { word: 'water', translation: 'água', language: 'pt' },
    { word: 'food', translation: 'comida', language: 'pt' },
    { word: 'good morning', translation: 'bom dia', language: 'pt' },
    { word: 'good night', translation: 'boa noite', language: 'pt' },
    { word: 'how are you', translation: 'tudo bem', language: 'pt' },
  ],
  'pt-es': [
    { word: 'olá', translation: 'hola', language: 'es' },
    { word: 'obrigado', translation: 'gracias', language: 'es' },
    { word: 'por favor', translation: 'por favor', language: 'es' },
    { word: 'sim', translation: 'sí', language: 'es' },
    { word: 'não', translation: 'no', language: 'es' },
    { word: 'água', translation: 'agua', language: 'es' },
    { word: 'comida', translation: 'comida', language: 'es' },
  ],
  'en-es': [
    { word: 'hello', translation: 'hola', language: 'es' },
    { word: 'thank you', translation: 'gracias', language: 'es' },
    { word: 'please', translation: 'por favor', language: 'es' },
    { word: 'yes', translation: 'sí', language: 'es' },
    { word: 'no', translation: 'no', language: 'es' },
  ],
};

export function useOfflineDictionary() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getOfflineTranslation = (
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): string | null => {
    const key = `${sourceLanguage}-${targetLanguage}`;
    const dictionary = OFFLINE_DICTIONARY[key];

    if (!dictionary) return null;

    const lowerText = text.toLowerCase().trim();
    const entry = dictionary.find((e) => e.word.toLowerCase() === lowerText);

    return entry?.translation || null;
  };

  return {
    isOffline,
    getOfflineTranslation,
  };
}
