import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageBubble } from '@/components/MessageBubble';
import { useConversationHistory, Conversation } from '@/hooks/useConversationHistory';
import { ArrowLeft, Trash2, Download } from 'lucide-react';
import { Link } from 'wouter';

const LANGUAGE_NAMES: Record<string, string> = {
  'pt': '🇧🇷 Português',
  'en': '🇺🇸 English',
  'es': '🇪🇸 Español',
  'fr': '🇫🇷 Français',
  'ko': '🇰🇷 한국어',
};

export default function History() {
  const { conversations, currentConversation, deleteConversation, loadConversation } =
    useConversationHistory();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(
    currentConversation
  );

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    loadConversation(conv.id);
  };

  const handleDeleteConversation = (id: string) => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      deleteConversation(id);
      if (selectedConversation?.id === id) {
        setSelectedConversation(null);
      }
    }
  };

  const handleDownloadConversation = (conv: Conversation) => {
    const text = conv.messages
      .map((msg) => `[${msg.timestamp.toLocaleTimeString()}] ${msg.language}: ${msg.text}`)
      .join('\n');

    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
    );
    element.setAttribute('download', `conversation-${conv.id}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Conversation History</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="p-4 border-border/50 max-h-[600px] overflow-y-auto">
              <h2 className="text-lg font-bold mb-4">Conversations</h2>

              {conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No conversations yet
                </p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedConversation?.id === conv.id
                          ? 'bg-accent/10 border-accent'
                          : 'border-border hover:bg-secondary'
                      }`}
                      onClick={() => handleSelectConversation(conv)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {LANGUAGE_NAMES[conv.sourceLanguage]} →{' '}
                            {LANGUAGE_NAMES[conv.targetLanguage]}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {conv.messages.length} messages
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(conv.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(conv.id);
                          }}
                          className="flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Conversation Details */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card className="p-6 border-border/50">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold">
                      {LANGUAGE_NAMES[selectedConversation.sourceLanguage]} →{' '}
                      {LANGUAGE_NAMES[selectedConversation.targetLanguage]}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedConversation.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadConversation(selectedConversation)}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {selectedConversation.messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No messages in this conversation
                    </p>
                  ) : (
                    selectedConversation.messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        text={msg.text}
                        language={msg.language}
                        timestamp={msg.timestamp}
                        isTranslation={msg.isTranslation}
                      />
                    ))
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-6 border-border/50 flex items-center justify-center h-[500px]">
                <p className="text-muted-foreground">Select a conversation to view details</p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
