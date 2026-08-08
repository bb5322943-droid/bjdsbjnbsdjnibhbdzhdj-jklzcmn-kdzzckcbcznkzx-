@echo off
chcp 65001 >nul
color 0A
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║           🚀 FUSION ERP - DEPLOY WIZARD                   ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo ✅ Git tayyor
echo ✅ Commit qilingan
echo ✅ Vercel'ga ro'yxatdan o'tdingiz
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo DEPLOY USULINI TANLANG:
echo.
echo 1. GitHub orqali (tavsiya, avtomatik deploy) ⭐
echo 2. Vercel CLI (to'g'ridan) ⚡
echo 3. Ko'rsatma ochish 📖
echo 4. Chiqish
echo.
set /p choice="Tanlang (1-4): "

if "%choice%"=="1" goto github_deploy
if "%choice%"=="2" goto vercel_cli
if "%choice%"=="3" goto open_docs
if "%choice%"=="4" goto end

echo.
echo ❌ Noto'g'ri tanlov!
pause
exit /b 1

:github_deploy
cls
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║              GITHUB ORQALI DEPLOY                         ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo QADAM 1: GitHub repository yaratish
echo.
echo GitHub sahifasi ochilmoqda...
timeout /t 2 >nul
start https://github.com/new
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo GitHub sahifasida:
echo.
echo   Repository name: fusion-erp
echo   Private: ✅ (tavsiya)
echo   "Create repository" bosing
echo.
echo Repository yaratilgandan keyin URL nusxalang!
echo Masalan: https://github.com/username/fusion-erp.git
echo.
echo ═══════════════════════════════════════════════════════════
echo.
set /p repo_url="GitHub repository URL'ni kiriting: "

if "%repo_url%"=="" (
    echo.
    echo ❌ URL kiritilmadi!
    pause
    goto github_deploy
)

echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo QADAM 2: GitHub'ga push qilish
echo.
echo 🔄 Push boshlanmoqda...
echo.

REM Git remote qo'shish
git remote remove origin 2>nul
git remote add origin %repo_url%
if %errorlevel% neq 0 (
    echo ⚠️  Remote qo'shishda muammo, davom ettiramiz...
)
echo ✅ Remote sozlandi

REM Push
echo.
echo 📤 GitHub'ga push qilinmoqda...
echo.
git push -u origin main
if %errorlevel% neq 0 (
    echo.
    echo ════════════════════════════════════════════════════════
    echo ❌ PUSH XATOSI!
    echo ════════════════════════════════════════════════════════
    echo.
    echo Mumkin sabablari:
    echo.
    echo 1. Git credentials kerak:
    echo    - Username: GitHub username
    echo    - Password: Personal Access Token (parol emas!)
    echo.
    echo 2. Token yaratish:
    echo    https://github.com/settings/tokens
    echo    "Generate new token (classic)" → "repo" checkbox
    echo.
    echo 3. Qayta urinish:
    echo    git push -u origin main
    echo.
    echo Token sahifasini ochmoqchi bo'lsangiz Enter bosing...
    pause
    start https://github.com/settings/tokens
    echo.
    echo Token yaratib, qayta urinib ko'ring:
    echo git push -u origin main
    echo.
    pause
    goto end
)

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║            ✅ GITHUB'GA PUSH BO'LDI!                      ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo QADAM 3: Vercel'da import qilish
echo.
echo Vercel ochilmoqda...
timeout /t 2 >nul
start https://vercel.com/new
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo Vercel sahifasida:
echo.
echo 1. "Import Git Repository" bosing
echo 2. GitHub'ni ulang (agar birinchi marta)
echo 3. "fusion-erp" repo'ni tanlang
echo 4. Project Settings:
echo      Build Command: npm run build:vercel
echo      Output Directory: dist/spa
echo      Install Command: npm install
echo 5. Environment Variables qo'shing (pastda ko'rsatiladi)
echo 6. "Deploy" bosing!
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo ENVIRONMENT VARIABLES:
echo.
echo JWT Secrets yaratilmoqda...
echo.

REM JWT secrets yaratish
echo JWT_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
echo.
echo JWT_REFRESH_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
echo.
echo Boshqa variables:
echo.
echo ADMIN_EMAIL = admin@yourcompany.com
echo ADMIN_PASSWORD = YourStrongPassword123!
echo NODE_ENV = production
echo ALLOWED_ORIGINS = https://your-app.vercel.app
echo.
echo ⚠️  DATABASE_URL - Vercel'da PostgreSQL yaratish kerak!
echo    Storage → Create Database → Postgres → Connect to Project
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo 📋 Bu ma'lumotlarni Vercel'da Environment Variables'ga kiriting!
echo.
pause
goto end

:vercel_cli
cls
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║              VERCEL CLI DEPLOY                            ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo ⚠️  OGOHLANTIRISH: SSL muammosi bo'lishi mumkin!
echo.
set /p ssl="SSL bypass qilishni xohlaysizmi? (Y/N): "

if /i not "%ssl%"=="Y" (
    echo.
    echo Deploy bekor qilindi.
    echo GitHub usulini sinab ko'ring (Variant 1)
    pause
    goto end
)

echo.
echo 🔓 SSL bypass yoqilmoqda...
set NODE_TLS_REJECT_UNAUTHORIZED=0

echo.
echo 🚀 Vercel login...
echo.
vercel login
if %errorlevel% neq 0 (
    echo.
    echo ❌ Login xatosi!
    echo Vercel o'rnatilganligini tekshiring: vercel --version
    pause
    goto end
)

echo.
echo ✅ Login muvaffaqiyatli!
echo.
echo 📦 Deploy qilinmoqda...
echo.
vercel --prod --yes
if %errorlevel% neq 0 (
    echo.
    echo ════════════════════════════════════════════════════════
    echo ❌ DEPLOY XATOSI!
    echo ════════════════════════════════════════════════════════
    echo.
    echo GitHub usulini sinab ko'ring (Variant 1)
    echo.
    pause
    goto end
)

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║            ✅ DEPLOY BO'LDI!                              ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo Environment Variables qo'shish kerak!
echo Vercel Dashboard ochilmoqda...
timeout /t 2 >nul
start https://vercel.com/dashboard
echo.
echo Settings → Environment Variables'ga qo'shing va redeploy qiling!
echo.
pause
goto end

:open_docs
echo.
echo 📖 Hujjatlar ochilmoqda...
start DEPLOY_BOSHLASH.md
start VERCEL_MANUAL_DEPLOY.html
echo.
echo Hujjatlar ochildi!
pause
goto end

:end
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo Xayr! 👋
echo.
echo Yordam kerak bo'lsa:
echo - DEPLOY_BOSHLASH.md o'qing
echo - VERCEL_MANUAL_DEPLOY.html ni oching
echo.
pause
exit /b 0
