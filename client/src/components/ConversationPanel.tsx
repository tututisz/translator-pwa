import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2, Trash2 } from 'lucide-react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

interface ConversationMessage {
  id: string;
  text: string;
  language: string;
  timestamp: Date;
  isTranslation?: boolean;
}

interface ConversationPanelProps {
  title: string;
  language: string;
  messages: ConversationMessage[];
  onClear: () => void;
  langColor?: string;
}

export function ConversationPanel({
  title,
  language,
  messages,
  onClear,
  langColor = 'text-foreground',
}: ConversationPanelProps) {
  const { isSpeaking, speak, stop } = useTextToSpeech();

  const handleSpeak = (text: string) => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text, language);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${langColor}`}>{title}</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-center">No messages yet. Start speaking!</p>
          </div>
        ) : (
          messages.map((msg) => {
            // Ensure timestamp is a Date object
            const normalizedTimestamp = msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp);
            
            return (
            <Card
              key={msg.id}
              className={`p-3 ${
                msg.isTranslation ? 'bg-accent/10 border-accent/20' : 'bg-card'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground break-words">{msg.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {normalizedTimestamp.toLocaleTimeString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSpeak(msg.text)}
                  className="flex-shrink-0"
                >
                  <Volume2
                    className={`w-4 h-4 ${
                      isSpeaking ? 'text-accent' : 'text-muted-foreground'
                    }`}
                  />
                </Button>
              </div>
            </Card>
          );
          })
        )}
      </div>
    </div>
  );
}
