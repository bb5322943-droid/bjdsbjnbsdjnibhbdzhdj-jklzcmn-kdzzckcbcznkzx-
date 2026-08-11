-- Update admin email
UPDATE users 
SET email = 'admin@orbiserp.uz'
WHERE login = 'admin';

-- Verify update
SELECT id, login, email, role, status, length(passwordHash) as hashLen 
FROM users 
WHERE login = 'admin';
