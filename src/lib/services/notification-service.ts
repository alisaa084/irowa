// src/lib/services/notification-service.ts
import { createClient, isSupabaseConfigured } from "../supabase/client";
import { NotificationRow, AnnouncementRow } from "@/types/notification";

export const MOCK_NOTIFICATIONS: NotificationRow[] = [];

export const MOCK_ANNOUNCEMENTS: AnnouncementRow[] = [];

export async function getNotifications(visitorId?: string): Promise<NotificationRow[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  try {
    const supabase = createClient();
    const query = supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error || !data) {
      return [];
    }
    return data as NotificationRow[];
  } catch {
    return [];
  }
}

export async function getAnnouncements(): Promise<AnnouncementRow[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error || !data) {
      return [];
    }
    return data as AnnouncementRow[];
  } catch {
    return [];
  }
}
