export function profileErrors(
  fullName: string,
  dateOfBirth: string,
  avatarUrl: string
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!fullName.trim() || fullName.trim().length > 150)
    errors.fullName = "Họ tên cần từ 1 đến 150 ký tự.";
  if (dateOfBirth) {
    const date = new Date(`${dateOfBirth}T00:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) ||
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== dateOfBirth ||
      dateOfBirth > new Date().toISOString().slice(0, 10)
    ) {
      errors.dateOfBirth = "Nhập ngày hợp lệ dạng YYYY-MM-DD, không ở tương lai.";
    }
  }
  if (avatarUrl.trim()) {
    try {
      const url = new URL(avatarUrl.trim());
      if (!["https:", "http:"].includes(url.protocol) || avatarUrl.trim().length > 2048)
        throw new Error();
    } catch {
      errors.avatarUrl = "Nhập URL ảnh HTTP/HTTPS hợp lệ, tối đa 2048 ký tự.";
    }
  }
  return errors;
}

export function passwordErrors(
  current: string,
  next: string,
  confirm: string
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!current) errors.current = "Nhập mật khẩu hiện tại.";
  if (next.length < 8) errors.next = "Mật khẩu mới cần ít nhất 8 ký tự.";
  else if (next === current) errors.next = "Mật khẩu mới phải khác mật khẩu hiện tại.";
  if (confirm !== next) errors.confirm = "Xác nhận mật khẩu chưa khớp.";
  return errors;
}
