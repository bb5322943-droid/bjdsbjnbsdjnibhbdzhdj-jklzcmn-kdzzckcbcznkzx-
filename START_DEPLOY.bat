@echo off
chcp 65001 >nul
echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║           FUSION ERP - DEPLOY HELPER                  ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

REM Git tekshirish
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git o'rnatilmagan!
    echo.
    echo Git o'rnatish uchun:
    echo 1. https://git-scm.com/download/win ga o'ting
    echo 2. Git-2.x.x-64-bit.exe yuklab oling
    echo 3. O'rnating (default settings)
    echo 4. Terminal'ni qayta oching
    echo 5. Bu scriptni yana ishga tushiring
    echo.
    pause
    exit /b 1
)

echo ✅ Git o'rnatilgan: 
git --version
echo.

REM Vercel CLI tekshirish
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Vercel CLI o'rnatilmagan
    echo.
    echo Vercel CLI o'rnatish uchun:
    echo npm install -g vercel
    echo.
) else (
    echo ✅ Vercel CLI o'rnatilgan:
    vercel --version
    echo.
)

echo ═══════════════════════════════════════════════════════
echo.
echo DEPLOY VARIANTLARI:
echo.
echo 1. GitHub → Vercel (tavsiya, avtomatik)
echo 2. Vercel CLI (to'g'ridan-to'g'ri)
echo 3. Qo'rsatmalarni ko'rish
echo 4. Chiqish
echo.
set /p choice="Tanlang (1-4): "

if "%choice%"=="1" goto github_deploy
if "%choice%"=="2" goto vercel_cli
if "%choice%"=="3" goto show_docs
if "%choice%"=="4" goto end

:github_deploy
echo.
echo ═══════════════════════════════════════════════════════
echo GITHUB → VERCEL DEPLOY
echo ═══════════════════════════════════════════════════════
echo.
echo QADAMLAR:
echo.
echo 1. GitHub'da yangi repository yarating:
echo    https://github.com/new
echo.
echo 2. Repository URL'ni kiriting (bo'sh qoldiring, agar skip qilmoqchi bo'lsangiz):
set /p repo_url="GitHub repo URL: "

if "%repo_url%"=="" (
    echo.
    echo ⚠️  URL kiritilmadi. Qo'lda davom eting:
    echo.
    echo git init
    echo git add .
    echo git commit -m "Production deploy"
    echo git remote add origin YOUR_REPO_URL
    echo git branch -M main
    echo git push -u origin main
    echo.
    goto after_git
)

echo.
echo 🔄 Git repository yaratilmoqda...

REM Git init
git init
if %errorlevel% neq 0 (
    echo ❌ Git init xatosi
    pause
    exit /b 1
)
echo ✅ Git initialized

REM Git add
git add .
if %errorlevel% neq 0 (
    echo ❌ Git add xatosi
    pause
    exit /b 1
)
echo ✅ Files staged

REM Git commit
git commit -m "Production-ready ERP system"
if %errorlevel% neq 0 (
    echo ❌ Git commit xatosi
    pause
    exit /b 1
)
echo ✅ Commit created

REM Git remote
git remote add origin %repo_url%
if %errorlevel% neq 0 (
    echo ⚠️  Remote allaqachon mavjud, yangilanmoqda...
    git remote set-url origin %repo_url%
)
echo ✅ Remote added

REM Git branch
git branch -M main
echo ✅ Branch: main

REM Git push
echo.
echo 🚀 GitHub'ga push qilinmoqda...
git push -u origin main
if %errorlevel% neq 0 (
    echo ❌ Push xatosi!
    echo.
    echo Qo'lda urinib ko'ring:
    echo git push -u origin main
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ GITHUB'GA PUSH BO'LDI!
echo.

:after_git
echo ═══════════════════════════════════════════════════════
echo.
echo KEYINGI QADAM: VERCEL'DA IMPORT QILING
echo.
echo 1. Vercel.com ga kiring: https://vercel.com
echo 2. "Add New" → "Project" bosing
echo 3. "Import Git Repository" tanlang
echo 4. GitHub'dan repo'ni tanlang
echo 5. Environment Variables qo'shing:
echo    - JWT_SECRET (node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo    - JWT_REFRESH_SECRET (node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo    - ADMIN_EMAIL
echo    - ADMIN_PASSWORD
echo    - DATABASE_URL (Vercel PostgreSQL)
echo    - ALLOWED_ORIGINS
echo    - NODE_ENV=production
echo 6. Deploy tugmasini bosing!
echo.
echo ═══════════════════════════════════════════════════════
pause
goto end

:vercel_cli
echo.
echo ═══════════════════════════════════════════════════════
echo VERCEL CLI DEPLOY
echo ═══════════════════════════════════════════════════════
echo.

vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI o'rnatilmagan!
    echo.
    echo O'rnatish:
    echo npm install -g vercel
    echo.
    pause
    goto end
)

echo ⚠️  SSL muammosi bo'lishi mumkin!
echo.
echo SSL tekshiruvini o'chirib, deploy qilasizmi?
echo (Faqat development uchun! Production uchun xavfli!)
echo.
set /p ssl_choice="Y/N: "

if /i "%ssl_choice%"=="Y" (
    echo.
    echo 🔓 SSL tekshiruvi o'chirilmoqda...
    set NODE_TLS_REJECT_UNAUTHORIZED=0
    
    echo.
    echo 🚀 Deploy boshlanyapti...
    vercel --prod --yes
    
    echo.
    echo 🔒 SSL tekshiruvi qayta yoqilmoqda...
    set NODE_TLS_REJECT_UNAUTHORIZED=
    
    if %errorlevel% equ 0 (
        echo.
        echo ✅ DEPLOY BO'LDI!
    ) else (
        echo.
        echo ❌ DEPLOY XATOSI!
        echo.
        echo GitHub orqali deploy qiling (Variant 1)
    )
) else (
    echo.
    echo Deploy bekor qilindi.
)

echo.
pause
goto end

:show_docs
echo.
echo ═══════════════════════════════════════════════════════
echo HUJJATLAR
echo ═══════════════════════════════════════════════════════
echo.
echo Quyidagi fayllarni o'qing:
echo.
echo - DEPLOY_HOZIR.md    - Batafsil deploy ko'rsatmasi
echo - GITHUB_DEPLOY.md   - GitHub orqali deploy
echo - DEPLOY_QOLLANMA.md - Barcha variantlar
echo - XULOSA.md          - Yakuniy baholash
echo.
pause
goto end

:end
echo.
echo Xayr! 👋
exit /b 0
