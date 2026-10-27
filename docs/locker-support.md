# Liên hệ hỗ trợ tại tủ

Phụ thuộc backend PR #207 (BE #187), cùng quyền phụ trách có hiệu lực của BE #195.

Thẻ hỗ trợ có tại trang chủ cư dân (tủ đã đăng ký), chi tiết kiện hàng, yêu cầu giao, trả hàng và sự cố. Thẻ chỉ hiển thị liên hệ công việc được công khai hoặc hướng dẫn dự phòng do quản trị viên cấu hình, không đọc số điện thoại tài khoản.

Liên hệ được tải lại khi mở màn hình, quay lại ứng dụng, nhận cập nhật dữ liệu, mỗi phút và trước khi gọi. Người dùng có thể tải lại thủ công. Khi ngoài giờ hoặc chưa có người hỗ trợ, thẻ hiển thị hướng dẫn dự phòng; số không khả dụng không có nút gọi.

Các thao tác sao chép gồm số công khai và mã tủ/mã bản ghi giao dịch. Không truyền mã nhận hàng, mã OTP hoặc token vào thẻ.

Sao chép dùng expo-clipboard phiên bản tương thích Expo 57 (~57.0.2); cần build native mới để kiểm tra trên thiết bị. Chưa xác nhận gọi điện, clipboard hay API đang chạy trên thiết bị trong PR này.
