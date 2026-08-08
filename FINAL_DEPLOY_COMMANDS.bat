@echo off
chcp 65001 >nul
echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║        FUSION ERP - OXIRGI 3 TA QADAM!                ║
echo ╚═══════════════════════════════════════════════════════╝
echo.
echo ✅ Git tayyorlandi
echo ✅ Fayllar commit qilindi
echo ✅ Repository tayyor
echo.
echo ═══════════════════════════════════════════════════════
echo.
echo QADAM 1: GitHub'da yangi repository yarating
echo.
echo 1. https://github.com/new ga o'ting
echo 2. Repository name: fusion-erp-production
echo 3. Private yoki Public tanlang
echo 4. "Create repository" bosing
echo 5. URL'ni nusxalang (masalan: https://github.com/username/fusion-erp-production.git)
echo.
echo ═══════════════════════════════════════════════════════
echo.
set /p repo_url="GitHub repository URL'ni kiriting: "

if "%repo_url%"=="" (
    echo.
    echo ❌ URL kiritilmadi!
    echo.
    echo Qo'lda bajaring:
    echo.
    echo git branch -M main
    echo git remote add origin YOUR_GITHUB_URL
    echo git push -u origin main
    echo.
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════
echo.
echo 🚀 DEPLOY BOSHLANDI...
echo.

REM Branch yaratish
git branch -M main
if %errorlevel% neq 0 (
    echo ❌ Branch yaratishda xato
    pause
    exit /b 1
)
echo ✅ Branch: main

REM Remote qo'shish
git remote add origin %repo_url%
if %errorlevel% neq 0 (
    echo ⚠️  Remote mavjud, yangilanmoqda...
    git remote set-url origin %repo_url%
)
echo ✅ Remote ulandi

REM Push qilish
echo.
echo 📤 GitHub'ga push qilinmoqda...
echo.
git push -u origin main
if %errorlevel% neq 0 (
    echo.
    echo ❌ PUSH XATOSI!
    echo.
    echo Mumkin sabablari:
    echo - GitHub login kerak (git credential manager)
    echo - Repository private va access yo'q
    echo - Internet muammosi
    echo.
    echo Qo'lda urinib ko'ring:
    echo git push -u origin main
    echo.
    pause
    exit /b 1
)

echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║             ✅ GITHUB'GA PUSH BO'LDI!                 ║
echo ╚═══════════════════════════════════════════════════════╝
echo.
echo ═══════════════════════════════════════════════════════
echo.
echo QADAM 2: VERCEL'DA IMPORT QILING
echo.
echo 1. https://vercel.com ga kiring
echo 2. "Add New" → "Project" bosing
echo 3. "Import Git Repository" tanlang
echo 4. GitHub'dan repo'ni tanlang: fusion-erp-production
echo.
echo ═══════════════════════════════════════════════════════
echo.
echo QADAM 3: ENVIRONMENT VARIABLES
echo.
echo Vercel Dashboard → Settings → Environment Variables:
echo.
echo JWT_SECRET va JWT_REFRESH_SECRET yaratish:
echo.

REM JWT secrets yaratish
echo Birinchi JWT secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
echo.
echo Ikkinchi JWT secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

echo.
echo Yuqoridagi 2 ta random string'ni Vercel'ga kiriting!
echo.
echo Boshqa environment variables:
echo - ADMIN_EMAIL = admin@yourcompany.com
echo - ADMIN_PASSWORD = YourStrongPassword123!
echo - NODE_ENV = production
echo - DATABASE_URL = (Vercel PostgreSQL yarating)
echo - ALLOWED_ORIGINS = https://your-app.vercel.app
echo.
echo ═══════════════════════════════════════════════════════
echo.
echo To'liq ko'rsatma: GITHUB_DEPLOY.md
echo.
pause
