import { pgTable, text, serial, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Global settings table - single row for app-wide defaults
export const globalSettings = pgTable("global_settings", {
  id: serial("id").primaryKey(),
  settings: jsonb("settings").$type<GlobalSettings>().default({}),
});

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

// Global settings - these are the app-wide defaults
export interface GlobalSettings {
  // Speech settings
  speechEnabled?: boolean;
  speechRate?: number;
  speechVoice?: string;
  
  // Display settings
  fontScale?: number;
  lineHeight?: number;
  highContrast?: boolean;
  readerMode?: boolean; // Default to reader mode or live mode
  showInputEcho?: boolean; // Show what the user types in the terminal
  
  // Automation settings
  triggersEnabled?: boolean;
  aliasesEnabled?: boolean;
  
  // Connection settings (defaults for new profiles)
  autoReconnect?: boolean;
  reconnectDelay?: number; // seconds
  keepAlive?: boolean;
  keepAliveInterval?: number; // seconds
}

// Profile settings - null means "use global default"
export interface ProfileSettings {
  // Speech settings (null = use global)
  speechEnabled?: boolean | null;
  speechRate?: number | null;
  speechVoice?: string | null;
  
  // Display settings (null = use global)
  fontScale?: number | null;
  lineHeight?: number | null;
  highContrast?: boolean | null;
  readerMode?: boolean | null;
  showInputEcho?: boolean | null;
  
  // Automation settings (null = use global)
  triggersEnabled?: boolean | null;
  aliasesEnabled?: boolean | null;
  
  // Connection settings (null = use global)
  autoReconnect?: boolean | null;
  reconnectDelay?: number | null;
  keepAlive?: boolean | null;
  keepAliveInterval?: number | null;
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
export const insertGlobalSettingsSchema = createInsertSchema(globalSettings);

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type GlobalSettingsRow = typeof globalSettings.$inferSelect;
export type InsertGlobalSettings = z.infer<typeof insertGlobalSettingsSchema>;

// === API TYPES ===
export type CreateProfileRequest = InsertProfile;
export type UpdateProfileRequest = Partial<InsertProfile>;
export type UpdateGlobalSettingsRequest = Partial<GlobalSettings>;

// Default global settings
export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  speechEnabled: true,
  speechRate: 1.0,
  speechVoice: undefined,
  fontScale: 1.0,
  lineHeight: 1.4,
  highContrast: false,
  readerMode: false,
  showInputEcho: true,
  triggersEnabled: true,
  aliasesEnabled: true,
  autoReconnect: true,
  reconnectDelay: 5,
  keepAlive: false,
  keepAliveInterval: 60,
};

// Merge global settings with profile overrides
// Profile values take precedence; null/undefined means use global
export function mergeSettings(global: GlobalSettings, profile: ProfileSettings): GlobalSettings {
  const result: GlobalSettings = { ...global };
  
  // Only override if profile value is not null/undefined
  for (const key of Object.keys(profile) as (keyof ProfileSettings)[]) {
    const profileValue = profile[key];
    if (profileValue !== null && profileValue !== undefined) {
      (result as Record<string, unknown>)[key] = profileValue;
    }
  }
  
  return result;
}

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
