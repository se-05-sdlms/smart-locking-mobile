export function dueLabel(deadline: string, now = Date.now()): string {
  const remaining = Date.parse(deadline) - now;
  if (!Number.isFinite(remaining)) return "Chưa có hạn nhận";
  if (remaining <= 0) return "Đã quá hạn";
  if (remaining < 86400000) return `Còn ${Math.ceil(remaining / 3600000)} giờ`;
  return `Còn ${Math.ceil(remaining / 86400000)} ngày`;
}

export function unlockLabel(state: string, demo: boolean): string {
  if (state === "sent") return demo ? "Đã mở (demo)" : "Đã gửi lệnh mở";
  if (state === "opening") return "Đang mở…";
  if (state === "failed") return "Mở thất bại";
  return "Sẵn sàng";
}

export const parcelDate = (value: string): string =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));

export const parcelStatusLabel = (status: string): string =>
  ({ Stored: "Đang lưu trữ", Overdue: "Quá hạn", Retrieved: "Đã nhận", Removed: "Đã chuyển kho" })[
    status
  ] ?? status;
