import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  numeric,
  date,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const usageDaily = pgTable(
  'usage_daily',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    modelId: text('model_id').notNull(),
    date: date('date').notNull(),
    requestCount: integer('request_count').default(0).notNull(),
    inputTokens: bigint('input_tokens', { mode: 'number' }).default(0).notNull(),
    outputTokens: bigint('output_tokens', { mode: 'number' }).default(0).notNull(),
    totalCost: numeric('total_cost', { precision: 10, scale: 6 }).default('0').notNull(),
  },
  (table) => [
    unique('uq_usage_user_model_date').on(table.userId, table.modelId, table.date),
    index('idx_usage_user_date').on(table.userId, table.date),
  ]
);

export type UsageDaily = typeof usageDaily.$inferSelect;
export type NewUsageDaily = typeof usageDaily.$inferInsert;
