# Tour Management

Hệ thống quản lý và đặt tour du lịch trực tuyến

## Công nghệ sử dụng

Backend: Node.js, Express.js, MongoDB, Socket.IO, JWT

Frontend: Handlebars, Tailwind CSS, Sass, Vanilla JavaScript

External APIs: MoMo Payment Gateway, Google GenAI

## Chức năng chính

- CRUD Tours: Tạo, sửa, xóa, quản lý tours
- Quản lý người dùng
- Thanh toán MoMo: Tích hợp cổng thanh toán MoMo (HMAC SHA-256, IPN)
- Đặt tour: Khách hàng tìm kiếm, so sánh và đặt tour
- Real-time Notifications: Socket.IO thông báo tức thì
- AI Chatbot: Hỗ trợ khách hàng tìm kiếm tour
- Feedbacks & Favorites: Đánh giá và yêu thích tours
- Dashboard: Thống kê doanh thu, bookings
- Mã giảm giá: Quản lý mã giảm giá
- Bảo mật: JWT authentication, bcrypt hashing, middleware protection

## Cài đặt & chạy project

Prerequisites: Node.js (v14+), MongoDB, Git

1. Clone repository:

```bash
git clone https://github.com/nsthieu1905/tour_management.git
cd tour_management
```

2. Cài đặt dependencies:

```bash
npm install
```

3. Tạo file .env:

```bash
cp .env.example .env
```

Điền các thông tin cần thiết:

```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tour_management
JWT_SECRET=your_secret_key
MOMO_PARTNER_CODE=your_code
MOMO_ACCESS_KEY=your_key
MOMO_SECRET_KEY=your_secret
GOOGLE_GENAI_API_KEY=your_key
EMAIL_USER=your_email
EMAIL_PASSWORD=your_password
```

4. Chạy ứng dụng:

```bash
npm run dev
Truy cập: http://localhost:3000
```

## Scripts npm

```bash
npm run dev         Chạy development mode (nodemon + debugger)
npm start           Chạy production mode
npm run watch:d     Watch admin scss
npm run watch:c     Watch customer scss
npm run setup:env   Copy .env.example to .env
npm run clear       Kill node process
```

## License

ISC License

Repository: https://github.com/nsthieu1905/tour_management
