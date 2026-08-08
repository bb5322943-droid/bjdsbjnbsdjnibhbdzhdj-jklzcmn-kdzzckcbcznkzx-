@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║         FUSION ERP SERVER STARTING...                 ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo ⚠️  node_modules topilmadi!
    echo 📦 Dependencies o'rnatilmoqda...
    echo.
    
    REM SSL bypass
    set NODE_TLS_REJECT_UNAUTHORIZED=0
    set npm_config_strict_ssl=false
    
    REM Install dependencies
    call npm install --omit=dev
    
    if %errorlevel% neq 0 (
        echo.
        echo ❌ Dependencies o'rnatishda xatolik!
        echo.
        echo Qo'lda urinib ko'ring:
        echo npm install
        pause
        exit /b 1
    )
    
    echo ✅ Dependencies o'rnatildi!
    echo.
)

REM Check if build exists
if not exist "dist\server\node-build.mjs" (
    echo ❌ Build topilmadi!
    echo.
    echo Build qilish kerak:
    echo npm run build
    pause
    exit /b 1
)

echo ✅ Build topildi
echo.
echo 🚀 Server ishga tushmoqda...
echo.
echo URL: http://localhost:8080
echo.
echo Login:
echo   Email: admin@yourcompany.com
echo   Parol: Admin123!Fusion
echo.
echo ⏹️  To'xtatish: Ctrl+C
echo.
echo ═══════════════════════════════════════════════════════
echo.

REM Start server
node dist\server\node-build.mjs

if %errorlevel% neq 0 (
    echo.
    echo ❌ Server xatosi!
    pause
)
