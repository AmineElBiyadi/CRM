import apiClient from "@/lib/api-client";

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  senderName: string;
}

export async function fetchNotifications(): Promise<NotificationDto[]> {
  const res = await apiClient.get<NotificationDto[]>("/api/notifications");
  return res.data;
}

export async function markNotificationRead(id: string): Promise<NotificationDto> {
  const res = await apiClient.patch<NotificationDto>(`/api/notifications/${id}/read`);
  return res.data;
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  const res = await apiClient.post<{ updated: number }>("/api/notifications/read-all");
  return res.data;
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
