@echo off
echo ========================================
echo Fusion ERP - Sotuvga Tayyorlash Skripti
echo ========================================
echo.

echo [1/5] Backuplarni o'chirish...
if exist backups rmdir /s /q backups
if exist *.backup del /f /q *.backup
echo ✓ Backuplar o'chirildi

echo.
echo [2/5] Log fayllarini o'chirish...
if exist logs rmdir /s /q logs
if exist *.log del /f /q *.log
echo ✓ Loglar o'chirildi

echo.
echo [3/5] Vaqtinchalik fayllarni o'chirish...
if exist node_modules rmdir /s /q node_modules
if exist dist rmdir /s /q dist
if exist .vite rmdir /s /q .vite
echo ✓ Vaqtinchalik fayllar o'chirildi

echo.
echo [4/5] .env faylini o'chirish (MUHIM!)...
if exist .env del /f /q .env
echo ✓ .env o'chirildi (mijoz o'zi yaratadi)

echo.
echo [5/5] Data bazasini o'chirish uchun tayyorlash...
echo ⚠️  DIQQAT: data/ papkani qo'lda o'chiring!
echo    (Database fayllari hozir ishlatilayotgan bo'lishi mumkin)
echo.

echo ========================================
echo ✅ Tizim sotuvga deyarli tayyor!
echo ========================================
echo.
echo Keyingi qadamlar:
echo 1. Barcha dasturlarni yoping
echo 2. data/ papkani qo'lda o'chiring
echo 3. .env.example ni tekshiring
echo 4. ZIP fayl yarating
echo 5. Mijozga topshiring!
echo.
pause
