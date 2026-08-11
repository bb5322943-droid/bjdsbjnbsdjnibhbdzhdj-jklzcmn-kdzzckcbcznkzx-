import Database from 'better-sqlite3';

const db = new Database('./data/app.db', { readonly: true });

console.log('👥 BARCHA FOYDALANUVCHILAR VA ULARNING LOGIN MA\'LUMOTLARI\n');
console.log('═'.repeat(70));

const users = db.prepare(`
  SELECT id, login, email, role, status 
  FROM users 
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'manager' THEN 2 
      WHEN 'accountant' THEN 3 
      ELSE 4 
    END
`).all();

console.log(`\nJami foydalanuvchilar: ${users.length}\n`);

users.forEach((user, index) => {
  console.log(`${index + 1}. ${user.role.toUpperCase()}`);
  console.log('   ─'.repeat(35));
  console.log(`   ID:     ${user.id}`);
  console.log(`   Login:  ${user.login}`);
  console.log(`   Email:  ${user.email}`);
  console.log(`   Status: ${user.status}`);
  console.log(`   Role:   ${user.role}`);
  console.log('');
});

db.close();

// Default passwords info
console.log('═'.repeat(70));
console.log('🔑 PAROLLAR:\n');
console.log('ADMIN:');
console.log('   Login: admin');
console.log('   Parol: OrbisAdmin2024!\n');
console.log('BOSHQA FOYDALANUVCHILAR (Demo):');
console.log('   Login: menejr, hisobchi, kassir');
console.log('   Parol: 123456');
console.log('═'.repeat(70));
