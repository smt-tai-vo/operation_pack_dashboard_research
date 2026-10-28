# SmartOS — Maintenance dashboard prototype

React + Vite. Dữ liệu demo, không kết nối backend hoặc database.

```sh
pnpm install
pnpm dev
```

Mở địa chỉ Vite hiển thị. Chuyển PMS / MPA ở thanh trên cùng.

- **PMS — Dashboard (`#dashboard`):** hiện trạng ticket/WO, phân bố trạng thái và các nhóm cần theo dõi. Bấm KPI, thanh trạng thái hoặc từng dòng (quá hạn, chờ duyệt, tạm dừng…) để mở modal đúng danh sách.
- **PMS — Báo cáo (`#reports`):** kết quả theo kỳ, biểu đồ tiếp nhận/xử lý, SLA xử lý và hiệu quả nhân viên. Bấm số liệu, điểm biểu đồ hoặc kết quả nhân viên để xem dữ liệu chi tiết.
- Hai trang có menu riêng, hỗ trợ tải lại và Back/Forward. Bộ lọc Location/loại ticket giữ khi chuyển trang trong PMS. Kỳ ngày chỉ áp dụng cho Báo cáo; Dashboard luôn phản ánh hiện tại.
- **Phân tích Ticket Request:** Top loại sự cố xuất hiện nhiều nhất (theo ngày tạo, gồm ticket hủy), loại được xử lý nhiều nhất (theo Resolved, loại hủy/thiếu mốc hợp lệ) và Location có nhiều request nhất. Mọi biểu đồ kế thừa Location/loại ticket/kỳ và mở danh sách ticket đúng nhóm khi bấm.
- **Bố cục gọn:** hai khối Ticket/WO, mỗi khối chỉ hiển thị một lần số tạo mới, hoàn tất, SLA xử lý, Phản hồi TB và Xử lý TB. So sánh kỳ trước nằm ngay dưới số ticket tạo mới. Không có biểu đồ SLA lặp lại. Xếp hạng loại sự cố chuyển giữa Phát sinh / Xử lý thay vì hai biểu đồ giống bố cục. Các bảng chi tiết loại sự cố, workflow và staff mặc định thu gọn; bấm để mở.
- **Hiệu quả theo loại:** sắp xếp theo số mới, đã xử lý, quá hạn hoặc thời gian xử lý chậm nhất. Số mới/Resolved/SLA/thời gian dùng kỳ tương ứng; còn mở/quá hạn là hiện tại, gồm ticket cũ trong phạm vi. Các ô số liệu đều mở danh sách mẫu.
- **Workflow trên Dashboard:** số lượt đang chạy (gồm chờ), chờ WO hoàn thành, thất bại và chờ trên 24 giờ. Nhóm có thể trùng nhau. 24 giờ là ngưỡng minh họa, không phải SLA; lượt thất bại chưa phản ánh đã khắc phục lỗi hay chưa.
- **Workflow trên Báo cáo:** biểu đồ cột chồng các lượt kết thúc thành công/thất bại/hủy theo ngày; Top workflow có nhiều lượt thất bại; bảng hiệu quả từng workflow. Khoảng dài gộp ngày để giữ tối đa 14 cột và vẫn bao phủ toàn kỳ.
- Tỷ lệ thành công workflow = thành công / (thành công + thất bại), theo **thời điểm kết thúc trong kỳ**; loại hủy và lượt chưa kết thúc. Thời gian trung bình dùng lượt thành công kết thúc trong kỳ, tính cả thời gian chờ. Lượt bắt đầu và WO được tạo dùng mốc tạo tương ứng; số WO được loại trùng theo ID.
- Lọc Location/loại ticket cũng áp dụng Workflow; lượt không có loại ticket không xuất hiện khi lọc một loại cụ thể. Bấm cột biểu đồ, thanh lỗi hoặc ô số liệu mở modal đúng tập lượt chạy; bấm số WO mở danh sách WO được tạo.
- **Modal Workflow:** tìm mã run/ticket/WO, lọc workflow/trạng thái, phân trang, xuất CSV đúng kết quả lọc; mở từng lượt để xem bước hiện tại, lỗi và ticket/WO liên quan. Mở WO bằng drawer, đóng quay lại modal giữ bộ lọc. Dữ liệu lượt chạy là demo, chưa kết nối hoặc điều khiển workflow backend.
- **Modal danh sách:** tìm kiếm, lọc trạng thái/ưu tiên/nhân viên, phân trang và xuất CSV UTF-8 cho toàn bộ kết quả đang lọc. WO mở drawer chi tiết; đóng drawer giữ lại modal và bộ lọc.
- **MPA:** một trang cá nhân (`#mpa`), giữ tối đa 4 WO cần làm ở trước kết quả cá nhân. Chỉ WO đang mở, ưu tiên quá hạn/sắp đến hạn/khẩn cấp. Không có tab hay danh sách toàn bộ Công việc của tôi.
- SLA chính là SLA xử lý. WO tính từ **lần Start đầu tiên → Completed**, gồm thời gian tạm dừng; chưa Start thì chưa có hạn xử lý. Due date độc lập. Ticket phản hồi từ Submitted → Approved; SLA xử lý từ Approved → Resolved, chưa duyệt thì chưa có hạn xử lý. WO/ticket hủy loại khỏi tỷ lệ; WO lưu trữ giữ kết quả hoàn thành.
- **Thời gian trung bình:** tích hợp trong hai khối tổng quan Ticket Request và Work order, đều có Phản hồi TB / Xử lý TB và danh sách mẫu khi bấm. Ticket: phản hồi Submitted → Approved (ticket duyệt trong kỳ), xử lý Approved → Resolved (ticket Resolved trong kỳ). WO: phản hồi Created → Start đầu tiên (WO bắt đầu trong kỳ), xử lý Start đầu tiên → Completed (WO hoàn thành trong kỳ). Loại trường hợp hủy, thiếu mốc hoặc thời gian ngược; không có mẫu thì hiện “—”. CSV và modal có đủ mốc cùng thời gian từng record.
- **Bảng staff và MPA:** giữ cả Phản hồi TB và Xử lý TB. Trong dữ liệu demo, phản hồi gắn với staff Start đầu tiên; xử lý/SLA gắn với người được giao lúc hoàn thành. Đây là thời gian/SLA của WO, chưa mô phỏng thời gian riêng từng lượt phân công hay chia thời gian giữa nhiều staff.
- Dữ liệu minh họa, không kết nối backend. Mốc demo: **22/10/2026, 10:30** (giờ Việt Nam). Tải lại trang reset thao tác thử.

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
