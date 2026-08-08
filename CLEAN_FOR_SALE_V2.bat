@echo off
chcp 65001 >nul
echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║      FUSION ERP - SOTUVGA TAYYORLASH SCRIPTI          ║
echo ╚═══════════════════════════════════════════════════════╝
echo.
echo ⚠️  OGOHLANTIRISH: Bu script quyidagilarni o'chiradi:
echo   - .env fayli
echo   - data/ papkasi (database)
echo   - logs/ papkasi
echo   - .vercel/ papkasi
echo   - node_modules/ papkasi
echo   - dist/ papkasi
echo.

set /p confirm="Davom ettirasizmi? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo.
    echo ❌ Bekor qilindi.
    pause
    exit /b
)

echo.
echo 🧹 Tozalash boshlandi...
echo.

REM 1. Environment faylini o'chirish
if exist ".env" (
    del /f /q ".env"
    echo ✅ .env o'chirildi
) else (
    echo ℹ️  .env topilmadi
)

REM 2. Database papkasini o'chirish
if exist "data" (
    rmdir /s /q "data"
    echo ✅ data/ o'chirildi
) else (
    echo ℹ️  data/ topilmadi
)

REM 3. Logs papkasini o'chirish
if exist "logs" (
    rmdir /s /q "logs"
    echo ✅ logs/ o'chirildi
) else (
    echo ℹ️  logs/ topilmadi
)

REM 4. Backups papkasini o'chirish
if exist "backups" (
    rmdir /s /q "backups"
    echo ✅ backups/ o'chirildi
) else (
    echo ℹ️  backups/ topilmadi
)

REM 5. Vercel config o'chirish
if exist ".vercel" (
    rmdir /s /q ".vercel"
    echo ✅ .vercel/ o'chirildi
) else (
    echo ℹ️  .vercel/ topilmadi
)

REM 6. Node modules o'chirish (yangi xaridor o'zi install qiladi)
if exist "node_modules" (
    echo 🗑️  node_modules/ o'chirilmoqda... (bu biroz vaqt oladi)
    rmdir /s /q "node_modules"
    echo ✅ node_modules/ o'chirildi
) else (
    echo ℹ️  node_modules/ topilmadi
)

REM 7. Dist papkasini o'chirish (yangi xaridor o'zi build qiladi)
if exist "dist" (
    rmdir /s /q "dist"
    echo ✅ dist/ o'chirildi
) else (
    echo ℹ️  dist/ topilmadi
)

REM 8. .env.local o'chirish
if exist ".env.local" (
    del /f /q ".env.local"
    echo ✅ .env.local o'chirildi
) else (
    echo ℹ️  .env.local topilmadi
)

echo.
echo ═══════════════════════════════════════════════════════
echo.
echo ✅ TOZALASH TUGADI!
echo.
echo 📋 Keyingi qadamlar:
echo.
echo 1. README.md ni tahrirlang:
echo    - "Made with ❤️ in Uzbekistan" ni o'chiring
echo    - Aloqa ma'lumotlarini o'chiring
echo.
echo 2. .env.example ni tekshiring:
echo    - DATABASE_PATH=./data/app.db ga o'zgartirilganligini
echo    - Default parollar yo'qligini
echo.
echo 3. package.json ni tahrirlang:
echo    - "name": "fusion-erp"
echo    - "description" qo'shing
echo.
echo 4. LICENSE faylini tekshiring
echo.
echo 5. ZIP archive yarating:
echo    7z a fusion-erp-v1.0.0.zip . -xr!.git
echo.
echo    yoki GitHub private repo ga push qiling:
echo    git init
echo    git add .
echo    git commit -m "Initial commit - Clean ERP System"
echo.
echo ═══════════════════════════════════════════════════════
echo.
pause
