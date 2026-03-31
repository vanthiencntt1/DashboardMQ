# MQ Soft Dashboard — Task Command Center

## 1. Giới thiệu tổng quan
**MQ Soft Dashboard** là một hệ thống bảng điều khiển (Dashboard) tập trung, được thiết kế để theo dõi và quản lý hiệu suất công việc của nhân sự thông qua dữ liệu từ API của hệ thống 1Office. Dự án này giúp Ban Giám đốc và các Quản lý Dự án có cái nhìn nhanh chóng, thời gian thực về tiến độ công việc và khối lượng tải của từng nhân viên.

## 2. Kiến trúc dự án
Dự án được xây dựng theo mô hình **Mono-file** (hợp nhất mã nguồn) để tối ưu hóa việc chạy trực tiếp trên trình duyệt mà không bị hạn chế bởi chính sách CORS khi mở file local.

- **`index.html`**: Cấu trúc giao diện chính, bao gồm các thẻ KPI, bảng nhân sự và chi tiết tác vụ.
- **`style.css`**: Hệ thống giao diện Dark Mode hiện đại, sử dụng CSS Variables để quản lý màu sắc và font chữ (`Space Mono` & `Be Vietnam Pro`).
- **`script.js`**: Chứa toàn bộ logic xử lý dữ liệu, bao gồm gọi API 1Office, quản lý trạng thái (State) và render giao diện động.

## 3. Các tính năng chính

### 📊 Hệ thống chỉ số KPI (Real-time)
Theo dõi các chỉ số quan trọng trong ngày:
- **Hoàn thành**: Số task đã kết thúc.
- **Tạo mới**: Các task mới phát sinh trong ngày.
- **Chờ Test**: Các task đã commit và đang chờ QA kiểm tra.
- **Chờ thực hiện**: Khối lượng công việc đang trong hàng đợi.
- **Đang làm**: Các công việc đang được triển khai thực tế.

### 👥 Quản lý nhân sự (Personnel Tracking)
- Danh sách nhân sự được phân chia theo phòng ban (Triển khai, Lập trình, Ban giám đốc).
- Thống kê chi tiết số lượng task của từng cá nhân theo 4 trạng thái: Chờ, Làm, Review, và Ưu tiên.
- Tính năng xem chi tiết task của từng người qua Modal.

### 🔍 Bộ lọc & Tiện ích
- **Lọc theo phòng ban**: Xem dữ liệu tập trung cho từng phòng ban cụ thể.
- **Lọc theo dự án**: Xem các task thuộc về một dự án nhất định.
- **Xuất Excel (CSV)**: Hỗ trợ xuất dữ liệu task ra file CSV để báo cáo (hỗ trợ hiển thị tiếng Việt có dấu trong Excel).
- **Đồng hồ & Tự động làm mới**: Hiển thị thời gian thực và tự động cập nhật dữ liệu sau mỗi 5 phút.

## 4. Cấu hình kỹ thuật
- **API Token**: Được nhúng trực tiếp trong code (`ACCESS_TOKEN`).
- **Endpoint**: Kết nối với `https://mqsoft.1office.vn/api/work/task/gets`.
- **CORS Handling**: Sử dụng phương pháp Fetch trực tiếp với token truy cập để lấy dữ liệu.
---
*Tài liệu được soạn thảo bởi Tiểu Mỹ (Antigravity).*
