// src/lib/services/push-dispatch-service.ts
import webpush from "web-push";
import { createAdminClient } from "../supabase/admin";

export async function sendPushNotificationToSubscribers(payload: {
  title: string;
  body: string;
  url?: string;
}): Promise<{ success: boolean; deliveredCount: number; error?: string }> {
  try {
    const publicKey =
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const privateKey =
      process.env.VAPID_PRIVATE_KEY || process.env.FIREBASE_VAPID_PRIVATE_KEY;
    const subject =
      process.env.VAPID_SUBJECT || process.env.NEXT_PUBLIC_APP_URL || "mailto:admin@irowa.gov.ph";

    if (!publicKey || !privateKey || publicKey.includes("your-") || privateKey.includes("your-") || publicKey.includes("placeholder")) {
      console.warn("VAPID keys not configured in environment variables. Web push skipped.");
      return { success: true, deliveredCount: 0 };
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const admin = createAdminClient();
    const { data: subs, error } = await admin.from("push_subscriptions").select("*");

    if (error || !subs || subs.length === 0) {
      return { success: true, deliveredCount: 0 };
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/home",
    });

    let delivered = 0;
    const promises = subs.map(async (sub) => {
      try {
        const subData = (sub.subscription_data || {
          endpoint: sub.endpoint,
          keys: sub.keys,
        }) as webpush.PushSubscription;

        await webpush.sendNotification(subData, notificationPayload);
        delivered++;
      } catch (err: any) {
        // If subscription has expired or is invalid (404/410), remove from database
        if (err.statusCode === 410 || err.statusCode === 404) {
          try {
            await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          } catch {}
        }
      }
    });

    await Promise.allSettled(promises);
    return { success: true, deliveredCount: delivered };
  } catch (err: any) {
    console.warn("Error sending web push notifications:", err);
    return { success: false, deliveredCount: 0, error: err.message };
  }
}
