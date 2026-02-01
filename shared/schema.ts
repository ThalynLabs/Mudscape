import { pgTable, text, serial, jsonb, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// Re-export chat models for AI integration
export * from "./models/chat";

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
  description: text("description"), // Optional description for the MUD
  host: text("host").notNull(),
  port: integer("port").notNull(),
  encoding: text("encoding").default("ISO-8859-1"), // MUD default
  autoConnect: boolean("auto_connect").default(false), // Connect on app start
  characterName: text("character_name"), // Character name for login
  characterPassword: text("character_password"), // Character password for login (encrypted in future)
  loginCommands: text("login_commands"), // Commands to send after connecting (one per line)
  settings: jsonb("settings").$type<ProfileSettings>().default({}), // UI prefs, accessibility overrides
  triggers: jsonb("triggers").$type<MudTrigger[]>().default([]),
  aliases: jsonb("aliases").$type<MudAlias[]>().default([]),
  scripts: jsonb("scripts").$type<MudScript[]>().default([]),
  timers: jsonb("timers").$type<MudTimer[]>().default([]),
  keybindings: jsonb("keybindings").$type<MudKeybinding[]>().default([]),
  buttons: jsonb("buttons").$type<MudButton[]>().default([]),
  classes: jsonb("classes").$type<MudClass[]>().default([]),
  variables: jsonb("variables").$type<MudVariables>().default({}),
  activeSoundpackId: text("active_soundpack_id"), // Currently active soundpack
});

// Soundpacks table for storing sound collections
export const soundpacks = pgTable("soundpacks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  files: jsonb("files").$type<SoundpackFile[]>().default([]),
});

// Packages table for bundling automation items
export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  version: text("version").default("1.0.0"),
  author: text("author"),
  contents: jsonb("contents").$type<PackageContents>().default({}),
});

// Package contents - what's bundled in a package
export interface PackageContents {
  triggers?: MudTrigger[];
  aliases?: MudAlias[];
  timers?: MudTimer[];
  keybindings?: MudKeybinding[];
  buttons?: MudButton[];
  scripts?: MudScript[];
  classes?: MudClass[];
}

// === TYPE DEFINITIONS ===

// Global settings - these are the app-wide defaults
export interface GlobalSettings {
  // Speech settings
  speechEnabled?: boolean;
  speechRate?: number;
  speechVolume?: number;
  speechPitch?: number;
  speechVoice?: string;
  // Speech interrupt behaviors
  interruptOnKeypress?: boolean;
  interruptOnSend?: boolean;
  interruptOnIncoming?: boolean;
  
  // Display settings
  fontScale?: number;
  lineHeight?: number;
  highContrast?: boolean;
  readerMode?: boolean; // Default to reader mode or live mode
  showInputEcho?: boolean; // Show what the user types in the terminal
  keepInputOnSend?: boolean; // Don't clear input field after sending command
  stripSymbols?: boolean; // Remove decorative symbols for screen readers
  
  // Automation settings
  triggersEnabled?: boolean;
  aliasesEnabled?: boolean;
  commandPrefix?: string; // Prefix for client commands (default: '/')
  
  // Connection settings (defaults for new profiles)
  autoReconnect?: boolean;
  reconnectDelay?: number; // seconds
  keepAlive?: boolean;
  keepAliveInterval?: number; // seconds
  
  // GMCP settings
  gmcpEnabled?: boolean;
}

// Profile settings - null means "use global default"
export interface ProfileSettings {
  // Speech settings (null = use global)
  speechEnabled?: boolean | null;
  speechRate?: number | null;
  speechVolume?: number | null;
  speechPitch?: number | null;
  speechVoice?: string | null;
  // Speech interrupt behaviors (null = use global)
  interruptOnKeypress?: boolean | null;
  interruptOnSend?: boolean | null;
  interruptOnIncoming?: boolean | null;
  
  // Display settings (null = use global)
  fontScale?: number | null;
  lineHeight?: number | null;
  highContrast?: boolean | null;
  readerMode?: boolean | null;
  showInputEcho?: boolean | null;
  keepInputOnSend?: boolean | null;
  stripSymbols?: boolean | null;
  
  // Automation settings (null = use global)
  triggersEnabled?: boolean | null;
  aliasesEnabled?: boolean | null;
  commandPrefix?: string | null;
  
  // Connection settings (null = use global)
  autoReconnect?: boolean | null;
  reconnectDelay?: number | null;
  keepAlive?: boolean | null;
  keepAliveInterval?: number | null;
  
  // Prompt detection - pattern that identifies the MUD's command prompt
  promptPattern?: string | null;
  
  // GMCP settings (null = use global)
  gmcpEnabled?: boolean | null;
}

export interface MudTrigger {
  id: string;
  pattern: string;
  type: 'regex' | 'plain';
  script: string; // Lua code to execute
  classId?: string; // Optional class grouping
  active: boolean;
  // Multi-line trigger options
  multiLine?: boolean; // Match across multiple lines
  lineCount?: number; // Number of lines to buffer (2-20)
  lineDelimiter?: string; // How to join lines for matching (default: "\n")
  // Gag option
  gag?: boolean; // Automatically hide matching lines (no script needed)
  // Sound options
  soundFile?: string; // Sound to play when triggered
  soundVolume?: number; // 0-1
  soundLoop?: boolean;
}

export interface MudAlias {
  id: string;
  pattern: string; // e.g. "^tt (.*)$"
  command: string; // "tell target $1" or Lua script
  isScript?: boolean; // If true, command is Lua script
  classId?: string; // Optional class grouping
  active: boolean;
}

export interface MudScript {
  id: string;
  name: string;
  content: string; // Lua code
  classId?: string;
  active: boolean;
}

export interface MudTimer {
  id: string;
  name: string;
  interval: number; // milliseconds
  oneShot: boolean; // if true, fires once then disables
  script: string; // Lua code to execute
  classId?: string;
  active: boolean;
}

export interface MudKeybinding {
  id: string;
  key: string; // e.g. "F1", "Ctrl+Shift+A"
  command: string; // Command to send or Lua script
  isScript: boolean; // If true, command is Lua; if false, it's a MUD command
  classId?: string;
  active: boolean;
}

export interface MudButton {
  id: string;
  label: string; // Display text on button
  command: string; // Command to send or Lua script
  isScript: boolean; // If true, command is Lua; if false, it's a MUD command
  color?: string; // Optional color class for styling
  icon?: string; // Optional Lucide icon name
  classId?: string;
  active: boolean;
}

// Class for grouping triggers/aliases/scripts
export interface MudClass {
  id: string;
  name: string;
  active: boolean;
}

// Variables stored per-profile for scripting
export interface MudVariables {
  [key: string]: string | number | boolean | null;
}

// Soundpack for audio
export interface SoundpackFile {
  id: string;
  name: string; // MSP name mapping, e.g. "sword_hit"
  filename: string; // actual file path
  category: 'effect' | 'music' | 'ambient';
  volume: number; // default volume 0-1
  loop: boolean; // default loop setting
}

export interface Soundpack {
  id: string;
  name: string;
  files: SoundpackFile[];
}

// === SCHEMAS ===
export const insertProfileSchema = createInsertSchema(profiles);
export const insertGlobalSettingsSchema = createInsertSchema(globalSettings);
export const insertSoundpackSchema = createInsertSchema(soundpacks);
export const insertPackageSchema = createInsertSchema(packages);

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type GlobalSettingsRow = typeof globalSettings.$inferSelect;
export type InsertGlobalSettings = z.infer<typeof insertGlobalSettingsSchema>;

export type SoundpackRow = typeof soundpacks.$inferSelect;
export type InsertSoundpack = z.infer<typeof insertSoundpackSchema>;

export type Package = typeof packages.$inferSelect;
export type InsertPackage = z.infer<typeof insertPackageSchema>;

// === API TYPES ===
export type CreateProfileRequest = InsertProfile;
export type UpdateProfileRequest = Partial<InsertProfile>;
export type UpdateGlobalSettingsRequest = Partial<GlobalSettings>;

// Default global settings
export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  speechEnabled: true,
  speechRate: 1.0,
  speechVolume: 1.0,
  speechPitch: 1.0,
  speechVoice: undefined,
  interruptOnKeypress: false,
  interruptOnSend: true,
  interruptOnIncoming: false,
  fontScale: 1.0,
  lineHeight: 1.4,
  highContrast: false,
  readerMode: false,
  showInputEcho: true,
  keepInputOnSend: false,
  stripSymbols: false,
  triggersEnabled: true,
  aliasesEnabled: true,
  commandPrefix: '/',
  autoReconnect: true,
  reconnectDelay: 5,
  keepAlive: false,
  keepAliveInterval: 60,
  gmcpEnabled: true,
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
  | { type: 'connect'; host: string; port: number; encoding?: string; gmcp?: boolean }
  | { type: 'disconnect' }
  | { type: 'send'; data: string }
  | { type: 'gmcp'; module: string; data: unknown }; // Send GMCP message

export type WsServerMessage =
  | { type: 'connected'; host: string; port: number }
  | { type: 'disconnected'; reason?: string }
  | { type: 'data'; content: string; raw?: boolean } // Content is ANSI text
  | { type: 'gmcp'; module: string; data: unknown } // GMCP data from server
  | { type: 'error'; message: string };
