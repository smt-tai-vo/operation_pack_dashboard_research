# SmartOS — Maintenance dashboard prototype

React + Vite. Dữ liệu demo, không kết nối backend hoặc database.

```sh
pnpm install
pnpm dev
```

Mở địa chỉ Vite hiển thị. Chuyển PMS / MPA ở thanh trên cùng.

- **PMS:** một dashboard duy nhất, gồm số liệu hiện tại, công việc cần xử lý, biểu đồ theo kỳ, SLA Ticket/WO, tải công việc và SLA nhân viên.
- **MPA:** một dashboard cá nhân duy nhất, gồm số việc đang phụ trách, lượt được giao / hoàn thành trong kỳ, SLA phản hồi / xử lý và tối đa 4 WO cần làm (chỉ WO đang mở, ưu tiên quá hạn / sắp đến hạn / khẩn cấp); bấm WO để xem và thao tác. Không có tab Công việc của tôi hoặc danh sách toàn bộ WO.
- Filter Location áp dụng cho toàn dashboard; khoảng thời gian áp dụng cho kết quả trong kỳ, biểu đồ và SLA. Các KPI tồn đọng luôn phản ánh hiện trạng.
- File xuất là CSV UTF-8, mở được bằng Excel.
- SLA nhân viên trong prototype tính theo từng lượt phân công: phản hồi từ lúc giao đến hành động đầu tiên; xử lý từ lúc giao đến hoàn thành, bao gồm thời gian tạm dừng. Mục tiêu thời gian lấy từ WO. Đây là giả định để xem thử UI, chưa phải chức năng backend đã triển khai.
- WO hủy được tách khỏi kết quả hoàn thành; WO đóng để lưu trữ giữ kết quả hoàn thành trước đó.
- Mốc dữ liệu demo: 22/10/2026 lúc 10:30 (giờ Việt Nam). Tải lại trang để reset các thao tác thử.

## GitHub Pages

`base: './'` hỗ trợ repo path trên GitHub Pages. Điều hướng dùng React state, không cần cấu hình SPA fallback.

1. Đẩy project này vào repository GitHub riêng với nhánh `main`.
2. Settings → Pages → Source: **GitHub Actions**.
3. Workflow `Deploy dashboard to GitHub Pages` build và deploy thư mục `dist`.

```sh
pnpm build
pnpm preview
```

Chưa tạo repository hoặc publish từ prototype này.
