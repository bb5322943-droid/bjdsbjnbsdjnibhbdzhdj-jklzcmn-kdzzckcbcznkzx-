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

console.log('🔧 DATABASE UPDATE STARTING...\n');

const db = new Database('./data/app.db');

try {
  // 1. Get current admin
  const before = db.prepare(`SELECT id, login, email, length(passwordHash) as hashLen FROM users WHERE login='admin'`).get();
  console.log('📋 BEFORE:', before);

  // 2. Generate new hash
  const newHash = hashPassword(ADMIN_PASSWORD);
  console.log('\n🔐 New hash generated, length:', newHash.length);

  // 3. Update admin
  const result = db.prepare(`
    UPDATE users 
    SET email = ?, passwordHash = ?
    WHERE login = 'admin'
  `).run(ADMIN_EMAIL, newHash);

  console.log('✅ Update result:', result.changes, 'rows changed');

  // 4. Verify
  const after = db.prepare(`SELECT id, login, email, length(passwordHash) as hashLen FROM users WHERE login='admin'`).get();
  console.log('\n📋 AFTER:', after);

  console.log('\n🔑 NEW LOGIN CREDENTIALS:');
  console.log('   Login: admin');
  console.log('   Email:', ADMIN_EMAIL);
  console.log('   Password:', ADMIN_PASSWORD);
  
  console.log('\n✅ DATABASE UPDATE COMPLETE!');
} catch (error) {
  console.error('❌ ERROR:', error);
} finally {
  db.close();
}
