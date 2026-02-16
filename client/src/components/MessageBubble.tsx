import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

interface MessageBubbleProps {
  text: string;
  language: string;
  timestamp: Date;
  isTranslation?: boolean;
  langColor?: string;
}

const LANGUAGE_NAMES: Record<string, string> = {
  'pt': 'Português',
  'en': 'English',
  'es': 'Español',
  'fr': 'Français',
  'ko': '한국어',
};

const BUBBLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'pt': {
    bg: 'bg-green-50',
    text: 'text-green-900',
    border: 'border-green-200',
  },
  'en': {
    bg: 'bg-blue-50',
    text: 'text-blue-900',
    border: 'border-blue-200',
  },
  'es': {
    bg: 'bg-yellow-50',
    text: 'text-yellow-900',
    border: 'border-yellow-200',
  },
  'fr': {
    bg: 'bg-red-50',
    text: 'text-red-900',
    border: 'border-red-200',
  },
  'ko': {
    bg: 'bg-purple-50',
    text: 'text-purple-900',
    border: 'border-purple-200',
  },
};

export function MessageBubble({
  text,
  language,
  timestamp,
  isTranslation,
  langColor,
}: MessageBubbleProps) {
  const { isSpeaking, speak, stop } = useTextToSpeech();
  const colors = BUBBLE_COLORS[language] || BUBBLE_COLORS['en'];

  const handleSpeak = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text, language);
    }
  };

  return (
    <div className={`flex gap-3 ${isTranslation ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-3 border ${colors.bg} ${colors.border} ${colors.text}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">{LANGUAGE_NAMES[language]}</p>
            <p className="text-sm break-words">{text}</p>
            <p className="text-xs opacity-70 mt-2">
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSpeak}
            className="flex-shrink-0 -mr-2"
          >
            <Volume2
              className={`w-4 h-4 ${isSpeaking ? 'text-current' : 'opacity-50'}`}
            />
          </Button>
        </div>
      </div>
    </div>
  );
}
