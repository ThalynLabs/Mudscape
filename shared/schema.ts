import { pgTable, text, serial, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
// We store profiles on the server so the user can access them from any device (Self-hosted goal)
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g. "Achaea", "Discworld"
  host: text("host").notNull(),
  port: integer("port").notNull(),
  encoding: text("encoding").default("ISO-8859-1"), // MUD default
  settings: jsonb("settings").$type<ProfileSettings>().default({}), // UI prefs, accessibility overrides
  triggers: jsonb("triggers").$type<MudTrigger[]>().default([]),
  aliases: jsonb("aliases").$type<MudAlias[]>().default([]),
  scripts: jsonb("scripts").$type<MudScript[]>().default([]),
});

// === TYPE DEFINITIONS ===

export interface ProfileSettings {
  fontScale?: number;
  lineHeight?: number;
  highContrast?: boolean;
  speechEnabled?: boolean;
  speechRate?: number;
  speechVoice?: string;
  readerMode?: boolean; // Default to reader mode or live mode
}

export interface MudTrigger {
  id: string;
  pattern: string;
  type: 'regex' | 'plain';
  script: string; // JavaScript code to execute
  active: boolean;
}

export interface MudAlias {
  id: string;
  pattern: string; // e.g. "^tt (.*)$"
  command: string; // "tell target $1"
  active: boolean;
}

export interface MudScript {
  id: string;
  name: string;
  content: string;
  active: boolean;
}

// === SCHEMAS ===
export const insertProfileSchema = createInsertSchema(profiles);

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

// === API TYPES ===
export type CreateProfileRequest = InsertProfile;
export type UpdateProfileRequest = Partial<InsertProfile>;

// === WEBSOCKET TYPES ===
// Messages between Frontend and Relay Server
export type WsClientMessage =
  | { type: 'connect'; host: string; port: number; encoding?: string }
  | { type: 'disconnect' }
  | { type: 'send'; data: string }; // User command

export type WsServerMessage =
  | { type: 'connected'; host: string; port: number }
  | { type: 'disconnected'; reason?: string }
  | { type: 'data'; content: string; raw?: boolean } // Content is ANSI text
  | { type: 'error'; message: string };
