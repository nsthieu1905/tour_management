# Debug Notification Bug

## Update: Thêm ObjectId conversion fix

**Issue:** UserId trong DB có thể là ObjectId, nhưng query được gửi với string, dẫn đến không match.

**Fix:** Thêm logic convert string → ObjectId trong `NotificationService.getNotifications()`

## Các bước đã fix:

1. ✅ Sửa NotificationController - lấy userId từ req.user thay vì req.params/req.body
2. ✅ Sửa routes - bỏ :userId param, thêm protectClientRoutes middleware
3. ✅ Sửa frontend - thay đổi fetch URL từ `/api/notifications/user/${userId}` → `/api/notifications/user`
4. ✅ Thêm debug logs vào middleware, controller, service
5. ✅ Thêm ObjectId conversion logic để fix userId type mismatch

## Cách kiểm tra:

### Step 1: Tạo Booking mới

1. Đăng nhập vào website
2. Bấm "Đặt tour" trên một tour
3. Hoàn tất booking

### Step 2: Kiểm tra Backend Logs

1. Mở **Terminal chạy server**
2. Tìm logs sau:
   ```
   🔔 [NotificationService] Creating notification...
      Type: booking
      UserId: ...
      UserId type: object (nếu là ObjectId)
   ✅ [NotificationService] Notification saved to DB
      Saved userId: ...
   ```

### Step 3: Kiểm tra Frontend - Bấm notification bell

1. Mở Browser **DevTools (F12)**
2. Vào **Console tab**
3. Bấm **notification bell**
4. Tìm logs:
   ```
   📥 [Client] Fetching notifications from server for userId: ...
   📥 [Client] Raw response data: ...
   📥 [Client] Received notifications from server: 5 (nếu có thông báo)
   ```

### Step 4: Kiểm tra Backend Logs khi fetch API

1. Tìm logs sau:

   ```
   📥 [getUserNotifications] Called
      req.user: { userId: ObjectId(...), email: ..., role: ..., fullName: ... }
   📥 [getUserNotifications] Fetching notifications for: ObjectId(...)

   📊 [NotificationService.getNotifications] Query params:
      userId: ObjectId(...)
      userId type: object
      Final query object: { userId: ObjectId(...) }
   📊 [NotificationService.getNotifications] Result:
      Found: 5 notifications (nếu query match)
   ```

## Các endpoint đã thay đổi:

- GET `/api/notifications/user` (protected) - lấy thông báo user hiện tại
- GET `/api/notifications/unread` (protected) - lấy số thông báo chưa đọc
- PUT `/api/notifications/:notificationId/read` (protected) - mark as read
- DELETE `/api/notifications/:notificationId` (protected) - delete notification

## Modified Files:

- `src/app/controllers/NotificationController.js` - Added debug logs
- `src/middleware/protectClientRoutes.js` - Added debug logs
- `src/routes/api/notifications.js` - Updated routes with middleware
- `src/public/client/js/notifications.js` - Fixed API endpoints + added debug logs
- `src/services/NotificationService.js` - Added ObjectId conversion + debug logs

- `src/app/controllers/NotificationController.js` - Added debug logs
- `src/middleware/protectClientRoutes.js` - Added debug logs
- `src/routes/api/notifications.js` - Updated routes with middleware
- `src/public/client/js/notifications.js` - Fixed API endpoints
