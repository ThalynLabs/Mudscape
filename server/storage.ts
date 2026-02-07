import { db } from "./db";
import {
  profiles,
  globalSettings,
  soundpacks,
  packages,
  type Profile,
  type InsertProfile,
  type UpdateProfileRequest,
  type GlobalSettings,
  type GlobalSettingsRow,
  type SoundpackRow,
  type InsertSoundpack,
  type Package,
  type InsertPackage,
  DEFAULT_GLOBAL_SETTINGS,
} from "@shared/schema";
import { users, appConfig, authTokens, type User, type UpsertUser, type AppConfig } from "@shared/models/auth";
import { eq, and, desc, sql, gt } from "drizzle-orm";

export interface IStorage {
  // Profiles
  getProfiles(): Promise<Profile[]>;
  getProfilesByUser(userId: string): Promise<Profile[]>;
  getProfile(id: number): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: number, updates: UpdateProfileRequest): Promise<Profile>;
  deleteProfile(id: number): Promise<void>;
  
  // Global Settings
  getGlobalSettings(): Promise<GlobalSettings>;
  updateGlobalSettings(updates: Partial<GlobalSettings>): Promise<GlobalSettings>;
  
  // Soundpacks
  getSoundpacks(): Promise<SoundpackRow[]>;
  getSoundpack(id: number): Promise<SoundpackRow | undefined>;
  createSoundpack(soundpack: InsertSoundpack): Promise<SoundpackRow>;
  updateSoundpack(id: number, updates: Partial<InsertSoundpack>): Promise<SoundpackRow>;
  deleteSoundpack(id: number): Promise<void>;
  
  // Packages
  getPackages(): Promise<Package[]>;
  getPackagesByUser(userId: string): Promise<Package[]>;
  getPackage(id: number): Promise<Package | undefined>;
  createPackage(pkg: InsertPackage): Promise<Package>;
  updatePackage(id: number, updates: Partial<InsertPackage>): Promise<Package>;
  deletePackage(id: number): Promise<void>;
  getSharedPackages(search?: string): Promise<Package[]>;
  incrementDownloads(id: number): Promise<void>;
  
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getUserCount(): Promise<number>;
  
  // App Config
  getAppConfig(): Promise<AppConfig | undefined>;
  createAppConfig(config: Partial<AppConfig>): Promise<AppConfig>;
  updateAppConfig(updates: Partial<AppConfig>): Promise<AppConfig>;

  // Auth Tokens
  createAuthToken(token: string, userId: string, expiresAt: Date): Promise<void>;
  getUserByToken(token: string): Promise<User | undefined>;
  deleteAuthToken(token: string): Promise<void>;
  deleteUserTokens(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Profiles
  async getProfiles(): Promise<Profile[]> {
    return await db.select().from(profiles).orderBy(profiles.name);
  }

  async getProfilesByUser(userId: string): Promise<Profile[]> {
    return await db.select().from(profiles).where(eq(profiles.userId, userId)).orderBy(profiles.name);
  }

  async getProfile(id: number): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile;
  }

  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    const [profile] = await db.insert(profiles).values(insertProfile as typeof profiles.$inferInsert).returning();
    return profile;
  }

  async updateProfile(id: number, updates: UpdateProfileRequest): Promise<Profile> {
    const [profile] = await db
      .update(profiles)
      .set(updates as Partial<typeof profiles.$inferInsert>)
      .where(eq(profiles.id, id))
      .returning();
    return profile;
  }

  async deleteProfile(id: number): Promise<void> {
    await db.delete(profiles).where(eq(profiles.id, id));
  }
  
  // Global Settings
  async getGlobalSettings(): Promise<GlobalSettings> {
    const [row] = await db.select().from(globalSettings).limit(1);
    if (!row) {
      // Initialize with defaults if no row exists
      const [newRow] = await db.insert(globalSettings)
        .values({ settings: DEFAULT_GLOBAL_SETTINGS })
        .returning();
      return newRow.settings ?? DEFAULT_GLOBAL_SETTINGS;
    }
    // Merge with defaults to ensure all keys exist
    return { ...DEFAULT_GLOBAL_SETTINGS, ...(row.settings ?? {}) };
  }
  
  async updateGlobalSettings(updates: Partial<GlobalSettings>): Promise<GlobalSettings> {
    const current = await this.getGlobalSettings();
    const merged = { ...current, ...updates };
    
    // Get or create the row
    const [row] = await db.select().from(globalSettings).limit(1);
    if (!row) {
      const [newRow] = await db.insert(globalSettings)
        .values({ settings: merged })
        .returning();
      return newRow.settings ?? merged;
    }
    
    const [updated] = await db
      .update(globalSettings)
      .set({ settings: merged })
      .where(eq(globalSettings.id, row.id))
      .returning();
    return updated.settings ?? merged;
  }
  
  // Soundpacks
  async getSoundpacks(): Promise<SoundpackRow[]> {
    return await db.select().from(soundpacks).orderBy(soundpacks.name);
  }
  
  async getSoundpack(id: number): Promise<SoundpackRow | undefined> {
    const [soundpack] = await db.select().from(soundpacks).where(eq(soundpacks.id, id));
    return soundpack;
  }
  
  async createSoundpack(insertSoundpack: InsertSoundpack): Promise<SoundpackRow> {
    const [soundpack] = await db.insert(soundpacks).values(insertSoundpack as typeof soundpacks.$inferInsert).returning();
    return soundpack;
  }
  
  async updateSoundpack(id: number, updates: Partial<InsertSoundpack>): Promise<SoundpackRow> {
    const [soundpack] = await db
      .update(soundpacks)
      .set(updates as Partial<typeof soundpacks.$inferInsert>)
      .where(eq(soundpacks.id, id))
      .returning();
    return soundpack;
  }
  
  async deleteSoundpack(id: number): Promise<void> {
    await db.delete(soundpacks).where(eq(soundpacks.id, id));
  }
  
  // Packages
  async getPackages(): Promise<Package[]> {
    return await db.select().from(packages).orderBy(packages.name);
  }

  async getPackagesByUser(userId: string): Promise<Package[]> {
    return await db.select().from(packages).where(eq(packages.userId, userId)).orderBy(packages.name);
  }
  
  async getPackage(id: number): Promise<Package | undefined> {
    const [pkg] = await db.select().from(packages).where(eq(packages.id, id));
    return pkg;
  }
  
  async createPackage(insertPackage: InsertPackage): Promise<Package> {
    const [pkg] = await db.insert(packages).values(insertPackage as typeof packages.$inferInsert).returning();
    return pkg;
  }

  async updatePackage(id: number, updates: Partial<InsertPackage>): Promise<Package> {
    const [pkg] = await db
      .update(packages)
      .set({ ...updates, updatedAt: new Date() } as Partial<typeof packages.$inferInsert>)
      .where(eq(packages.id, id))
      .returning();
    return pkg;
  }
  
  async deletePackage(id: number): Promise<void> {
    await db.delete(packages).where(eq(packages.id, id));
  }

  async getSharedPackages(search?: string): Promise<Package[]> {
    if (search) {
      const term = `%${search.toLowerCase()}%`;
      return await db
        .select()
        .from(packages)
        .where(
          and(
            eq(packages.isShared, true),
            sql`(LOWER(${packages.name}) LIKE ${term} OR LOWER(COALESCE(${packages.targetMud}, '')) LIKE ${term} OR LOWER(COALESCE(${packages.author}, '')) LIKE ${term})`
          )
        )
        .orderBy(desc(packages.downloads), packages.name);
    }
    return await db
      .select()
      .from(packages)
      .where(eq(packages.isShared, true))
      .orderBy(desc(packages.downloads), packages.name);
  }

  async incrementDownloads(id: number): Promise<void> {
    await db
      .update(packages)
      .set({ downloads: sql`COALESCE(${packages.downloads}, 0) + 1` } as any)
      .where(eq(packages.id, id));
  }
  
  // Users
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.username);
  }
  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(insertUser: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }
  
  async getUserCount(): Promise<number> {
    const result = await db.select().from(users);
    return result.length;
  }
  
  // App Config
  async getAppConfig(): Promise<AppConfig | undefined> {
    const [config] = await db.select().from(appConfig).limit(1);
    return config;
  }
  
  async createAppConfig(config: Partial<AppConfig>): Promise<AppConfig> {
    const [created] = await db.insert(appConfig).values(config as typeof appConfig.$inferInsert).returning();
    return created;
  }
  
  async updateAppConfig(updates: Partial<AppConfig>): Promise<AppConfig> {
    const existing = await this.getAppConfig();
    if (!existing) {
      return this.createAppConfig(updates);
    }
    const [updated] = await db
      .update(appConfig)
      .set(updates as Partial<typeof appConfig.$inferInsert>)
      .where(eq(appConfig.id, existing.id))
      .returning();
    return updated;
  }

  // Auth Tokens
  async createAuthToken(token: string, userId: string, expiresAt: Date): Promise<void> {
    await db.insert(authTokens).values({ token, userId, expiresAt });
  }

  async getUserByToken(token: string): Promise<User | undefined> {
    const [row] = await db
      .select()
      .from(authTokens)
      .where(and(eq(authTokens.token, token), gt(authTokens.expiresAt, new Date())));
    if (!row) return undefined;
    return this.getUser(row.userId);
  }

  async deleteAuthToken(token: string): Promise<void> {
    await db.delete(authTokens).where(eq(authTokens.token, token));
  }

  async deleteUserTokens(userId: string): Promise<void> {
    await db.delete(authTokens).where(eq(authTokens.userId, userId));
  }
}

export const storage = new DatabaseStorage();
