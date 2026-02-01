import { db } from "./db";
import {
  profiles,
  globalSettings,
  soundpacks,
  type Profile,
  type InsertProfile,
  type UpdateProfileRequest,
  type GlobalSettings,
  type GlobalSettingsRow,
  type SoundpackRow,
  type InsertSoundpack,
  DEFAULT_GLOBAL_SETTINGS,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Profiles
  getProfiles(): Promise<Profile[]>;
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
}

export class DatabaseStorage implements IStorage {
  // Profiles
  async getProfiles(): Promise<Profile[]> {
    return await db.select().from(profiles).orderBy(profiles.name);
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
}

export const storage = new DatabaseStorage();
