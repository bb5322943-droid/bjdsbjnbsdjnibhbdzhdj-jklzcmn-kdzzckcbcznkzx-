import { randomBytes, scryptSync } from 'node:crypto';

const KEY_LENGTH = 64;
const password = "OrbisAdmin2024!";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${derived}`;
}

const hash = hashPassword(password);
console.log('Password:', password);
console.log('Hash:', hash);
console.log('\nSQL Update:');
console.log(`UPDATE users SET passwordHash = '${hash}' WHERE login = 'admin';`);
