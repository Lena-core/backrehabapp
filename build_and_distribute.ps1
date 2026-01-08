# Скрипт для сборки APK и автоматической загрузки в Firebase App Distribution

Write-Host "=== Сборка и загрузка APK в Firebase App Distribution ===" -ForegroundColor Green

# Шаг 1: Сборка Release APK
Write-Host "`nШаг 1: Сборка Release APK..." -ForegroundColor Yellow
Set-Location android
.\gradlew.bat assembleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "Ошибка при сборке APK!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# Шаг 2: Загрузка в Firebase App Distribution
Write-Host "`nШаг 2: Загрузка в Firebase App Distribution..." -ForegroundColor Yellow
Set-Location android
.\gradlew.bat appDistributionUploadRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "Ошибка при загрузке в Firebase!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

Write-Host "`n=== Готово! APK успешно загружен в Firebase App Distribution ===" -ForegroundColor Green
Write-Host "Тестировщики получат уведомление о новой версии." -ForegroundColor Cyan
