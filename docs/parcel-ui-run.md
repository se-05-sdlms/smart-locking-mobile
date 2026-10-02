# Chạy giao diện Boxora sau đăng nhập

## Test trên máy khác

Checkout nhánh `feature/resident-parcel-ui` trong cả `smart-locking-mobile` và `smart-locking-be`.
Các đường dẫn `D:\User\Source` bên dưới là ví dụ; thay bằng thư mục checkout trên máy bạn.

Trong thư mục mobile:

```powershell
npm.cmd ci
Copy-Item .env.example .env
```

Chỉ copy `.env.example` nếu máy chưa có `.env`. Đặt `EXPO_PUBLIC_API_URL` theo BE của máy test,
và `EXPO_PUBLIC_PARCEL_DEMO=active` để xem giao diện có bưu kiện, `empty` để xem trạng thái trống.
Đăng nhập vẫn dùng tài khoản cư dân thật ở BE. Tên/địa chỉ tủ trên dữ liệu thật cần bản BE cùng nhánh.

## Đã thay đổi

- Trang chủ có bưu kiện và trạng thái trống theo ảnh tham chiếu, header cam, lịch sử gần đây.
- Giữ kiểu và tên các tab hiện tại; icon Trang chủ dùng biểu tượng khối hộp Boxora.
- Chi tiết bưu kiện có nút mở khóa và các trạng thái sẵn sàng, đang mở, gửi lệnh thành công, lỗi.
- Mở khóa thật gọi API hiện có; không đánh dấu đã nhận chỉ vì gửi lệnh thành công.
- Gửi hàng trả là form demo. Bluetooth chưa kết nối phần cứng.
- Backend `/api/residents/me` thêm `registeredLockerCode` và `registeredLockerAddress` để hiện tủ đã đăng ký cả khi tủ bảo trì. Không cần migration.

## Backend

Bản mới được chạy ở cổng 5006, tránh tiến trình cũ ở 5005. Swagger: http://localhost:5006/swagger

Khi cần khởi động lại, dừng tiến trình bản mới trước rồi chạy:

```powershell
cd D:\User\Source\smart-locking-be
dotnet build smart-locking-be.API -o .artifacts/parcel-ui-api -p:UseAppHost=false
cd smart-locking-be.API
$env:ASPNETCORE_ENVIRONMENT = "Development"
dotnet ../.artifacts/parcel-ui-api/smart-locking-be.API.dll --urls http://0.0.0.0:5006
```

Đọc cấu hình database và JWT từ appsettings hiện tại. Không chạy seed hay migration vào database khi làm giao diện.

## Mobile trong lúc phát triển

`.env` ở máy này dùng `EXPO_PUBLIC_API_URL=http://192.168.110.124:5006/api`.
Điện thoại và máy chạy BE phải cùng mạng Wi-Fi; IP này cần thay nếu máy đổi mạng.

```powershell
cd D:\User\Source\smart-locking-mobile
npx.cmd expo start --dev-client --port 8082
```

Để xem dữ liệu mẫu, đặt trong `.env` rồi khởi động lại Metro:

```dotenv
EXPO_PUBLIC_PARCEL_DEMO=active
```

- `active`: có bưu kiện mẫu, lịch sử và mở khóa mô phỏng.
- `empty`: không có bưu kiện chờ nhận, vẫn có lịch sử mẫu.
- `off`: lấy dữ liệu thật.

Đăng nhập luôn dùng BE thật. Demo không bỏ qua xác thực. Đổi chế độ không tự tạo bưu kiện trong database.

## Build APK bằng EAS

`app.json` dùng projectId `535b5783-6307-4982-a796-1aa71e988fef`, owner `wy_kowjbu` theo thông tin bạn cung cấp.
Tài khoản Expo cần quyền truy cập project. Cấu hình đã được thêm; chưa gửi build lên EAS trong phiên này.

EAS không tải `.env` của máy này trong gói upload. Cấu hình API URL cho môi trường preview một lần:

```powershell
cd D:\User\Source\smart-locking-mobile
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_API_URL --value "http://192.168.110.124:5006/api" --visibility plaintext
```

Nếu biến đã tồn tại, cập nhật giá trị trong EAS Dashboard của project, môi trường `preview`.
URL LAN này dành cho điện thoại cùng mạng với máy đang chạy BE; dùng URL HTTPS của BE đã triển khai nếu muốn dùng ngoài mạng đó.

```powershell
# APK dữ liệu thật
npx.cmd eas-cli@latest build --platform android --profile preview

# APK demo có bưu kiện
npx.cmd eas-cli@latest build --platform android --profile preview-demo

# APK demo trạng thái trống
npx.cmd eas-cli@latest build --platform android --profile preview-empty
```

APK preview chạy độc lập, không cần Metro. Profile development dùng khi cần dev client:

```powershell
npx.cmd eas-cli@latest build --platform android --profile development
```

Nếu PowerShell không tìm thấy npm/npx dù Node đã được cài tại máy này:

```powershell
$env:Path += ";C:\Program Files\nodejs"
```

## Kiểm tra

```powershell
cd D:\User\Source\smart-locking-mobile
node node_modules/typescript/bin/tsc --noEmit
node --test tests/parcel-display.test.mjs
node node_modules/expo/bin/cli export --platform android --output-dir .expo/parcel-ui-export
```

Kiểm tra trên điện thoại: đăng nhập, chuyển tab, kéo làm mới, mở chi tiết từ Trang chủ/Lịch sử, thử trạng thái trống, thử mất mạng và gửi lệnh mở khóa với tủ được phép. Chưa xác minh giao diện trên thiết bị thật, Bluetooth hoặc push notifications trong phiên này. Android push còn cần cấu hình Firebase/FCM phù hợp; projectId không thay thế cấu hình đó.
