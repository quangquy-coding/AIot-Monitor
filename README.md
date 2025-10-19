# AIoT Monitor

Hệ thống giám sát và quản lý thiết bị IoT thông minh với giao diện web hiện đại.

## 🚀 Tính năng

- **Quản lý thiết bị**: Theo dõi và điều khiển các thiết bị IoT
- **Nhóm thiết bị**: Tổ chức thiết bị theo nhóm logic
- **Hub quản lý**: Quản lý các hub kết nối
- **Xác thực người dùng**: Hệ thống đăng nhập bảo mật với JWT
- **Giao diện thời gian thực**: Cập nhật trạng thái thiết bị real-time với Socket.IO
- **Lịch sử hoạt động**: Theo dõi và ghi log các hoạt động
- **Danh sách lệnh**: Quản lý và thực thi lệnh trên thiết bị

## 🏗️ Kiến trúc hệ thống

```
aiot-monitor/
├── backend/          # API Server (Node.js + Express)
├── frontend/         # Web Interface (React + Vite)
├── docker/           # Simulated devices
└── docker-compose.yml
```

## 🛠️ Công nghệ sử dụng

### Backend
- **Node.js** + **Express.js** - API Server
- **MongoDB** + **Mongoose** - Database
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React 18** - UI Framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Router** - Navigation
- **Lucide React** - Icons

## 📋 Yêu cầu hệ thống

- **Docker** và **Docker Compose**
- **Node.js** 18+ (nếu chạy development)
- **MongoDB** (nếu không dùng Docker)

## 🚀 Cài đặt và chạy

### Sử dụng Docker (Khuyến nghị)

1. **Clone repository**
```bash
git clone <repository-url>
cd aiot-monitor
```

2. **Chạy toàn bộ hệ thống**
```bash
docker-compose up -d
```

3. **Truy cập ứng dụng**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

### Development Mode

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔧 Cấu hình

### Backend Environment (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://admin:adminpassword@localhost:27017/aiotmonitor?authSource=admin
JWT_SECRET=your_jwt_secret_key_here
FRONTEND_URL=http://localhost:5173
```

### Frontend Environment (.env)
```env
VITE_API_URL=http://localhost:5000
```

## 🎯 Thiết bị mô phỏng

Hệ thống bao gồm 5 thiết bị mô phỏng:

| Thiết bị | Hostname | SSH Port | User | IP |
|----------|----------|----------|------|-----|
| Core Router 01 | core-router-01.aiot.local | 2201 | admin | 10.0.1.1 |
| Docker Device 1 | mydockdev1.aiot.local | 2221 | operator | Dynamic |
| Dist Switch 01 | dist-switch-01.aiot.local | 2202 | netadmin | 10.0.1.2 |
| WebServer Prod 01 | webserver01.aiot.local | 2203 | webadmin | 10.0.2.10 |
| DB Server Prod 01 | dbserver01.aiot.local | 2204 | dbadmin | 10.0.2.20 |

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký

### Devices
- `GET /api/devices` - Lấy danh sách thiết bị
- `POST /api/devices` - Tạo thiết bị mới
- `PUT /api/devices/:id` - Cập nhật thiết bị
- `DELETE /api/devices/:id` - Xóa thiết bị

### Device Groups
- `GET /api/device-groups` - Lấy danh sách nhóm
- `POST /api/device-groups` - Tạo nhóm mới

### Hubs
- `GET /api/hubs` - Lấy danh sách hub
- `POST /api/hubs` - Tạo hub mới

## 🔒 Bảo mật

- JWT token authentication
- Password hashing với bcryptjs
- CORS protection
- Environment variables cho sensitive data

## 📊 Monitoring

- Real-time device status updates
- Activity logging
- Command execution tracking
- User action history

## 🐳 Docker Commands

```bash
# Khởi động tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng services
docker-compose down

# Rebuild và restart
docker-compose up -d --build

# Xóa volumes (reset database)
docker-compose down -v
```

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Liên hệ

Project Link: [https://github.com/your-username/aiot-monitor](https://github.com/your-username/aiot-monitor)