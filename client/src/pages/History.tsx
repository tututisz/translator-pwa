import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageBubble } from '@/components/MessageBubble';
import { useConversationHistory, Conversation } from '@/hooks/useConversationHistory';
import { useSummary } from '@/hooks/useSummary';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { ArrowLeft, Trash2, Download, FileText, Volume2 } from 'lucide-react';
import { Link } from 'wouter';

const LANGUAGE_NAMES: Record<string, string> = {
  'pt': '🇧🇷 Português',
  'en': '🇺🇸 English',
  'es': '🇪🇸 Español',
  'fr': '🇫🇷 Français',
  'ko': '🇰🇷 한국어',
  'it': '🇮🇹 Italiano',
  'de': '🇩🇪 Deutsch',
  'zh': '🇨🇳 中文',
  'ja': '🇯🇵 日本語',
  'ru': '🇷🇺 Русский',
  'ar': '🇸🇦 العربية',
  'hi': '🇮🇳 हिन्दी',
};

export default function History() {
  const { conversations, currentConversation, deleteConversation, loadConversation } =
    useConversationHistory();
  const { summary, isGenerating, generateSummary } = useSummary();
  const { speak } = useTextToSpeech();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(
    currentConversation
  );
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

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

  const groupMessages = (messages: any[]) => {
    const groupedMessages = [];
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg.isTranslation) {
        // Look for the next translation
        const nextMsg = messages[i + 1];
        if (nextMsg && nextMsg.isTranslation) {
          groupedMessages.push({
            original: msg,
            translation: nextMsg
          });
          i++; // Skip the translation as it's now grouped
        } else {
          groupedMessages.push({
            original: msg,
            translation: null
          });
        }
      }
    }
    return groupedMessages;
  };

  const handleGenerateSummary = async () => {
    if (!selectedConversation) return;
    
    setIsGeneratingSummary(true);
    try {
      await generateSummary(
        selectedConversation.messages,
        selectedConversation.sourceLanguage,
        selectedConversation.targetLanguage
      );
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const generateHTMLContent = (conv: Conversation, summaryData: any) => {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conversa Traduzida - ${LANGUAGE_NAMES[conv.sourceLanguage]} → ${LANGUAGE_NAMES[conv.targetLanguage]}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
            margin-bottom: 20px;
        }
        
        .header .meta {
            display: flex;
            justify-content: center;
            gap: 30px;
            font-size: 0.9em;
            opacity: 0.8;
        }
        
        .content {
            padding: 30px;
        }
        
        .summary-section {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 30px;
            color: white;
        }
        
        .summary-section h2 {
            font-size: 1.8em;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .summary-content {
            font-size: 1.1em;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        
        .key-points {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 20px;
            margin-top: 20px;
        }
        
        .key-points h3 {
            font-size: 1.3em;
            margin-bottom: 15px;
        }
        
        .key-points ul {
            list-style: none;
            padding: 0;
        }
        
        .key-points li {
            padding: 8px 0;
            padding-left: 25px;
            position: relative;
        }
        
        .key-points li:before {
            content: "✨";
            position: absolute;
            left: 0;
        }
        
        .statistics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .stat-item {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 10px;
            text-align: center;
        }
        
        .stat-value {
            font-size: 1.5em;
            font-weight: bold;
            display: block;
        }
        
        .stat-label {
            font-size: 0.9em;
            opacity: 0.8;
        }
        
        .conversation {
            margin-top: 30px;
        }
        
        .conversation h2 {
            font-size: 1.8em;
            margin-bottom: 20px;
            color: #333;
            text-align: center;
        }
        
        .messages {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .message {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 15px;
            border-radius: 15px;
            max-width: 80%;
            word-wrap: break-word;
        }
        
        .message.source {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            align-self: flex-start;
            border-bottom-left-radius: 5px;
        }
        
        .message.target {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            align-self: flex-end;
            border-bottom-right-radius: 5px;
            flex-direction: row-reverse;
        }
        
        .message.target .message-content {
            text-align: right;
        }
        
        .message-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2em;
            flex-shrink: 0;
        }
        
        .message-content {
            flex: 1;
        }
        
        .message-text {
            font-size: 1.1em;
            line-height: 1.5;
            margin-bottom: 5px;
        }
        
        .original-text {
            font-size: 1.2em;
            font-weight: 600;
            margin-bottom: 8px;
            line-height: 1.4;
        }
        
        .translation-text {
            font-size: 0.9em;
            opacity: 0.8;
            padding-top: 8px;
            border-top: 1px solid rgba(255,255,255,0.2);
            font-style: italic;
        }
        
        .message-meta {
            font-size: 0.8em;
            opacity: 0.7;
        }
        
        .translation-badge {
            background: rgba(255,255,255,0.2);
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.7em;
            margin-left: 8px;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
        
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            .header h1 {
                font-size: 2em;
            }
            
            .header .meta {
                flex-direction: column;
                gap: 10px;
            }
            
            .message {
                max-width: 90%;
            }
            
            .statistics {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🗣️ Conversa Traduzida</h1>
            <div class="subtitle">
                ${LANGUAGE_NAMES[conv.sourceLanguage]} → ${LANGUAGE_NAMES[conv.targetLanguage]}
            </div>
            <div class="meta">
                <span>📅 ${new Date(conv.createdAt).toLocaleDateString('pt-BR')}</span>
                <span>🕐 ${new Date(conv.createdAt).toLocaleTimeString('pt-BR')}</span>
                <span>💬 ${conv.messages.length} mensagens</span>
            </div>
        </div>
        
        <div class="content">
            ${summaryData ? `
            <div class="summary-section">
                <h2>📋 Resumo da Conversa</h2>
                <div class="summary-content">
                    ${summaryData.summary}
                </div>
                
                ${summaryData.keyPoints && summaryData.keyPoints.length > 0 ? `
                <div class="key-points">
                    <h3>🎯 Pontos Principais</h3>
                    <ul>
                        ${summaryData.keyPoints.map((point: string) => `<li>${point}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                
                ${summaryData.statistics ? `
                <div class="statistics">
                    <div class="stat-item">
                        <span class="stat-value">${summaryData.statistics.totalMessages}</span>
                        <span class="stat-label">Mensagens</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${summaryData.statistics.totalWords}</span>
                        <span class="stat-label">Palavras</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${summaryData.statistics.duration}</span>
                        <span class="stat-label">Duração</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${summaryData.statistics.languagesUsed.length}</span>
                        <span class="stat-label">Idiomas</span>
                    </div>
                </div>
                ` : ''}
            </div>
            ` : ''}
            
            <div class="conversation">
                <h2>💬 Conversa Completa</h2>
                <div class="messages">
                    ${conv.messages.map((msg, index) => {
                        const normalizedTimestamp = msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp);
                        const isSource = msg.language === conv.sourceLanguage;
                        return `
                        <div class="message ${isSource ? 'source' : 'target'}">
                            <div class="message-avatar">
                                ${isSource ? '👤' : '🤖'}
                            </div>
                            <div class="message-content">
                                <div class="message-text">
                                    <div class="original-text">
                                        ${msg.text}
                                    </div>
                                    ${msg.isTranslation ? `
                                    <div class="translation-text">
                                        Tradução
                                    </div>
                                    ` : ''}
                                </div>
                                <div class="message-meta">
                                    ${LANGUAGE_NAMES[msg.language]} • ${normalizedTimestamp.toLocaleTimeString('pt-BR')}
                                    ${msg.isTranslation ? ' • Tradução' : ''}
                                </div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
        
        <div class="footer">
            Gerado pelo Translator PWA • ${new Date().toLocaleDateString('pt-BR')} • 
            <a href="#" style="color: #667eea; text-decoration: none;">Powered by AI</a>
        </div>
    </div>
</body>
</html>`;
    
    return htmlTemplate;
  };

  const handleDownloadConversation = async (conv: Conversation) => {
    let summaryData = summary;
    
    // Generate summary if not available
    if (!summaryData && conv.messages.length > 0) {
      setIsGeneratingSummary(true);
      try {
        await generateSummary(
          conv.messages,
          conv.sourceLanguage,
          conv.targetLanguage
        );
        summaryData = summary;
      } catch (error) {
        console.error('Error generating summary for download:', error);
      } finally {
        setIsGeneratingSummary(false);
      }
    }
    
    const htmlContent = generateHTMLContent(conv, summaryData);
    
    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent)
    );
    element.setAttribute('download', `conversation-${conv.id}.html`);
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateSummary}
                      disabled={isGeneratingSummary || isGenerating}
                      className="gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      {isGeneratingSummary || isGenerating ? 'Generating...' : 'Summary'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadConversation(selectedConversation)}
                      disabled={isGeneratingSummary}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </div>

                {summary && (
                  <Card className="p-4 mb-6 border-border/50 bg-accent/5">
                    <h3 className="text-lg font-semibold mb-3">📋 Resumo da Conversa</h3>
                    <p className="text-sm text-foreground mb-3">{summary.summary}</p>
                    {summary.keyPoints && summary.keyPoints.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium mb-2">🎯 Pontos Principais:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {summary.keyPoints.map((point, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-accent">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {summary.statistics && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-semibold text-accent">{summary.statistics.totalMessages}</div>
                            <div className="text-muted-foreground">Mensagens</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-accent">{summary.statistics.totalWords}</div>
                            <div className="text-muted-foreground">Palavras</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-accent">{summary.statistics.duration}</div>
                            <div className="text-muted-foreground">Duração</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-accent">{summary.statistics.languagesUsed.length}</div>
                            <div className="text-muted-foreground">Idiomas</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {selectedConversation.messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No messages in this conversation
                    </p>
                  ) : (
                    groupMessages(selectedConversation.messages).map((group, index) => (
                      <div key={index} className={`flex gap-3 ${group.original.language === selectedConversation.sourceLanguage ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-3 border ${
                          group.original.language === selectedConversation.sourceLanguage 
                            ? 'bg-blue-50 border-blue-200 text-blue-900' 
                            : 'bg-green-50 border-green-200 text-green-900'
                        }`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium mb-1">
                                {LANGUAGE_NAMES[group.original.language]}
                                {group.translation && ` • ${LANGUAGE_NAMES[group.translation.language]}`}
                              </p>
                              <div className="space-y-2">
                                <p className="text-base font-semibold break-words">
                                  {group.original.text}
                                </p>
                                {group.translation && (
                                  <p className="text-sm opacity-80 italic break-words border-t border-current/20 pt-2">
                                    {group.translation.text}
                                  </p>
                                )}
                              </div>
                              <p className="text-xs opacity-70 mt-2">
                                {group.original.timestamp instanceof Date 
                                  ? group.original.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : new Date(group.original.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                }
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => speak(group.original.text, group.original.language)}
                              className="flex-shrink-0 -mr-2"
                            >
                              <Volume2 className="w-4 h-4 opacity-50" />
                            </Button>
                          </div>
                        </div>
                      </div>
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
