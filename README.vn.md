<p align="center">
  <img src="./docs/images/readme-header.png" alt="Ứng dụng Mobile tủ khóa thông minh Boxora" width="100%" />
</p>

<p align="center">
  <img
    src="./docs/images/boxora-header.gif"
    alt="Boxora"
    width="560"
  />
</p>

<p align="center">
  <strong>Ngôn ngữ:</strong>
  <a href="./README.vn.md">🇻🇳 Tiếng Việt</a>
  &nbsp;|&nbsp;
  <a href="./README.md">🇬🇧 English</a>
</p>

<h3 align="center">
  📱 Resident Mobile App của SDLMS
</h3>

<p align="center">
  Nền tảng quản lý giao nhận bưu kiện thông minh, kết nối thời gian thực và tích hợp IoT.
</p>

<p align="center">
  <img
    src="https://img.shields.io/badge/Mobile-Flutter_3.22-02569B?style=flat-square&logo=flutter&logoColor=white"
    alt="Mobile Flutter 3.22"
  />
  <img
    src="https://img.shields.io/badge/Language-Dart_3.4-0175C2?style=flat-square&logo=dart&logoColor=white"
    alt="Language Dart 3.4"
  />
  <img
    src="https://img.shields.io/badge/Backend-.NET_8-512BD4?style=flat-square&logo=dotnet&logoColor=white"
    alt="Backend .NET 8"
  />
  <img
    src="https://img.shields.io/badge/Realtime-SignalR-512BD4?style=flat-square"
    alt="Realtime SignalR"
  />
  <img
    src="https://img.shields.io/badge/Notifications-Firebase_FCM-FFCA28?style=flat-square&logo=firebase&logoColor=black"
    alt="Firebase Cloud Messaging"
  />
  <img
    src="https://img.shields.io/badge/State-BLoC-40B5A4?style=flat-square"
    alt="BLoC State Management"
  />
</p>

<p align="center">
  <a href="#quick-start"><img src="https://img.shields.io/badge/B%E1%BA%AFt_%C4%91%E1%BA%A7u_nhanh-Xem-2ea44f?style=for-the-badge" alt="Bắt đầu nhanh" /></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/C%C3%B4ng_ngh%E1%BB%87-Xem-0969da?style=for-the-badge" alt="Công nghệ" /></a>
  <a href="#architecture"><img src="https://img.shields.io/badge/Ki%E1%BA%BFn_tr%C3%BAc-Xem-8250df?style=for-the-badge" alt="Kiến trúc" /></a>
  <a href="#related-repositories"><img src="https://img.shields.io/badge/Repo_li%C3%AAn_quan-Xem-e85d04?style=for-the-badge" alt="Repo liên quan" /></a>
  <a href="#development-team"><img src="https://img.shields.io/badge/Nh%C3%B3m_ph%C3%A1t_tri%E1%BB%83n-Xem-DB2777?style=for-the-badge" alt="Nhóm phát triển" /></a>
</p>

## Tổng quan

`smart-locking-mobile` là Resident Mobile App của hệ thống Boxora, cho phép cư dân và người dùng văn phòng quản lý việc giao nhận bưu kiện, nhận thông báo, lấy hàng và tương tác từ xa với tủ thông minh được chỉ định.

### Các màn hình chính

* **Authentication** — đăng ký và đăng nhập cư dân bằng số điện thoại và OTP.
* **Home Dashboard** — hiển thị tổng quan bưu kiện, thông báo và các cập nhật quan trọng của tủ.
* **Danh sách bưu kiện** — hiển thị bưu kiện đang hoạt động, đã hoàn thành, quá hạn và lịch sử.
* **Chi tiết bưu kiện** — hiển thị thông tin bưu kiện, trạng thái lưu trữ, ngăn tủ và phương thức nhận hàng.
* **Nhận bưu kiện** — hỗ trợ Personal QR Code, One-Time Password và Remote App Unlock.
* **Thông báo** — nhận cập nhật bưu kiện và trạng thái tủ qua Firebase Cloud Messaging.
* **Tùy chọn giao hàng** — cho phép cư dân cấu hình chế độ phê duyệt giao hàng Auto hoặc Manual.
* **Hồ sơ & Cài đặt** — quản lý thông tin cư dân, thiết lập bảo mật và tùy chọn ứng dụng.

---

<a id="quick-start"></a>

<details open>
<summary><strong>🚀 Bắt đầu nhanh</strong></summary>

### Yêu cầu

* Flutter SDK 3.22
* Dart SDK 3.4+
* Android Studio hoặc Visual Studio Code
* Android emulator, iOS simulator hoặc thiết bị thật
* Xcode để phát triển iOS trên macOS

### Cài đặt

```bash
git clone https://github.com/se-05-sdlms/smart-locking-mobile
cd smart-locking-mobile
flutter pub get
```

### Cấu hình

Cấu hình URL của Backend API và SignalR Hub theo phương thức cấu hình được sử dụng trong source code.

```env
# NGƯỜI DÙNG CẦN ĐIỀN đúng tên biến từ source code
API_BASE_URL=
SIGNALR_HUB_URL=
```

Thêm file cấu hình Firebase cho các nền tảng cần sử dụng:

```text
android/app/google-services.json
ios/Runner/GoogleService-Info.plist
```

### Chạy môi trường phát triển

```bash
flutter run
```

Hoặc chọn thiết bị cụ thể:

```bash
flutter devices
flutter run -d <DEVICE_ID>
```

* App target: Android, iOS, emulator, simulator hoặc thiết bị thật
* Backend URL: cập nhật theo môi trường Backend local hoặc đã deploy

</details>

<a id="tech-stack"></a>

<details open>
<summary><strong>🧰 Công nghệ</strong></summary>

| Nhóm                    | Công nghệ                            |
| ----------------------- | ------------------------------------ |
| Framework               | Flutter 3.22                         |
| Language                | Dart 3.4+                            |
| Architecture            | Clean Architecture                   |
| State management        | BLoC                                 |
| Networking              | Dio                                  |
| Realtime                | SignalR Client cho Flutter           |
| Push notification       | Firebase Cloud Messaging             |
| Local storage           | Theo implementation của project      |
| Testing                 | Flutter Test, BLoC Test, Mockito      |
| Nền tảng hỗ trợ         | Android, iOS                         |

</details>

<a id="architecture"></a>

<details open>
<summary><strong>🏗️ Kiến trúc</strong></summary>

```mermaid
flowchart TD
    subgraph Mobile["📱 Resident Mobile App"]
        P["Presentation Layer<br/>Screens · Widgets · BLoC"]
        D["Domain Layer<br/>Entities · Use Cases · Repository Interfaces"]
        I["Data Layer<br/>Dio · SignalR Client · Data Sources"]
        N["Notification Layer<br/>Firebase Cloud Messaging"]
    end

    B["⚙️ ASP.NET Core Web API<br/>.NET 8 · JWT · SignalR"]
    DB[("🗄️ PostgreSQL Database<br/>Supabase · Audit Logs")]
    E["📡 EMQX MQTT Broker<br/>MQTT v5.0"]
    F["🔌 ESP32 Locker Controller<br/>ESP32 WROOM 32D"]
    G["🔒 Phần cứng tủ<br/>Khóa điện tử · Relay · Cảm biến cửa"]
    FCM["🔔 Firebase Cloud Messaging"]

    P --> D
    D --> I

    I -->|"(1) HTTPS / REST API / JWT"| B
    B -.->|"(2) SignalR thời gian thực"| I
    B -->|"(3) Push Notification"| FCM
    FCM --> N

    B <-->|"(4) Entity Framework Core"| DB
    B <-->|"(5) MQTT Publish / Subscribe<br/>Server-side"| E
    E <-->|"(6) MQTT qua Wi-Fi / Internet"| F
    F -->|"(7) Điều khiển và đọc trạng thái"| G

    style P fill:#dbeafe,stroke:#2563eb,stroke-width:2px
    style D fill:#fef3c7,stroke:#d97706,stroke-width:2px
    style I fill:#dcfce7,stroke:#16a34a,stroke-width:2px
    style N fill:#fffbeb,stroke:#f59e0b,stroke-width:2px
    style B fill:#ede9fe,stroke:#7c3aed,stroke-width:2px
    style DB fill:#f3e8ff,stroke:#9333ea,stroke-width:2px
    style E fill:#ccfbf1,stroke:#0f766e,stroke-width:2px
    style F fill:#ffedd5,stroke:#ea580c,stroke-width:2px
    style G fill:#fee2e2,stroke:#dc2626,stroke-width:2px
    style FCM fill:#fef9c3,stroke:#ca8a04,stroke-width:2px
```

Mobile App giao tiếp với Backend thông qua REST API, JWT và SignalR. Ứng dụng nhận push notification qua Firebase Cloud Messaging, không kết nối trực tiếp đến PostgreSQL, MQTT Broker hoặc thiết bị ESP32.

</details>

<details open>
<summary><strong>🔐 Biến môi trường</strong></summary>

Cấu hình ứng dụng theo phương thức quản lý môi trường được triển khai trong source code.

```env
# NGƯỜI DÙNG CẦN ĐIỀN đúng tên biến từ source code
API_BASE_URL=
SIGNALR_HUB_URL=
```

Cấu hình Firebase theo từng nền tảng:

```text
android/app/google-services.json
ios/Runner/GoogleService-Info.plist
```

Không commit production credential, signing file, private key hoặc cấu hình môi trường nhạy cảm lên Git.

</details>

<details>
<summary><strong>🧪 Build, test và format</strong></summary>

```bash
# Cài đặt dependency
flutter pub get

# Phân tích source code
flutter analyze

# Chạy toàn bộ test
flutter test

# Kiểm tra format
dart format --output=none --set-exit-if-changed .

# Build Android APK
flutter build apk --release

# Build Android App Bundle
flutter build appbundle --release

# Build iOS trên macOS
flutter build ios --release
```

</details>

<details>
<summary><strong>📁 Cấu trúc dự án</strong></summary>

```text
smart-locking-mobile/
├── docs/
│   └── images/
│       └── readme-header.png
├── android/
├── ios/
├── assets/
├── lib/
│   ├── core/
│   ├── features/
│   ├── shared/
│   └── main.dart
├── test/
├── pubspec.yaml
├── README.vn.md
└── README.md
```

</details>

<a id="related-repositories"></a>

<details open>
<summary><strong>🔗 Repo và tài liệu liên quan</strong></summary>

| Thành phần           | Liên kết                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| GitHub Organization  | [se-05-sdlms](https://github.com/se-05-sdlms)                                                        |
| Frontend             | [smart-locking-fe](https://github.com/se-05-sdlms/smart-locking-fe)                                  |
| Backend              | [smart-locking-be](https://github.com/se-05-sdlms/smart-locking-be)                                  |
| Tài liệu dự án       | [Google Drive](https://drive.google.com/drive/folders/1M3OPsm2NxAi7WnAfsKgV4MQEMRy5rOsa?usp=sharing) |

</details>

<a id="development-team"></a>

<details open>
<summary><strong>👥 Nhóm phát triển</strong></summary>

* **Mã dự án:** `SDLMS`
* **Nhóm:** `SE_05`

### Giảng viên hướng dẫn

| Họ và tên            | Vai trò              | Email                                       |
| -------------------- | -------------------- | ------------------------------------------- |
| ThS. Lê Thị Bích Tra | Giảng viên hướng dẫn | [traltb@fe.edu.vn](mailto:traltb@fe.edu.vn) |

### Thành viên

| MSSV     | Họ và tên            | Vai trò     | Email                                                             |
| -------- | -------------------- | ----------- | ----------------------------------------------------------------- |
| DE180519 | Nguyễn Phan Huy      | Trưởng nhóm | [huynpde180519@fpt.edu.vn](mailto:huynpde180519@fpt.edu.vn)       |
| DE180405 | Phan Thành Vương     | Thành viên  | [vuongptde180405@fpt.edu.vn](mailto:vuongptde180405@fpt.edu.vn)   |
| DE180313 | Võ Văn Hài           | Thành viên  | [haivvde180313@fpt.edu.vn](mailto:haivvde180313@fpt.edu.vn)       |
| DE180393 | Trần Minh Cường      | Thành viên  | [cuongtmde180393@fpt.edu.vn](mailto:cuongtmde180393@fpt.edu.vn)   |
| DE181072 | Trương Hà Thùy Trang | Thành viên  | [trangthtde181072@fpt.edu.vn](mailto:trangthtde181072@fpt.edu.vn) |

</details>
