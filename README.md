# Hệ thống quản lý đơn hàng, ví nội bộ và quầy dịch vụ

## 1. Giới thiệu dự án

Dự án này là một hệ thống quản lý **người dùng, ví nội bộ, nạp tiền, quầy dịch vụ, đơn hàng, hoa hồng, hỗ trợ khách hàng và thông báo**.

Mục tiêu của hệ thống là:

* Cho phép khách hàng đăng ký và sử dụng tài khoản trong hệ thống.
* Cho phép khách hàng nạp tiền vào **ví nội bộ**.
* Cho phép khách hàng dùng số dư ví để tạo đơn tại các **quầy dịch vụ**.
* Mỗi quầy có nhiều loại dịch vụ/đơn, mỗi dịch vụ có quy tắc riêng như số tiền tối thiểu và tỷ lệ hoa hồng.
* Khi đơn hàng hoàn thành, hệ thống tính toán và cộng **hoa hồng** vào ví nội bộ của khách hàng.
* Hệ thống có **supporter** để xử lý đơn, duyệt nạp tiền và hỗ trợ người dùng.
* Hệ thống có **admin** để quản trị dữ liệu, giám sát hoạt động và cấu hình nghiệp vụ.

> Lưu ý: Dự án **không liên quan đến tài khoản ngân hàng**. Toàn bộ tiền trong hệ thống được quản lý qua **ví nội bộ**.

---

## 2. Vai trò trong hệ thống

### 2.1. Customer (User)

Là khách hàng sử dụng hệ thống.

Customer có thể:

* Đăng ký, đăng nhập.
* Xem và cập nhật hồ sơ cá nhân.
* Xem ví nội bộ.
* Gửi tin nhắn cho chăm sóc khách hàng để yêu cầu nạp tiền.
* Chọn quầy và dịch vụ để tạo đơn.
* Theo dõi trạng thái đơn hàng.
* Nhận hoa hồng vào ví khi đơn hoàn thành.
* Xem lịch sử hoạt động và thông báo.
* Nhắn tin với supporter.

### 2.2. Supporter

Là nhân viên hỗ trợ khách hàng.

Supporter có thể:

* Tiếp nhận tin nhắn hỗ trợ và yêu cầu nạp tiền từ user.
* Kiểm tra thông tin nạp tiền và chuyển yêu cầu cho admin xử lý.
* Xử lý đơn hàng.
* Cập nhật trạng thái đơn hàng theo từng giai đoạn.
* Nhắn tin, phản hồi người dùng.
* Theo dõi lịch sử xử lý đơn hàng.

### 2.3. Admin

Là người quản trị hệ thống.

Admin có thể:

* Quản lý tài khoản người dùng.
* Quản lý quầy và dịch vụ của từng quầy.
* Quản lý supporter.
* Theo dõi đơn hàng toàn hệ thống.
* Xác nhận hoặc từ chối yêu cầu nạp tiền.
* Theo dõi nạp tiền, số dư ví, hoa hồng.
* Xem dashboard thống kê.
* Gửi thông báo hệ thống.

---

## 3. Các module chính của hệ thống

### 3.1. Authentication & User Management

Phần này phụ trách:

* Đăng ký tài khoản.
* Đăng nhập.
* Đăng xuất.
* Quên mật khẩu.
* Phân quyền người dùng theo role: `user`, `supporter`, `admin`.

### 3.2. Wallet Management

Phần này quản lý ví nội bộ của khách hàng:

* Tạo ví cho user khi đăng ký thành công.
* Quản lý số dư khả dụng (`availableBalance`).
* Quản lý số dư đang giữ (`holdBalance`) nếu nghiệp vụ cần giữ tiền khi tạo đơn.
* Quản lý trạng thái yêu cầu nạp tiền hiện tại ngay trên ví qua `depositStatus`.
* Lưu số tiền nạp đang chờ xử lý qua `pendingDepositAmount`.
* Lưu ghi chú xử lý nạp tiền qua `depositNote`.
* Lưu thời điểm yêu cầu và thời điểm xử lý nạp tiền.
* Hiển thị số dư hiện tại.
* Với bản MVP tối giản, ví là nơi giữ trạng thái nạp tiền hiện tại của user.

### 3.3. Counter Management

Phần này quản lý các quầy dịch vụ:

* Hệ thống có 10 quầy.
* Mỗi quầy có mã quầy, tên quầy, trạng thái hoạt động.
* Có thể quy định mức tiền tối thiểu.
* Có thể bật/tắt quầy.

### 3.4. Counter Service Management

Phần này quản lý dịch vụ trong từng quầy:

* Mỗi quầy có nhiều dịch vụ.
* Mỗi dịch vụ có mã, tên, danh mục, tỷ lệ hoa hồng.
* Có thể bật/tắt từng dịch vụ.
* Khi tạo đơn, user sẽ chọn quầy và dịch vụ phù hợp.

### 3.5. Order Management

Phần này quản lý đơn hàng:

* User tạo đơn bằng tiền trong ví.
* Hệ thống kiểm tra số dư.
* Hệ thống kiểm tra điều kiện nghiệp vụ của quầy/dịch vụ.
* Hệ thống ghi nhận đơn với trạng thái ban đầu.
* Supporter xử lý đơn và cập nhật trạng thái.
* User theo dõi tiến trình xử lý đơn.

### 3.6. Commission Management

Phần này quản lý hoa hồng:

* Khi đơn hoàn thành, hệ thống tính hoa hồng dựa trên cấu hình dịch vụ.
* Hoa hồng được cộng vào ví của customer.
* Hệ thống ghi nhận log hoa hồng.
* User có thể xem khoản hoa hồng đã nhận.

### 3.7. Support Messaging

Phần này quản lý việc user trao đổi với supporter:

* User gửi yêu cầu hỗ trợ.
* User gửi yêu cầu nạp tiền thông qua kênh chăm sóc khách hàng.
* Supporter phản hồi.
* Theo dõi trạng thái tin nhắn theo `sent`, `unread`, `read`.
* Gửi notification khi có tin nhắn mới.

### 3.8. Notification Management

Phần này quản lý thông báo:

* Thông báo nạp tiền được duyệt hoặc bị từ chối.
* Thông báo tạo đơn thành công.
* Thông báo đơn thay đổi trạng thái.
* Thông báo cộng hoa hồng.
* Thông báo phản hồi từ supporter.
* Thông báo hệ thống từ admin.

---

## 4. Luồng nghiệp vụ chính

## 4.1. Luồng đăng ký và khởi tạo ví

1. Người dùng đăng ký tài khoản.
2. Hệ thống tạo bản ghi `users`.
3. Hệ thống tự động tạo `wallets` cho user đó.
4. Trạng thái tài khoản mặc định là hoạt động hoặc chờ xác minh theo cấu hình.
5. Người dùng có thể đăng nhập và sử dụng hệ thống.

### Kết quả

* User có tài khoản.
* User có ví nội bộ.
* User bắt đầu với số dư bằng 0.

---

## 4.2. Luồng nạp tiền

1. User vào màn hình hỗ trợ hoặc chat chăm sóc khách hàng.
2. User gửi tin nhắn yêu cầu nạp tiền, kèm số tiền và thông tin cần thiết.
3. Hệ thống tạo bản ghi `support_messages` để supporter tiếp nhận.
4. Supporter kiểm tra nội dung và chuyển yêu cầu cho admin xử lý.
5. Hệ thống cập nhật `wallets.depositStatus = pending` và lưu `pendingDepositAmount`.
6. User nhìn thấy yêu cầu nạp tiền ở trạng thái chờ xử lý trong hệ thống.
7. Admin kiểm tra và xác nhận yêu cầu nạp tiền.
8. Nếu hợp lệ:

   * cập nhật số dư `wallets.availableBalance` cho user
   * xóa `pendingDepositAmount`
   * cập nhật `wallets.depositStatus = processed`
   * cập nhật `lastDepositProcessedAt`
   * tạo `notifications` với loại `deposit_approved`
9. Nếu không hợp lệ:

   * giữ nguyên số dư ví
   * xóa `pendingDepositAmount`
   * cập nhật `wallets.depositStatus = rejected`
   * lưu lý do từ chối vào `depositNote` nếu có
   * cập nhật `lastDepositProcessedAt`
   * tạo `notifications` với loại `deposit_rejected`

### Kết quả

* User theo dõi được yêu cầu nạp tiền đang chờ xử lý hay đã hoàn tất.
* Khi admin xác nhận, tiền được cộng vào ví và thông tin xử lý gần nhất được lưu ngay trên ví.

---

## 4.3. Luồng xem quầy và dịch vụ

1. User vào màn hình danh sách quầy.
2. Hệ thống hiển thị 10 quầy trong bảng `counters`.
3. User chọn một quầy.
4. Hệ thống hiển thị danh sách dịch vụ của quầy đó từ `counter_services`.
5. User xem thông tin:

   * tên dịch vụ
   * loại dịch vụ (`category`)
   * tỷ lệ hoa hồng (`commissionRate`)
   * trạng thái hoạt động của dịch vụ (`isActive`)
   * số tiền tối thiểu của quầy (`counters.minAmount`)

### Kết quả

* User chọn được quầy và dịch vụ phù hợp để tạo đơn.

---

## 4.4. Luồng tạo đơn

1. User chọn quầy.
2. User chọn dịch vụ.
3. User nhập số tiền.
4. Hệ thống kiểm tra:

   * `wallets.availableBalance` của user có đủ hay không
   * quầy có đang hoạt động hay không
   * dịch vụ có `isActive = true` hay không
   * số tiền có đạt `counters.minAmount` hay không
5. Nếu hợp lệ:

   * hệ thống tạo `orders`
   * sinh `orderNo`
   * sinh `trackingCode`
   * gắn `userId`, `counterId`, `serviceId`
   * cập nhật trạng thái ban đầu là `pending`
   * trừ tiền khả dụng hoặc chuyển sang `wallets.holdBalance` theo nghiệp vụ
   * cập nhật tổng tiền của đơn vào `totalAmount`
   * tạo `notifications` với loại `order_created`
6. Nếu không hợp lệ:

   * từ chối tạo đơn
   * trả về lỗi phù hợp

### Kết quả

* User có một đơn mới trong hệ thống.
* Đơn sẵn sàng để supporter xử lý.

---

## 4.5. Luồng xử lý đơn

1. Supporter xem danh sách đơn.
2. Supporter nhận xử lý đơn.
3. Supporter cập nhật trạng thái đơn theo quy trình:

   * `pending`
   * `verifying`
   * `processing`
   * `completed`
   * `cancelled`
   * `rejected`
4. Mỗi lần đổi trạng thái:

   * cập nhật `orders.status`
   * lưu thông tin người xử lý và thời điểm xử lý theo nghiệp vụ hệ thống
   * tạo `notifications` tương ứng như `order_verifying`, `order_processing`, `order_completed`, `order_cancelled`, `order_rejected`

### Kết quả

* Đơn có lịch sử xử lý rõ ràng.
* User luôn biết đơn đang ở giai đoạn nào.

---

## 4.6. Luồng hoàn thành đơn và cộng hoa hồng

1. Supporter/Admin cập nhật đơn sang `completed`.
2. Hệ thống lấy thông tin dịch vụ từ `counter_services`.
3. Hệ thống tính hoa hồng theo `commissionRate`.
4. Hệ thống cộng hoa hồng vào `wallets.availableBalance` của user.
5. Hệ thống ghi nhận lịch sử cộng hoa hồng theo nghiệp vụ hệ thống.
6. Hệ thống tạo `notifications` với loại `commission_added`.

### Kết quả

* Đơn hoàn thành.
* User nhận được hoa hồng trong ví.
* Có thể tra cứu lịch sử thưởng sau này.

---

## 4.7. Luồng hủy hoặc từ chối đơn

1. Supporter/Admin cập nhật đơn sang `cancelled` hoặc `rejected`.
2. Hệ thống cập nhật `orders.status`.
3. Nếu nghiệp vụ cho phép hoàn tiền:

   * hoàn tiền từ `wallets.holdBalance` về `wallets.availableBalance`
   * ghi nhận lịch sử hoàn tiền theo nghiệp vụ hệ thống
   * tạo `notifications` với loại `refund_added`, `order_cancelled` hoặc `order_rejected`
4. Nếu không hoàn tiền thì cần có note giải thích rõ.

### Kết quả

* User biết đơn không còn được xử lý tiếp.
* Hệ thống rõ ràng về trạng thái và tiền liên quan.

---

## 4.8. Luồng hỗ trợ khách hàng

1. User gửi tin nhắn hỗ trợ.
2. Hệ thống tạo `support_messages`.
3. Supporter nhận được danh sách tin nhắn cần xử lý theo từng `userId` và `supporterId`.
4. Supporter phản hồi.
5. Hệ thống cập nhật trạng thái tin nhắn theo `sent`, `unread`, `read`.
6. Hệ thống gửi `notifications` với loại `support_reply` cho user khi có phản hồi mới.
7. Với yêu cầu nạp tiền, supporter tiếp nhận thông tin từ chat và chuyển admin xử lý ở luồng nạp tiền.

### Kết quả

* User được hỗ trợ kịp thời.
* Có lịch sử trao đổi để tra cứu.
* Các yêu cầu nạp tiền của user được tiếp nhận qua đúng kênh hỗ trợ của hệ thống.

---

## 5. Quy tắc nghiệp vụ quan trọng

### 5.1. Quy tắc tài khoản

* Mỗi email chỉ thuộc về một tài khoản.
* Một tài khoản có một role chính.
* Customer mới có ví nội bộ.
* Tài khoản bị khóa không được tạo đơn và không được nạp tiền.

### 5.2. Quy tắc ví

* Số dư ví không được âm.
* Tiền trong ví chỉ được dùng khi đủ điều kiện nghiệp vụ.
* Mỗi ví chỉ giữ một yêu cầu nạp tiền đang xử lý tại một thời điểm.
* Trạng thái nạp tiền hiện tại được lưu trực tiếp trong `wallets.depositStatus`.

### 5.3. Quy tắc nạp tiền

* Chỉ yêu cầu nạp tiền có minh chứng hợp lệ mới được duyệt.
* Tại một thời điểm, một ví chỉ có một yêu cầu nạp tiền ở trạng thái `pending`.
* Khi duyệt hoặc từ chối phải cập nhật lại `depositStatus`, `depositNote` và thời gian xử lý.

### 5.4. Quy tắc quầy và dịch vụ

* Quầy không hoạt động thì không được tạo đơn.
* Dịch vụ không hoạt động thì không được chọn.
* Có thể quy định tiền tối thiểu theo quầy hoặc theo dịch vụ.

### 5.5. Quy tắc đơn hàng

* User chỉ được tạo đơn nếu ví đủ tiền.
* Mỗi đơn phải gắn với đúng 1 user, 1 quầy, 1 dịch vụ.
* Mỗi đơn phải có mã đơn và mã tracking duy nhất.
* Mọi thay đổi trạng thái phải được ghi log.

### 5.6. Quy tắc hoa hồng

* Hoa hồng chỉ được cộng khi đơn ở trạng thái `completed`.
* Không được cộng hoa hồng 2 lần cho cùng một đơn.
* Hoa hồng được cộng vào ví nội bộ, không chuyển ra ngân hàng.

### 5.7. Quy tắc notification

* Các sự kiện quan trọng đều phải sinh notification.
* Notification phải gắn đúng user nhận.
* User có thể đánh dấu đã đọc.

---

## 6. Các thực thể chính trong hệ thống

### `users`

Lưu thông tin tài khoản chung cho admin, supporter, customer.

### `wallets`

Lưu thông tin ví nội bộ của customer, bao gồm số dư và trạng thái yêu cầu nạp tiền hiện tại.

### `wallet_transactions`

Có thể bổ sung ở giai đoạn sau nếu cần audit chi tiết lịch sử tăng giảm tiền trong ví.

### `counters`

Lưu thông tin 10 quầy trong hệ thống.

### `counter_services`

Lưu các dịch vụ của từng quầy.

### `orders`

Lưu đơn hàng mà user tạo.

### `order_events`

Lưu lịch sử trạng thái và thao tác trên đơn.

### `support_messages`

Lưu trao đổi giữa user và supporter.

### `notifications`

Lưu toàn bộ thông báo gửi cho user.

---

## 7. API nghiệp vụ gợi ý

## Auth

* `POST /auth/register`
* `POST /auth/login`
* `POST /auth/forgot-password`
* `GET /auth/profile`

## Wallet

* `GET /wallet`
* `GET /wallet/by-user?userId=...`
* `PATCH /wallet/:id/deposit/request`
* `PATCH /wallet/:id/deposit/approve`
* `PATCH /wallet/:id/deposit/reject`

## Counter

* `GET /counters`
* `GET /counters/:id`
* `GET /counters/:id/services`

## Order

* `POST /orders`
* `GET /orders/my`
* `GET /orders/:id`
* `GET /orders/:id/events`
* `PATCH /orders/:id/status`

## Support

* `POST /support/messages`
* `GET /support/messages/my`
* `POST /support/messages/:id/reply`

## Notification

* `GET /notifications`
* `PATCH /notifications/:id/read`
* `PATCH /notifications/read-all`

---

## 8. Dashboard / màn hình gợi ý

Quy ước:

* `[x]` Đã xong
* `[~]` Đã có một phần
* `[ ]` Chưa làm

### User app/web

* `[x]` Đăng ký / đăng nhập
* `[ ]` Trang chủ
* `[x]` Ví của tôi
* `[x]` Danh sách quầy
* `[x]` Chi tiết quầy
* `[x]` Danh sách đơn hàng
* `[x]` Chi tiết đơn hàng
* `[x]` Hỗ trợ khách hàng
* `[x]` Thông báo
* `[x]` Hồ sơ cá nhân

### Supporter dashboard

* `[ ]` Danh sách yêu cầu nạp tiền đang chờ
* `[x]` Chuyển yêu cầu nạp tiền cho admin
* `[ ]` Danh sách đơn chờ xử lý
* `[x]` Chi tiết đơn và timeline
* `[x]` Nhắn tin hỗ trợ user

### Admin dashboard

* `[x]` Quản lý user
* `[x]` Quản lý supporter
* `[x]` Quản lý quầy
* `[x]` Quản lý dịch vụ quầy
* `[x]` Quản lý đơn hàng
* `[x]` Xử lý nạp tiền trên ví
* `[x]` Quản lý notification hệ thống
* `[ ]` Dashboard thống kê

---

## 9. Mục tiêu kỹ thuật khi code

Khi bắt đầu code, nên bám các mục tiêu sau:

* Code rõ module theo nghiệp vụ.
* Tách riêng entity, dto, service, controller.
* Các thao tác liên quan đến tiền cần dùng transaction khi mở rộng nghiệp vụ.
* Với bản tối giản, ưu tiên đúng trạng thái ví và thông báo nạp tiền trước khi tách lịch sử riêng.
* Dùng enum cho các trạng thái chính.
* Luôn validate input ở DTO.
* Permission rõ theo role.
* Notification được sinh tự động từ các nghiệp vụ quan trọng.

---

## 10. Roadmap triển khai gợi ý

### Giai đoạn 1 - Core MVP

* Auth + role
* User profile
* Wallet
* Deposit flow tối giản trên `wallet`
* Counter + CounterService
* Order
* Notification cơ bản

### Giai đoạn 2 - Vận hành tốt hơn

* Wallet transaction đầy đủ
* Commission riêng
* Support chat tốt hơn
* Dashboard admin/supporter
* Filter/search/order history

### Giai đoạn 3 - Hoàn thiện

* Báo cáo thống kê nâng cao
* Broadcast notification
* File upload tốt hơn
* Audit log
* Soft delete
* Queue xử lý notification / jobs

---

## 11. Tóm tắt ngắn

Đây là hệ thống trong đó:

* user nạp tiền vào ví nội bộ,
* dùng ví để tạo đơn theo quầy và dịch vụ,
* supporter/admin xử lý đơn,
* khi đơn hoàn thành thì user nhận hoa hồng về lại ví,
* toàn bộ hoạt động quan trọng đều được lưu log và gửi notification.

Hệ thống xoay quanh 4 lõi chính:

1. **Tài khoản và phân quyền**
2. **Ví nội bộ và nạp tiền**
3. **Quầy, dịch vụ và đơn hàng**
4. **Hoa hồng, hỗ trợ và thông báo**
