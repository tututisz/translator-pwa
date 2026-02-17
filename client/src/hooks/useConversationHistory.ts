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

  // Hydrate conversations with proper Date objects
  const hydrateConversation = useCallback((conv: any): Conversation => {
    return {
      ...conv,
      createdAt: conv.createdAt instanceof Date ? conv.createdAt : new Date(conv.createdAt),
      updatedAt: conv.updatedAt instanceof Date ? conv.updatedAt : new Date(conv.updatedAt),
      messages: (conv.messages || []).map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
      })),
    };
  }, []);

  // Save conversations to localStorage
  const saveConversations = useCallback((convs: Conversation[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
      // Hydrate before setting state to ensure Date objects
      const hydrated = convs.map(hydrateConversation);
      setConversations(hydrated);
    } catch (err) {
      console.error('Failed to save conversations:', err);
    }
  }, [hydrateConversation]);

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

      // Ensure message timestamp is a Date
      const normalizedMessage: HistoryMessage = {
        ...message,
        timestamp: message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp),
      };

      const updated = {
        ...currentConversation,
        messages: [...currentConversation.messages, normalizedMessage],
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
      // Hydrate conversation before setting as current
      const hydrated = hydrateConversation(conv);
      setCurrentConversation(hydrated);
    }
  }, [conversations, hydrateConversation]);

  const archiveConversation = useCallback(
    (sourceLanguage: string, targetLanguage: string): Conversation => {
      // Create a new conversation, archiving the current one
      const newConversation: Conversation = {
        id: nanoid(),
        sourceLanguage,
        targetLanguage,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Keep current conversation in history and create new one
      const updated = [newConversation, ...conversations].slice(0, MAX_CONVERSATIONS);
      saveConversations(updated);
      setCurrentConversation(newConversation);

      return newConversation;
    },
    [conversations, saveConversations]
  );

  return {
    conversations: conversations.map(hydrateConversation),
    currentConversation: currentConversation ? hydrateConversation(currentConversation) : null,
    createConversation,
    addMessage,
    deleteConversation,
    clearAllConversations,
    loadConversation,
    archiveConversation,
  };
}
