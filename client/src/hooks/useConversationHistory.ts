import { useState, useCallback, useEffect } from 'react';
import { nanoid } from 'nanoid';

export interface HistoryMessage {
  id: string;
  text: string;
  language: string;
  timestamp: Date;
  isTranslation?: boolean;
}

export interface Conversation {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  messages: HistoryMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const STORAGE_KEY = 'translator_conversations';
const MAX_CONVERSATIONS = 50;

export function useConversationHistory() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);

  // Load conversations from localStorage
  useEffect(() => {
    const loadConversations = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Convert date strings back to Date objects
          const conversations = parsed.map((conv: any) => ({
            ...conv,
            createdAt: new Date(conv.createdAt),
            updatedAt: new Date(conv.updatedAt),
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          }));
          setConversations(conversations);
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      }
    };

    loadConversations();
  }, []);

  // Save conversations to localStorage
  const saveConversations = useCallback((convs: Conversation[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
      setConversations(convs);
    } catch (err) {
      console.error('Failed to save conversations:', err);
    }
  }, []);

  const createConversation = useCallback(
    (sourceLanguage: string, targetLanguage: string): Conversation => {
      const conversation: Conversation = {
        id: nanoid(),
        sourceLanguage,
        targetLanguage,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updated = [conversation, ...conversations].slice(0, MAX_CONVERSATIONS);
      saveConversations(updated);
      setCurrentConversation(conversation);

      return conversation;
    },
    [conversations, saveConversations]
  );

  const addMessage = useCallback(
    (message: HistoryMessage) => {
      if (!currentConversation) return;

      const updated = {
        ...currentConversation,
        messages: [...currentConversation.messages, message],
        updatedAt: new Date(),
      };

      setCurrentConversation(updated);

      // Update in conversations list
      const conversationsList = conversations.map((conv) =>
        conv.id === updated.id ? updated : conv
      );
      saveConversations(conversationsList);
    },
    [currentConversation, conversations, saveConversations]
  );

  const deleteConversation = useCallback(
    (id: string) => {
      const updated = conversations.filter((conv) => conv.id !== id);
      saveConversations(updated);

      if (currentConversation?.id === id) {
        setCurrentConversation(null);
      }
    },
    [conversations, currentConversation, saveConversations]
  );

  const clearAllConversations = useCallback(() => {
    saveConversations([]);
    setCurrentConversation(null);
  }, [saveConversations]);

  const loadConversation = useCallback((id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      setCurrentConversation(conv);
    }
  }, [conversations]);

  return {
    conversations,
    currentConversation,
    createConversation,
    addMessage,
    deleteConversation,
    clearAllConversations,
    loadConversation,
  };
}
