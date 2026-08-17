@echo off
echo ========================================
echo   FUSION ERP - AVTOMATIK DEPLOY
echo ========================================
echo.
echo Loyihangizni GitHub va Vercel'ga deploy qilish boshlandi...
echo.
powershell -ExecutionPolicy Bypass -File "SETUP_GITHUB_AND_DEPLOY.ps1"
pause
