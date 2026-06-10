/**
 * In-memory data store for conversations and messages.
 * Replaces PostgreSQL when DATABASE_URL is not available.
 * Data persists for the lifetime of the server process.
 */

export interface StoredConversation {
  id: string;
  userId: string;
  title: string;
  mode: string;
  modelIds: string[];
  messageCount: number;
  totalTokens: number;
  totalCost: number;
  pinned: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoredMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  modelId: string | null;
  content: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  createdAt: string;
}

export interface UsageRecord {
  modelId: string;
  tokens: number;
  cost: number;
  requestCount: number;
}

class MemoryStore {
  private conversations = new Map<string, StoredConversation>();
  private messages = new Map<string, StoredMessage[]>();
  private usage = new Map<string, UsageRecord>();

  // --- Conversations ---

  getConversations(userId: string): StoredConversation[] {
    return Array.from(this.conversations.values())
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getConversation(id: string): StoredConversation | undefined {
    return this.conversations.get(id);
  }

  createConversation(conv: StoredConversation): StoredConversation {
    this.conversations.set(conv.id, conv);
    this.messages.set(conv.id, []);
    return conv;
  }

  updateConversation(id: string, updates: Partial<StoredConversation>): StoredConversation | undefined {
    const conv = this.conversations.get(id);
    if (!conv) return undefined;
    const updated = { ...conv, ...updates, updatedAt: new Date().toISOString() };
    this.conversations.set(id, updated);
    return updated;
  }

  deleteConversation(id: string): boolean {
    this.messages.delete(id);
    return this.conversations.delete(id);
  }

  // --- Messages ---

  getMessages(conversationId: string): StoredMessage[] {
    return this.messages.get(conversationId) || [];
  }

  addMessage(msg: StoredMessage): StoredMessage {
    const msgs = this.messages.get(msg.conversationId) || [];
    msgs.push(msg);
    this.messages.set(msg.conversationId, msgs);

    // Update conversation stats
    const conv = this.conversations.get(msg.conversationId);
    if (conv) {
      conv.messageCount = msgs.length;
      conv.totalTokens += msg.inputTokens + msg.outputTokens;
      conv.totalCost += msg.cost;
      conv.updatedAt = new Date().toISOString();

      // Auto-title from first user message
      if (msg.role === 'user' && conv.title === 'New Conversation') {
        conv.title = msg.content.slice(0, 50) + (msg.content.length > 50 ? '...' : '');
      }
    }

    return msg;
  }

  // --- Usage ---

  trackUsage(userId: string, modelId: string, inputTokens: number, outputTokens: number, cost: number) {
    const key = `${userId}:${modelId}`;
    const existing = this.usage.get(key) || { modelId, tokens: 0, cost: 0, requestCount: 0 };
    existing.tokens += inputTokens + outputTokens;
    existing.cost += cost;
    existing.requestCount += 1;
    this.usage.set(key, existing);
  }

  getUsage(userId: string): { totalTokens: number; totalCost: number; byModel: UsageRecord[] } {
    const byModel: UsageRecord[] = [];
    let totalTokens = 0;
    let totalCost = 0;

    for (const [key, record] of this.usage.entries()) {
      if (key.startsWith(`${userId}:`)) {
        byModel.push(record);
        totalTokens += record.tokens;
        totalCost += record.cost;
      }
    }

    return { totalTokens, totalCost, byModel };
  }
}

// Singleton instance
export const memoryStore = new MemoryStore();
