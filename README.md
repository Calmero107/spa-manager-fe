# Spa Manager – Frontend

Giao diện quản lý vận hành spa, kết nối với [spa-manager-be](https://github.com/Calmero107/spa-manager-be) qua REST API.

---

## Công nghệ sử dụng

| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| React | 19 | Thư viện giao diện |
| TypeScript | 6 | Kiểu dữ liệu tĩnh |
| Vite | 8 | Build tool & dev server |
| React Router | 7 | Định tuyến SPA |
| TanStack Query | 5 | Quản lý state server |
| React Hook Form | 7 | Quản lý form |
| Zod | 4 | Validate dữ liệu |
| Tailwind CSS | 4 | Styling |
| Axios | 1.15 | HTTP client |

---

## Cấu trúc thư mục

```
src/
├── app/                    # Router, layout chính, Dashboard, ProtectedRoute
├── components/
│   ├── layout/             # AppShell (sidebar + header)
│   └── ui/                 # Component dùng chung (PageCard, StatusBadge,
│                             LoadingSpinner, ErrorAlert, EmptyState, Tabs)
├── features/
│   ├── auth/               # Đăng nhập, phân quyền, quản lý tài khoản
│   ├── customer/           # Quản lý khách hàng
│   ├── appointment/        # Chi tiết & vòng đời lịch hẹn
│   ├── treatment-plan/     # Liệu trình điều trị
│   ├── scheduling/         # Đặt lịch & bảng lịch hẹn
│   ├── dashboard/          # API tổng quan hoạt động
│   ├── service/            # Danh mục dịch vụ
│   ├── staff/              # Quản lý nhân viên
│   └── resource/           # Phòng, thiết bị, kỹ năng, yêu cầu dịch vụ
├── lib/                    # Axios instance, helper, storage
├── types/                  # TypeScript type dùng chung
├── main.tsx                # Entry point
└── index.css               # Tailwind base styles
```

---

## Tính năng chính

### Xác thực & phân quyền
- Đăng nhập qua `/auth/login`, bootstrap phiên bằng `/auth/me`.
- Protected route theo vai trò: **Owner**, **Manager**, **Receptionist**, **Therapist**.
- Đổi mật khẩu, quản lý tài khoản nhân viên (chỉ Owner/Manager).

### Dashboard tổng quan
- Thống kê lịch hẹn, buổi dịch vụ, liệu trình theo ngày.
- Danh sách lịch hẹn sắp tới & buổi chưa đặt lịch.
- Khối lượng công việc theo nhân viên và phòng.

### Quản lý khách hàng
- Danh sách, tạo mới, xem chi tiết khách hàng.
- Ghi chú, cờ cảnh báo, lịch sử giao dịch và audit log.

### Liệu trình điều trị
- Tạo liệu trình theo dịch vụ, quản lý vòng đời (Bản nháp → Hoạt động → Tạm dừng → Hoàn thành / Hủy).
- Tìm kiếm, lọc, xem timeline audit.

### Lịch hẹn & đặt lịch
- Đặt lịch hẹn: chọn slot, khóa slot, chọn nhân viên & phòng.
- Bảng lịch hẹn vận hành (Scheduling Board) với bộ lọc và thao tác nhanh.
- Vòng đời lịch hẹn: Chờ → Xác nhận → Check-in → Hoàn thành / Hủy / Vắng mặt.

### Quản lý tài nguyên
- Nhân viên, dịch vụ, phòng, thiết bị.
- Kỹ năng nhân viên và yêu cầu dịch vụ.

---

## Cài đặt & chạy

### Yêu cầu
- Node.js ≥ 18
- Backend [spa-manager-be](https://github.com/Calmero107/spa-manager-be) đang chạy

### Các bước

```bash
# 1. Clone repo
git clone https://github.com/Calmero107/spa-manager-fe.git
cd spa-manager-fe

# 2. Tạo file cấu hình môi trường
cp .env.example .env

# 3. Cài dependencies
npm install

# 4. Chạy dev server
npm run dev
```

Ứng dụng sẽ mở tại `http://localhost:5173`.

### Biến môi trường

| Biến | Mô tả | Mặc định |
|---|---|---|
| `VITE_API_BASE_URL` | URL gốc của backend API | `http://localhost:8080/api/v1` |

### Scripts

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy dev server |
| `npm run build` | Build production |
| `npm run preview` | Preview bản build |
| `npm run lint` | Kiểm tra linting |

---

## Tài khoản mặc định

Sử dụng dữ liệu seed từ backend:

| Tài khoản | Mật khẩu | Vai trò |
|---|---|---|
| `owner1` | `password` | Owner |

---

## Ghi chú

- Frontend yêu cầu backend đã chạy và seed dữ liệu sẵn.
- Thông tin chi nhánh, nhân viên, phiên làm việc được lấy từ dữ liệu xác thực — không sử dụng UUID mặc định.
- Giao diện được Việt hóa toàn bộ.
