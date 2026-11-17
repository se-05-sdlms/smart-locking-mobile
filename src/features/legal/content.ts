export const LEGAL_VERSION = "1.0";

export type LegalDocument = "terms" | "privacy";

export const legalDocuments: Record<LegalDocument, { title: string; paragraphs: string[] }> = {
  terms: {
    title: `Điều khoản sử dụng Smart Locking v${LEGAL_VERSION}`,
    paragraphs: [
      "Smart Locking cung cấp chức năng tạo và theo dõi yêu cầu gửi, nhận và trả kiện qua tủ thông minh.",
      "Người dùng phải cung cấp thông tin chính xác, bảo vệ tài khoản và không chia sẻ mã xác thực.",
      "Không gửi hàng cấm, nguy hiểm, dễ cháy nổ, trái pháp luật hoặc vượt giới hạn tủ. Người dùng chịu trách nhiệm về nội dung và tính hợp pháp của kiện hàng.",
      "Người dùng phải đóng cửa theo hướng dẫn và kiểm tra trạng thái trên ứng dụng; khi trạng thái chưa xác nhận, cần liên hệ hỗ trợ bằng mã yêu cầu thay vì tạo lượt mới.",
      "Phí, thời hạn, hủy, hoàn và xử lý sự cố được hiển thị trước khi xác nhận.",
      "Hệ thống có thể tạm dừng khi tủ, mạng hoặc nhà cung cấp gặp sự cố. Điều khoản có version và có thể được cập nhật; version áp dụng được ghi cùng consent.",
    ],
  },
  privacy: {
    title: `Chính sách bảo mật Smart Locking v${LEGAL_VERSION}`,
    paragraphs: [
      "Hệ thống có thể xử lý họ tên, số điện thoại, email, tài khoản, tủ đăng ký, mã yêu cầu, ảnh kiện/vận đơn, kết quả OCR, lịch sử thao tác và dữ liệu kỹ thuật bảo mật.",
      "Dữ liệu dùng để xác thực, tạo và theo dõi yêu cầu, tìm người nhận đúng tủ, OCR, hỗ trợ, đối soát và bảo mật.",
      "Ảnh vận đơn chỉ gửi tới dịch vụ OCR đã cấu hình khi người dùng yêu cầu; API key không nằm trên thiết bị và không ghi vào log.",
      "Dữ liệu chỉ chia sẻ cho nhân sự vận hành hoặc nhà cung cấp cần thiết theo quyền truy cập; không bán dữ liệu cá nhân.",
      "Dữ liệu lưu trong thời gian cần cho giao dịch, hỗ trợ, đối soát và nghĩa vụ pháp lý, sau đó xóa hoặc ẩn danh theo chính sách lưu trữ.",
      "Người dùng có thể yêu cầu xem, sửa, hạn chế hoặc xóa dữ liệu qua kênh hỗ trợ sau khi xác minh. Chính sách có version và yêu cầu đồng ý lại khi thay đổi mục đích xử lý hoặc nội dung quan trọng.",
    ],
  },
};
