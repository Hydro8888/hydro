'use client';

import { create } from 'zustand';

interface ConversationMeta {
  id: string;
  title: string;
  updatedAt: string;
}

interface ChatStore {
  activeConversationId: string | null;
  conversations: ConversationMeta[];
  setActiveConversation: (id: string | null) => void;
  addConversation: (conversation: ConversationMeta) => void;
  updateConversationTitle: (id: string, title: string) => void;
  removeConversation: (id: string) => void;
  setConversations: (conversations: ConversationMeta[]) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  activeConversationId: null,
  conversations: [],

  setActiveConversation: (id) => set({ activeConversationId: id }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
      activeConversationId: conversation.id,
    })),

  updateConversationTitle: (id, title) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, title } : c
      ),
    })),

  removeConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      activeConversationId:
        state.activeConversationId === id ? null : state.activeConversationId,
    })),

  setConversations: (conversations) => set({ conversations }),
}));
