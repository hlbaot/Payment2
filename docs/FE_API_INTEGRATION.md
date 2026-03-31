# FE API Integration

Tai lieu nay duoc tong hop tu code backend hien tai trong `src/`.

## 1. Base

- Base URL: `http://localhost:8080`
- Swagger: `GET /swagger`
- Auth header:

```http
Authorization: Bearer <access_token>
```

## 2. Roles

- `ADMIN`
- `SUPPORTER`
- `USER`

## 3. Enums

### OrderStatus

```ts
'pending' | 'verifying' | 'processing' | 'completed' | 'cancelled' | 'rejected'
```

### CommissionStatus

```ts
'none' | 'pending' | 'approved' | 'rejected'
```

### SupportMessageStatus

```ts
'sent' | 'unread' | 'read'
```

### WalletDepositStatus

```ts
'none' | 'pending' | 'processed' | 'rejected'
```

### NotificationType

```ts
'deposit_created'
| 'deposit_approved'
| 'deposit_rejected'
| 'order_created'
| 'order_verifying'
| 'order_processing'
| 'order_completed'
| 'order_cancelled'
| 'order_rejected'
| 'commission_added'
| 'refund_added'
| 'support_reply'
| 'support_opened'
| 'support_resolved'
| 'system_announcement'
```

## 4. Auth

### POST `/auth/register`

Body:

```json
{
  "email": "user@example.com",
  "password": "123456",
  "otp": "123456"
}
```

Response:

```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

Note:

- `otp` hien dang bat buoc trong request.
- Backend hien chua verify OTP thuc te.

### POST `/auth/login`

Body:

```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

Response:

```json
{
  "userId": 1,
  "email": "user@example.com",
  "roleList": ["USER"],
  "token": "access_token",
  "refreshToken": "refresh_token"
}
```

### POST `/auth/refresh`

Body:

```json
{
  "refreshToken": "refresh_token"
}
```

Response: giong `POST /auth/login`

### GET `/auth/profile`

Auth: required

Response:

```json
{
  "id": 1,
  "fullName": "user",
  "email": "user@example.com",
  "phoneNumber": null,
  "country": null,
  "isActive": true,
  "createdAt": "2026-03-31T00:00:00.000Z",
  "updatedAt": "2026-03-31T00:00:00.000Z",
  "roles": ["USER"],
  "wallet": {
    "id": 1,
    "currency": "VND",
    "availableBalance": "0.00",
    "holdBalance": "0.00",
    "depositStatus": "none",
    "pendingDepositAmount": null,
    "depositNote": null,
    "lastDepositRequestedAt": null,
    "lastDepositProcessedAt": null,
    "createdAt": "2026-03-31T00:00:00.000Z"
  }
}
```

### POST `/auth/logout`

Auth: required

Response:

```json
{
  "success": true
}
```

## 5. User

### GET `/user/me`

Auth: required

Response: `User`

### PATCH `/user/me`

Auth: required

Body:

```json
{
  "fullName": "New Name",
  "phoneNumber": "0123456789",
  "country": "VN"
}
```

Response: `User`

### GET `/user/supporters`

Auth: `ADMIN`

Response: `User[]`

### POST `/user`

Auth: `ADMIN`

Body:

```json
{
  "fullName": "Admin Created User",
  "email": "u1@example.com",
  "password": "123456",
  "phoneNumber": "0123456789",
  "country": "VN",
  "isActive": true,
  "roleIds": [1]
}
```

### GET `/user`

Auth: `ADMIN`

### GET `/user/:id`

Auth: `ADMIN`

### PATCH `/user/:id`

Auth: `ADMIN`

Body:

```json
{
  "fullName": "Updated Name",
  "email": "updated@example.com",
  "password": "123456",
  "phoneNumber": null,
  "country": null,
  "isActive": true,
  "roleIds": [1, 2]
}
```

### DELETE `/user/:id`

Auth: `ADMIN`

## 6. Role

### POST `/role`

Auth: `ADMIN`

Body:

```json
{
  "name": "SUPPORTER"
}
```

### GET `/role`

Auth: `ADMIN`

### GET `/role/:id`

Auth: `ADMIN`

### PATCH `/role/:id`

Auth: `ADMIN`

Body:

```json
{
  "name": "ADMIN"
}
```

### DELETE `/role/:id`

Auth: `ADMIN`

## 7. Wallet

### GET `/wallet/me`

Auth: required

Response:

```json
{
  "id": 1,
  "userId": 1,
  "currency": "VND",
  "availableBalance": "100000.00",
  "holdBalance": "0.00",
  "pendingDepositAmount": null,
  "depositStatus": "processed",
  "depositNote": null,
  "lastDepositRequestedAt": null,
  "lastDepositProcessedAt": null,
  "createdAt": "2026-03-31T00:00:00.000Z",
  "user": {}
}
```

### GET `/wallet`

Auth: `ADMIN`

### GET `/wallet/by-user?userId=1`

Auth: `ADMIN`

### GET `/wallet/:id`

Auth: `ADMIN`

### POST `/wallet`

Auth: `ADMIN`

Body:

```json
{
  "userId": 1,
  "currency": "VND"
}
```

### PATCH `/wallet/:id`

Auth: `ADMIN`

Body:

```json
{
  "currency": "VND",
  "availableBalance": "100000.00",
  "holdBalance": "0.00",
  "pendingDepositAmount": null,
  "depositStatus": "none",
  "depositNote": null,
  "lastDepositRequestedAt": null,
  "lastDepositProcessedAt": null
}
```

### PATCH `/wallet/:id/deposit/request`

Auth: `ADMIN`

Body:

```json
{
  "amount": "500000.00",
  "note": "Nap tien"
}
```

### PATCH `/wallet/:id/deposit/approve`

Auth: `ADMIN`

Body:

```json
{
  "note": "Da duyet"
}
```

### PATCH `/wallet/:id/deposit/reject`

Auth: `ADMIN`

Body:

```json
{
  "note": "Tu choi"
}
```

### DELETE `/wallet/:id`

Auth: `ADMIN`

## 8. Wallet Transaction

### GET `/wallet-transaction/me`

Auth: required

### GET `/wallet-transaction`

Auth: `ADMIN`

Query:

- `userId?=1`

Response item:

```json
{
  "id": 1,
  "walletId": 1,
  "userId": 1,
  "type": "order_hold",
  "amount": "100000.00",
  "availableBalanceBefore": "500000.00",
  "availableBalanceAfter": "400000.00",
  "holdBalanceBefore": "0.00",
  "holdBalanceAfter": "100000.00",
  "referenceType": "order",
  "referenceId": 10,
  "note": "Funds held for order ORD-...",
  "createdAt": "2026-03-31T00:00:00.000Z"
}
```

## 9. Counter

### GET `/counter`

Public

Query:

- `activeOnly=true`

### GET `/counter/:id`

Public

### GET `/counter/:id/services`

Public

### POST `/counter`

Auth: `ADMIN`

Body:

```json
{
  "code": "Q1",
  "name": "Quay 1",
  "status": "open",
  "minAmount": "100000.00"
}
```

### PATCH `/counter/:id`

Auth: `ADMIN`

### DELETE `/counter/:id`

Auth: `ADMIN`

## 10. Counter Service

### GET `/counter-service`

Public

### GET `/counter-service/by-counter/:counterId`

Public

### GET `/counter-service/:id`

Public

### POST `/counter-service`

Auth: `ADMIN`

Body:

```json
{
  "counterId": 1,
  "serviceCode": "SV01",
  "name": "Dich vu A",
  "category": "transfer",
  "commissionRate": "5.00",
  "isActive": true
}
```

### PATCH `/counter-service/:id`

Auth: `ADMIN`

### DELETE `/counter-service/:id`

Auth: `ADMIN`

## 11. Order

### GET `/order/my`

Auth: required

### GET `/order/:id`

Auth: required

Note:

- `ADMIN` xem duoc tat ca.
- User thuong chi xem duoc order cua chinh minh.

### GET `/order/:id/events`

Auth: required

Response: `OrderEvent[]`

```json
[
  {
    "id": 1,
    "orderId": 10,
    "status": "pending",
    "note": "Order created",
    "createdAt": "2026-03-31T00:00:00.000Z"
  }
]
```

### POST `/order`

Auth: `ADMIN`

Body:

```json
{
  "userId": 1,
  "counterId": 1,
  "serviceId": 2,
  "amount": "200000.00"
}
```

### GET `/order`

Auth: `ADMIN`

Query:

- `status?=pending`
- `userId?=1`
- `counterId?=1`
- `commissionStatus?=pending`

### PATCH `/order/:id`

Auth: `ADMIN`

Body:

```json
{
  "counterId": 1,
  "serviceId": 2,
  "amount": "200000.00",
  "totalAmount": "200000.00"
}
```

### PATCH `/order/:id/status`

Auth: `ADMIN` or `SUPPORTER`

Body:

```json
{
  "status": "verifying"
}
```

Allowed flow:

- `pending -> verifying | cancelled | rejected`
- `verifying -> processing | cancelled | rejected`
- `processing -> completed | cancelled | rejected`

### DELETE `/order/:id`

Auth: `ADMIN`

### GET `/order/supporter/queue`

Auth: `ADMIN` or `SUPPORTER`

Response: danh sach order co status:

- `pending`
- `verifying`
- `processing`

### GET `/order/commission-reviews`

Auth: `ADMIN`

Query:

- `status?=all|pending|approved|rejected`

Response item:

```json
{
  "userId": 1,
  "email": "user@example.com",
  "fullName": "User A",
  "walletBalance": "100000.00",
  "totalOrders": 3,
  "totalCommission": "25000.00",
  "commissionStatus": "pending",
  "statusCounts": {
    "none": 0,
    "pending": 3,
    "approved": 0,
    "rejected": 0
  },
  "latestCompletedAt": "2026-03-31T00:00:00.000Z"
}
```

### GET `/order/commission-reviews/:userId`

Auth: `ADMIN`

Query:

- `status?=all|pending|approved|rejected`

Response:

```json
{
  "userId": 1,
  "email": "user@example.com",
  "fullName": "User A",
  "walletBalance": "100000.00",
  "totalCommission": "25000.00",
  "commissionStatus": "pending",
  "counters": [
    {
      "counterId": 1,
      "counterCode": "Q1",
      "counterName": "Quay 1",
      "totalCommission": "25000.00",
      "totalOrders": 2,
      "orders": [
        {
          "id": 10,
          "orderNo": "ORD-...",
          "trackingCode": "TRK-...",
          "amount": "200000.00",
          "totalAmount": "200000.00",
          "commissionAmount": "10000.00",
          "commissionRateSnapshot": "5.00",
          "commissionStatus": "pending",
          "completedAt": "2026-03-31T00:00:00.000Z",
          "serviceId": 2,
          "serviceName": "Dich vu A"
        }
      ]
    }
  ]
}
```

### PATCH `/order/commission-reviews/:userId/approve`

Auth: `ADMIN`

Body:

```json
{
  "orderIds": [10, 11]
}
```

Body co the bo `orderIds` de approve toan bo order pending commission cua user do.

### PATCH `/order/commission-reviews/:userId/reject`

Auth: `ADMIN`

Body:

```json
{
  "orderIds": [10, 11],
  "reason": "Khong du dieu kien"
}
```

## 12. Order Event

### GET `/order-event/order/:orderId`

Auth: `ADMIN` or `SUPPORTER`

## 13. Support Message

### POST `/support-message`

Auth: required

Body:

```json
{
  "userId": 1,
  "supporterId": 2,
  "messageText": "Em muon nap tien",
  "type": "private",
  "depositAmount": "500000.00",
  "status": "sent"
}
```

Note:

- User thuong khong can gui `userId`, backend se gan tu JWT.
- Neu `type = 'deposit_request'` va co `depositAmount`, backend se tao yeu cau nap tien tren wallet.

### GET `/support-message/my`

Auth: required

### GET `/support-message/conversation/:otherUserId`

Auth: required

### GET `/support-message/deposit-requests/pending`

Auth: `ADMIN` or `SUPPORTER`

### PATCH `/support-message/:id/forward-to-admin`

Auth: `ADMIN` or `SUPPORTER`

### GET `/support-message`

Auth: `ADMIN` or `SUPPORTER`

Query:

- `userA`
- `userB`

### GET `/support-message/:id`

Auth: required

### PATCH `/support-message/:id`

Auth: required

Body:

```json
{
  "messageText": "Da tiep nhan",
  "type": "deposit_forwarded_to_admin",
  "status": "read"
}
```

### DELETE `/support-message/:id`

Auth: `ADMIN`

## 14. Notification

### GET `/notification/me`

Auth: required

### GET `/notification/:id`

Auth: required

### PATCH `/notification/:id/read`

Auth: required

### PATCH `/notification/read-all`

Auth: required

### GET `/notification`

Auth: `ADMIN`

Query:

- `userId?=1`
- `type?=order_created`
- `isRead?=true|false`

### POST `/notification`

Auth: `ADMIN`

Body:

```json
{
  "userId": 1,
  "type": "system_announcement",
  "title": "Thong bao",
  "message": "Noi dung thong bao",
  "referenceType": "system",
  "referenceId": 1
}
```

### PATCH `/notification/:id`

Auth: `ADMIN`

### DELETE `/notification/:id`

Auth: `ADMIN`

## 15. Realtime Socket

### Connect

Socket auth:

```ts
const socket = io(BASE_URL, {
  auth: {
    token: accessToken
  }
});
```

Sau khi connect, backend tu dong join room:

```ts
user_<userId>
```

### Client emit: `private-message`

Payload:

```json
{
  "receiverId": 2,
  "message": "Xin chao"
}
```

### Client listen: `private-message`

Payload:

```json
{
  "senderId": 1,
  "message": "Xin chao",
  "time": "2026-03-31T00:00:00.000Z"
}
```

### Client listen: `notification:new`

Payload:

```json
{
  "id": 1,
  "userId": 2,
  "type": "support_reply",
  "title": "New support reply",
  "message": "Xin chao",
  "referenceType": null,
  "referenceId": null,
  "isRead": false,
  "readAt": null,
  "createdAt": "2026-03-31T00:00:00.000Z"
}
```

## 16. Main Response Shapes

### User

```ts
type User = {
  id: number;
  fullName: string;
  email: string;
  password?: string;
  refreshToken?: string | null;
  phoneNumber: string | null;
  country: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  roleSet?: { id: number; name: string }[];
  wallet?: Wallet;
};
```

### Wallet

```ts
type Wallet = {
  id: number;
  userId: number;
  currency: string;
  availableBalance: string;
  holdBalance: string;
  pendingDepositAmount: string | null;
  depositStatus: 'none' | 'pending' | 'processed' | 'rejected';
  depositNote: string | null;
  lastDepositRequestedAt: string | null;
  lastDepositProcessedAt: string | null;
  createdAt: string;
};
```

### Counter

```ts
type Counter = {
  id: number;
  code: string;
  name: string;
  status: 'open' | 'busy' | 'full' | 'offline';
  minAmount: string;
  createdAt: string;
};
```

### CounterService

```ts
type CounterService = {
  id: number;
  counterId: number;
  serviceCode: string;
  name: string;
  category: 'transfer' | 'payment';
  commissionRate: string;
  isActive: boolean;
};
```

### Order

```ts
type Order = {
  id: number;
  orderNo: string;
  trackingCode: string | null;
  userId: number;
  counterId: number;
  serviceId: number;
  amount: string;
  totalAmount: string;
  status: OrderStatus;
  commissionRateSnapshot: string | null;
  commissionAmount: string | null;
  commissionStatus: CommissionStatus;
  commissionReviewedAt: string | null;
  commissionRejectReason: string | null;
  completedAt: string | null;
  createdAt: string;
  user?: User;
  counter?: Counter;
  service?: CounterService;
};
```

### SupportMessage

```ts
type SupportMessage = {
  id: number;
  userId: number;
  supporterId: number;
  status: 'sent' | 'unread' | 'read';
  type: string;
  messageText: string;
  createdAt: string;
};
```

### Notification

```ts
type Notification = {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  referenceType: string | null;
  referenceId: number | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};
```

## 17. FE Notes

- Hien tai route dung dang so it:
  - `/auth`
  - `/user`
  - `/role`
  - `/wallet`
  - `/wallet-transaction`
  - `/counter`
  - `/counter-service`
  - `/order`
  - `/order-event`
  - `/support-message`
  - `/notification`
- Khong dung cac route so nhieu nhu `/orders`, `/notifications`, `/support/messages`.
- Numeric money values dang tra ve chuoi. FE nen parse khi can tinh toan.
- Realtime notification da emit tu dong moi khi backend tao notification qua `NotificationService.create()`.
