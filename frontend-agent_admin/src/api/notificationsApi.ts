import { apiFetch } from "@/utils/api";

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  senderName: string;
}

export async function fetchNotifications(): Promise<NotificationDto[]> {
  return apiFetch("/api/notifications") as Promise<NotificationDto[]>;
}

export async function markNotificationRead(id: string): Promise<NotificationDto> {
  return apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" }) as Promise<NotificationDto>;
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  return apiFetch("/api/notifications/read-all", { method: "POST" }) as Promise<{ updated: number }>;
}

export function formatNotificationTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "hier";
  return `il y a ${diffD}j`;
}

export function mapNotificationDto(n: NotificationDto) {
  return {
    id: n.id,
    title: n.title,
    body: n.message,
    time: formatNotificationTime(n.createdAt),
    read: n.read,
    senderName: n.senderName,
  };
}
