# MQ Soft Dashboard — Tổng Quan Dự Án

> Phiên bản: v2.0.0 · 2026 | Tác giả: VanThien

---

## 1. Mục đích dự án

**MQ Soft Dashboard** là hệ thống bảng điều khiển nội bộ của công ty **MQ Soft** — đơn vị phát triển phần mềm Hệ thống Thông tin Bệnh viện (HIS). Dự án giúp Ban Giám đốc và Quản lý Dự án có cái nhìn tập trung, thời gian thực về:

- Khối lượng và tiến độ công việc của từng nhân viên theo phòng ban
- Trạng thái task trong toàn bộ pipeline (Hoàn thành / Đang làm / Chờ Test / Ưu tiên)
- Nhật ký chat Zalo từ các bệnh viện khách hàng để phân tích vấn đề hỗ trợ

Nguồn dữ liệu chính là **1Office** (phần mềm quản lý dự án của Việt Nam), truy cập thông qua REST API.

---

## 2. Cấu trúc dự án

```
DashboardMQ/
├── index.html              — Trang đăng nhập (điểm vào)
├── dashboard.html          — Dashboard chính (Task Command Center)
├── script.js               — Toàn bộ logic dashboard (~626 dòng)
├── style.css               — Giao diện Dark Mode
├── PROJECT_OVERVIEW.md     — Tài liệu mô tả dự án (file này)
├── .github/
│   └── workflows/
│       └── jekyll-gh-pages.yml  — CI/CD tự động deploy lên GitHub Pages
├── analytics/
│   ├── index.html          — Sub-app Phân Tích Hiệu Suất
│   ├── script.js           — Logic analytics (~40KB)
│   └── style.css           — Giao diện analytics
└── LogZalo/
    ├── index.html          — Sub-app Phân Tích Chat Zalo Bệnh Viện
    ├── script.js           — Logic phân tích nhật ký (~430 dòng)
    ├── rules.js            — Bộ quy tắc phân loại lỗi HIS
    ├── ai.js               — Tích hợp Gemini AI (~159 dòng)
    └── style.css           — Giao diện LogZalo
```

---

## 3. Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ | Vanilla JavaScript (ES2020+), HTML5, CSS3 |
| Kiến trúc | Static site — không cần build, không cần server |
| Thư viện | Chart.js 4.4.1 (CDN) |
| Font chữ | Space Mono, Be Vietnam Pro, Syne, JetBrains Mono |
| API ngoài | 1Office REST API, Google Sheets (JSONP), Google Gemini AI |
| Deploy | GitHub Pages (Jekyll CI/CD tự động) |
| Auth | Client-side, `localStorage`, credentials hardcoded |

> **Không có `package.json`, không có Node.js, không có build step.** Toàn bộ ứng dụng chạy trực tiếp trên trình duyệt — đây là lựa chọn có chủ đích để tránh hạn chế CORS khi mở file local.

---

## 4. Các module chính

### 4.1 Trang Đăng Nhập (`index.html`)
- Giao diện Dark Mode với hiệu ứng particle nổi động
- Kiểm tra đăng nhập hardcoded: `admin` / `mqsoft@123`
- Lưu trạng thái đăng nhập vào `localStorage.mqsoft_auth`
- Redirect về trang login nếu chưa xác thực (kiểm tra ở tất cả sub-page)

---

### 4.2 Dashboard Chính (`dashboard.html` + `script.js`)

**KPI Row — 6 chỉ số thời gian thực:**
| KPI | Mô tả |
|---|---|
| Hoàn thành hôm nay | Task kết thúc trong ngày |
| Tạo mới hôm nay | Task mới phát sinh trong ngày |
| Chờ Test | Đã commit, đang chờ QA |
| Chờ thực hiện | Trong hàng đợi |
| Đang làm | Đang triển khai |
| Ưu tiên (P!) | Task cần xử lý khẩn |

**Bảng nhân sự — 24 nhân viên, 3 phòng ban:**
- Phòng Triển Khai - Quản Lý Dự Án
- Phòng Lập Trình
- Ban Giám Đốc

**Các tính năng khác:**
- Modal xem chi tiết task của từng nhân viên (có tab filter theo trạng thái)
- Banner cảnh báo khi nhân viên bị overload
- Lọc theo phòng ban / dự án / tìm kiếm nhân viên
- Xuất CSV (UTF-8 BOM, hỗ trợ tiếng Việt trong Excel)
- Tự động làm mới mỗi 5 phút
- Đồng hồ thời gian thực trên header
- Top Performers: nhân viên hoàn thành nhiều task nhất hôm nay

---

### 4.3 Analytics / Performance Hub (`analytics/`)
Sub-app phân tích hiệu suất lịch sử, truy cập qua link "PHÂN BỔ TASK":

- Phân tích theo khoảng thời gian: 7 ngày, 30 ngày, hoặc tùy chỉnh
- Phân loại độ tuổi task: xanh (<7 ngày), vàng (7–90 ngày), đỏ (>90 ngày)
- Chế độ so sánh tuần vs. tháng
- Cùng danh sách nhân sự và API 1Office, nhưng query theo date range

---

### 4.4 LogZalo — Phân Tích Chat Zalo Bệnh Viện (`LogZalo/`)

**Mục đích:** MQ Soft hỗ trợ các bệnh viện qua nhóm Zalo. Nhật ký chat được export vào Google Sheets. LogZalo đọc các sheet đó, phân tích tần suất lỗi, và dùng AI để chẩn đoán vấn đề nghiêm trọng.

**8 bệnh viện khách hàng được tích hợp:**
1. BV Buôn Ma Thuột
2. BV ĐH Y Dược TPHCM CS2
3. BV Đa khoa Tân Tạo
4. BV Đa Khoa Nhà Bè
5. BV Đa khoa Củ Chi
6. BV Đa Khoa Bạc Liêu
7. BV An Bình
8. NỘI BỘ MQ

**Luồng dữ liệu:**
```
Google Sheets (Zalo logs) → JSONP fetch → Parse & filter → Phân tích → Hiển thị + AI
```

**Các phân tích được thực hiện:**
| Phân tích | Mô tả |
|---|---|
| Top 10 nhân viên hoạt động nhiều nhất | Theo số lượng tin nhắn |
| Top 10 lỗi thường gặp nhất | Dựa trên keyword HIS |
| Timeline hoạt động | Biểu đồ số tin nhắn theo ngày (Chart.js) |
| Repeat Patterns | Gom nhóm các tin nhắn lỗi tương tự (tối đa 15 pattern) |
| AI Analysis (Gemini) | Chẩn đoán top 3 vấn đề, nguyên nhân, kế hoạch hành động |

**`rules.js` — Bộ quy tắc phân loại:**
- ~60 keyword tiếng Việt chuyên ngành HIS xác định tin nhắn báo lỗi (`lỗi`, `bug`, `bhyt`, `kê toa`, `kho`, `mật khẩu`...)
- Keyword loại trừ: tin nhắn xác nhận đã xử lý (`đã fix`, `đã xử lý`...)
- 7 nhóm domain HIS: Viện phí/BHYT, Khám bệnh, Kho Dược, Tiếp nhận, Báo cáo, Hệ thống, Yêu cầu hỗ trợ

**`ai.js` — Tích hợp Gemini AI:**
- Model: `gemini-flash-latest`
- Input: 50 tin nhắn lỗi gần nhất + 8 pattern lặp lại hàng đầu
- Output (tiếng Việt): Top 3 vấn đề nghiêm trọng, chẩn đoán nguyên nhân, kế hoạch ưu tiên, cảnh báo rủi ro
- Xuất báo cáo: File `.doc` (Office XML) với UTF-8 BOM

---

## 5. Các quyết định thiết kế đáng chú ý

| Quyết định | Lý do |
|---|---|
| Không có build step / npm | Tránh CORS khi mở file local; đơn giản hóa deploy |
| Secrets hardcoded trong source | Tool nội bộ — chấp nhận được trong môi trường kiểm soát |
| Vietnamese-first | Toàn bộ UI, comment, tên biến business đều bằng tiếng Việt |
| GitHub Pages deployment | Tự động deploy mỗi khi push lên `main` |
| Không có framework (React/Vue) | Vanilla JS đủ dùng, không cần thêm dependency |

---

## 6. API & Tích hợp

| Service | Mục đích | Endpoint |
|---|---|---|
| 1Office | Quản lý task | `https://mqsoft.1office.vn/api/work/task/gets` |
| Google Sheets | Lưu nhật ký Zalo | `gviz/tq` JSONP endpoint |
| Google Gemini | AI phân tích chat | `gemini-flash-latest` |

---

## 7. Deploy

- **Tự động**: Push lên nhánh `main` → GitHub Actions chạy Jekyll build → Deploy lên GitHub Pages
- **Thủ công/Local**: Mở trực tiếp `index.html` trong trình duyệt (không cần server)

---

*Tài liệu được tạo tự động bởi Claude Code — 2026-04-08*
