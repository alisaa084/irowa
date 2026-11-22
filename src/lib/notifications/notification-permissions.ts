// src/lib/notifications/notification-permissions.ts
import { isPushNotificationSupported } from "./notification-utils";

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    throw new Error("Push notifications are not supported by this browser.");
  }

  // If already granted, return directly to prevent mobile browser glitches
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    return "granted";
  }

  // Handle both Promise-based and callback-based requestPermission across mobile browsers
  try {
    const result = await Notification.requestPermission();
    if (result) return result;
  } catch {
    // Fallback for mobile browsers expecting a callback
  }

  return new Promise((resolve) => {
    try {
      Notification.requestPermission((status) => resolve(status));
    } catch {
      resolve(Notification.permission || "denied");
    }
  });
}

export function getNotificationPermissionStatus(): NotificationPermission {
  if (!isPushNotificationSupported()) return "denied";
  return Notification.permission;
}
