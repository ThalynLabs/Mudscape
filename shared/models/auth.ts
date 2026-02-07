import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, boolean, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table - supports both Replit Auth and local authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Replit Auth fields
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Local auth fields
  username: varchar("username").unique(),
  passwordHash: varchar("password_hash"),
  isAdmin: boolean("is_admin").default(false),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// App configuration - installation settings
export const appConfig = pgTable("app_config", {
  id: serial("id").primaryKey(),
  // Account mode: 'single' = one user, no login; 'multi' = multiple users with login
  accountMode: varchar("account_mode").default("multi"),
  // Whether new user registration is allowed
  registrationEnabled: boolean("registration_enabled").default(true),
  // App name for branding
  appName: varchar("app_name").default("Mudscape"),
  // Whether initial setup is complete
  installed: boolean("installed").default(false),
});

export const authTokens = pgTable("auth_tokens", {
  token: varchar("token").primaryKey(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const insertAppConfigSchema = createInsertSchema(appConfig);

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type AppConfig = typeof appConfig.$inferSelect;
export type InsertAppConfig = z.infer<typeof insertAppConfigSchema>;
export type AuthToken = typeof authTokens.$inferSelect;
