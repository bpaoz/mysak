import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  platform: text("platform").notNull(), // 'web' | 'messenger'
  messages: jsonb("messages").notNull().default(sql`'[]'::jsonb`),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const botResponses = pgTable("bot_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  intent: text("intent").notNull(),
  keywords: jsonb("keywords").notNull().default(sql`'[]'::jsonb`),
  responseAr: text("response_ar").notNull(),
  responseFr: text("response_fr").notNull(),
  category: text("category").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const facebookSettings = pgTable("facebook_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageAccessToken: text("page_access_token"),
  verifyToken: text("verify_token"),
  webhookUrl: text("webhook_url"),
  isActive: boolean("is_active").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatStats = pgTable("chat_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(),
  totalConversations: text("total_conversations").notNull().default("0"),
  resolvedQueries: text("resolved_queries").notNull().default("0"),
  balanceInquiries: text("balance_inquiries").notNull().default("0"),
  averageResponses: text("average_responses").notNull().default("0"),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBotResponseSchema = createInsertSchema(botResponses).omit({
  id: true,
  createdAt: true,
});

export const insertFacebookSettingsSchema = createInsertSchema(facebookSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertChatStatsSchema = createInsertSchema(chatStats).omit({
  id: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type BotResponse = typeof botResponses.$inferSelect;
export type InsertBotResponse = z.infer<typeof insertBotResponseSchema>;
export type FacebookSettings = typeof facebookSettings.$inferSelect;
export type InsertFacebookSettings = z.infer<typeof insertFacebookSettingsSchema>;
export type ChatStats = typeof chatStats.$inferSelect;
export type InsertChatStats = z.infer<typeof insertChatStatsSchema>;

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
  language?: 'ar' | 'fr';
}

export interface ServiceIntent {
  intent: string;
  confidence: number;
  category: 'balance' | 'recharge' | 'plans' | 'support' | 'general';
}
