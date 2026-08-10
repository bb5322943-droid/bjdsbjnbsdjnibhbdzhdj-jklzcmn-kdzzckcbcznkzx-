// Simple password hash test
import crypto from 'crypto';

const KEY_LENGTH = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  
  const expected = Buffer.from(hash, "hex");
  const actual = crypto.scryptSync(password, salt, KEY_LENGTH);
  
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

// Test
const password = "OrbisAdmin2024!";
const hash = hashPassword(password);

console.log("✅ Password:", password);
console.log("✅ Hash:", hash);
console.log("✅ Verify correct:", verifyPassword(password, hash));
console.log("❌ Verify wrong:", verifyPassword("wrong", hash));

// Test with admin email
console.log("\n📧 Admin email: admin@orbiserp.uz");
console.log("🔑 Admin password: OrbisAdmin2024!");

// Test different passwords
console.log("\n🧪 Testing different passwords:");
const testPasswords = [
  "OrbisAdmin2024!",
  "Admin123!Fusion",
  "123456",
  "admin"
];

testPasswords.forEach(pwd => {
  const h = hashPassword(pwd);
  console.log(`Password: ${pwd} → Hash works: ${verifyPassword(pwd, h)}`);
});
