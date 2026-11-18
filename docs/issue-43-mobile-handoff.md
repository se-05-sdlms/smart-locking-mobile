# Issue #43 — Hoàn thiện resident UI, phạm vi mobile

Issue: https://github.com/se-05-sdlms/smart-locking-mobile/issues/43

Tiếp tục trên `dev2-design` từ commit `0588b61` theo yêu cầu trực tiếp của người dùng. Không tạo nhánh khác, không quay về `dev`/`main`. Người dùng đã giới hạn phạm vi ở code mobile: không xử lý backend/database/seed, không chạy test, lint/typecheck, build hay device QA trong lượt này.

## Thiết kế

Giữ canvas trắng `#FFFFFF`, surface neutral `#F6F7F9`, border `#E7E9ED`, text `#171717`, fill/icon cam `#EA580C`, orange soft `#FFF1E8`. Chữ cam dùng `--link: #C2410C`; native tab label dùng `accentText`, icon tab vẫn dùng `accent`. Dark theme giữ canvas `#111214`, surface `#1B1D21`, text cam `#FB923C`.

Không thay đồng loạt fill/icon cam bằng cam tối. CTA vẫn có nền cam; foreground trên fill cam chuyển sang charcoal để tăng contrast cho nhãn cỡ thường. Thay đổi này nằm ở semantic token dùng chung, không đổi bố cục auth. Badge sử dụng soft foreground theo theme HeroUI.

```text
Home:       featured Card nhẹ → compact ListGroup + divider → CTA gửi đồ phụ
Settings:   navigation row → một mô tả thông báo → RadioGroup Hệ thống/Sáng/Tối
Package:    Surface gói hiện tại → RadioGroup option gọn → benefit chung → checkout
Profile:    thông tin tĩnh dạng View; điều hướng dạng ListGroup.Item + chevron
Return:     camera Card + FieldError → TextField → Surface tủ → Alert lỗi → CTA
```

Giữ typography HeroUI, khoảng cách và radius của design system hiện có. Các row/action chính có target tối thiểu khoảng 48dp; option theme wrap khi không đủ chiều ngang. Radio indicator, nhãn “Đã đọc/Chưa đọc”, title/copy bổ sung selected/read state để không phụ thuộc riêng màu sắc.

## Thay đổi mobile

- Home: featured Card border neutral và bỏ shadow; compact parcels thành ListGroup với divider, role/label điều hướng. “Gửi đồ” dùng CTA secondary. Refresh không đồng thời hiển thị skeleton toàn màn; có khóa request và giữ dữ liệu cũ khi refresh thất bại.
- Settings: bỏ hai Switch disabled giả chức năng và hai dòng mô tả lặp. Thay bằng một thông tin trung tính, không khẳng định permission hệ điều hành đang được bật. Theme dùng RadioGroup, indicator, selected/focus/disabled state; giữ cơ chế SecureStore rồi áp dụng theme khi lưu thành công, khóa thao tác đồng thời.
- Package: giữ RadioGroup và selection thuần local. Option chỉ có tên, giá/thời hạn, hạn mức khác biệt và indicator; unselected có neutral border. Benefit lưu miễn phí chuyển ra ghi chú chung. Description nguyên bản của gói được chọn xuất hiện bên dưới, không sửa hoặc suy đoán dấu. Current package dùng Surface secondary; không thay payment safeguards, pending checkout, price confirmation hay API subscribe.
- Profile: static information dùng View, icon muted, caption và giá trị; không còn disabled Pressable. Navigation row có role/label, feedback, chevron và target tối thiểu. Thêm reload profile và khóa thay đổi chế độ nhận hàng trong khi đang tải/lưu.
- New Return: camera Card giữ nguyên vai trò media group; permission chỉ xử lý khi bấm camera. Lỗi camera/thiếu ảnh dùng FieldError; lỗi upload/create dùng Alert, giữ ảnh/ghi chú. “Tủ sử dụng” thành Surface compact. Có trạng thái upload/create, khóa request, cache URL của ảnh đã upload trong lần mở form để retry tạo yêu cầu không upload lại ảnh cũ. Luồng tạo yêu cầu → mở ngăn → hoàn tất và API contract giữ nguyên.
- History/Send: giữ SearchField/Tabs và row/divider, thêm label/role; copy phân biệt không có lịch sử, không tìm thấy và lỗi. Mô tả Send rút gọn. Search/filter tiếp tục áp dụng trên các trang đã tải; empty copy nói rõ có thể tải thêm khi còn dữ liệu cũ.
- Notifications: list item với accent-soft ở unread, divider và nhãn “Đã đọc/Chưa đọc”. Title/date không cạnh tranh chiều rộng. Chạm row mở Dialog đọc toàn bộ title/message có thể scroll; “Mở mục liên quan” dùng chính navigation target cũ. Đây là thay đổi tương tác để nội dung dài luôn đọc được. Mark-read vẫn optimistic, có rollback, lỗi và retry; khóa request theo ID.
- Parcel detail: metadata/timeline dùng hierarchy nhẹ hơn với Surface; reason giữ nguyên từ API, hiển thị riêng và selectable. Có retry tải detail và ngăn response cũ cập nhật sau khi route/revision đổi.
- Shared feedback: Skeleton gần shape row; empty có heading/copy; Alert có semantic error và retry. Lỗi pagination tách khỏi lỗi initial/refresh, xuất hiện compact ở footer và retry đúng trang bị lỗi, giữ rows đã tải. Feed khóa request song song; không reset về trang đầu khi chỉ retry pagination.

## Lỗi tiếng Việt: chưa đánh dấu hoàn tất

Chưa có payload/record thực tế được kiểm tra trong môi trường này. Không kết luận mobile, API serialization hay database là root cause. Không sửa backend/DB/seed hoặc tạo backend issue theo giới hạn phạm vi mới nhất của người dùng.

Đã bỏ đổi câu riêng trong notification title và mapping free-text reason của timeline; mobile hiển thị chính chuỗi nhận được. Không thêm `.replace()` để sửa dấu, không bỏ dấu, không thêm fallback che dữ liệu lỗi. Dấu `?` thay thế ký tự gốc không chứa đủ thông tin để mobile khôi phục chính xác.

Thêm chẩn đoán **tắt mặc định**, chỉ chạy khi `__DEV__` và `EXPO_PUBLIC_DEBUG_TEXT_ENCODING=true`. Chẩn đoán tại thời điểm `response.json()` đã decode, trước khi trả dữ liệu cho UI, chỉ với:

- `/subscription-plans`: name/description.
- `/notifications` và từng notification: title/message.
- `/parcels/{id}/history`: reason.

Log có endpoint không chứa query, record ID, field, content-type, sample tối đa 240 code points và code points của tối đa 64 ký tự đầu; giới hạn tổng 20 sample riêng biệt mỗi lần mở app. Không log headers, request body, token hoặc toàn bộ response. Sample thông báo có thể chứa nội dung cá nhân: chỉ bật có chủ đích trong development, giữ capture local hoặc redact trước khi chia sẻ.

Chẩn đoán này không kiểm tra raw response bytes hoặc DB và không tự chứng minh nguyên nhân upstream. Nó cung cấp evidence ở biên JSON → UI cho người có môi trường thực hiện tiếp. Nếu sample đã có U+003F giữa từ/U+FFFD, cần đối chiếu raw HTTP và dữ liệu gốc ở môi trường đó. Nếu sample Unicode đúng mà UI sai, điều tra tiếp render/font/platform. Các cờ nghi vấn chỉ là heuristic, không thay đổi text.

## Bàn giao

Đã format source và rà diff; **không chạy test/lint/typecheck/Expo Doctor/build/device QA** theo yêu cầu. Test harness API client chỉ được cập nhật mock cho import chẩn đoán mới; không chạy test suite. Không có screenshots hoặc xác nhận TalkBack, contrast đo trên thiết bị, font scale, keyboard hay native Dialog trong lượt này.

Người nhận bàn giao cần kiểm tra các state initial loading/refresh/load-more/empty/error/retry; light/dark, viewport 360dp, font scale lớn, TalkBack, RadioGroup persistence, notification đầy đủ/rollback và Return camera/upload failure. Kiểm tra checkout pending/price confirmation bằng môi trường test, tránh thanh toán thật. Lỗi Unicode từ payload và root-cause evidence vẫn là phần chưa hoàn tất của #43.

Không thêm/nâng dependency, đổi toolchain, prebuild hoặc sửa native Android. Không commit skills local/AGENTS.md/artifact review.
