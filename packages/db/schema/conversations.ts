import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  numeric,
  boolean,
  timestamp,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const chatModeEnum = pgEnum('chat_mode', ['single', 'dual', 'multi']);

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    title: text('title').default('New Conversation').notNull(),
    mode: chatModeEnum('mode').default('single').notNull(),
    modelIds: text('model_ids').array().notNull().default([]),
    messageCount: integer('message_count').default(0).notNull(),
    totalTokens: bigint('total_tokens', { mode: 'number' }).default(0).notNull(),
    totalCost: numeric('total_cost', { precision: 10, scale: 6 }).default('0').notNull(),
    pinned: boolean('pinned').default(false).notNull(),
    archived: boolean('archived').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_conversations_user_id').on(table.userId),
    index('idx_conversations_updated').on(table.updatedAt),
  ]
);

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
