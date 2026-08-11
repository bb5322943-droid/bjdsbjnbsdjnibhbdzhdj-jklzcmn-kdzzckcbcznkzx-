import Database from 'better-sqlite3';
import { randomBytes, scryptSync } from 'node:crypto';

const KEY_LENGTH = 64;
const ADMIN_EMAIL = "admin@orbiserp.uz";
const ADMIN_PASSWORD = "OrbisAdmin2024!";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${derived}`;
}

const db = new Database('./data/app.db');

console.log('🔧 UPDATING ADMIN USER\n');

// 1. Check current admin
const currentAdmin = db.prepare(`
  SELECT id, login, email, role, status 
  FROM users 
  WHERE login='admin'
`).get();

console.log('Current admin:', currentAdmin);

if (!currentAdmin) {
  console.log('❌ Admin not found! Creating new admin...');
  
  const newPasswordHash = hashPassword(ADMIN_PASSWORD);
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO users (id, name, login, email, role, status, lastLogin, employeeId, createdDate, passwordHash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    '1',
    'Administrator',
    'admin',
    ADMIN_EMAIL,
    'admin',
    'active',
    now,
    null,
    now.split('T')[0],
    newPasswordHash
  );
  
  console.log('✅ New admin created!');
} else {
  console.log('\n♻️ Updating existing admin...');
  
  const newPasswordHash = hashPassword(ADMIN_PASSWORD);
  
  db.prepare(`
    UPDATE users 
    SET email = ?, 
        passwordHash = ?,
        role = 'admin',
        status = 'active'
    WHERE login = 'admin'
  `).run(ADMIN_EMAIL, newPasswordHash);
  
  console.log('✅ Admin updated!');
}

// 2. Verify update
const updatedAdmin = db.prepare(`
  SELECT id, login, email, role, status, length(passwordHash) as hashLen 
  FROM users 
  WHERE login='admin'
`).get();

console.log('\n✅ Updated admin:', {
  id: updatedAdmin.id,
  login: updatedAdmin.login,
  email: updatedAdmin.email,
  role: updatedAdmin.role,
  status: updatedAdmin.status,
  hasPassword: updatedAdmin.hashLen > 0,
  passwordHashLength: updatedAdmin.hashLen
});

console.log('\n🔑 Login credentials:');
console.log('   Login: admin');
console.log('   Email:', ADMIN_EMAIL);
console.log('   Password:', ADMIN_PASSWORD);

db.close();
console.log('\n✅ Admin update complete!');
