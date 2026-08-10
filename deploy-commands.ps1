# FUSION ERP - Vercel Deployment Commands
# Bu skript loyihangizni deploy qilish uchun kerakli barcha buyruqlarni o'z ichiga oladi

Write-Host "🚀 FUSION ERP - DEPLOYMENT SCRIPT" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# 1. JWT Secrets generatsiya qilish
Write-Host "📝 QADAM 1: JWT Secrets generatsiya" -ForegroundColor Yellow
Write-Host ""
Write-Host "JWT_SECRET:" -ForegroundColor Green
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
Write-Host ""
Write-Host "JWT_REFRESH_SECRET:" -ForegroundColor Green
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
Write-Host ""

# 2. Git statusni ko'rsatish
Write-Host "📦 QADAM 2: Git Status" -ForegroundColor Yellow
git status
Write-Host ""

# 3. GitHub remote ko'rsatish
Write-Host "🔗 Hozirgi GitHub Remote:" -ForegroundColor Yellow
git remote -v
Write-Host ""

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "KEYINGI QADAMLAR:" -ForegroundColor Green
Write-Host ""
Write-Host "1. GitHub'da yangi repo yarating: https://github.com/new" -ForegroundColor White
Write-Host "2. Quyidagi commandlarni ishlating (USERNAME'ni o'zgartiing):" -ForegroundColor White
Write-Host ""
Write-Host "   git remote remove origin" -ForegroundColor Cyan
Write-Host "   git remote add origin https://github.com/SIZNING_USERNAME/fusion-erp.git" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Vercel'ga import qiling: https://vercel.com/new" -ForegroundColor White
Write-Host ""
Write-Host "To'liq qo'llanma: DEPLOY_NOW.md faylini oching!" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Cyan
