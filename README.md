# 📦 InstaApp - Complete Setup Guide

## 🎯 Metode 1 Gunakan Docker

**`backend/.env`** - Edit file ini:
```env
APP_NAME=InstaApp
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=instaapp
DB_USERNAME=instaapp_user
DB_PASSWORD=secret123

SANCTUM_STATEFUL_DOMAINS=localhost:3000
SESSION_DOMAIN=localhost
```

#### Jalankan Aplikasi

```bash
# Di folder instaapp/
docker-compose up -d

# Tunggu container siap (sekitar 1-2 menit)

# Generate key dan migrate
docker exec -it instaapp_backend php artisan key:generate
docker exec -it instaapp_backend php artisan migrate
docker exec -it instaapp_backend php artisan storage:link
docker exec -it instaapp_backend chmod -R 777 storage bootstrap/cache
```

#### Akses Aplikasi

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api

---

### **Metode 2: Tanpa Docker (Local Development)**

#### Backend Setup:
```bash
cd backend

# Setup database PostgreSQL local
# Buat database: instaapp

# Update .env untuk database local
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=instaapp
DB_USERNAME=postgres
DB_PASSWORD=yourpassword

# Jalankan
php artisan key:generate
php artisan migrate
php artisan storage:link
php artisan serve
```

#### Frontend Setup:
```bash
cd frontend

# Update API URL di src/App.js
# Cari: const API_URL = 'http://localhost:8000/api';
# Pastikan sesuai dengan backend URL

npm start
```
---

## 🔧 Troubleshooting

### Port sudah digunakan
```bash
# Ganti port di docker-compose.yml
ports:
  - "8001:8000"  # Backend
  - "3001:3000"  # Frontend
  - "5433:5432"  # PostgreSQL
```

### Permission Error
```bash
docker exec -it instaapp_backend chmod -R 777 storage bootstrap/cache
```


### Database Connection Failed
```bash
# Cek status container
docker-compose ps

# Cek logs
docker-compose logs postgres
docker-compose logs backend
```

---
# insta_app
