import {
  pgTable,
  uuid,
  text,
  bigint,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const tierEnum = pgEnum('tier', ['free', 'pro', 'team', 'enterprise']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkId: text('clerk_id').unique().notNull(),
  email: text('email').unique().notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  tier: tierEnum('tier').default('free').notNull(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id'),
  tokenLimit: bigint('token_limit', { mode: 'number' }).default(50000).notNull(),
  tokensUsed: bigint('tokens_used', { mode: 'number' }).default(0).notNull(),
  billingPeriodStart: timestamp('billing_period_start', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
