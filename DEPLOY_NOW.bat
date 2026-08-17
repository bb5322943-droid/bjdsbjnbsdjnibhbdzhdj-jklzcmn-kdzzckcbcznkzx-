@echo off
cls
echo ========================================
echo   FUSION ERP - VERCEL DEPLOY
echo ========================================
echo.
echo Deployment boshlanyapti...
echo.
echo DIQQAT: Birinchi marta deploy qilayotgan bo'lsangiz:
echo 1. Brauzerda Vercel login sahifasi ochiladi
echo 2. Email yoki GitHub bilan login qiling
echo 3. Sahifani yopib, bu oynaga qaytib keling
echo 4. Enter tugmasini bosing
echo.
pause
echo.
echo Deployment jarayoni boshlandi...
echo.
cd /d "%~dp0"
vercel --prod
echo.
echo ========================================
echo   DEPLOYMENT TUGALLANDI!
echo ========================================
echo.
echo Vercel sizga URL berdi (yuqorida ko'ring)
echo URL ni nusxalab, brauzerda oching!
echo.
echo Login ma'lumotlar:
echo Email: admin@fusion-erp.com
echo Password: Admin123!@#
echo.
pause
