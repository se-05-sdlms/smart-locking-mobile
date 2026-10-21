# Issue #42: đánh giá source và bàn giao dev2-design

Issue: https://github.com/se-05-sdlms/smart-locking-mobile/issues/42

Base: `origin/dev`, commit `11d33c2`. Implementation: `dev2-design`.

## Đánh giá tính đúng đắn của issue

| Nhận định                           | Đối chiếu source tại base                                                                                                                                       |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canvas resident ngả kem/nâu         | Đúng: CSS light background có sắc ấm; SafeAreaView còn hard-code `#fbf8f3` và dark `#100d0b`, đè lên màu theme.                                                 |
| Home badge có thể overflow          | Có cơ sở: mã kiện và badge cùng một hàng, mã chưa truncate và container chưa giới hạn co giãn. Chưa tái hiện trên thiết bị 720 px; pixel vật lý khác layout dp. |
| Switch Settings không hoạt động     | Đúng: hai switch luôn selected, không có handler hoặc persistence cho từng loại thông báo.                                                                      |
| Lịch sử thanh toán giả empty state  | Đúng: màn hình không gọi API. Contract mobile hiện có chỉ expose tạo và đọc từng giao dịch, chưa expose API liệt kê.                                            |
| CTA “Nhận hàng” đi sai nơi          | Đúng: action về `/`; PaymentTransaction không có parcel ID để suy ra đích nhận hàng an toàn.                                                                    |
| Refresh lỗi mạng làm logout         | Đúng: catch refresh luôn clear session. Startup auth cũng clear session với mọi lỗi tải profile.                                                                |
| Thiếu camera permission             | Đúng ở form báo sự cố; form gửi đồ đã request permission.                                                                                                       |
| Conditional render auth field       | Đúng về pattern: `error` là string nhưng dùng `error && ...`. Đã đổi sang ternary; không khẳng định đã tái hiện crash.                                          |
| Tab scaffold thiếu lifecycle native | Đúng: `Slot` cùng `router.replace` thay vì navigator có state riêng cho từng tab.                                                                               |
| Danh sách render toàn bộ            | Đúng: History, Send, Notifications, Delivery Requests, Incidents dùng map trong ScrollView.                                                                     |
| Ảnh cần expo-image                  | Hợp lý nhưng dev chưa có dependency. Người dùng đã duyệt riêng `expo-image ~57.0.5`, theo bundledNativeModules của SDK đang cài.                                |
| Profile toàn card bo lớn            | Chỉ đúng một phần: base đã dùng ListGroup transparent; giữ cấu trúc row này, sửa nền và mục chưa khả dụng.                                                      |
| Gói ở signup chỉ advisory           | Đúng: lựa chọn chỉ lưu local sau đăng ký, chưa mua gói. Loại picker khỏi signup; mua gói vẫn ở Tài khoản.                                                       |

## Quyết định thiết kế và thay đổi

HeroUI Native vẫn là bộ component mặc định, Uniwind là styling, GravityIcon là nguồn icon hiện có. Auth giữ bố cục và ảnh nền; chỉ sửa field error, OTP và bước chọn gói.

Canvas light trắng `#FFFFFF`, surface phụ `#F6F7F9`, divider `#E7E9ED`, text `#171717`, brand accent `#EA580C`, orange soft `#FFF1E8`. Dark chuyển sang neutral `#111214`/`#1B1D21`. CSS semantic tokens và palette native cùng dùng các giá trị này. Giữ typography HeroUI; spacing ngang 20, row gap 12 và section gap 24 làm chuẩn.

Hierarchy resident:

```text
Home                    History / Send           Profile / Settings
Logo      Thông báo      Tiêu đề / action          Danh tính / tiêu đề
Đồ cần nhận              Tìm kiếm / bộ lọc         Nhóm chức năng
[Kiện ưu tiên + CTA]     Row + divider             Row + divider
Kiện phụ                Row + divider             Control có trạng thái thật
Promo gửi đồ            Tải thêm                   Giao diện / đăng xuất
──────────── 4 native tabs: Trang chủ · Lịch sử · Gửi đồ · Tài khoản ────────────
```

- Home: mã kiện truncate giữa, badge nằm trên dòng riêng có thể wrap; kéo để tải lại, refresh khi quay lại tab, không nuốt lỗi tải yêu cầu giao hàng.
- Native tabs theo API SDK 57, back history; detail sử dụng native stack header. Icon tab là PNG nhiều mật độ xuất từ path GravityIcon đang có, không thêm bộ icon mới.
- FlatList cho History, Send, Notifications, Delivery Requests, Incidents và lịch sử đăng ký gói. Feed có trạng thái loading/error/empty/content, refresh và tải thêm khi response có metadata phân trang; API trả array được xem là danh sách hoàn chỉnh.
- Tìm kiếm/lọc History và lọc Send/Notifications áp dụng trên các trang đã tải; nút Tải thêm vẫn xuất hiện khi còn trang, kể cả trang hiện tại không có kết quả phù hợp.
- Ảnh resident dùng expo-image qua ParcelImage: memory/disk cache, placeholder, lỗi ảnh rõ ràng, recycling key và reset lỗi khi URI/item thay đổi.
- Hai notification switch bị disable kèm giải thích; không giả lập preference mà backend chưa hỗ trợ. Entry lịch sử thanh toán bị ẩn khỏi Profile; deep link cũ giải thích tính năng chưa khả dụng.
- CTA giao dịch về Home được ghi đúng “Về trang chủ”. Không suy đoán parcel ID từ overdue charge ID.
- Refresh single-flight được giữ, tránh refresh lần nữa với 401 đến muộn từ access token cũ. Chỉ expire khi server từ chối refresh: 401/403 hoặc 400 với thông báo `Invalid refresh token.` theo AuthController/AuthService hiện có. Network/timeout/429/5xx giữ session; ApiError expose retryable.
- Startup auth giữ user từ SecureStore khi profile tạm không tải được. Không đổi nơi lưu token.
- Camera báo sự cố check/request permission khi người dùng bấm thêm ảnh; permission bị chặn có action mở Cài đặt, lỗi mở camera có thông báo và draft được giữ.
- Form gửi đồ/báo sự cố có KeyboardAvoidingView trên iOS; Android giữ resize mode đang có. Scroll container dùng automatic insets; tránh cộng thêm top safe area trên iOS khi native header/scroll inset đã xử lý.
- OTP resend có cooldown 60 giây, loading/disabled và ref chống request đồng thời.

## Bàn giao kiểm thử

Theo yêu cầu mới nhất của người dùng, bàn giao code để người khác clone và test: **chưa chạy typecheck/lint/Expo Doctor, test suite, native build hoặc device smoke test cho bản thay đổi này**. Chưa có before/after screenshots hoặc xác nhận TalkBack, font scale lớn, keyboard và back behavior trên thiết bị. Lệnh baseline trước khi sửa đã bị gián đoạn; không dùng làm bằng chứng pass.

Đã thêm test source `tests/api-client.test.cjs` cho refresh thành công, 401/403/400 invalid-token, lỗi mạng và recovery, timeout, 503, nhiều request 401 đồng thời và 401 đến muộn. Test chưa chạy. Người nhận bàn giao có thể chạy:

```powershell
npm ci
npm run test:session
npm run typecheck
npm run lint
npx expo-doctor
```

Cần kiểm thử native APK với expo-image được link vào binary mới, không dùng binary cũ chưa có module. Kiểm tra Home/History/Send/Profile/Settings và detail/payment ở light/dark, layout hẹp, mã dài, large font, TalkBack, back/tab state, refresh/pagination, network failure/recovery và camera granted/denied/permanently denied. Không uninstall app khi signature mismatch mà chưa được người dùng đồng ý. Việc build phải theo cấu hình native của người nhận bàn giao; nhánh base không track thư mục Android.

Không đổi backend/API contract, không prebuild/regenerate Android, không nâng toolchain hoặc dependency khác. Local skills, AGENTS.md và artifact review không nằm trong commit. Các API chưa có contract mobile được xử lý bằng UX trung thực thay vì mock dữ liệu production.
