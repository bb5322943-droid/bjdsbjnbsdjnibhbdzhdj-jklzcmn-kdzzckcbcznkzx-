import Database from 'better-sqlite3';

const db = new Database('./data/app.db', { readonly: true });

console.log('📊 DATABASE CHECK\n');

// 1. Check all users
const allUsers = db.prepare('SELECT id, login, email, role, status FROM users').all();
console.log('👥 Total users:', allUsers.length);
console.log('Users:', allUsers.map(u => `${u.login} (${u.email}) - ${u.role}`).join('\n      '));

// 2. Check admin users
const adminUsers = db.prepare(`
  SELECT id, login, email, role, status, length(passwordHash) as hashLen 
  FROM users 
  WHERE role='admin' OR login='admin'
`).all();

console.log('\n🔐 Admin users found:', adminUsers.length);
if (adminUsers.length > 0) {
  adminUsers.forEach(admin => {
    console.log('\n  Admin:', {
      id: admin.id,
      login: admin.login,
      email: admin.email,
      role: admin.role,
      status: admin.status,
      hasPassword: admin.hashLen > 0,
      passwordHashLength: admin.hashLen
    });
  });
} else {
  console.log('  ❌ NO ADMIN USERS FOUND!');
}

// 3. Check if admin@orbiserp.uz exists
const orbisAdmin = db.prepare(`
  SELECT id, login, email, role, status, length(passwordHash) as hashLen 
  FROM users 
  WHERE email='admin@orbiserp.uz' OR login='admin'
`).get();

console.log('\n🎯 Target admin (admin@orbiserp.uz):');
if (orbisAdmin) {
  console.log('  ✅ Found:', {
    id: orbisAdmin.id,
    login: orbisAdmin.login,
    email: orbisAdmin.email,
    role: orbisAdmin.role,
    status: orbisAdmin.status,
    hasPassword: orbisAdmin.hashLen > 0,
    passwordHashLength: orbisAdmin.hashLen
  });
} else {
  console.log('  ❌ NOT FOUND!');
}

db.close();
console.log('\n✅ Database check complete');
