import type { IncidentStatus } from "@/features/incidents/types";

export function incidentStatusLabel(status: IncidentStatus): string {
  return {
    0: "Đã tiếp nhận",
    1: "Đang xử lý",
    2: "Đã giải quyết",
    3: "Đã chuyển cấp",
  }[status];
}

export function incidentStatusTone(
  status: IncidentStatus
): "success" | "warning" | "danger" | "default" {
  if (status === 2) return "success";
  if (status === 1) return "warning";
  if (status === 3) return "danger";
  return "default";
}
