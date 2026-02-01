import { Profile } from "@shared/schema";

export interface MudConnection {
  id: string;
  profileId: number;
  profile: Profile;
  isConnected: boolean;
  lines: string[];
  unreadCount: number;
}

export interface ConnectionTab {
  id: string;
  profileId: number;
  profileName: string;
  isConnected: boolean;
  unreadCount: number;
}

export function createConnectionId(profileId: number): string {
  return `conn-${profileId}-${Date.now()}`;
}
