@echo off
chcp 65001 > nul
color 0A
title 🚀 Orbis ERP - Deployment Status

echo.
echo ═══════════════════════════════════════════════════════
echo 🚀 ORBIS ERP - VERCEL DEPLOYMENT STATUS
echo ═══════════════════════════════════════════════════════
echo.

echo ✅ Git Push: MUVAFFAQIYATLI
echo 📦 Latest Commit: fix: deploy login - hardcoded admin credentials
echo.

echo ⏳ Vercel Build: ISHLAMOQDA...
echo.

echo ═══════════════════════════════════════════════════════
echo 🌐 PRODUCTION URL
echo ═══════════════════════════════════════════════════════
echo.
echo https://fusion-erp.vercel.app
echo.

echo ═══════════════════════════════════════════════════════
echo 🔐 LOGIN MA'LUMOTLAR
echo ═══════════════════════════════════════════════════════
echo.
echo Login: admin
echo Parol: OrbisAdmin2024!
echo.

echo ═══════════════════════════════════════════════════════
echo 📊 DASHBOARD LINKS
echo ═══════════════════════════════════════════════════════
echo.
echo [1] Production Sayt
echo [2] Vercel Dashboard  
echo [3] GitHub Repository
echo [4] Exit
echo.

set /p choice=Tanlang (1-4): 

if "%choice%"=="1" (
    echo.
    echo 🌐 Production saytni ochish...
    start https://fusion-erp.vercel.app
    timeout /t 3 > nul
    goto menu
)

if "%choice%"=="2" (
    echo.
    echo 📊 Vercel Dashboard ochilmoqda...
    start https://vercel.com/dashboard
    timeout /t 3 > nul
    goto menu
)

if "%choice%"=="3" (
    echo.
    echo 📁 GitHub repository ochilmoqda...
    start https://github.com/bb5322943-droid
    timeout /t 3 > nul
    goto menu
)

if "%choice%"=="4" (
    echo.
    echo ✅ Xayr!
    timeout /t 2 > nul
    exit
)

:menu
echo.
echo ═══════════════════════════════════════════════════════
echo.
set /p again=Yana tanlaysizmi? (y/n): 

if /i "%again%"=="y" goto start

echo.
echo ✅ Deployment monitor to'xtatildi
echo.
pause
