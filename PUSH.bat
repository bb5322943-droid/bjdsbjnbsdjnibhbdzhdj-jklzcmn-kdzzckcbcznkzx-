@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════════════════
echo   GITHUB'GA PUSH QILISH
echo ═══════════════════════════════════════════════════════
echo.
echo GitHub'da repository yaratdingizmi? (fusion-erp)
echo.
set /p confirm="Ha bo'lsa Enter bosing, yo'q bo'lsa saytni ochaman (Y/N): "

if /i "%confirm%"=="N" (
    echo.
    echo GitHub ochilmoqda...
    start https://github.com/new
    echo.
    echo Repository yaratib, qaytib keling!
    pause
    exit /b
)

echo.
echo ═══════════════════════════════════════════════════════
echo.
set /p repo_url="GitHub repository URL'ni kiriting: "

if "%repo_url%"=="" (
    echo.
    echo ❌ URL kiritilmadi!
    echo.
    echo Misol: https://github.com/username/fusion-erp.git
    echo.
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════
echo.
echo 🚀 GitHub'ga push qilinmoqda...
echo.

REM Remote qo'shish
git remote remove origin 2>nul
git remote add origin %repo_url%
if %errorlevel% neq 0 (
    echo ⚠️  Remote sozlashda xatolik
)
echo ✅ Remote sozlandi

REM Push qilish
git push -u origin main
if %errorlevel% neq 0 (
    echo.
    echo ════════════════════════════════════════════════════════
    echo ❌ PUSH XATOSI!
    echo ════════════════════════════════════════════════════════
    echo.
    echo Git credentials kerak bo'lsa:
    echo.
    echo Username: GitHub username'ingiz
    echo Password: Personal Access Token (parol EMAS!)
    echo.
    echo Token yaratish:
    echo 1. https://github.com/settings/tokens
    echo 2. "Generate new token (classic)"
    echo 3. "repo" checkbox'ni belgilang
    echo 4. Token'ni nusxalang va password sifatida ishlating
    echo.
    set /p open_token="Token yaratish sahifasini ochishni xohlaysizmi? (Y/N): "
    if /i "!open_token!"=="Y" (
        start https://github.com/settings/tokens
        echo.
        echo Token yaratib, qayta urinib ko'ring:
        echo git push -u origin main
    )
    echo.
    pause
    exit /b 1
)

echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║          ✅ GITHUB'GA PUSH BO'LDI!                    ║
echo ╚═══════════════════════════════════════════════════════╝
echo.
echo Endi Vercel'da import qilishingiz mumkin!
echo.
set /p open_vercel="Vercel'ni ochishni xohlaysizmi? (Y/N): "

if /i "%open_vercel%"=="Y" (
    echo.
    echo Vercel ochilmoqda...
    start https://vercel.com/new
    echo.
    echo ═══════════════════════════════════════════════════════
    echo.
    echo VERCEL'DA QILING:
    echo.
    echo 1. "Import Git Repository" bosing
    echo 2. GitHub'ni ulang
    echo 3. "fusion-erp" ni tanlang
    echo 4. Deploy!
    echo.
    echo Environment Variables keyinroq qo'shishingiz mumkin.
    echo.
)

pause
