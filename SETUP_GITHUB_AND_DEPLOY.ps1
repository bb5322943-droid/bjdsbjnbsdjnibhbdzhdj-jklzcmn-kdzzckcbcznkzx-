# GitHub + Vercel Deploy Script
# Bu script GitHub repository yaratadi va Vercel'ga deploy qiladi

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   FUSION ERP - GITHUB DEPLOY SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. GitHub username so'rash
Write-Host "1. GitHub username kiriting (masalan: johnsmith):" -ForegroundColor Yellow
$username = Read-Host "Username"

# 2. Repository nomi
Write-Host ""
Write-Host "2. Repository nomi kiriting (Enter = 'fusion-erp'):" -ForegroundColor Yellow
$repoName = Read-Host "Repository name"
if ([string]::IsNullOrWhiteSpace($repoName)) {
    $repoName = "fusion-erp"
}

# 3. GitHub URL yaratish
$repoUrl = "https://github.com/$username/$repoName.git"
Write-Host ""
Write-Host "Repository URL: $repoUrl" -ForegroundColor Green

# 4. GitHub Personal Access Token
Write-Host ""
Write-Host "3. GitHub Personal Access Token kiriting:" -ForegroundColor Yellow
Write-Host "   (Token yo'q bo'lsa: https://github.com/settings/tokens/new)" -ForegroundColor Gray
Write-Host "   Scope: 'repo' tanlang" -ForegroundColor Gray
$token = Read-Host "Token" -AsSecureString
$tokenPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($token))

# 5. Confirmation
Write-Host ""
Write-Host "Tayyor! Quyidagilar bajariladi:" -ForegroundColor Cyan
Write-Host "  - GitHub repository yaratiladi: $repoName" -ForegroundColor White
Write-Host "  - Loyiha push qilinadi: $repoUrl" -ForegroundColor White
Write-Host "  - Vercel import sahifasi ochiladi" -ForegroundColor White
Write-Host ""
Write-Host "Davom etamizmi? (Y/n):" -ForegroundColor Yellow
$confirm = Read-Host
if ($confirm -eq "n" -or $confirm -eq "N") {
    Write-Host "Bekor qilindi." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   BOSHLANDI..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 6. GitHub repository yaratish (API orqali)
Write-Host ""
Write-Host "[1/4] GitHub repository yaratilmoqda..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "token $tokenPlain"
    "Accept" = "application/vnd.github.v3+json"
}
$body = @{
    "name" = $repoName
    "private" = $true
    "description" = "Fusion ERP - Full-featured business management system"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "✅ Repository yaratildi: $($response.html_url)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Repository allaqachon mavjud yoki xato: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "Davom etamiz..." -ForegroundColor Gray
}

# 7. Git remote qo'shish
Write-Host ""
Write-Host "[2/4] Git remote qo'shilmoqda..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin "https://$($tokenPlain)@github.com/$username/$repoName.git"
Write-Host "✅ Git remote qo'shildi" -ForegroundColor Green

# 8. Push qilish
Write-Host ""
Write-Host "[3/4] GitHub'ga push qilinmoqda..." -ForegroundColor Yellow
git branch -M main
git push -u origin main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Push muvaffaqiyatli!" -ForegroundColor Green
} else {
    Write-Host "❌ Push xatolik bilan yakunlandi" -ForegroundColor Red
    exit 1
}

# 9. Vercel import sahifasini ochish
Write-Host ""
Write-Host "[4/4] Vercel import sahifasi ochilmoqda..." -ForegroundColor Yellow
Start-Process "https://vercel.com/new?utm_source=fusion-erp"
Write-Host "✅ Brauzer ochildi" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   TAYYOR!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Keyingi qadamlar:" -ForegroundColor Yellow
Write-Host "1. Brauzerda Vercel'ga login qiling" -ForegroundColor White
Write-Host "2. '$repoName' repository'ni Import qiling" -ForegroundColor White
Write-Host "3. Environment Variables qo'shing:" -ForegroundColor White
Write-Host "   - JWT_SECRET" -ForegroundColor Gray
Write-Host "   - JWT_REFRESH_SECRET" -ForegroundColor Gray
Write-Host "   - ADMIN_EMAIL" -ForegroundColor Gray
Write-Host "   - ADMIN_PASSWORD" -ForegroundColor Gray
Write-Host "4. Deploy tugmasini bosing!" -ForegroundColor White
Write-Host ""
Write-Host "Batafsil ko'rsatma: DEPLOY_INSTRUCTIONS_FINAL.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "GitHub URL: https://github.com/$username/$repoName" -ForegroundColor Green
Write-Host ""
pause
