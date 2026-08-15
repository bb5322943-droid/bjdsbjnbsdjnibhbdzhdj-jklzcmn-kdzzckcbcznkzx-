@echo off
echo ========================================
echo   FUSION ERP - VERCEL DEPLOY
echo ========================================
echo.

echo 1. Vercel'ga login qiling...
call vercel login

echo.
echo 2. Loyihani deploy qilyapman...
call vercel --prod

echo.
echo ========================================
echo   DEPLOY TUGALLANDI!
echo ========================================
echo.
echo Vercel sizga URL berdi. Brauzerda oching!
pause
