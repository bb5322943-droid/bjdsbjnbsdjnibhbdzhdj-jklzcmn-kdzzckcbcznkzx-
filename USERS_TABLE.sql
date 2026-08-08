-- 👥 TEST FOYDALANUVCHILAR JADVALI
-- Database: SQLite / PostgreSQL
-- Parol: 123456 (bcrypt hash)
-- Yaratilgan: 2026-08-04

-- ============================================
-- FOYDALANUVCHILAR JADVALI
-- ============================================

-- Agar jadval mavjud bo'lsa, o'chirish
-- DROP TABLE IF EXISTS users;

-- Jadval yaratish
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- bcrypt hash
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Index yaratish (tezlik uchun)
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- TEST FOYDALANUVCHILARNI QO'SHISH
-- ============================================
-- Parol: 123456
-- Bcrypt hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

INSERT INTO users (username, password_hash, full_name, role, email, phone) VALUES
-- 1. ADMINISTRATOR
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Sardor Mahmudov', 'admin', 'admin@orbis.uz', '+998901234567'),

-- 2. RAHBAR (Manager)
('rahbar', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Aziz Alimov', 'manager', 'rahbar@orbis.uz', '+998901234568'),

-- 3. BUXGALTER (Accountant)
('buxgalter', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Malika Karimova', 'accountant', 'buxgalter@orbis.uz', '+998901234569'),

-- 4. OMBOR XODIMI (Warehouse)
('ombor', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Jasur Toshmatov', 'warehouse', 'ombor@orbis.uz', '+998901234570'),

-- 5. SOTUV MENEJERI (Sales)
('sotuv', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Dilshod Ergashev', 'sales', 'sotuv@orbis.uz', '+998901234571'),

-- 6. KUZATUVCHI (Viewer)
('kuzatuvchi', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Nodira Narimanova', 'viewer', 'kuzatuvchi@orbis.uz', '+998901234572'),

-- 7. KASSIR (Cashier) ⭐ YANGI
('kassir', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Gulnora Salimova', 'cashier', 'kassir@orbis.uz', '+998901234573'),

-- 8. HR MENEJERI (HR Manager) ⭐ YANGI
('hr_manager', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Sevara Rahimova', 'hr_manager', 'hr@orbis.uz', '+998901234574');

-- ============================================
-- TEKSHIRISH
-- ============================================

-- Barcha foydalanuvchilarni ko'rish
SELECT 
    id,
    username,
    full_name,
    role,
    email,
    phone,
    is_active,
    created_at
FROM users
ORDER BY id;

-- Rol bo'yicha soni
SELECT 
    role,
    COUNT(*) as count
FROM users
GROUP BY role
ORDER BY count DESC;

-- ============================================
-- PAROLNI O'ZGARTIRISH (Production uchun)
-- ============================================

-- Yangi parolni hash qilish uchun:
-- Node.js: const bcrypt = require('bcryptjs'); bcrypt.hashSync('parol', 10);
-- Python: from bcrypt import hashpw, gensalt; hashpw(b'parol', gensalt())
-- Online: https://bcrypt-generator.com/

-- Parolni yangilash misoli:
-- UPDATE users SET password_hash = '$2a$10$...' WHERE username = 'admin';

-- ============================================
-- SESSION JADVALI (ixtiyoriy)
-- ============================================

CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- ============================================
-- AUDIT LOG JADVALI (ixtiyoriy)
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username VARCHAR(50),
    action VARCHAR(50) NOT NULL, -- login, logout, create, update, delete
    module VARCHAR(50), -- pos, warehouse, crm, etc.
    entity_type VARCHAR(50), -- order, product, customer, etc.
    entity_id VARCHAR(100),
    details TEXT, -- JSON format
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);

-- ============================================
-- TEST SSENARIYLARI
-- ============================================

-- 1. Foydalanuvchi login tekshiruvi
-- SELECT * FROM users WHERE username = 'admin' AND is_active = 1;

-- 2. Parolni tekshirish (bcrypt bilan)
-- Node.js: bcrypt.compareSync('123456', user.password_hash);

-- 3. Session yaratish
-- INSERT INTO sessions (user_id, token, ip_address, expires_at) VALUES (1, 'token123', '192.168.1.1', datetime('now', '+8 hours'));

-- 4. Audit log yozish
-- INSERT INTO audit_logs (user_id, username, action, module, details) VALUES (1, 'admin', 'login', 'auth', '{"success": true}');

-- ============================================
-- MA'LUMOTLARNI TOZALASH (DEV faqat!)
-- ============================================

-- DELETE FROM sessions WHERE expires_at < datetime('now');
-- DELETE FROM audit_logs WHERE created_at < datetime('now', '-1 year');

-- ============================================
-- BACKUP
-- ============================================

-- SQLite backup:
-- .backup users_backup.db

-- PostgreSQL backup:
-- pg_dump -U postgres -d orbis_db -t users > users_backup.sql

-- ============================================
-- NOTES
-- ============================================

-- 1. Parol: 123456 (test uchun)
-- 2. Production'da: murakkab parol + 2FA
-- 3. Session timeout: 8 soat
-- 4. Audit log: 1 yil
-- 5. Bcrypt rounds: 10 (yetarli)

-- ============================================
-- QOSHMCHA MA'LUMOT
-- ============================================

-- Rol huquqlari: permissions.ts faylida
-- Session boshqarish: auth.ts faylida
-- Audit log: audit.ts faylida

-- Yaratilgan: 2026-08-04
-- Versiya: 1.0.0
-- Status: ✅ TEST UCHUN TAYYOR
