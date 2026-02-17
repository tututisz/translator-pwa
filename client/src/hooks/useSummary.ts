import { useState, useCallback } from 'react';

interface Message {
  id: string;
  text: string;
  language: string;
  timestamp: Date;
  isTranslation?: boolean;
}

interface SummaryResult {
  summary: string;
  keyPoints: string[];
  errors: string[];
  statistics: {
    totalMessages: number;
    totalWords: number;
    duration: string;
    languagesUsed: string[];
  };
}

interface UseSummaryReturn {
  summary: SummaryResult | null;
  isGenerating: boolean;
  error: string | null;
  generateSummary: (messages: Message[], sourceLanguage: string, targetLanguage: string) => Promise<void>;
}

export function useSummary(): UseSummaryReturn {
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = useCallback(async (
    messages: Message[],
    sourceLanguage: string,
    targetLanguage: string
  ) => {
    if (messages.length === 0) {
      setError('No messages to summarize');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      // Format messages for summary
      const formattedMessages = messages
        .map((msg) => {
          const lang = msg.language === sourceLanguage ? sourceLanguage : targetLanguage;
          const label = msg.isTranslation ? `[${lang}]` : `[${lang}]`;
          return `${label} ${msg.text}`;
        })
        .join('\n');

      // Calculate statistics
      const totalWords = messages.reduce((sum, msg) => sum + msg.text.split(/\s+/).length, 0);
      const firstTimestamp = messages[0]?.timestamp instanceof Date ? messages[0].timestamp : new Date(messages[0]?.timestamp || 0);
      const lastTimestamp = messages[messages.length - 1]?.timestamp instanceof Date ? messages[messages.length - 1].timestamp : new Date(messages[messages.length - 1]?.timestamp || 0);
      const durationMs = lastTimestamp.getTime() - firstTimestamp.getTime();
      const durationMinutes = Math.floor(durationMs / 60000);
      const durationSeconds = Math.floor((durationMs % 60000) / 1000);

      const response = await fetch('/.netlify/functions/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: formattedMessages,
          sourceLanguage,
          targetLanguage,
          totalMessages: messages.length,
          totalWords,
          duration: `${durationMinutes}m ${durationSeconds}s`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json() as SummaryResult;
      setSummary(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Summary generation error';
      setError(message);
      console.error('Summary error:', err);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    summary,
    isGenerating,
    error,
    generateSummary,
  };
}
