# JWT Secrets Generator
Write-Host "JWT_SECRET:" -ForegroundColor Green
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

Write-Host ""
Write-Host "JWT_REFRESH_SECRET:" -ForegroundColor Green
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

Write-Host ""
Write-Host "Vercel Environment Variables ga qo'shing!" -ForegroundColor Yellow
