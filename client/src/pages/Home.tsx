import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Volume2, VolumeX, History as HistoryIcon, Archive, FileText } from 'lucide-react';
import { Link } from 'wouter';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ConversationPanel } from '@/components/ConversationPanel';
import { AudioWaveform } from '@/components/AudioWaveform';
import { SummaryReport } from '@/components/SummaryReport';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTranslation } from '@/hooks/useTranslation';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useConversationHistory } from '@/hooks/useConversationHistory';
import { useOfflineDictionary } from '@/hooks/useOfflineDictionary';
import { useSummary } from '@/hooks/useSummary';
import { nanoid } from 'nanoid';

interface Message {
  id: string;
  text: string;
  language: string;
  timestamp: Date;
  isTranslation?: boolean;
}

const LANGUAGE_NAMES: Record<string, string> = {
  'pt': 'Português',
  'en': 'English',
  'es': 'Español',
  'fr': 'Français',
  'ko': '한국어',
};

const LANGUAGE_COLORS: Record<string, string> = {
  'pt': 'text-green-600',
  'en': 'text-blue-600',
  'es': 'text-yellow-600',
  'fr': 'text-red-600',
  'ko': 'text-purple-600',
};

export default function Home() {
  const [sourceLanguage, setSourceLanguage] = useState('pt');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [isWaiting, setIsWaiting] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<'source' | 'target'>('source');
  const [showSummary, setShowSummary] = useState(false);

  // Track if we've already processed a translation
  const translationProcessedRef = useRef(false);

  const { createConversation, addMessage: addHistoryMessage, currentConversation, archiveConversation } =
    useConversationHistory();
  const { isOffline } = useOfflineDictionary();

  const { isListening, transcript, interimTranscript, startListening, stopListening } =
    useSpeechRecognition();
  const { translatedText, isTranslating, translate } = useTranslation();
  const { isSpeaking, speak, stop } = useTextToSpeech();
  const { summary, isGenerating, generateSummary } = useSummary();

  // Initialize conversation on mount
  useEffect(() => {
    if (!currentConversation) {
      createConversation(sourceLanguage, targetLanguage);
    }
  }, []);

  // Handle transcript updates
  useEffect(() => {
    if (transcript && !isListening) {
      handleTranscriptComplete(transcript);
    }
  }, [transcript, isListening]);

  const handleTranscriptComplete = async (text: string) => {
    if (!text.trim()) return;

    // Determine which language was spoken based on current speaker
    const spokenLanguage = currentSpeaker === 'source' ? sourceLanguage : targetLanguage;
    const otherLanguage = currentSpeaker === 'source' ? targetLanguage : sourceLanguage;

    // Create message with the spoken language
    const msg: Message = {
      id: nanoid(),
      text: text.trim(),
      language: spokenLanguage,
      timestamp: new Date(),
    };

    // Add to all messages
    setAllMessages((prev) => [...prev, msg]);

    // Add to history
    if (currentConversation) {
      addHistoryMessage({
        id: msg.id,
        text: msg.text,
        language: spokenLanguage,
        timestamp: msg.timestamp,
      });
    }

    // Reset translation flag and translate
    translationProcessedRef.current = false;
    setIsWaiting(true);
    await translate(text.trim(), spokenLanguage, otherLanguage);
  };

  // Handle translation result - only process once per translation
  useEffect(() => {
    if (translatedText && !isTranslating && !translationProcessedRef.current) {
      translationProcessedRef.current = true;
      setIsWaiting(false);

      // Get the language of the speaker who just spoke
      const spokenLanguage = currentSpeaker === 'source' ? sourceLanguage : targetLanguage;
      const translationLanguage = currentSpeaker === 'source' ? targetLanguage : sourceLanguage;

      const translationMsg: Message = {
        id: nanoid(),
        text: translatedText,
        language: translationLanguage,
        timestamp: new Date(),
        isTranslation: true,
      };

      // Add to all messages
      setAllMessages((prev) => [...prev, translationMsg]);

      // Add to history
      if (currentConversation) {
        addHistoryMessage({
          id: translationMsg.id,
          text: translationMsg.text,
          language: translationLanguage,
          timestamp: translationMsg.timestamp,
          isTranslation: true,
        });
      }

      // Auto-play translation
      speak(translatedText, translationLanguage);

      // Switch speaker after translation
      const nextSpeaker = currentSpeaker === 'source' ? 'target' : 'source';
      setCurrentSpeaker(nextSpeaker);
    }
  }, [translatedText, isTranslating]);

  // Filter messages by language
  const sourceMessages = allMessages.filter((msg) => msg.language === sourceLanguage);
  const targetMessages = allMessages.filter((msg) => msg.language === targetLanguage);

  const handleStartRecording = () => {
    // Use the language of the current speaker
    const speakerLanguage = currentSpeaker === 'source' ? sourceLanguage : targetLanguage;
    startListening(speakerLanguage);
  };

  const handleStopRecording = () => {
    stopListening();
  };

  const handleClearSource = () => {
    setAllMessages((prev) => prev.filter((msg) => msg.language !== sourceLanguage));
  };

  const handleClearTarget = () => {
    setAllMessages((prev) => prev.filter((msg) => msg.language !== targetLanguage));
  };

  const handleSwapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setCurrentSpeaker('source');
    translationProcessedRef.current = false;
  };

  const handleSwitchSpeaker = () => {
    translationProcessedRef.current = false;
    setCurrentSpeaker(currentSpeaker === 'source' ? 'target' : 'source');
  };

  const handleArchiveConversation = () => {
    archiveConversation(sourceLanguage, targetLanguage);
    setAllMessages([]);
    setCurrentSpeaker('source');
    translationProcessedRef.current = false;
  };

  const handleGenerateSummary = async () => {
    await generateSummary(allMessages, sourceLanguage, targetLanguage);
    setShowSummary(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                <Volume2 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold">Translator PWA</h1>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Real-time translation with audio</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateSummary}
                disabled={allMessages.length === 0 || isGenerating}
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                {isGenerating ? 'Generating...' : 'Summary'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleArchiveConversation}
                className="gap-2"
              >
                <Archive className="w-4 h-4" />
                Archive
              </Button>
              <Link href="/history">
                <Button variant="outline" size="sm" className="gap-2">
                  <HistoryIcon className="w-4 h-4" />
                  History
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Language Controls */}
        <Card className="p-6 mb-8 border-border/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <LanguageSelector
              value={sourceLanguage}
              onChange={setSourceLanguage}
              label="From"
            />

            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwapLanguages}
                className="rounded-full w-10 h-10 p-0"
              >
                ⇄
              </Button>
            </div>

            <LanguageSelector
              value={targetLanguage}
              onChange={setTargetLanguage}
              label="To"
            />
          </div>
        </Card>

        {/* Current Speaker Indicator */}
        <Card className="p-4 mb-8 border-border/50 bg-accent/5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              Current Speaker:{' '}
              <span className={LANGUAGE_COLORS[currentSpeaker === 'source' ? sourceLanguage : targetLanguage]}>
                {currentSpeaker === 'source'
                  ? LANGUAGE_NAMES[sourceLanguage]
                  : LANGUAGE_NAMES[targetLanguage]}
              </span>
            </div>
            {isOffline && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Offline Mode
              </span>
            )}
          </div>
        </Card>

        {/* Recording Controls */}
        <Card className="p-6 mb-8 border-border/50">
          <div className="flex flex-col items-center gap-4">
            {isListening && (
              <AudioWaveform
                isActive={isListening}
                color="rgb(var(--color-accent))"
              />
            )}

            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-4">
                {!isListening ? (
                  <Button
                    onClick={handleStartRecording}
                    size="lg"
                    className="gap-2 bg-accent hover:bg-accent/90"
                  >
                    <Mic className="w-5 h-5" />
                    Start Recording
                  </Button>
                ) : (
                  <Button
                    onClick={handleStopRecording}
                    size="lg"
                    variant="destructive"
                    className="gap-2"
                  >
                    <MicOff className="w-5 h-5" />
                    Stop Recording
                  </Button>
                )}

                {isSpeaking && (
                  <Button
                    onClick={stop}
                    size="lg"
                    variant="outline"
                    className="gap-2"
                  >
                    <VolumeX className="w-5 h-5" />
                    Stop Audio
                  </Button>
                )}
              </div>

              <Button
                onClick={handleSwitchSpeaker}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                ⇄ Switch Speaker
              </Button>
            </div>

            {interimTranscript && (
              <p className="text-sm text-muted-foreground italic">
                Listening: {interimTranscript}
              </p>
            )}

            {isWaiting && (
              <p className="text-sm text-accent">Translating...</p>
            )}
          </div>
        </Card>

        {/* Conversation Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-6 border-border/50 flex flex-col h-[500px]">
            <ConversationPanel
              title={LANGUAGE_NAMES[sourceLanguage]}
              language={sourceLanguage}
              messages={sourceMessages}
              onClear={handleClearSource}
              langColor={LANGUAGE_COLORS[sourceLanguage]}
            />
          </Card>

          <Card className="p-6 border-border/50 flex flex-col h-[500px]">
            <ConversationPanel
              title={LANGUAGE_NAMES[targetLanguage]}
              language={targetLanguage}
              messages={targetMessages}
              onClear={handleClearTarget}
              langColor={LANGUAGE_COLORS[targetLanguage]}
            />
          </Card>
        </div>
      </main>

      {/* Summary Report Modal */}
      {showSummary && summary && (
        <SummaryReport
          summary={summary.summary}
          keyPoints={summary.keyPoints}
          errors={summary.errors}
          statistics={summary.statistics}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  );
}
